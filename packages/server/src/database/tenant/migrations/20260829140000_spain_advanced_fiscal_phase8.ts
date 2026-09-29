import { Knex } from 'knex';

const ADVANCED_TAXES = [
  {
    name: 'Entrega intracomunitaria de bienes',
    code: 'ES-UE-E',
    rate: 0,
    fiscal_regime: 'exempt',
    spanish_operation_type: 'intra_community_goods_supply',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '01',
    aeat_operation_qualification: 'S1',
    aeat_exemption_cause: 'E5',
  },
  {
    name: 'Prestación intracomunitaria de servicios',
    code: 'ES-UE-S',
    rate: 0,
    fiscal_regime: 'not_subject',
    spanish_operation_type: 'intra_community_service_supply',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '01',
    aeat_operation_qualification: 'N2',
    aeat_exemption_cause: null,
  },
  {
    name: 'Adquisición intracomunitaria de bienes 21%',
    code: 'ES-UE-A-21',
    rate: 21,
    fiscal_regime: 'reverse_charge',
    spanish_operation_type: 'intra_community_goods_acquisition',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '09',
    aeat_operation_qualification: 'S2',
    aeat_exemption_cause: null,
  },
  {
    name: 'Adquisición intracomunitaria de servicios 21%',
    code: 'ES-UE-I-21',
    rate: 21,
    fiscal_regime: 'reverse_charge',
    spanish_operation_type: 'intra_community_service_acquisition',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '09',
    aeat_operation_qualification: 'S2',
    aeat_exemption_cause: null,
  },
  {
    name: 'Exportación exenta de IVA',
    code: 'ES-EXPORT',
    rate: 0,
    fiscal_regime: 'exempt',
    spanish_operation_type: 'export',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '02',
    aeat_operation_qualification: 'S1',
    aeat_exemption_cause: 'E2',
  },
  {
    name: 'Importación - IVA liquidado en aduana 21%',
    code: 'ES-IMPORT-21',
    active: 0,
    rate: 21,
    fiscal_regime: 'reverse_charge',
    spanish_operation_type: 'import',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '01',
    aeat_operation_qualification: 'S2',
    aeat_exemption_cause: null,
  },
  {
    name: 'Inversión del sujeto pasivo nacional 21%',
    code: 'ES-ISP-21',
    rate: 21,
    fiscal_regime: 'reverse_charge',
    spanish_operation_type: 'domestic_reverse_charge',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '01',
    aeat_operation_qualification: 'S2',
    aeat_exemption_cause: null,
  },
  {
    name: 'OSS - IVA destino',
    code: 'ES-OSS',
    active: 0,
    rate: 0,
    fiscal_regime: 'standard',
    spanish_operation_type: 'oss',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '17',
    aeat_operation_qualification: 'S1',
    aeat_exemption_cause: null,
  },
  {
    name: 'IOSS - IVA importación destino',
    code: 'ES-IOSS',
    active: 0,
    rate: 0,
    fiscal_regime: 'standard',
    spanish_operation_type: 'ioss',
    equivalence_surcharge_rate: 0,
    retention_rate: 0,
    aeat_tax_code: '01',
    aeat_regime_key: '18',
    aeat_operation_qualification: 'S1',
    aeat_exemption_cause: null,
  },
];

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('tax_rates', 'spanish_operation_type'))) {
    await knex.schema.alterTable('tax_rates', (table) => {
      table.string('spanish_operation_type', 48).notNullable().defaultTo('domestic').index();
      table.string('oss_scheme', 16).nullable();
    });
  }

  if (!(await knex.schema.hasColumn('items_entries', 'spanish_operation_type'))) {
    await knex.schema.alterTable('items_entries', (table) => {
      table.string('spanish_operation_type', 48).nullable().index();
      table.string('oss_scheme', 16).nullable();
    });
  }

  if (!(await knex.schema.hasColumn('contacts', 'vies_status'))) {
    await knex.schema.alterTable('contacts', (table) => {
      table.string('vies_status', 16).notNullable().defaultTo('unknown').index();
      table.dateTime('vies_checked_at').nullable();
      table.string('vies_country_code', 2).nullable();
      table.string('vies_vat_number', 32).nullable();
    });
  }

  if (!(await knex.schema.hasColumn('payment_receives', 'aeat_payment_method'))) {
    await knex.schema.alterTable('payment_receives', (table) => {
      table.string('aeat_payment_method', 2).nullable().index();
      table.string('aeat_payment_reference', 255).nullable();
    });
  }

  if (!(await knex.schema.hasColumn('bills_payments', 'aeat_payment_method'))) {
    await knex.schema.alterTable('bills_payments', (table) => {
      table.string('aeat_payment_method', 2).nullable().index();
      table.string('aeat_payment_reference', 255).nullable();
    });
  }

  if (!(await knex.schema.hasTable('sii_records'))) {
    await knex.schema.createTable('sii_records', (table) => {
      table.increments('id').primary();
      table.string('record_kind', 32).notNullable().index();
      table.string('source_type', 32).notNullable().index();
      table.integer('source_id').unsigned().notNullable().index();
      table.string('source_number', 100).nullable().index();
      table.string('period_year', 4).notNullable().index();
      table.string('period_month', 2).notNullable().index();
      table.string('counterparty_name', 255).nullable();
      table.string('counterparty_tax_number', 32).nullable().index();
      table.string('special_regime_key', 2).nullable();
      table.string('status', 32).notNullable().defaultTo('generated').index();
      table.text('payload_json', 'longtext').notNullable();
      table.text('payload_xml', 'longtext').notNullable();
      table.string('payload_sha256', 64).notNullable().index();
      table.text('response_xml', 'longtext').nullable();
      table.string('aeat_csv', 128).nullable().index();
      table.string('error_code', 64).nullable();
      table.text('error_message').nullable();
      table.integer('attempts').unsigned().notNullable().defaultTo(0);
      table.dateTime('generated_at').notNullable();
      table.dateTime('submitted_at').nullable();
      table.dateTime('accepted_at').nullable();
      table.dateTime('rejected_at').nullable();
      table.dateTime('created_at').notNullable();
      table.dateTime('updated_at').nullable();
      table.unique(['record_kind', 'source_type', 'source_id'], {
        indexName: 'sii_records_source_unique',
      });
    });
  }

  for (const tax of ADVANCED_TAXES) {
    const existing = await knex('tax_rates').where({ code: tax.code }).first();
    if (!existing) {
      await knex('tax_rates').insert({
        ...tax,
        active: (tax as any).active ?? 1,
        description: `Fiscalidad avanzada España · Fase 8 · ${tax.name}`,
        created_at: knex.fn.now(),
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sii_records');

  if (await knex.schema.hasColumn('bills_payments', 'aeat_payment_method')) {
    await knex.schema.alterTable('bills_payments', (table) => {
      table.dropColumn('aeat_payment_method');
      table.dropColumn('aeat_payment_reference');
    });
  }
  if (await knex.schema.hasColumn('payment_receives', 'aeat_payment_method')) {
    await knex.schema.alterTable('payment_receives', (table) => {
      table.dropColumn('aeat_payment_method');
      table.dropColumn('aeat_payment_reference');
    });
  }
  if (await knex.schema.hasColumn('contacts', 'vies_status')) {
    await knex.schema.alterTable('contacts', (table) => {
      table.dropColumn('vies_status');
      table.dropColumn('vies_checked_at');
      table.dropColumn('vies_country_code');
      table.dropColumn('vies_vat_number');
    });
  }
  if (await knex.schema.hasColumn('items_entries', 'spanish_operation_type')) {
    await knex.schema.alterTable('items_entries', (table) => {
      table.dropColumn('spanish_operation_type');
      table.dropColumn('oss_scheme');
    });
  }
  if (await knex.schema.hasColumn('tax_rates', 'spanish_operation_type')) {
    await knex.schema.alterTable('tax_rates', (table) => {
      table.dropColumn('spanish_operation_type');
      table.dropColumn('oss_scheme');
    });
  }
}
