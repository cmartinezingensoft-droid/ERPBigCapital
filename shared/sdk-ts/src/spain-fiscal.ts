import type { ApiFetcher } from './fetch-utils';
import { rawRequest } from './fetch-utils';

export interface SpanishFiscalPeriod { fromDate?: string; toDate?: string }
export interface SpanishFiscalConfig {
  vatPeriodicity: 'monthly' | 'quarterly';
  reccEnabled: boolean;
  ossUnionEnabled: boolean;
  ossNonUnionEnabled: boolean;
  iossEnabled: boolean;
  inputVatDeductibilityPercent: number;
  siiEnabled?: boolean;
}
export interface ViesCheckInput { countryCode: string; vatNumber: string; contactId?: number }

const qs = (period: SpanishFiscalPeriod = {}) => {
  const p = new URLSearchParams();
  if (period.fromDate) p.set('fromDate', period.fromDate);
  if (period.toDate) p.set('toDate', period.toDate);
  const value = p.toString();
  return value ? `?${value}` : '';
};

export const fetchSpanishFiscalConfig = (fetcher: ApiFetcher) =>
  rawRequest<SpanishFiscalConfig>(fetcher, 'GET', '/api/spain/fiscal/config');
export const updateSpanishFiscalConfig = (fetcher: ApiFetcher, body: Partial<SpanishFiscalConfig>) =>
  rawRequest<SpanishFiscalConfig>(fetcher, 'PUT', '/api/spain/fiscal/config', body);
export const fetchSpanishVatBooks = (fetcher: ApiFetcher, period: SpanishFiscalPeriod) =>
  rawRequest<any>(fetcher, 'GET', `/api/spain/fiscal/vat-books${qs(period)}`);
export const fetchSpanishModel303 = (fetcher: ApiFetcher, period: SpanishFiscalPeriod) =>
  rawRequest<any>(fetcher, 'GET', `/api/spain/fiscal/model-303-preview${qs(period)}`);
export const fetchSpanishModel349 = (fetcher: ApiFetcher, period: SpanishFiscalPeriod) =>
  rawRequest<any>(fetcher, 'GET', `/api/spain/fiscal/model-349-preview${qs(period)}`);
export const fetchSpanishModel347 = (fetcher: ApiFetcher, period: SpanishFiscalPeriod) =>
  rawRequest<any>(fetcher, 'GET', `/api/spain/fiscal/model-347-preview${qs(period)}`);
export const fetchSpanishModel369 = (fetcher: ApiFetcher, period: SpanishFiscalPeriod) =>
  rawRequest<any>(fetcher, 'GET', `/api/spain/fiscal/model-369-preview${qs(period)}`);
export const checkVies = (fetcher: ApiFetcher, body: ViesCheckInput) =>
  rawRequest<any>(fetcher, 'POST', '/api/spain/fiscal/vies/check', body);
