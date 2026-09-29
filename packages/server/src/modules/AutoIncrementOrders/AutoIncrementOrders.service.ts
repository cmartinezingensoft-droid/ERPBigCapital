import { Knex } from 'knex';
import { Inject, Injectable } from '@nestjs/common';
import { SettingsStore } from '../Settings/SettingsStore';
import { SETTINGS_PROVIDER } from '../Settings/Settings.types';
import { transactionIncrement } from '@/utils/transaction-increment';

/**
 * Auto increment orders service.
 */
@Injectable()
export class AutoIncrementOrdersService {
  constructor(
    @Inject(SETTINGS_PROVIDER)
    private readonly settingsStore: () => SettingsStore,
  ) {}

  /**
   * Check if the auto increment is enabled for the given settings group.
   * @param {string} settingsGroup - Settings group.
   * @returns {Promise<boolean>}
   */
  public autoIncrementEnabled = async (
    settingsGroup: string,
  ): Promise<boolean> => {
    const settingsStore = await this.settingsStore();
    const group = settingsGroup;

    // Settings service transaction number and prefix.
    return settingsStore.get({ group, key: 'auto_increment' }, false);
  };

  /**
   * Retrieve the next service transaction number.
   * @param {string} settingsGroup
   * @param {Function} getMaxTransactionNo
   * @return {Promise<string>}
   */
  async getNextTransactionNumber(group: string): Promise<string> {
    const settingsStore = await this.settingsStore();

    // Settings service transaction number and prefix.
    const autoIncrement = await this.autoIncrementEnabled(group);

    const settingNo = settingsStore.get({ group, key: 'next_number' }, '');
    const settingPrefix = settingsStore.get(
      { group, key: 'number_prefix' },
      '',
    );
    return autoIncrement ? `${settingPrefix}${settingNo}` : '';
  }

  /**
   * Atomically reserves and increments the next transaction number.
   * The settings rows are locked in the caller transaction so concurrent
   * document creation cannot obtain the same number.
   */
  async reserveNextTransactionNumber(
    group: string,
    trx: Knex.Transaction,
  ): Promise<string> {
    const rows = await trx('settings')
      .select('id', 'key', 'value')
      .where({ group })
      .whereIn('key', ['auto_increment', 'next_number', 'number_prefix'])
      .forUpdate();

    const byKey = new Map(rows.map((row) => [row.key, row]));
    const enabledValue = String(byKey.get('auto_increment')?.value ?? '0').toLowerCase();
    const enabled = enabledValue === '1' || enabledValue === 'true';
    if (!enabled) return '';

    const numberRow = byKey.get('next_number');
    if (!numberRow) throw new Error(`Missing ${group}.next_number setting`);
    const current = String(numberRow.value ?? '1');
    const prefix = String(byKey.get('number_prefix')?.value ?? '');
    await trx('settings')
      .where({ id: numberRow.id })
      .update({ value: transactionIncrement(current) });
    return `${prefix}${current}`;
  }

  /**
   * Increment setting next number.
   * @param {string} orderGroup - Order group.
   * @param {string} orderNumber -Order number.
   */
  async incrementSettingsNextNumber(group: string) {
    const settingsStore = await this.settingsStore();

    const settingNo = settingsStore.get({ group, key: 'next_number' });
    const autoIncrement = settingsStore.get({ group, key: 'auto_increment' });

    // // Can't continue if the auto-increment of the service was disabled.
    if (!autoIncrement) {
      return;
    }
    settingsStore.set(
      { group, key: 'next_number' },
      transactionIncrement(settingNo),
    );
    await settingsStore.save();
  }
}
