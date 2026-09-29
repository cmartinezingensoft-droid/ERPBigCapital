import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Knex } from 'knex';
import { SETTINGS_PROVIDER } from '@/modules/Settings/Settings.types';
import { SettingsStore } from '@/modules/Settings/SettingsStore';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import {
  CreateSepaMandateDto,
  CreateSepaRemittanceDto,
  PgcReportQueryDto,
  UpdateContactSepaDto,
  UpdateSepaBankAccountDto,
  UpdateSepaMandateDto,
  UpdateSpainFinanceConfigDto,
} from './dtos/SpainFinance.dto';
import { buildPain001, buildPain008, isValidBic, isValidCreditorIdentifier, isValidIban, normalizeBic, normalizeIban, sha256 } from './lib/SepaXml';

const round2 = (n: number) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
const cleanDate = (value?: string, fallback?: string) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : fallback;
const makeMessageId = (prefix: string) => `${prefix}-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${randomBytes(3).toString('hex')}`.slice(0, 35);

@Injectable()
export class SpainFinanceService {
  constructor(
    @Inject(TENANCY_DB_CONNECTION) private readonly tenantKnex: () => Knex,
    @Inject(SETTINGS_PROVIDER) private readonly settingsStore: () => SettingsStore,
  ) {}

  async getConfig() {
    const store = await this.settingsStore();
    const get = (key: string, fallback: unknown) => store.get({ group: 'spain-finance', key }, fallback as never);
    return {
      accountingStandard: String(get('accounting_standard', 'pymes')) === 'pgc' ? 'pgc' : 'pymes',
      fiscalTerritory: ['common', 'canary', 'ceuta', 'melilla'].includes(String(get('fiscal_territory', 'common')))
        ? String(get('fiscal_territory', 'common')) : 'common',
      sepaCreditTransferSchema: 'pain.001.001.09',
      sepaDirectDebitSchema: 'pain.008.001.08',
      structuredAddressRequiredFrom: '2026-11-15',
    };
  }

  async saveConfig(input: UpdateSpainFinanceConfigDto) {
    const store = await this.settingsStore();
    if (input.accountingStandard !== undefined) store.set({ group: 'spain-finance', key: 'accounting_standard', value: input.accountingStandard });
    if (input.fiscalTerritory !== undefined) store.set({ group: 'spain-finance', key: 'fiscal_territory', value: input.fiscalTerritory });
    await store.save();
    return this.getConfig();
  }

  async pgcCatalog() {
    const config = await this.getConfig();
    return this.tenantKnex()('spain_pgc_catalog').where({ standard: config.accountingStandard }).orderBy('code');
  }

  async initializePgc() {
    const knex = this.tenantKnex();
    const config = await this.getConfig();
    const catalog = await this.pgcCatalog();
    let created = 0;
    let updated = 0;
    let prefixMapped = 0;
    await knex.transaction(async (trx) => {
      for (const row of catalog) {
        const existing = await trx('accounts').where({ code: row.code }).first();
        if (existing) {
          await trx('accounts').where({ id: existing.id }).update({
            pgc_standard: config.accountingStandard, pgc_statement: row.statement, pgc_section: row.section,
          });
          updated += 1;
          continue;
        }
        await trx('accounts').insert({
          name: `${row.code} · ${row.name}`,
          slug: `pgc-${row.code}-${slugify(row.name)}`,
          account_type: row.account_type,
          code: row.code,
          description: `Cuenta creada desde el catálogo ${config.accountingStandard === 'pgc' ? 'PGC' : 'PGC-PYMES'} España · Fase 9`,
          active: 1, predefined: 0, index: 900, amount: 0, currency_code: 'EUR',
          pgc_standard: config.accountingStandard, pgc_statement: row.statement, pgc_section: row.section,
          created_at: trx.fn.now(),
        });
        created += 1;
      }
      // Las subcuentas habituales (4300001, 5720002, etc.) heredan la clasificación
      // de la cuenta PGC de prefijo más largo, sin obligar a renumerar el plan existente.
      const allAccounts = await trx('accounts').select('id','code','pgc_statement','pgc_section');
      const ordered = [...catalog].sort((a: any, b: any) => String(b.code).length - String(a.code).length);
      for (const account of allAccounts) {
        const code = String(account.code || '');
        if (!/^\d{3,10}$/.test(code)) continue;
        const match: any = ordered.find((row: any) => code.startsWith(String(row.code)));
        if (!match) continue;
        if (account.pgc_statement !== match.statement || account.pgc_section !== match.section) {
          await trx('accounts').where({ id: account.id }).update({ pgc_standard: config.accountingStandard, pgc_statement: match.statement, pgc_section: match.section });
          prefixMapped += 1;
        }
      }
    });
    return { created, updated, prefixMapped, catalogSize: catalog.length, standard: config.accountingStandard };
  }

  async pgcDiagnostics() {
    const knex = this.tenantKnex();
    const accounts = await knex('accounts').select('id', 'code', 'name', 'account_type', 'pgc_standard', 'pgc_statement', 'pgc_section').orderBy('code');
    const catalog = await this.pgcCatalog();
    const ordered = [...catalog].sort((a: any, b: any) => String(b.code).length - String(a.code).length);
    const unmapped = accounts.filter((a: any) => !a.code || !a.pgc_statement || !a.pgc_section).map((a: any) => {
      const match: any = ordered.find((row: any) => String(a.code || '').startsWith(String(row.code)));
      return { ...a, suggestedCode: match?.code || null, suggestedSection: match?.section || null };
    });
    const invalidCodes = accounts.filter((a: any) => a.code && !/^\d{3,10}$/.test(String(a.code)));
    const duplicateCodes = await knex('accounts').select('code').count('* as count').whereNotNull('code').groupBy('code').havingRaw('COUNT(*) > 1');
    return {
      totalAccounts: accounts.length,
      mappedAccounts: accounts.length - unmapped.length,
      unmapped,
      invalidCodes,
      duplicateCodes,
      ready: unmapped.length === 0 && invalidCodes.length === 0 && duplicateCodes.length === 0,
    };
  }

  private async groupedTransactions(filter: PgcReportQueryDto, mode: 'balance' | 'profit_loss') {
    const knex = this.tenantKnex();
    const q = knex('accounts_transactions as t')
      .join('accounts as a', 'a.id', 't.account_id')
      .select('a.id', 'a.code', 'a.name', 'a.account_type', 'a.pgc_statement', 'a.pgc_section')
      .sum({ debit: 't.debit', credit: 't.credit' })
      .groupBy('a.id', 'a.code', 'a.name', 'a.account_type', 'a.pgc_statement', 'a.pgc_section')
      .orderBy('a.code');
    if (mode === 'profit_loss') {
      if (filter.fromDate) q.where('t.date', '>=', filter.fromDate);
      if (filter.toDate) q.where('t.date', '<=', filter.toDate);
      q.where('a.pgc_statement', 'profit_loss');
    } else {
      if (filter.toDate) q.where('t.date', '<=', filter.toDate);
      q.where('a.pgc_statement', 'balance');
    }
    return q;
  }

  async profitLoss(filter: PgcReportQueryDto) {
    const rows = await this.groupedTransactions(filter, 'profit_loss');
    const data = rows.map((r: any) => {
      const debit = Number(r.debit || 0), credit = Number(r.credit || 0);
      const income = ['income', 'other-income'].includes(r.account_type);
      return { ...r, debit: round2(debit), credit: round2(credit), amount: round2(income ? credit - debit : debit - credit) };
    });
    const sections: Record<string, number> = {};
    data.forEach((r: any) => { sections[r.pgc_section || 'unmapped'] = round2((sections[r.pgc_section || 'unmapped'] || 0) + r.amount); });
    const income = data.filter((r: any) => ['income', 'other-income'].includes(r.account_type)).reduce((s: number, r: any) => s + r.amount, 0);
    const expenses = data.filter((r: any) => !['income', 'other-income'].includes(r.account_type)).reduce((s: number, r: any) => s + r.amount, 0);
    return { period: filter, standard: (await this.getConfig()).accountingStandard, sections, rows: data, totals: { income: round2(income), expenses: round2(expenses), result: round2(income - expenses) } };
  }

  async balanceSheet(filter: PgcReportQueryDto) {
    const rows = await this.groupedTransactions(filter, 'balance');
    const creditSections = new Set(['equity', 'non_current_liabilities', 'current_liabilities']);
    const data = rows.map((r: any) => {
      const debit = Number(r.debit || 0), credit = Number(r.credit || 0);
      const creditNormal = creditSections.has(r.pgc_section);
      return { ...r, debit: round2(debit), credit: round2(credit), amount: round2(creditNormal ? credit - debit : debit - credit) };
    });
    const sections: Record<string, number> = {};
    data.forEach((r: any) => { sections[r.pgc_section || 'unmapped'] = round2((sections[r.pgc_section || 'unmapped'] || 0) + r.amount); });
    // Hasta el asiento de regularización/cierre, las cuentas 6/7 todavía contienen el
    // resultado del ejercicio. Lo incorporamos como patrimonio neto provisional para
    // que el balance de gestión español no aparezca artificialmente descuadrado.
    const asOf = cleanDate(filter.toDate);
    const yearStart = asOf ? `${asOf.slice(0, 4)}-01-01` : undefined;
    const currentResultReport = await this.profitLoss({ fromDate: yearStart, toDate: asOf });
    const currentYearResult = round2(currentResultReport.totals.result);
    if (currentYearResult) sections.current_year_result = currentYearResult;
    const assets = round2((sections.non_current_assets || 0) + (sections.current_assets || 0));
    const equityLiabilities = round2((sections.equity || 0) + currentYearResult + (sections.non_current_liabilities || 0) + (sections.current_liabilities || 0));
    return {
      asOf: asOf || null,
      standard: (await this.getConfig()).accountingStandard,
      sections,
      rows: data,
      totals: { assets, equityAndLiabilities: equityLiabilities, currentYearResult, difference: round2(assets - equityLiabilities) },
      note: 'El resultado corriente se incorpora provisionalmente al patrimonio neto hasta su regularización/cierre contable en la cuenta 129.',
    };
  }

  async trialBalance(filter: PgcReportQueryDto) {
    const knex = this.tenantKnex();
    const start = cleanDate(filter.fromDate);
    const end = cleanDate(filter.toDate);
    const accounts = await knex('accounts')
      .select('id','code','name','account_type','pgc_statement','pgc_section')
      .whereNotNull('code')
      .orderBy('code');
    const ids = accounts.map((a: any) => a.id);
    if (!ids.length) return { period: filter, rows: [], totals: { openingDebit: 0, openingCredit: 0, debit: 0, credit: 0, closingDebit: 0, closingCredit: 0 } };

    const opening = start
      ? await knex('accounts_transactions').select('account_id').sum({ debit: 'debit', credit: 'credit' }).whereIn('account_id', ids).where('date','<',start).groupBy('account_id')
      : [];
    const movementsQ = knex('accounts_transactions').select('account_id').sum({ debit: 'debit', credit: 'credit' }).whereIn('account_id', ids).groupBy('account_id');
    if (start) movementsQ.where('date','>=',start);
    if (end) movementsQ.where('date','<=',end);
    const movements = await movementsQ;
    const openingMap = new Map(opening.map((r: any) => [Number(r.account_id), r]));
    const movementMap = new Map(movements.map((r: any) => [Number(r.account_id), r]));
    const rows = accounts.map((a: any) => {
      const o: any = openingMap.get(Number(a.id)) || {};
      const m: any = movementMap.get(Number(a.id)) || {};
      const openingBalance = round2(Number(o.debit || 0) - Number(o.credit || 0));
      const debit = round2(Number(m.debit || 0));
      const credit = round2(Number(m.credit || 0));
      const closingBalance = round2(openingBalance + debit - credit);
      return { ...a, openingDebit: openingBalance > 0 ? openingBalance : 0, openingCredit: openingBalance < 0 ? -openingBalance : 0, debit, credit, closingDebit: closingBalance > 0 ? closingBalance : 0, closingCredit: closingBalance < 0 ? -closingBalance : 0 };
    }).filter((r: any) => r.openingDebit || r.openingCredit || r.debit || r.credit || r.closingDebit || r.closingCredit);
    const totals = rows.reduce((t: any, r: any) => {
      for (const k of ['openingDebit','openingCredit','debit','credit','closingDebit','closingCredit']) t[k] = round2(t[k] + Number(r[k] || 0));
      return t;
    }, { openingDebit:0, openingCredit:0, debit:0, credit:0, closingDebit:0, closingCredit:0 });
    return { period: filter, standard: (await this.getConfig()).accountingStandard, rows, totals, balanced: round2(totals.debit - totals.credit) === 0 };
  }

  async bankAccounts() {
    return this.tenantKnex()('accounts').select('id','code','name','currency_code','iban','bic','bank_name','bank_account_holder','bank_country_code','sepa_creditor_identifier','sepa_enabled').where({ account_type: 'bank' }).orderBy('name');
  }

  async updateBankAccount(accountId: number, input: UpdateSepaBankAccountDto) {
    const knex = this.tenantKnex();
    const account = await knex('accounts').where({ id: accountId, account_type: 'bank' }).first();
    if (!account) throw new NotFoundException('BANK_ACCOUNT_NOT_FOUND');
    const iban = input.iban !== undefined ? normalizeIban(input.iban) : undefined;
    const bic = input.bic !== undefined ? normalizeBic(input.bic) : undefined;
    const creditorIdentifier = input.sepaCreditorIdentifier !== undefined ? String(input.sepaCreditorIdentifier || '').replace(/\s+/g, '').toUpperCase() : undefined;
    if (iban && !isValidIban(iban)) throw new BadRequestException('IBAN_INVALID');
    if (bic && !isValidBic(bic)) throw new BadRequestException('BIC_INVALID');
    if (creditorIdentifier && !isValidCreditorIdentifier(creditorIdentifier)) throw new BadRequestException('SEPA_CREDITOR_IDENTIFIER_INVALID');
    const patch: any = {};
    if (iban !== undefined) patch.iban = iban || null;
    if (bic !== undefined) patch.bic = bic || null;
    if (input.bankName !== undefined) patch.bank_name = input.bankName || null;
    if (input.bankAccountHolder !== undefined) patch.bank_account_holder = input.bankAccountHolder || null;
    if (input.bankCountryCode !== undefined) patch.bank_country_code = input.bankCountryCode?.toUpperCase() || null;
    if (creditorIdentifier !== undefined) patch.sepa_creditor_identifier = creditorIdentifier || null;
    if (input.sepaEnabled !== undefined) patch.sepa_enabled = input.sepaEnabled ? 1 : 0;
    if (input.sepaEnabled) {
      const effectiveIban = iban !== undefined ? iban : normalizeIban(account.iban);
      if (!isValidIban(effectiveIban)) throw new BadRequestException('BANK_ACCOUNT_NOT_SEPA_READY');
    }
    await knex('accounts').where({ id: accountId }).update(patch);
    return knex('accounts').where({ id: accountId }).first();
  }

  async contacts(search?: string) {
    const q = this.tenantKnex()('contacts').select('id','contact_service','display_name','fiscal_number','fiscal_territory','sepa_iban','sepa_bic','sepa_account_holder','billing_address_country').where({ active: 1 }).orderBy('display_name').limit(200);
    if (search) q.where('display_name', 'like', `%${search}%`);
    return q;
  }

  async updateContact(contactId: number, input: UpdateContactSepaDto) {
    const knex = this.tenantKnex();
    const contact = await knex('contacts').where({ id: contactId }).first();
    if (!contact) throw new NotFoundException('CONTACT_NOT_FOUND');
    const iban = input.sepaIban !== undefined ? normalizeIban(input.sepaIban) : undefined;
    const bic = input.sepaBic !== undefined ? normalizeBic(input.sepaBic) : undefined;
    if (iban && !isValidIban(iban)) throw new BadRequestException('IBAN_INVALID');
    if (bic && !isValidBic(bic)) throw new BadRequestException('BIC_INVALID');
    const patch: any = {};
    if (iban !== undefined) patch.sepa_iban = iban || null;
    if (bic !== undefined) patch.sepa_bic = bic || null;
    if (input.sepaAccountHolder !== undefined) patch.sepa_account_holder = input.sepaAccountHolder || null;
    if (input.fiscalTerritory !== undefined) patch.fiscal_territory = input.fiscalTerritory;
    await knex('contacts').where({ id: contactId }).update(patch);
    return knex('contacts').where({ id: contactId }).first();
  }

  async mandates() {
    return this.tenantKnex()('sepa_mandates as m').leftJoin('contacts as c','c.id','m.contact_id')
      .select('m.*','c.display_name as contact_name').orderBy('m.id','desc');
  }

  async createMandate(input: CreateSepaMandateDto) {
    const iban = normalizeIban(input.debtorIban), bic = normalizeBic(input.debtorBic);
    if (!isValidIban(iban)) throw new BadRequestException('IBAN_INVALID');
    if (!isValidBic(bic)) throw new BadRequestException('BIC_INVALID');
    const knex = this.tenantKnex();
    const contact = await knex('contacts').where({ id: input.contactId }).first();
    if (!contact) throw new NotFoundException('CONTACT_NOT_FOUND');
    try {
      const [id] = await knex('sepa_mandates').insert({
        contact_id: input.contactId, mandate_reference: input.mandateReference.trim(), scheme: input.scheme || 'CORE',
        signature_date: input.signatureDate, status: 'active', debtor_name: input.debtorName.trim(), debtor_iban: iban,
        debtor_bic: bic || null, debtor_country_code: input.debtorCountryCode?.toUpperCase() || contact.billing_address_country || null,
        created_at: knex.fn.now(),
      });
      await knex('contacts').where({ id: input.contactId }).update({ sepa_iban: iban, sepa_bic: bic || null, sepa_account_holder: input.debtorName.trim() });
      return knex('sepa_mandates').where({ id }).first();
    } catch (e: any) {
      if (/unique|duplicate/i.test(String(e?.message || ''))) throw new ConflictException('SEPA_MANDATE_REFERENCE_EXISTS');
      throw e;
    }
  }

  async updateMandate(id: number, input: UpdateSepaMandateDto) {
    const knex = this.tenantKnex();
    const row = await knex('sepa_mandates').where({ id }).first();
    if (!row) throw new NotFoundException('SEPA_MANDATE_NOT_FOUND');
    const patch: any = { updated_at: knex.fn.now() };
    if (input.status !== undefined) patch.status = input.status;
    if (input.debtorName !== undefined) patch.debtor_name = input.debtorName;
    if (input.debtorIban !== undefined) {
      const iban = normalizeIban(input.debtorIban); if (!isValidIban(iban)) throw new BadRequestException('IBAN_INVALID'); patch.debtor_iban = iban;
    }
    if (input.debtorBic !== undefined) {
      const bic = normalizeBic(input.debtorBic); if (!isValidBic(bic)) throw new BadRequestException('BIC_INVALID'); patch.debtor_bic = bic || null;
    }
    await knex('sepa_mandates').where({ id }).update(patch);
    return knex('sepa_mandates').where({ id }).first();
  }

  async remittances() {
    return this.tenantKnex()('sepa_remittances as r').leftJoin('accounts as a','a.id','r.account_id')
      .select('r.*','a.name as account_name','a.iban as account_iban').orderBy('r.id','desc').limit(250);
  }

  async getRemittance(id: number) {
    const knex = this.tenantKnex();
    const row = await knex('sepa_remittances as r').leftJoin('accounts as a','a.id','r.account_id').select('r.*','a.name as account_name').where('r.id',id).first();
    if (!row) throw new NotFoundException('SEPA_REMITTANCE_NOT_FOUND');
    const entries = await knex('sepa_remittance_entries').where({ remittance_id: id }).orderBy('id');
    return { ...row, entries };
  }

  async createRemittance(input: CreateSepaRemittanceDto) {
    if (!input.entries?.length) throw new BadRequestException('SEPA_REMITTANCE_EMPTY');
    const knex = this.tenantKnex();
    const bank = await knex('accounts').where({ id: input.accountId, account_type: 'bank' }).first();
    if (!bank) throw new NotFoundException('BANK_ACCOUNT_NOT_FOUND');
    if (!bank.sepa_enabled || !isValidIban(bank.iban)) throw new BadRequestException('BANK_ACCOUNT_NOT_SEPA_READY');
    if (!isValidBic(bank.bic)) throw new BadRequestException('BANK_BIC_INVALID');
    if (input.remittanceType === 'SDD' && !isValidCreditorIdentifier(bank.sepa_creditor_identifier)) throw new BadRequestException('SEPA_CREDITOR_IDENTIFIER_INVALID');
    const messageId = String(input.messageId || makeMessageId(input.remittanceType)).replace(/[^A-Za-z0-9+?/:().,'-]/g, '-').slice(0, 35);
    return knex.transaction(async (trx) => {
      const [id] = await trx('sepa_remittances').insert({
        remittance_type: input.remittanceType, scheme: input.remittanceType === 'SDD' ? (input.scheme || 'CORE') : null,
        message_id: messageId, account_id: input.accountId, requested_date: input.requestedDate, status: 'draft', note: input.note || null,
        transaction_count: input.entries.length, control_sum: round2(input.entries.reduce((s, e) => s + Number(e.amount || 0), 0)), created_at: trx.fn.now(),
      });
      let idx = 0;
      for (const e of input.entries) {
        idx += 1;
        let iban = normalizeIban(e.iban), bic = normalizeBic(e.bic), mandate: any = null;
        if (e.contactId && (!iban || !bic)) {
          const c = await trx('contacts').where({ id: e.contactId }).first();
          iban = iban || normalizeIban(c?.sepa_iban); bic = bic || normalizeBic(c?.sepa_bic);
        }
        if (!isValidIban(iban)) throw new BadRequestException(`IBAN_INVALID_ENTRY_${idx}`);
        if (!isValidBic(bic)) throw new BadRequestException(`BIC_INVALID_ENTRY_${idx}`);
        let sequence = e.sequenceType || null;
        if (input.remittanceType === 'SDD') {
          if (!e.mandateId) throw new BadRequestException(`SEPA_MANDATE_REQUIRED_ENTRY_${idx}`);
          mandate = await trx('sepa_mandates').where({ id: e.mandateId, status: 'active' }).first();
          if (!mandate) throw new BadRequestException(`SEPA_MANDATE_INVALID_ENTRY_${idx}`);
          if ((input.scheme || 'CORE') !== mandate.scheme) throw new BadRequestException(`SEPA_MANDATE_SCHEME_MISMATCH_ENTRY_${idx}`);
          iban = mandate.debtor_iban; bic = mandate.debtor_bic; sequence = sequence || (mandate.last_collection_date ? 'RCUR' : 'FRST');
        }
        await trx('sepa_remittance_entries').insert({
          remittance_id: id, contact_id: e.contactId || mandate?.contact_id || null, mandate_id: e.mandateId || null,
          source_type: e.sourceType || null, source_id: e.sourceId || null, counterparty_name: e.counterpartyName,
          iban, bic: bic || null, country_code: e.countryCode?.toUpperCase() || mandate?.debtor_country_code || null,
          amount: round2(e.amount), end_to_end_id: String(e.endToEndId || `${messageId}-${idx}`).slice(0,35), sequence_type: sequence,
          remittance_information: e.remittanceInformation || null, created_at: trx.fn.now(),
        });
      }
      return this.getRemittance(Number(id));
    });
  }

  async generateRemittance(id: number) {
    const knex = this.tenantKnex();
    const current = await this.getRemittance(id);
    if (current.xml_payload && ['generated', 'exported'].includes(current.status)) return current;
    if (current.status !== 'draft') throw new ConflictException('SEPA_REMITTANCE_IMMUTABLE');
    const bank = await knex('accounts').where({ id: current.account_id }).first();
    if (!bank || !bank.sepa_enabled || !isValidIban(bank.iban)) throw new BadRequestException('BANK_ACCOUNT_NOT_SEPA_READY');
    const entries: any[] = [];
    for (const row of current.entries) {
      let mandate: any = null;
      if (current.remittance_type === 'SDD') mandate = await knex('sepa_mandates').where({ id: row.mandate_id }).first();
      entries.push({
        counterpartyName: row.counterparty_name, iban: row.iban, bic: row.bic, countryCode: row.country_code,
        amount: Number(row.amount), endToEndId: row.end_to_end_id, remittanceInformation: row.remittance_information,
        mandateReference: mandate?.mandate_reference, signatureDate: mandate ? String(mandate.signature_date).slice(0,10) : undefined,
        sequenceType: row.sequence_type,
      });
    }
    const bankData = { holder: bank.bank_account_holder || bank.name, iban: bank.iban, bic: bank.bic, countryCode: bank.bank_country_code || 'ES', creditorIdentifier: bank.sepa_creditor_identifier };
    const xml = current.remittance_type === 'SCT'
      ? buildPain001({ messageId: current.message_id, requestedDate: String(current.requested_date).slice(0,10), bank: bankData, entries })
      : buildPain008({ messageId: current.message_id, requestedDate: String(current.requested_date).slice(0,10), scheme: current.scheme || 'CORE', bank: bankData, entries });
    await knex('sepa_remittances').where({ id }).update({ xml_payload: xml, xml_sha256: sha256(xml), status: 'generated', generated_at: knex.fn.now(), updated_at: knex.fn.now() });
    return this.getRemittance(id);
  }

  async markRemittanceExported(id: number) {
    const knex = this.tenantKnex();
    const current = await this.getRemittance(id);
    if (current.status === 'exported') return current;
    if (current.status !== 'generated' || !current.xml_payload) throw new ConflictException('SEPA_REMITTANCE_NOT_GENERATED');
    await knex.transaction(async (trx) => {
      await trx('sepa_remittances').where({ id }).update({ status: 'exported', exported_at: trx.fn.now(), updated_at: trx.fn.now() });
      if (current.remittance_type === 'SDD') {
        const mandateIds = [...new Set(current.entries.map((e: any) => Number(e.mandate_id)).filter(Boolean))];
        if (mandateIds.length) await trx('sepa_mandates').whereIn('id', mandateIds).update({ last_collection_date: current.requested_date, updated_at: trx.fn.now() });
      }
    });
    return this.getRemittance(id);
  }

  validateIban(iban: string, bic?: string) {
    return { iban: normalizeIban(iban), ibanValid: isValidIban(iban), bic: normalizeBic(bic), bicValid: isValidBic(bic) };
  }

  async territorySummary() {
    const knex = this.tenantKnex();
    const config = await this.getConfig();
    const taxes = await knex('tax_rates').select('id','code','name','rate','active','tax_territory','fiscal_regime').whereIn('tax_territory',['iva','igic','ipsi']).orderBy(['tax_territory','rate']);
    const contacts = await knex('contacts').select('fiscal_territory').count('* as count').groupBy('fiscal_territory');
    return { config, taxes, contacts, warning: config.fiscalTerritory === 'common' ? null : 'Los impuestos IGIC/IPSI no deben entrar en las casillas ordinarias de IVA/Modelo 303. Revise siempre reglas territoriales y asesoría fiscal.' };
  }
}
