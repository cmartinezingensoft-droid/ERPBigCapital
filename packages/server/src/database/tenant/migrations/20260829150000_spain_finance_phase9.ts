import { Knex } from 'knex';

const PGC_CATALOG = [
  ['100','Capital social','equity','balance','equity'],
  ['112','Reserva legal','equity','balance','equity'],
  ['113','Reservas voluntarias','equity','balance','equity'],
  ['118','Aportaciones de socios o propietarios','equity','balance','equity'],
  ['120','Remanente','equity','balance','equity'],
  ['121','Resultados negativos de ejercicios anteriores','equity','balance','equity'],
  ['129','Resultado del ejercicio','equity','balance','equity'],
  ['170','Deudas a largo plazo con entidades de crédito','long-term-liability','balance','non_current_liabilities'],
  ['173','Proveedores de inmovilizado a largo plazo','long-term-liability','balance','non_current_liabilities'],
  ['206','Aplicaciones informáticas','fixed-asset','balance','non_current_assets'],
  ['210','Terrenos y bienes naturales','fixed-asset','balance','non_current_assets'],
  ['211','Construcciones','fixed-asset','balance','non_current_assets'],
  ['212','Instalaciones técnicas','fixed-asset','balance','non_current_assets'],
  ['213','Maquinaria','fixed-asset','balance','non_current_assets'],
  ['214','Utillaje','fixed-asset','balance','non_current_assets'],
  ['215','Otras instalaciones','fixed-asset','balance','non_current_assets'],
  ['216','Mobiliario','fixed-asset','balance','non_current_assets'],
  ['217','Equipos para procesos de información','fixed-asset','balance','non_current_assets'],
  ['218','Elementos de transporte','fixed-asset','balance','non_current_assets'],
  ['219','Otro inmovilizado material','fixed-asset','balance','non_current_assets'],
  ['280','Amortización acumulada del inmovilizado intangible','fixed-asset','balance','non_current_assets'],
  ['281','Amortización acumulada del inmovilizado material','fixed-asset','balance','non_current_assets'],
  ['300','Mercaderías','inventory','balance','current_assets'],
  ['310','Materias primas','inventory','balance','current_assets'],
  ['400','Proveedores','accounts-payable','balance','current_liabilities'],
  ['401','Proveedores, efectos comerciales a pagar','accounts-payable','balance','current_liabilities'],
  ['407','Anticipos a proveedores','other-current-asset','balance','current_assets'],
  ['410','Acreedores por prestaciones de servicios','accounts-payable','balance','current_liabilities'],
  ['430','Clientes','accounts-receivable','balance','current_assets'],
  ['431','Clientes, efectos comerciales a cobrar','accounts-receivable','balance','current_assets'],
  ['436','Clientes de dudoso cobro','accounts-receivable','balance','current_assets'],
  ['438','Anticipos de clientes','other-current-liability','balance','current_liabilities'],
  ['440','Deudores','accounts-receivable','balance','current_assets'],
  ['460','Anticipos de remuneraciones','other-current-asset','balance','current_assets'],
  ['465','Remuneraciones pendientes de pago','other-current-liability','balance','current_liabilities'],
  ['4700','HP deudora por IVA','other-current-asset','balance','current_assets'],
  ['4709','HP deudora por devolución de impuestos','other-current-asset','balance','current_assets'],
  ['472','HP IVA soportado','other-current-asset','balance','current_assets'],
  ['473','HP retenciones y pagos a cuenta','other-current-asset','balance','current_assets'],
  ['4750','HP acreedora por IVA','tax-payable','balance','current_liabilities'],
  ['4751','HP acreedora por retenciones practicadas','other-current-liability','balance','current_liabilities'],
  ['476','Organismos de la Seguridad Social, acreedores','other-current-liability','balance','current_liabilities'],
  ['477','HP IVA repercutido','tax-payable','balance','current_liabilities'],
  ['520','Deudas a corto plazo con entidades de crédito','other-current-liability','balance','current_liabilities'],
  ['523','Proveedores de inmovilizado a corto plazo','accounts-payable','balance','current_liabilities'],
  ['570','Caja, euros','cash','balance','current_assets'],
  ['572','Bancos e instituciones de crédito c/c vista, euros','bank','balance','current_assets'],
  ['600','Compras de mercaderías','cost-of-goods-sold','profit_loss','procurements'],
  ['601','Compras de materias primas','cost-of-goods-sold','profit_loss','procurements'],
  ['602','Compras de otros aprovisionamientos','cost-of-goods-sold','profit_loss','procurements'],
  ['606','Descuentos sobre compras por pronto pago','cost-of-goods-sold','profit_loss','procurements'],
  ['608','Devoluciones de compras y operaciones similares','cost-of-goods-sold','profit_loss','procurements'],
  ['609','Rappels por compras','cost-of-goods-sold','profit_loss','procurements'],
  ['621','Arrendamientos y cánones','expense','profit_loss','other_operating_expenses'],
  ['622','Reparaciones y conservación','expense','profit_loss','other_operating_expenses'],
  ['623','Servicios de profesionales independientes','expense','profit_loss','other_operating_expenses'],
  ['624','Transportes','expense','profit_loss','other_operating_expenses'],
  ['625','Primas de seguros','expense','profit_loss','other_operating_expenses'],
  ['626','Servicios bancarios y similares','expense','profit_loss','other_operating_expenses'],
  ['627','Publicidad, propaganda y relaciones públicas','expense','profit_loss','other_operating_expenses'],
  ['628','Suministros','expense','profit_loss','other_operating_expenses'],
  ['629','Otros servicios','expense','profit_loss','other_operating_expenses'],
  ['6300','Impuesto corriente','expense','profit_loss','income_tax'],
  ['640','Sueldos y salarios','expense','profit_loss','personnel'],
  ['642','Seguridad Social a cargo de la empresa','expense','profit_loss','personnel'],
  ['649','Otros gastos sociales','expense','profit_loss','personnel'],
  ['662','Intereses de deudas','other-expense','profit_loss','financial'],
  ['669','Otros gastos financieros','other-expense','profit_loss','financial'],
  ['678','Gastos excepcionales','other-expense','profit_loss','other_results'],
  ['680','Amortización del inmovilizado intangible','expense','profit_loss','depreciation'],
  ['681','Amortización del inmovilizado material','expense','profit_loss','depreciation'],
  ['700','Ventas de mercaderías','income','profit_loss','net_turnover'],
  ['701','Ventas de productos terminados','income','profit_loss','net_turnover'],
  ['705','Prestaciones de servicios','income','profit_loss','net_turnover'],
  ['706','Descuentos sobre ventas por pronto pago','income','profit_loss','net_turnover'],
  ['708','Devoluciones de ventas y operaciones similares','income','profit_loss','net_turnover'],
  ['709','Rappels sobre ventas','income','profit_loss','net_turnover'],
  ['752','Ingresos por arrendamientos','other-income','profit_loss','other_operating_income'],
  ['759','Ingresos por servicios diversos','other-income','profit_loss','other_operating_income'],
  ['769','Otros ingresos financieros','other-income','profit_loss','financial'],
  ['778','Ingresos excepcionales','other-income','profit_loss','other_results'],
] as const;

const TERRITORIAL_TAXES = [
  { name: 'IGIC tipo cero 0%', code: 'ES-IGIC-0', rate: 0, territory: 'igic' },
  { name: 'IGIC específico 1%', code: 'ES-IGIC-1', rate: 1, territory: 'igic' },
  { name: 'IGIC superreducido 3%', code: 'ES-IGIC-3', rate: 3, territory: 'igic' },
  { name: 'IGIC reducido 5%', code: 'ES-IGIC-5', rate: 5, territory: 'igic' },
  { name: 'IGIC general 7%', code: 'ES-IGIC-7', rate: 7, territory: 'igic' },
  { name: 'IGIC incrementado 9,5%', code: 'ES-IGIC-9.5', rate: 9.5, territory: 'igic' },
  { name: 'IGIC incrementado 15%', code: 'ES-IGIC-15', rate: 15, territory: 'igic' },
  { name: 'IGIC especial 20%', code: 'ES-IGIC-20', rate: 20, territory: 'igic' },
  { name: 'IGIC exento', code: 'ES-IGIC-EXENTO', rate: 0, territory: 'igic', fiscalRegime: 'exempt' },
  // IPSI depende del territorio y de la naturaleza de la operación. Se deja maestro desactivado y configurable.
  { name: 'IPSI configurable', code: 'ES-IPSI', rate: 0, territory: 'ipsi', active: 0 },
] as const;

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('accounts', 'pgc_standard'))) {
    await knex.schema.alterTable('accounts', (table) => {
      table.string('pgc_standard', 16).nullable().index();
      table.string('pgc_statement', 16).nullable().index();
      table.string('pgc_section', 48).nullable().index();
      table.string('iban', 34).nullable().index();
      table.string('bic', 11).nullable().index();
      table.string('bank_name', 255).nullable();
      table.string('bank_account_holder', 255).nullable();
      table.string('bank_country_code', 2).nullable();
      table.string('sepa_creditor_identifier', 35).nullable().index();
      table.boolean('sepa_enabled').notNullable().defaultTo(false).index();
    });
  }

  if (!(await knex.schema.hasColumn('contacts', 'fiscal_territory'))) {
    await knex.schema.alterTable('contacts', (table) => {
      table.string('fiscal_territory', 16).notNullable().defaultTo('common').index();
      table.string('sepa_iban', 34).nullable().index();
      table.string('sepa_bic', 11).nullable().index();
      table.string('sepa_account_holder', 255).nullable();
    });
  }

  if (!(await knex.schema.hasColumn('tax_rates', 'tax_territory'))) {
    await knex.schema.alterTable('tax_rates', (table) => {
      table.string('tax_territory', 16).notNullable().defaultTo('iva').index();
    });
  }
  if (!(await knex.schema.hasColumn('items_entries', 'tax_territory'))) {
    await knex.schema.alterTable('items_entries', (table) => {
      table.string('tax_territory', 16).nullable().index();
    });
  }

  if (!(await knex.schema.hasColumn('expense_transaction_categories', 'tax_territory'))) {
    await knex.schema.alterTable('expense_transaction_categories', (table) => {
      table.string('tax_territory', 16).nullable().index();
    });
  }

  if (!(await knex.schema.hasTable('spain_pgc_catalog'))) {
    await knex.schema.createTable('spain_pgc_catalog', (table) => {
      table.increments('id').primary();
      table.string('standard', 16).notNullable().defaultTo('pymes').index();
      table.string('code', 10).notNullable().index();
      table.string('name', 255).notNullable();
      table.string('account_type', 48).notNullable();
      table.string('statement', 16).notNullable().index();
      table.string('section', 48).notNullable().index();
      table.boolean('required').notNullable().defaultTo(false);
      table.unique(['standard', 'code'], { indexName: 'spain_pgc_catalog_standard_code_unique' });
    });
  }

  if (!(await knex.schema.hasTable('sepa_mandates'))) {
    await knex.schema.createTable('sepa_mandates', (table) => {
      table.increments('id').primary();
      table.integer('contact_id').unsigned().notNullable().index().references('id').inTable('contacts');
      table.string('mandate_reference', 35).notNullable().unique();
      table.string('scheme', 8).notNullable().defaultTo('CORE').index();
      table.date('signature_date').notNullable();
      table.string('status', 16).notNullable().defaultTo('active').index();
      table.string('debtor_name', 255).notNullable();
      table.string('debtor_iban', 34).notNullable().index();
      table.string('debtor_bic', 11).nullable();
      table.string('debtor_country_code', 2).nullable();
      table.date('last_collection_date').nullable();
      table.dateTime('created_at').notNullable();
      table.dateTime('updated_at').nullable();
    });
  }

  if (!(await knex.schema.hasTable('sepa_remittances'))) {
    await knex.schema.createTable('sepa_remittances', (table) => {
      table.increments('id').primary();
      table.string('remittance_type', 8).notNullable().index(); // SCT / SDD
      table.string('scheme', 8).nullable().index(); // CORE / B2B
      table.string('message_id', 35).notNullable().unique();
      table.integer('account_id').unsigned().notNullable().index().references('id').inTable('accounts');
      table.date('requested_date').notNullable().index();
      table.string('status', 16).notNullable().defaultTo('draft').index();
      table.integer('transaction_count').unsigned().notNullable().defaultTo(0);
      table.decimal('control_sum', 19, 2).notNullable().defaultTo(0);
      table.text('xml_payload', 'longtext').nullable();
      table.string('xml_sha256', 64).nullable().index();
      table.dateTime('generated_at').nullable();
      table.dateTime('exported_at').nullable();
      table.text('note').nullable();
      table.integer('user_id').unsigned().nullable().index();
      table.dateTime('created_at').notNullable();
      table.dateTime('updated_at').nullable();
    });
  }

  if (!(await knex.schema.hasTable('sepa_remittance_entries'))) {
    await knex.schema.createTable('sepa_remittance_entries', (table) => {
      table.increments('id').primary();
      table.integer('remittance_id').unsigned().notNullable().index().references('id').inTable('sepa_remittances').onDelete('CASCADE');
      table.integer('contact_id').unsigned().nullable().index().references('id').inTable('contacts');
      table.integer('mandate_id').unsigned().nullable().index().references('id').inTable('sepa_mandates');
      table.string('source_type', 32).nullable().index();
      table.integer('source_id').unsigned().nullable().index();
      table.string('counterparty_name', 255).notNullable();
      table.string('iban', 34).notNullable();
      table.string('bic', 11).nullable();
      table.string('country_code', 2).nullable();
      table.decimal('amount', 19, 2).notNullable();
      table.string('end_to_end_id', 35).notNullable();
      table.string('sequence_type', 4).nullable();
      table.string('remittance_information', 140).nullable();
      table.dateTime('created_at').notNullable();
    });
  }

  for (const standard of ['pymes', 'pgc'] as const) {
    for (const [code, name, accountType, statement, section] of PGC_CATALOG) {
      const existing = await knex('spain_pgc_catalog').where({ standard, code }).first();
      if (!existing) {
        await knex('spain_pgc_catalog').insert({
          standard, code, name, account_type: accountType, statement, section,
          required: ['400','430','472','4751','477','570','572','600','700','705'].includes(code) ? 1 : 0,
        });
      }
      // Existing installations default to PGC-PYMES; selecting PGC later remaps through initializePgc().
      if (standard === 'pymes') {
        await knex('accounts').where({ code }).update({ pgc_standard: 'pymes', pgc_statement: statement, pgc_section: section });
      }
    }
  }

  for (const tax of TERRITORIAL_TAXES) {
    const existing = await knex('tax_rates').where({ code: tax.code }).first();
    if (!existing) {
      await knex('tax_rates').insert({
        name: tax.name,
        code: tax.code,
        rate: tax.rate,
        active: (tax as any).active ?? 1,
        description: `Fiscalidad territorial España · Fase 9 · ${tax.name}`,
        fiscal_regime: (tax as any).fiscalRegime ?? 'standard',
        spanish_operation_type: 'igic_ipsi',
        tax_territory: tax.territory,
        equivalence_surcharge_rate: 0,
        retention_rate: 0,
        aeat_tax_code: tax.territory === 'igic' ? '03' : '02',
        aeat_regime_key: '01',
        created_at: knex.fn.now(),
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sepa_remittance_entries');
  await knex.schema.dropTableIfExists('sepa_remittances');
  await knex.schema.dropTableIfExists('sepa_mandates');
  await knex.schema.dropTableIfExists('spain_pgc_catalog');
  await knex('tax_rates').whereIn('code', TERRITORIAL_TAXES.map((t) => t.code)).delete();

  if (await knex.schema.hasColumn('expense_transaction_categories', 'tax_territory')) {
    await knex.schema.alterTable('expense_transaction_categories', (table) => table.dropColumn('tax_territory'));
  }
  if (await knex.schema.hasColumn('items_entries', 'tax_territory')) {
    await knex.schema.alterTable('items_entries', (table) => table.dropColumn('tax_territory'));
  }
  if (await knex.schema.hasColumn('tax_rates', 'tax_territory')) {
    await knex.schema.alterTable('tax_rates', (table) => table.dropColumn('tax_territory'));
  }
  if (await knex.schema.hasColumn('contacts', 'fiscal_territory')) {
    await knex.schema.alterTable('contacts', (table) => { table.dropColumn('fiscal_territory'); table.dropColumn('sepa_iban'); table.dropColumn('sepa_bic'); table.dropColumn('sepa_account_holder'); });
  }
  if (await knex.schema.hasColumn('accounts', 'pgc_standard')) {
    await knex.schema.alterTable('accounts', (table) => {
      table.dropColumn('pgc_standard'); table.dropColumn('pgc_statement'); table.dropColumn('pgc_section');
      table.dropColumn('iban'); table.dropColumn('bic'); table.dropColumn('bank_name'); table.dropColumn('bank_account_holder');
      table.dropColumn('bank_country_code'); table.dropColumn('sepa_creditor_identifier'); table.dropColumn('sepa_enabled');
    });
  }
}
