import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const duplicates = await knex('sales_invoices')
    .select('invoice_no')
    .count<{ invoice_no: string; total: number }[]>({ total: '*' })
    .whereNotNull('invoice_no')
    .groupBy('invoice_no')
    .havingRaw('COUNT(*) > 1')
    .limit(10);
  if (duplicates.length) {
    throw new Error(`Cannot enforce unique invoice numbers; duplicates: ${duplicates.map((r: any) => r.invoice_no).join(', ')}`);
  }
  const hasIndex = await knex.schema.hasColumn('sales_invoices', 'invoice_no');
  if (hasIndex) {
    await knex.schema.alterTable('sales_invoices', (table) => {
      table.unique(['invoice_no'], { indexName: 'sales_invoices_invoice_no_unique' });
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales_invoices', (table) => {
    table.dropUnique(['invoice_no'], 'sales_invoices_invoice_no_unique');
  });
}
