import { Knex } from 'knex';

/**
 * Phase 7 - Spanish electronic invoicing foundation.
 *
 * The migration deliberately stores immutable generated payloads separately
 * from the commercial invoice. A new version is created whenever an operator
 * regenerates a format, so a payload that has been signed/submitted can always
 * be reconstructed and audited.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('contacts', (table) => {
    table.string('electronic_invoice_channel', 32).nullable().index();
    table.string('electronic_invoice_endpoint', 255).nullable();
    table.string('peppol_endpoint_id', 128).nullable();
    table.string('dir3_accounting_office', 20).nullable().index();
    table.string('dir3_management_body', 20).nullable().index();
    table.string('dir3_processing_unit', 20).nullable().index();
    table.string('dir3_proposing_body', 20).nullable();
  });

  await knex.schema.alterTable('sales_invoices', (table) => {
    table.date('operation_date').nullable();
    table.string('purchase_order_reference', 100).nullable();
    table.string('receiver_contract_reference', 100).nullable();
    table.string('receiver_transaction_reference', 100).nullable();
  });

  await knex.schema.createTable('electronic_invoice_documents', (table) => {
    table.increments('id').primary();
    table.integer('sale_invoice_id').unsigned().notNullable().index();
    table.string('format', 32).notNullable().index();
    table.string('profile', 32).notNullable().index();
    table.string('semantic_model', 32).notNullable().defaultTo('EN16931');
    table.string('spec_version', 32).notNullable();
    table.integer('version').unsigned().notNullable().defaultTo(1);

    table.string('status', 32).notNullable().defaultTo('generated').index();
    table.string('signature_status', 32).notNullable().defaultTo('unsigned').index();
    table.text('payload', 'longtext').notNullable();
    table.string('payload_sha256', 64).notNullable().index();
    table.text('signed_payload', 'longtext').nullable();
    table.string('signed_payload_sha256', 64).nullable().index();

    table.string('external_reference', 255).nullable().index();
    table.text('response_payload', 'longtext').nullable();
    table.string('error_code', 100).nullable();
    table.text('error_message').nullable();

    table.dateTime('generated_at').notNullable();
    table.dateTime('signed_at').nullable();
    table.dateTime('submitted_at').nullable();
    table.dateTime('accepted_at').nullable();
    table.dateTime('rejected_at').nullable();
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').nullable();

    table.unique(['sale_invoice_id', 'format', 'profile', 'version'], {
      indexName: 'electronic_invoice_documents_unique_version',
    });
  });

  await knex.schema.createTable('electronic_invoice_status_events', (table) => {
    table.increments('id').primary();
    table.integer('document_id').unsigned().notNullable().index();
    table.string('event_type', 40).notNullable().index();
    table.dateTime('event_date').notNullable().index();
    table.decimal('amount', 15, 5).nullable();
    table.string('currency_code', 3).nullable();
    table.string('assignee_tax_number', 32).nullable();
    table.string('assignee_name', 255).nullable();
    table.string('state', 32).notNullable().defaultTo('recorded').index();
    table.text('payload', 'longtext').nullable();
    table.string('external_reference', 255).nullable();
    table.dateTime('transmitted_at').nullable();
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('electronic_invoice_status_events');
  await knex.schema.dropTableIfExists('electronic_invoice_documents');

  await knex.schema.alterTable('sales_invoices', (table) => {
    table.dropColumn('operation_date');
    table.dropColumn('purchase_order_reference');
    table.dropColumn('receiver_contract_reference');
    table.dropColumn('receiver_transaction_reference');
  });

  await knex.schema.alterTable('contacts', (table) => {
    table.dropColumn('electronic_invoice_channel');
    table.dropColumn('electronic_invoice_endpoint');
    table.dropColumn('peppol_endpoint_id');
    table.dropColumn('dir3_accounting_office');
    table.dropColumn('dir3_management_body');
    table.dropColumn('dir3_processing_unit');
    table.dropColumn('dir3_proposing_body');
  });
}
