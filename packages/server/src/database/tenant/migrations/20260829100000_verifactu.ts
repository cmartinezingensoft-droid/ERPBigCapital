import { Knex } from 'knex';

const immutableColumns = [
  'sale_invoice_id', 'event', 'record_version', 'issuer_nif', 'invoice_no',
  'invoice_date', 'generation_timestamp', 'invoice_type', 'tax_total',
  'invoice_total', 'previous_record_id', 'previous_hash', 'hash_type', 'hash',
  'qr_url', 'payload_json', 'payload_xml',
];

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('verifactu_chain_state'))) {
    await knex.schema.createTable('verifactu_chain_state', (table) => {
      table.integer('id').primary();
      table.bigInteger('last_record_id').unsigned().nullable();
      table.string('last_hash', 64).nullable();
      table.timestamps(true, true);
    });
  }
  await knex('verifactu_chain_state').insert({ id: 1 }).onConflict('id').ignore();

  if (!(await knex.schema.hasTable('verifactu_records'))) {
    await knex.schema.createTable('verifactu_records', (table) => {
      table.bigIncrements('id');
      table.integer('sale_invoice_id').unsigned().notNullable().index()
        .references('id').inTable('sales_invoices').onDelete('RESTRICT');
      table.string('event', 16).notNullable().index(); // alta | subsanacion | anulacion
      table.integer('record_version').unsigned().notNullable().defaultTo(1);
      table.string('issuer_nif', 20).notNullable();
      table.string('invoice_no', 60).notNullable();
      table.date('invoice_date').notNullable();
      table.string('generation_timestamp', 40).notNullable();
      table.string('invoice_type', 2).notNullable().defaultTo('F1');
      table.decimal('tax_total', 15, 2).notNullable().defaultTo(0);
      table.decimal('invoice_total', 15, 2).notNullable().defaultTo(0);
      table.bigInteger('previous_record_id').unsigned().nullable().index();
      table.string('previous_hash', 64).nullable();
      table.string('hash_type', 2).notNullable().defaultTo('01');
      table.string('hash', 64).notNullable().unique();
      table.text('qr_url').nullable();
      table.specificType('payload_json', 'LONGTEXT').notNullable();
      table.specificType('payload_xml', 'LONGTEXT').notNullable();

      // Mutable transport/result information is deliberately separated from the
      // immutable fiscal snapshot above.
      table.string('aeat_status', 32).notNullable().defaultTo('pending').index();
      table.string('aeat_csv', 128).nullable().index();
      table.string('aeat_error_code', 32).nullable();
      table.text('aeat_error_message').nullable();
      table.specificType('last_response_xml', 'LONGTEXT').nullable();
      table.specificType('aeat_query_response_xml', 'LONGTEXT').nullable();
      table.dateTime('last_reconciled_at').nullable().index();
      table.dateTime('sent_at').nullable();
      table.dateTime('accepted_at').nullable();
      table.timestamps(true, true);
      table.unique(['sale_invoice_id', 'event', 'record_version'], 'verifactu_record_version_unique');
    });
  }

  if (!(await knex.schema.hasTable('verifactu_dispatch'))) {
    await knex.schema.createTable('verifactu_dispatch', (table) => {
      table.bigIncrements('id');
      table.bigInteger('record_id').unsigned().notNullable().unique()
        .references('id').inTable('verifactu_records').onDelete('CASCADE');
      table.string('state', 16).notNullable().defaultTo('pending').index();
      table.integer('attempts').unsigned().notNullable().defaultTo(0);
      table.dateTime('next_attempt_at').nullable().index();
      table.dateTime('locked_at').nullable();
      table.integer('tiempo_espera_envio').unsigned().nullable();
      table.text('last_error').nullable();
      table.timestamps(true, true);
    });
  }

  const immutablePredicate = immutableColumns
    .map((column) => `NOT (NEW.\`${column.toUpperCase()}\` <=> OLD.\`${column.toUpperCase()}\`)`)
    .join(' OR ');

  await knex.raw('DROP TRIGGER IF EXISTS verifactu_records_immutable_update');
  await knex.raw(`
    CREATE TRIGGER verifactu_records_immutable_update
    BEFORE UPDATE ON VERIFACTU_RECORDS
    FOR EACH ROW
    BEGIN
      IF ${immutablePredicate} THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'VERIFACTU_IMMUTABLE_FISCAL_RECORD';
      END IF;
    END
  `);
  await knex.raw('DROP TRIGGER IF EXISTS verifactu_records_immutable_delete');
  await knex.raw(`
    CREATE TRIGGER verifactu_records_immutable_delete
    BEFORE DELETE ON VERIFACTU_RECORDS
    FOR EACH ROW
    BEGIN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'VERIFACTU_FISCAL_RECORD_CANNOT_BE_DELETED';
    END
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS verifactu_records_immutable_update');
  await knex.raw('DROP TRIGGER IF EXISTS verifactu_records_immutable_delete');
  await knex.schema.dropTableIfExists('verifactu_dispatch');
  await knex.schema.dropTableIfExists('verifactu_records');
  await knex.schema.dropTableIfExists('verifactu_chain_state');
}
