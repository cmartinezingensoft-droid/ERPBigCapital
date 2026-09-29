import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { basename } from 'path';
import { SETTINGS_PROVIDER } from '@/modules/Settings/Settings.types';
import { SettingsStore } from '@/modules/Settings/SettingsStore';
import { UpdateSiiConfigDto } from './dtos/Sii.dto';

const bool = (value: unknown, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on', 'si', 'sí'].includes(String(value).toLowerCase());
};

@Injectable()
export class SiiSettingsService {
  constructor(
    private readonly config: ConfigService,
    @Inject(SETTINGS_PROVIDER) private readonly settingsStore: () => SettingsStore,
  ) {}

  async getRuntimeConfig() {
    const store = await this.settingsStore();
    const get = (key: string, fallback: unknown) => store.get({ group: 'sii', key }, fallback as never);
    const legacyEnabled = bool(store.get({ group: 'verifactu', key: 'sii_enabled' }, false as never), false);
    const enabled = bool(get('enabled', legacyEnabled), legacyEnabled);
    const environment = String(get('environment', 'test')) === 'production' ? 'production' : 'test';
    const certificatePath = String(process.env.SII_CERTIFICATE_PATH || this.config.get<string>('verifactu.certificatePath') || '').trim();
    const passphrase = String(process.env.SII_CERTIFICATE_PASSPHRASE || this.config.get<string>('verifactu.certificatePassphrase') || '');
    const endpoints = {
      issued: String(process.env.SII_ENDPOINT_ISSUED || get('endpoint_issued', '') || '').trim(),
      received: String(process.env.SII_ENDPOINT_RECEIVED || get('endpoint_received', '') || '').trim(),
      issuedPayment: String(process.env.SII_ENDPOINT_ISSUED_PAYMENT || get('endpoint_issued_payment', '') || '').trim(),
      receivedPayment: String(process.env.SII_ENDPOINT_RECEIVED_PAYMENT || get('endpoint_received_payment', '') || '').trim(),
    };
    return { enabled, environment, certificatePath, passphrase, endpoints };
  }

  async getPublicConfig() {
    const runtime = await this.getRuntimeConfig();
    const certificateExists = Boolean(runtime.certificatePath) && existsSync(runtime.certificatePath);
    const configuredEndpoints = Object.entries(runtime.endpoints).filter(([, value]) => Boolean(value)).map(([key]) => key);
    const warnings: string[] = [];
    if (runtime.enabled && !runtime.certificatePath) warnings.push('SII_CERTIFICATE_PATH_REQUIRED');
    if (runtime.enabled && runtime.certificatePath && !certificateExists) warnings.push('SII_CERTIFICATE_FILE_NOT_FOUND');
    if (runtime.enabled && !runtime.endpoints.issued) warnings.push('SII_ISSUED_ENDPOINT_REQUIRED_FOR_SUBMISSION');
    if (runtime.enabled && !runtime.endpoints.received) warnings.push('SII_RECEIVED_ENDPOINT_REQUIRED_FOR_SUBMISSION');
    return {
      enabled: runtime.enabled,
      environment: runtime.environment,
      certificateConfigured: Boolean(runtime.certificatePath),
      certificateExists,
      certificateFilename: runtime.certificatePath ? basename(runtime.certificatePath) : '',
      passphraseConfigured: Boolean(runtime.passphrase),
      configuredEndpoints,
      endpoints: runtime.endpoints,
      generationReady: runtime.enabled,
      transportReady: runtime.enabled && certificateExists && Boolean(runtime.endpoints.issued) && Boolean(runtime.endpoints.received),
      warnings,
      schemaVersion: '1.1',
    };
  }

  async save(input: UpdateSiiConfigDto) {
    const store = await this.settingsStore();
    const mapping: Record<string, unknown> = {
      enabled: input.enabled,
      environment: input.environment,
      endpoint_issued: input.endpointIssued,
      endpoint_received: input.endpointReceived,
      endpoint_issued_payment: input.endpointIssuedPayment,
      endpoint_received_payment: input.endpointReceivedPayment,
    };
    Object.entries(mapping).forEach(([key, value]) => {
      if (value !== undefined) store.set({ group: 'sii', key, value });
    });
    if (input.enabled !== undefined) {
      store.set({ group: 'verifactu', key: 'sii_enabled', value: input.enabled });
    }
    await store.save();
    return this.getPublicConfig();
  }
}
