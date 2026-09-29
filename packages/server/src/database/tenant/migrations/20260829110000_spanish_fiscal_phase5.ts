import { Knex } from 'knex';

const FISCAL_TOTAL_COLUMNS = [
  'equivalence_surcharge_amount',
  'retention_amount',
] as const;

async function addDocumentFiscalTotals(knex: Knex, tableName: string) {
  if (!(await knex.schema.hasColumn(tableName, 'equivalence_surcharge_amount'))) {
    await knex.schema.alterTable(tableName, (table) => {
      table.decimal('equivalence_surcharge_amount', 15, 5).notNullable().defaultTo(0);
    });
  }
  if (!(await knex.schema.hasColumn(tableName, 'retention_amount'))) {
    await knex.schema.alterTable(tableName, (table) => {
      table.decimal('retention_amount', 15, 5).notNullable().defaultTo(0);
    });
  }
}

export async function up(knex: Knex): Promise<void> {
  // Fase 5: the Spanish fiscal engine must be symmetric in sales and purchases.
  // Persist totals on every line-based fiscal document so historical amounts do
  // not depend on a future tax-master or calculation change.
  await addDocumentFiscalTotals(knex, 'bills');
  await addDocumentFiscalTotals(knex, 'credit_notes');
  await addDocumentFiscalTotals(knex, 'vendor_credits');

  if (!(await knex.schema.hasColumn('expenses_transactions', 'tax_amount'))) {
    await knex.schema.alterTable('expenses_transactions', (table) => {
      table.decimal('tax_amount', 15, 5).notNullable().defaultTo(0);
      table.decimal('equivalence_surcharge_amount', 15, 5).notNullable().defaultTo(0);
      table.decimal('retention_amount', 15, 5).notNullable().defaultTo(0);
    });
  }
  if (!(await knex.schema.hasColumn('expense_transaction_categories', 'tax_rate_id'))) {
    await knex.schema.alterTable('expense_transaction_categories', (table) => {
      table.integer('tax_rate_id').unsigned().nullable().index();
      table.decimal('tax_rate', 8, 4).notNullable().defaultTo(0);
      table.string('fiscal_regime', 32).nullable().defaultTo('standard');
      table.decimal('equivalence_surcharge_rate', 8, 4).notNullable().defaultTo(0);
      table.decimal('retention_rate', 8, 4).notNullable().defaultTo(0);
      table.decimal('tax_amount', 15, 5).notNullable().defaultTo(0);
      table.decimal('equivalence_surcharge_amount', 15, 5).notNullable().defaultTo(0);
      table.decimal('retention_amount', 15, 5).notNullable().defaultTo(0);
    });
  }

  // Explicit rectification metadata. A credit note may still be applied to more
  // than one invoice for commercial settlement, but Spanish fiscal issuance can
  // identify the principal corrected invoice and its reason independently.
  if (!(await knex.schema.hasColumn('credit_notes', 'original_sale_invoice_id'))) {
    await knex.schema.alterTable('credit_notes', (table) => {
      table.integer('original_sale_invoice_id').unsigned().nullable().index();
      table.string('rectification_reason', 250).nullable();
      table.string('rectification_method', 2).nullable().defaultTo('I');
    });
  }

  // Complete the two Spanish tax accounts used by purchase documents.
  const accounts = [
    {
      name: 'HP IVA soportado (PGC 472)',
      slug: 'pgc-472-iva-soportado',
      account_type: 'other-current-asset',
      code: '472',
      description: 'IVA soportado deducible en compras y gastos (España)',
    },
    {
      name: 'HP acreedora retenciones practicadas (PGC 4751)',
      slug: 'pgc-4751-retenciones',
      account_type: 'other-current-liability',
      code: '4751',
      description: 'Retenciones practicadas pendientes de ingreso (España)',
    },
  ];
  for (const account of accounts) {
    const existing = await knex('accounts').where({ slug: account.slug }).first();
    if (!existing) {
      await knex('accounts').insert({
        ...account,
        active: 1,
        predefined: 1,
        index: 1,
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('credit_notes', 'original_sale_invoice_id')) {
    await knex.schema.alterTable('credit_notes', (table) => {
      table.dropColumn('original_sale_invoice_id');
      table.dropColumn('rectification_reason');
      table.dropColumn('rectification_method');
    });
  }

  if (await knex.schema.hasColumn('expense_transaction_categories', 'tax_rate_id')) {
    await knex.schema.alterTable('expense_transaction_categories', (table) => {
      table.dropColumn('tax_rate_id');
      table.dropColumn('tax_rate');
      table.dropColumn('fiscal_regime');
      table.dropColumn('equivalence_surcharge_rate');
      table.dropColumn('retention_rate');
      table.dropColumn('tax_amount');
      table.dropColumn('equivalence_surcharge_amount');
      table.dropColumn('retention_amount');
    });
  }
  if (await knex.schema.hasColumn('expenses_transactions', 'tax_amount')) {
    await knex.schema.alterTable('expenses_transactions', (table) => {
      table.dropColumn('tax_amount');
      table.dropColumn('equivalence_surcharge_amount');
      table.dropColumn('retention_amount');
    });
  }

  for (const tableName of ['bills', 'credit_notes', 'vendor_credits']) {
    for (const column of FISCAL_TOTAL_COLUMNS) {
      if (await knex.schema.hasColumn(tableName, column)) {
        await knex.schema.alterTable(tableName, (table) => table.dropColumn(column));
      }
    }
  }
}
