import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('contacts', 'payment_method'))) {
    await knex.schema.alterTable('contacts', (table) => {
      table.string('payment_method', 32).nullable().index();
    });
  }
  if (!(await knex.schema.hasColumn('contacts', 'payment_terms_days'))) {
    await knex.schema.alterTable('contacts', (table) => {
      table.string('payment_terms_days', 255).nullable();
    });
  }

  if (!(await knex.schema.hasColumn('sales_invoices', 'payment_method'))) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.string('payment_method', 32).nullable().index();
    });
  }
  if (!(await knex.schema.hasColumn('sales_invoices', 'payment_terms_days'))) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.string('payment_terms_days', 255).nullable();
    });
  }

  if (!(await knex.schema.hasTable('sale_invoice_payment_effects'))) {
    await knex.schema.createTable('sale_invoice_payment_effects', (table) => {
      table.increments('id').primary();
      table
        .integer('sale_invoice_id')
        .unsigned()
        .notNullable()
        .index()
        .references('id')
        .inTable('sales_invoices')
        .onDelete('CASCADE');
      table.integer('customer_id').unsigned().notNullable().index().references('id').inTable('contacts');
      table.string('payment_method', 32).notNullable().index();
      table.integer('installment_index').unsigned().notNullable();
      table.date('due_date').notNullable().index();
      table.decimal('amount', 19, 2).notNullable();
      table.string('status', 16).notNullable().defaultTo('pending').index();
      table.dateTime('created_at').notNullable();
      table.dateTime('updated_at').nullable();
      table.unique(['sale_invoice_id', 'installment_index'], {
        indexName: 'sale_invoice_effects_invoice_index_unique',
      });
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sale_invoice_payment_effects');

  if (await knex.schema.hasColumn('sales_invoices', 'payment_method')) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.dropColumn('payment_method');
    });
  }
  if (await knex.schema.hasColumn('sales_invoices', 'payment_terms_days')) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.dropColumn('payment_terms_days');
    });
  }

  if (await knex.schema.hasColumn('contacts', 'payment_method')) {
    await knex.schema.alterTable('contacts', (table) => {
      table.dropColumn('payment_method');
    });
  }
  if (await knex.schema.hasColumn('contacts', 'payment_terms_days')) {
    await knex.schema.alterTable('contacts', (table) => {
      table.dropColumn('payment_terms_days');
    });
  }
}
