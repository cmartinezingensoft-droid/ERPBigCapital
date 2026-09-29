import { registerAs } from '@nestjs/config';

const asBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export default registerAs('verifactu', () => {
  const environment = process.env.VERIFACTU_ENVIRONMENT === 'production'
    ? 'production'
    : 'test';

  return {
    enabled: asBoolean(process.env.VERIFACTU_ENABLED, false),
    environment,
    endpoint:
      process.env.VERIFACTU_ENDPOINT ||
      (environment === 'production'
        ? 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP'
        : 'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP'),
    qrEndpoint:
      process.env.VERIFACTU_QR_ENDPOINT ||
      (environment === 'production'
        ? 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR'
        : 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR'),
    certificatePath: process.env.VERIFACTU_CERTIFICATE_PATH || '',
    certificatePassphrase: process.env.VERIFACTU_CERTIFICATE_PASSPHRASE || '',
    producerName: process.env.VERIFACTU_PRODUCER_NAME || 'FaroCapital',
    producerTaxNumber: process.env.VERIFACTU_PRODUCER_TAX_NUMBER || '',
    systemName: process.env.VERIFACTU_SYSTEM_NAME || 'FaroCapital',
    systemId: (process.env.VERIFACTU_SYSTEM_ID || 'BC').slice(0, 2),
    systemVersion: process.env.VERIFACTU_SYSTEM_VERSION || '1.0.0',
    installationNumber: process.env.VERIFACTU_INSTALLATION_NUMBER || '1',
    requestTimeoutMs: Number(process.env.VERIFACTU_REQUEST_TIMEOUT_MS || 30000),
    defaultWaitSeconds: Number(process.env.VERIFACTU_DEFAULT_WAIT_SECONDS || 60),
    maxAttempts: Number(process.env.VERIFACTU_MAX_ATTEMPTS || 12),
  };
});
