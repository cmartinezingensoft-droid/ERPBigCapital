import { Knex } from 'knex';

/**
 * Phase 6 - Persist the AEAT invoice class used by the immutable VERI*FACTU
 * snapshot. Existing invoices remain F1 by default; new invoices can opt into
 * F2 (simplified invoice) before they are issued.
 */
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('sales_invoices', 'aeat_invoice_type'))) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.string('aeat_invoice_type', 2).notNullable().defaultTo('F1').index();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('sales_invoices', 'aeat_invoice_type')) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.dropColumn('aeat_invoice_type');
    });
  }
}
