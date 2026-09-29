import { Inject, Injectable } from '@nestjs/common';
import { SETTINGS_PROVIDER } from '@/modules/Settings/Settings.types';
import { SettingsStore } from '@/modules/Settings/SettingsStore';
import { UpdateSpanishFiscalConfigDto } from './dtos/SpanishFiscalConfig.dto';

const toBoolean = (value: unknown, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return ['1', 'true', 'yes', 'on', 'si', 'sí'].includes(String(value).trim().toLowerCase());
};

const toNumber = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

@Injectable()
export class SpanishFiscalSettingsService {
  constructor(
    @Inject(SETTINGS_PROVIDER)
    private readonly settingsStore: () => SettingsStore,
  ) {}

  async getConfig() {
    const store = await this.settingsStore();
    const get = (key: string, fallback: unknown) =>
      store.get({ group: 'spain-fiscal', key }, fallback as never);
    const legacySii = toBoolean(
      store.get({ group: 'verifactu', key: 'sii_enabled' }, false as never),
      false,
    );
    return {
      vatPeriodicity: String(get('vat_periodicity', 'quarterly')) === 'monthly' ? 'monthly' : 'quarterly',
      reccEnabled: toBoolean(get('recc_enabled', false), false),
      siiEnabled: legacySii,
      ossUnionEnabled: toBoolean(get('oss_union_enabled', false), false),
      ossNonUnionEnabled: toBoolean(get('oss_non_union_enabled', false), false),
      iossEnabled: toBoolean(get('ioss_enabled', false), false),
      inputVatDeductibilityPercent: Math.min(100, Math.max(0, toNumber(get('input_vat_deductibility_percent', 100), 100))),
      model347Threshold: 3005.06,
      model349QuarterlyThreshold: 50000,
    };
  }

  async saveConfig(input: UpdateSpanishFiscalConfigDto) {
    const store = await this.settingsStore();
    const mapping: Record<string, unknown> = {
      vat_periodicity: input.vatPeriodicity,
      recc_enabled: input.reccEnabled,
      oss_union_enabled: input.ossUnionEnabled,
      oss_non_union_enabled: input.ossNonUnionEnabled,
      ioss_enabled: input.iossEnabled,
      input_vat_deductibility_percent: input.inputVatDeductibilityPercent,
    };
    Object.entries(mapping).forEach(([key, value]) => {
      if (value !== undefined) store.set({ group: 'spain-fiscal', key, value });
    });
    await store.save();
    return this.getConfig();
  }
}
