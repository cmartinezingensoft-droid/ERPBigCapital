import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { basename } from 'path';
import { SETTINGS_PROVIDER } from '@/modules/Settings/Settings.types';
import { SettingsStore } from '@/modules/Settings/SettingsStore';
import {
  isValidSpanishFiscalNumber,
  normalizeSpanishFiscalNumber,
} from '@/modules/SpainFiscal/SpanishFiscalNumber';
import { UpdateVerifactuConfigDto } from './dtos/VerifactuConfig.dto';

export interface VerifactuRuntimeSettings {
  serverEnabled: boolean;
  tenantEnabled: boolean;
  siiEnabled: boolean;
  effectiveEnabled: boolean;
  environment: 'test' | 'production';
  endpoint: string;
  qrEndpoint: string;
  certificatePath: string;
  certificateFilename: string;
  certificatePassphrase: string;
  producerName: string;
  producerTaxNumber: string;
  systemName: string;
  systemId: string;
  systemVersion: string;
  installationNumber: string;
  requestTimeoutMs: number;
  defaultWaitSeconds: number;
  maxAttempts: number;
}

const TEST_ENDPOINT =
  'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP';
const PROD_ENDPOINT =
  'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP';
const TEST_QR_ENDPOINT = 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR';
const PROD_QR_ENDPOINT = 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR';

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return ['1', 'true', 'yes', 'on', 'si', 'sí'].includes(
    String(value).trim().toLowerCase(),
  );
};

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

@Injectable()
export class VerifactuSettingsService {
  constructor(
    private readonly config: ConfigService,
    @Inject(SETTINGS_PROVIDER)
    private readonly settingsStore: () => SettingsStore,
  ) {}

  async getRuntimeConfig(): Promise<VerifactuRuntimeSettings> {
    const store = await this.settingsStore();
    const get = (key: string, fallback: unknown) =>
      store.get({ group: 'verifactu', key }, fallback as never);

    // The process-level flag is a master switch. A tenant can opt out but can
    // never enable AEAT transmissions when the server administrator disabled
    // the integration globally.
    const serverEnabled = Boolean(this.config.get<boolean>('verifactu.enabled'));
    const tenantEnabled = toBoolean(get('enabled', serverEnabled), serverEnabled);
    const siiEnabled = toBoolean(get('sii_enabled', false), false);
    const environment =
      String(
        get(
          'environment',
          this.config.get<string>('verifactu.environment') || 'test',
        ),
      ) === 'production'
        ? 'production'
        : 'test';

    const defaultEndpoint = environment === 'production' ? PROD_ENDPOINT : TEST_ENDPOINT;
    const defaultQrEndpoint =
      environment === 'production' ? PROD_QR_ENDPOINT : TEST_QR_ENDPOINT;
    const certificatePath =
      String(this.config.get<string>('verifactu.certificatePath') || '').trim() ||
      String(get('certificate_path', '') || '').trim();

    return {
      serverEnabled,
      tenantEnabled,
      siiEnabled,
      effectiveEnabled: serverEnabled && tenantEnabled && !siiEnabled,
      environment,
      endpoint:
        String(process.env.VERIFACTU_ENDPOINT || '').trim() ||
        String(get('endpoint', '') || '').trim() ||
        defaultEndpoint,
      qrEndpoint:
        String(process.env.VERIFACTU_QR_ENDPOINT || '').trim() ||
        String(get('qr_endpoint', '') || '').trim() ||
        defaultQrEndpoint,
      certificatePath,
      certificateFilename: certificatePath ? basename(certificatePath) : '',
      // Never persist the certificate password in the tenant database.
      certificatePassphrase: String(
        this.config.get<string>('verifactu.certificatePassphrase') || '',
      ),
      producerName: String(
        get(
          'producer_name',
          this.config.get<string>('verifactu.producerName') || 'FaroCapital',
        ) || 'FaroCapital',
      ),
      producerTaxNumber: normalizeSpanishFiscalNumber(
        String(
          get(
            'producer_tax_number',
            this.config.get<string>('verifactu.producerTaxNumber') || '',
          ) || '',
        ),
      ),
      systemName: String(
        get(
          'system_name',
          this.config.get<string>('verifactu.systemName') || 'FaroCapital',
        ) || 'FaroCapital',
      ),
      systemId: String(
        get('system_id', this.config.get<string>('verifactu.systemId') || 'BC') ||
          'BC',
      ).slice(0, 2),
      systemVersion: String(
        get(
          'system_version',
          this.config.get<string>('verifactu.systemVersion') || '1.0.0',
        ) || '1.0.0',
      ),
      installationNumber: String(
        get(
          'installation_number',
          this.config.get<string>('verifactu.installationNumber') || '1',
        ) || '1',
      ),
      requestTimeoutMs: toNumber(
        get(
          'request_timeout_ms',
          this.config.get<number>('verifactu.requestTimeoutMs') || 30000,
        ),
        30000,
      ),
      defaultWaitSeconds: toNumber(
        get(
          'default_wait_seconds',
          this.config.get<number>('verifactu.defaultWaitSeconds') || 60,
        ),
        60,
      ),
      maxAttempts: Math.max(
        1,
        toNumber(
          get('max_attempts', this.config.get<number>('verifactu.maxAttempts') || 12),
          12,
        ),
      ),
    };
  }

  // Alias kept for the fiscal record generator, which uses the same runtime
  // configuration but historically called it "settings".
  getRuntimeSettings() {
    return this.getRuntimeConfig();
  }

  async getPublicConfig() {
    const runtime = await this.getRuntimeConfig();
    const warnings: string[] = [];

    if (!runtime.serverEnabled) warnings.push('VERIFACTU_SERVER_DISABLED');
    if (runtime.tenantEnabled && runtime.siiEnabled) {
      warnings.push('VERIFACTU_BLOCKED_BY_SII');
    }
    const validProducerTaxNumber = Boolean(runtime.producerTaxNumber) &&
      isValidSpanishFiscalNumber(runtime.producerTaxNumber);
    if (runtime.tenantEnabled && !runtime.producerTaxNumber) {
      warnings.push('VERIFACTU_PRODUCER_NIF_REQUIRED');
    } else if (runtime.tenantEnabled && !validProducerTaxNumber) {
      warnings.push('VERIFACTU_PRODUCER_NIF_INVALID');
    }
    if (runtime.tenantEnabled && !runtime.certificatePath) {
      warnings.push('VERIFACTU_CERTIFICATE_PATH_REQUIRED');
    }

    const certificateFileExists = Boolean(runtime.certificatePath) && existsSync(runtime.certificatePath);
    if (runtime.tenantEnabled && runtime.certificatePath && !certificateFileExists) {
      warnings.push('VERIFACTU_CERTIFICATE_FILE_NOT_FOUND');
    }

    return {
      enabled: runtime.tenantEnabled,
      serverEnabled: runtime.serverEnabled,
      siiEnabled: runtime.siiEnabled,
      effectiveEnabled: runtime.effectiveEnabled,
      environment: runtime.environment,
      producerName: runtime.producerName,
      producerTaxNumber: runtime.producerTaxNumber,
      systemName: runtime.systemName,
      systemId: runtime.systemId,
      systemVersion: runtime.systemVersion,
      installationNumber: runtime.installationNumber,
      certificateConfigured: Boolean(runtime.certificatePath),
      certificateFileExists,
      certificateFilename: runtime.certificateFilename,
      certificatePassphraseConfigured: Boolean(runtime.certificatePassphrase),
      endpointHost: (() => {
        try {
          return new URL(runtime.endpoint).host;
        } catch {
          return '';
        }
      })(),
      warnings,
      ready:
        runtime.effectiveEnabled &&
        validProducerTaxNumber &&
        certificateFileExists,
    };
  }

  async saveTenantSettings(input: UpdateVerifactuConfigDto) {
    const store = await this.settingsStore();
    const producerTaxNumber = input.producerTaxNumber
      ? normalizeSpanishFiscalNumber(input.producerTaxNumber)
      : input.producerTaxNumber;
    if (producerTaxNumber && !isValidSpanishFiscalNumber(producerTaxNumber)) {
      throw new Error('VERIFACTU_INVALID_PRODUCER_NIF');
    }
    const mapping: Record<string, unknown> = {
      enabled: input.enabled,
      environment: input.environment,
      sii_enabled: input.siiEnabled,
      producer_name: input.producerName,
      producer_tax_number: producerTaxNumber,
      system_name: input.systemName,
      system_id: input.systemId,
      system_version: input.systemVersion,
      installation_number: input.installationNumber,
    };

    Object.entries(mapping).forEach(([key, value]) => {
      if (value !== undefined) {
        store.set({ group: 'verifactu', key, value });
      }
    });
    await store.save();
    return this.getPublicConfig();
  }
}
