import { Knex } from 'knex';

const taxRates = [
  { name: 'IVA general 21%', code: 'ES-IVA-21', rate: 21, fiscal_regime: 'standard', equivalence_surcharge_rate: 0, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S1' },
  { name: 'IVA reducido 10%', code: 'ES-IVA-10', rate: 10, fiscal_regime: 'standard', equivalence_surcharge_rate: 0, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S1' },
  { name: 'IVA superreducido 4%', code: 'ES-IVA-4', rate: 4, fiscal_regime: 'standard', equivalence_surcharge_rate: 0, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S1' },
  // Recargo de equivalencia is opt-in: never attach it to a normal VAT rate.
  { name: 'IVA 21% + RE 5,2%', code: 'ES-IVA-21-RE', rate: 21, fiscal_regime: 'standard', equivalence_surcharge_rate: 5.2, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S1' },
  { name: 'IVA 10% + RE 1,4%', code: 'ES-IVA-10-RE', rate: 10, fiscal_regime: 'standard', equivalence_surcharge_rate: 1.4, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S1' },
  { name: 'IVA 4% + RE 0,5%', code: 'ES-IVA-4-RE', rate: 4, fiscal_regime: 'standard', equivalence_surcharge_rate: 0.5, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S1' },
  { name: 'IVA 0%', code: 'ES-IVA-0', rate: 0, fiscal_regime: 'standard', equivalence_surcharge_rate: 0, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S1' },
  { name: 'Exenta de IVA', code: 'ES-IVA-EXENTO', rate: 0, fiscal_regime: 'exempt', equivalence_surcharge_rate: 0, aeat_tax_code: '01', aeat_regime_key: '01', aeat_exemption_cause: 'E1' },
  { name: 'No sujeta a IVA', code: 'ES-IVA-NOSUJ', rate: 0, fiscal_regime: 'not_subject', equivalence_surcharge_rate: 0, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'N1' },
  { name: 'Inversión sujeto pasivo', code: 'ES-IVA-ISP', rate: 0, fiscal_regime: 'reverse_charge', equivalence_surcharge_rate: 0, aeat_tax_code: '01', aeat_regime_key: '01', aeat_operation_qualification: 'S2' },
];

const pgcAccounts = [
  ['Clientes (PGC 430)', 'pgc-430-clientes', 'accounts-receivable', '430'],
  ['Proveedores (PGC 400)', 'pgc-400-proveedores', 'accounts-payable', '400'],
  ['Bancos (PGC 572)', 'pgc-572-bancos', 'bank', '572'],
  ['Caja (PGC 570)', 'pgc-570-caja', 'cash', '570'],
  ['Ventas mercaderías (PGC 700)', 'pgc-700-ventas', 'income', '700'],
  ['Prestaciones servicios (PGC 705)', 'pgc-705-servicios', 'income', '705'],
  ['Compras mercaderías (PGC 600)', 'pgc-600-compras', 'cost-of-goods-sold', '600'],
  ['HP IVA soportado (PGC 472)', 'pgc-472-iva-soportado', 'other-current-asset', '472'],
  ['HP IVA repercutido (PGC 477)', 'pgc-477-iva-repercutido', 'tax-payable', '477'],
  ['HP retenciones y pagos a cuenta (PGC 473)', 'pgc-473-retenciones', 'other-current-asset', '473'],
  ['HP acreedora retenciones practicadas (PGC 4751)', 'pgc-4751-retenciones', 'other-current-liability', '4751'],
] as const;

async function addContactFiscalColumns(knex: Knex) {
  if (!(await knex.schema.hasColumn('contacts', 'fiscal_number'))) {
    await knex.schema.alterTable('contacts', (table) => {
      table.string('fiscal_number', 20).nullable().index();
      table.string('fiscal_country', 2).nullable().defaultTo('ES').index();
      table.string('tax_regime', 32).nullable().defaultTo('standard');
      table.string('aeat_id_type', 2).nullable();
    });
  }
}

async function addTaxRateFiscalColumns(knex: Knex) {
  if (!(await knex.schema.hasColumn('tax_rates', 'fiscal_regime'))) {
    await knex.schema.alterTable('tax_rates', (table) => {
      table.string('fiscal_regime', 32).notNullable().defaultTo('standard').index();
      table.decimal('equivalence_surcharge_rate', 8, 4).notNullable().defaultTo(0);
      table.decimal('retention_rate', 8, 4).notNullable().defaultTo(0);
      table.string('aeat_tax_code', 2).notNullable().defaultTo('01');
      table.string('aeat_regime_key', 2).notNullable().defaultTo('01');
      table.string('aeat_operation_qualification', 2).nullable();
      table.string('aeat_exemption_cause', 2).nullable();
    });
  }
}

async function addItemEntryFiscalSnapshot(knex: Knex) {
  if (!(await knex.schema.hasColumn('items_entries', 'fiscal_regime'))) {
    await knex.schema.alterTable('items_entries', (table) => {
      // Snapshot the fiscal classification on the document line so changing a
      // tax master later cannot silently rewrite an already-issued document.
      table.string('fiscal_regime', 32).nullable();
      table.decimal('equivalence_surcharge_rate', 8, 4).notNullable().defaultTo(0);
      table.decimal('retention_rate', 8, 4).notNullable().defaultTo(0);
      table.string('aeat_tax_code', 2).nullable();
      table.string('aeat_regime_key', 2).nullable();
      table.string('aeat_operation_qualification', 2).nullable();
      table.string('aeat_exemption_cause', 2).nullable();
      // Persist the proportional allocation of document-level discounts so
      // historical tax bases never depend on a later recalculation algorithm.
      table.decimal('document_discount_allocation', 19, 5).notNullable().defaultTo(0);
      table.decimal('discount_tax_base_amount', 19, 5).notNullable().defaultTo(0);
      table.decimal('discount_tax_amount', 19, 5).notNullable().defaultTo(0);
      table.decimal('document_adjustment_allocation', 19, 5).notNullable().defaultTo(0);
      table.decimal('adjustment_tax_base_amount', 19, 5).notNullable().defaultTo(0);
    });
  }
}

async function addFiscalAllocationUpgradeColumns(knex: Knex) {
  if (!(await knex.schema.hasColumn('items_entries', 'document_adjustment_allocation'))) {
    await knex.schema.alterTable('items_entries', (table) => {
      table.decimal('document_adjustment_allocation', 19, 5).notNullable().defaultTo(0);
      table.decimal('adjustment_tax_base_amount', 19, 5).notNullable().defaultTo(0);
    });
  }
}

async function addSaleInvoiceFiscalTotals(knex: Knex) {
  if (!(await knex.schema.hasColumn('sales_invoices', 'equivalence_surcharge_amount'))) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.decimal('equivalence_surcharge_amount', 15, 5).notNullable().defaultTo(0);
    });
  }
  if (!(await knex.schema.hasColumn('sales_invoices', 'retention_amount'))) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.decimal('retention_amount', 15, 5).notNullable().defaultTo(0);
    });
  }
}

export async function up(knex: Knex): Promise<void> {
  await addContactFiscalColumns(knex);
  await addTaxRateFiscalColumns(knex);
  await addItemEntryFiscalSnapshot(knex);
  await addFiscalAllocationUpgradeColumns(knex);
  await addSaleInvoiceFiscalTotals(knex);

  for (const rate of taxRates) {
    const exists = await knex('tax_rates').where({ code: rate.code }).first();
    if (!exists) {
      await knex('tax_rates').insert({
        ...rate,
        retention_rate: 0,
        description: 'Configuración fiscal España. Revise la causa AEAT en operaciones especiales.',
        active: 1,
      });
    }
  }

  for (const [name, slug, account_type, code] of pgcAccounts) {
    const exists = await knex('accounts').where({ slug }).first();
    if (!exists) {
      await knex('accounts').insert({
        name,
        slug,
        account_type,
        code,
        description: 'Cuenta base PGC España',
        active: 1,
        predefined: 0,
        index: 100,
      });
    }
  }

  const defaults = [
    ['organization', 'language', 'es'],
    ['organization', 'date_format', 'DD/MM/yyyy'],
    ['organization', 'time_zone', 'Europe/Madrid'],
    ['organization', 'fiscal_country', 'ES'],
  ] as const;
  for (const [group, key, value] of defaults) {
    const exists = await knex('settings').where({ group, key }).first();
    if (exists) await knex('settings').where({ id: exists.id }).update({ value });
    else await knex('settings').insert({ group, key, value });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex('tax_rates').whereIn('code', taxRates.map((r) => r.code)).delete();
  await knex('accounts').whereIn('slug', pgcAccounts.map((a) => a[1])).delete();

  if (await knex.schema.hasColumn('sales_invoices', 'equivalence_surcharge_amount')) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.dropColumn('equivalence_surcharge_amount');
      table.dropColumn('retention_amount');
    });
  }
  if (await knex.schema.hasColumn('items_entries', 'fiscal_regime')) {
    await knex.schema.alterTable('items_entries', (table) => {
      table.dropColumn('fiscal_regime');
      table.dropColumn('equivalence_surcharge_rate');
      table.dropColumn('retention_rate');
      table.dropColumn('aeat_tax_code');
      table.dropColumn('aeat_regime_key');
      table.dropColumn('aeat_operation_qualification');
      table.dropColumn('aeat_exemption_cause');
      table.dropColumn('document_discount_allocation');
      table.dropColumn('discount_tax_base_amount');
      table.dropColumn('discount_tax_amount');
      table.dropColumn('document_adjustment_allocation');
      table.dropColumn('adjustment_tax_base_amount');
    });
  }
  if (await knex.schema.hasColumn('tax_rates', 'fiscal_regime')) {
    await knex.schema.alterTable('tax_rates', (table) => {
      table.dropColumn('fiscal_regime');
      table.dropColumn('equivalence_surcharge_rate');
      table.dropColumn('retention_rate');
      table.dropColumn('aeat_tax_code');
      table.dropColumn('aeat_regime_key');
      table.dropColumn('aeat_operation_qualification');
      table.dropColumn('aeat_exemption_cause');
    });
  }
  if (await knex.schema.hasColumn('contacts', 'fiscal_number')) {
    await knex.schema.alterTable('contacts', (table) => {
      table.dropColumn('fiscal_number');
      table.dropColumn('fiscal_country');
      table.dropColumn('tax_regime');
      table.dropColumn('aeat_id_type');
    });
  }
}
