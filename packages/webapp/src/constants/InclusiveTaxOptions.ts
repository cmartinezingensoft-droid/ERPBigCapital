import { TaxType } from '@/interfaces/TaxRates';

export const InclusiveTaxOptions = [
  { key: TaxType.Inclusive, label: 'Impuestos incluidos' },
  { key: TaxType.Exclusive, label: 'Impuestos no incluidos' },
];
