import type { ApiFetcher } from './fetch-utils';
import { rawRequest } from './fetch-utils';

export type SpainAccountingStandard = 'pymes' | 'pgc';
export type SpainFiscalTerritory = 'common' | 'canary' | 'ceuta' | 'melilla';
export type SepaRemittanceType = 'SCT' | 'SDD';
export type SepaScheme = 'CORE' | 'B2B';

export interface SpainFinanceConfig {
  accountingStandard: SpainAccountingStandard;
  fiscalTerritory: SpainFiscalTerritory;
  sepaCreditTransferSchema: string;
  sepaDirectDebitSchema: string;
  structuredAddressRequiredFrom: string;
}
export interface SpainFinancePeriod { fromDate?: string; toDate?: string }
export interface SepaBankAccountInput {
  iban?: string; bic?: string; bankName?: string; bankAccountHolder?: string;
  bankCountryCode?: string; sepaCreditorIdentifier?: string; sepaEnabled?: boolean;
}
export interface SepaContactInput {
  sepaIban?: string; sepaBic?: string; sepaAccountHolder?: string; fiscalTerritory?: SpainFiscalTerritory;
}
export interface SepaMandateInput {
  contactId: number; mandateReference: string; scheme?: SepaScheme; signatureDate: string;
  debtorName: string; debtorIban: string; debtorBic?: string; debtorCountryCode?: string;
}
export interface SepaRemittanceEntryInput {
  contactId?: number; mandateId?: number; sourceType?: string; sourceId?: number;
  counterpartyName: string; iban: string; bic?: string; countryCode?: string;
  amount: number; endToEndId?: string; sequenceType?: 'FRST'|'RCUR'|'OOFF'|'FNAL'; remittanceInformation?: string;
}
export interface SepaRemittanceInput {
  remittanceType: SepaRemittanceType; scheme?: SepaScheme; accountId: number;
  requestedDate: string; messageId?: string; note?: string; entries: SepaRemittanceEntryInput[];
}

const query = (period: SpainFinancePeriod = {}) => {
  const p = new URLSearchParams();
  if (period.fromDate) p.set('fromDate', period.fromDate);
  if (period.toDate) p.set('toDate', period.toDate);
  const value = p.toString();
  return value ? `?${value}` : '';
};

export const fetchSpainFinanceConfig = (f: ApiFetcher) => rawRequest<SpainFinanceConfig>(f,'GET','/api/spain/finance/config');
export const updateSpainFinanceConfig = (f: ApiFetcher, body: Partial<SpainFinanceConfig>) => rawRequest<SpainFinanceConfig>(f,'PUT','/api/spain/finance/config',body);
export const fetchPgcCatalog = (f: ApiFetcher) => rawRequest<any[]>(f,'GET','/api/spain/finance/pgc/catalog');
export const initializePgc = (f: ApiFetcher) => rawRequest<any>(f,'POST','/api/spain/finance/pgc/initialize');
export const fetchPgcDiagnostics = (f: ApiFetcher) => rawRequest<any>(f,'GET','/api/spain/finance/pgc/diagnostics');
export const fetchPgcBalanceSheet = (f: ApiFetcher, p: SpainFinancePeriod) => rawRequest<any>(f,'GET',`/api/spain/finance/pgc/balance-sheet${query(p)}`);
export const fetchPgcProfitLoss = (f: ApiFetcher, p: SpainFinancePeriod) => rawRequest<any>(f,'GET',`/api/spain/finance/pgc/profit-loss${query(p)}`);
export const fetchPgcTrialBalance = (f: ApiFetcher, p: SpainFinancePeriod) => rawRequest<any>(f,'GET',`/api/spain/finance/pgc/trial-balance${query(p)}`);
export const fetchSpainBankAccounts = (f: ApiFetcher) => rawRequest<any[]>(f,'GET','/api/spain/finance/bank-accounts');
export const updateSpainBankAccount = (f: ApiFetcher, id: number, body: SepaBankAccountInput) => rawRequest<any>(f,'PUT',`/api/spain/finance/bank-accounts/${id}`,body);
export const fetchSpainFinanceContacts = (f: ApiFetcher, search?: string) => rawRequest<any[]>(f,'GET',`/api/spain/finance/contacts${search?`?search=${encodeURIComponent(search)}`:''}`);
export const updateSpainFinanceContact = (f: ApiFetcher, id: number, body: SepaContactInput) => rawRequest<any>(f,'PUT',`/api/spain/finance/contacts/${id}/sepa`,body);
export const validateSepa = (f: ApiFetcher, iban: string, bic?: string) => rawRequest<any>(f,'GET',`/api/spain/finance/sepa/validate?iban=${encodeURIComponent(iban)}${bic?`&bic=${encodeURIComponent(bic)}`:''}`);
export const fetchSepaMandates = (f: ApiFetcher) => rawRequest<any[]>(f,'GET','/api/spain/finance/sepa/mandates');
export const createSepaMandate = (f: ApiFetcher, body: SepaMandateInput) => rawRequest<any>(f,'POST','/api/spain/finance/sepa/mandates',body);
export const updateSepaMandate = (f: ApiFetcher, id: number, body: Partial<SepaMandateInput> & {status?: string}) => rawRequest<any>(f,'PUT',`/api/spain/finance/sepa/mandates/${id}`,body);
export const fetchSepaRemittances = (f: ApiFetcher) => rawRequest<any[]>(f,'GET','/api/spain/finance/sepa/remittances');
export const fetchSepaRemittance = (f: ApiFetcher, id: number) => rawRequest<any>(f,'GET',`/api/spain/finance/sepa/remittances/${id}`);
export const createSepaRemittance = (f: ApiFetcher, body: SepaRemittanceInput) => rawRequest<any>(f,'POST','/api/spain/finance/sepa/remittances',body);
export const generateSepaRemittance = (f: ApiFetcher, id: number) => rawRequest<any>(f,'POST',`/api/spain/finance/sepa/remittances/${id}/generate`);
export const markSepaRemittanceExported = (f: ApiFetcher, id: number) => rawRequest<any>(f,'POST',`/api/spain/finance/sepa/remittances/${id}/exported`);
export const fetchSpainTerritorySummary = (f: ApiFetcher) => rawRequest<any>(f,'GET','/api/spain/finance/territory');
