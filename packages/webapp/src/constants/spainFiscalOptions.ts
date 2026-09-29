export interface SpainFiscalOption {
  key: string;
  label: string;
}

export const CONTACT_FISCAL_TERRITORY_OPTIONS: SpainFiscalOption[] = [
  { key: 'common', label: 'Península / Baleares (IVA)' },
  { key: 'canary', label: 'Canarias (IGIC)' },
  { key: 'ceuta', label: 'Ceuta (IPSI)' },
  { key: 'melilla', label: 'Melilla (IPSI)' },
];

export const TAX_TERRITORY_OPTIONS: SpainFiscalOption[] = [
  { key: 'iva', label: 'IVA · Península / Baleares' },
  { key: 'igic', label: 'IGIC · Canarias' },
  { key: 'ipsi', label: 'IPSI · Ceuta / Melilla' },
];

export const FISCAL_REGIME_OPTIONS: SpainFiscalOption[] = [
  { key: 'standard', label: 'Sujeta y no exenta' },
  { key: 'exempt', label: 'Exenta' },
  { key: 'not_subject', label: 'No sujeta' },
  { key: 'reverse_charge', label: 'Inversión del sujeto pasivo' },
];

export const SPANISH_OPERATION_TYPE_OPTIONS: SpainFiscalOption[] = [
  { key: 'domestic', label: 'Operación nacional' },
  { key: 'intra_community_goods_supply', label: 'Entrega intracomunitaria de bienes' },
  { key: 'intra_community_goods_acquisition', label: 'Adquisición intracomunitaria de bienes' },
  { key: 'intra_community_service_supply', label: 'Prestación intracomunitaria de servicios' },
  { key: 'intra_community_service_acquisition', label: 'Adquisición intracomunitaria de servicios' },
  { key: 'export', label: 'Exportación' },
  { key: 'import', label: 'Importación' },
  { key: 'domestic_reverse_charge', label: 'Inversión del sujeto pasivo (operación interior)' },
  { key: 'oss', label: 'OSS' },
  { key: 'ioss', label: 'IOSS' },
  { key: 'igic_ipsi', label: 'Operación IGIC / IPSI' },
  { key: 'other', label: 'Otra operación' },
];

export const OSS_SCHEME_OPTIONS: SpainFiscalOption[] = [
  { key: '', label: 'No aplica' },
  { key: 'union', label: 'OSS · Régimen de la Unión' },
  { key: 'non_union', label: 'OSS · Régimen exterior a la Unión' },
  { key: 'import', label: 'IOSS · Régimen de importación' },
];

export const AEAT_TAX_CODE_OPTIONS: SpainFiscalOption[] = [
  { key: '01', label: '01 · IVA' },
  { key: '02', label: '02 · IPSI' },
  { key: '03', label: '03 · IGIC' },
  { key: '05', label: '05 · Otros tributos' },
];

// Claves utilizadas por los libros/SII. Algunas claves sólo son válidas en
// emitidas o recibidas; el servidor conserva la validación contextual final.
export const AEAT_REGIME_KEY_OPTIONS: SpainFiscalOption[] = [
  { key: '01', label: '01 · Régimen general' },
  { key: '02', label: '02 · Exportación / compensaciones REAGYP' },
  { key: '03', label: '03 · Bienes usados, arte, antigüedades y colección' },
  { key: '04', label: '04 · Oro de inversión' },
  { key: '05', label: '05 · Agencias de viajes' },
  { key: '06', label: '06 · Grupo de entidades IVA' },
  { key: '07', label: '07 · Criterio de caja / clave especial según libro' },
  { key: '08', label: '08 · IGIC / IPSI / clave especial según libro' },
  { key: '09', label: '09 · Operación intracomunitaria' },
  { key: '10', label: '10 · Operación especial AEAT' },
  { key: '11', label: '11 · Operación especial AEAT' },
  { key: '12', label: '12 · Arrendamiento / operación especial AEAT' },
  { key: '13', label: '13 · Importación / arrendamiento según libro' },
  { key: '14', label: '14 · Operación especial AEAT' },
  { key: '15', label: '15 · Operación especial AEAT' },
  { key: '16', label: '16 · Operación especial AEAT' },
  { key: '17', label: '17 · Operación especial AEAT' },
  { key: '18', label: '18 · Operación especial AEAT' },
];

export const AEAT_OPERATION_QUALIFICATION_OPTIONS: SpainFiscalOption[] = [
  { key: '', label: 'No aplica' },
  { key: 'S1', label: 'S1 · Sujeta y no exenta, sin inversión' },
  { key: 'S2', label: 'S2 · Sujeta y no exenta, con inversión del sujeto pasivo' },
  { key: 'N1', label: 'N1 · No sujeta (art. 7, 14 u otros)' },
  { key: 'N2', label: 'N2 · No sujeta por reglas de localización' },
];

export const AEAT_EXEMPTION_CAUSE_OPTIONS: SpainFiscalOption[] = [
  { key: '', label: 'No aplica' },
  { key: 'E1', label: 'E1 · Exenta por el artículo 20 LIVA' },
  { key: 'E2', label: 'E2 · Exenta por el artículo 21 LIVA' },
  { key: 'E3', label: 'E3 · Exenta por el artículo 22 LIVA' },
  { key: 'E4', label: 'E4 · Exenta por artículos 23 y 24 LIVA' },
  { key: 'E5', label: 'E5 · Exenta por el artículo 25 LIVA' },
  { key: 'E6', label: 'E6 · Exenta por otras causas' },
];

export const AEAT_FOREIGN_ID_TYPE_OPTIONS: SpainFiscalOption[] = [
  { key: '', label: 'No aplica / NIF español' },
  { key: '02', label: '02 · NIF-IVA (operador intracomunitario)' },
  { key: '03', label: '03 · Pasaporte' },
  { key: '04', label: '04 · Documento oficial de identificación' },
  { key: '05', label: '05 · Certificado de residencia' },
  { key: '06', label: '06 · Otro documento probatorio' },
  { key: '07', label: '07 · No censado' },
];

export const ELECTRONIC_INVOICE_CHANNEL_OPTIONS: SpainFiscalOption[] = [
  { key: 'none', label: 'Sin canal electrónico' },
  { key: 'face', label: 'FACe / Administración Pública' },
  { key: 'b2b-public', label: 'B2B · Solución pública' },
  { key: 'b2b-private', label: 'B2B · Plataforma privada' },
  { key: 'auto', label: 'Automático según destinatario' },
];

export const PAYMENT_METHOD_OPTIONS: SpainFiscalOption[] = [
  { key: 'receipt', label: 'Recibo' },
  { key: 'transfer', label: 'Transferencia' },
  { key: 'direct-debit', label: 'Domiciliación / adeudo SEPA' },
  { key: 'negotiable-draft', label: 'Giro negociable' },
  { key: 'promissory-note', label: 'Pagaré' },
  { key: 'cash', label: 'Contado' },
  { key: 'card', label: 'Tarjeta' },
  { key: 'other', label: 'Otra forma de pago' },
];
