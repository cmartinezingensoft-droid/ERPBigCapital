import { Knex } from 'knex';

/**
 * Phase 6 - VERI*FACTU operational console audit fields.
 *
 * `attempts` remains the attempt counter for the current automatic/manual
 * retry cycle. `total_attempts` never resets, so support can reconstruct the
 * actual transport effort even after an operator explicitly requeues a row.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('verifactu_dispatch', (table) => {
    table.integer('total_attempts').unsigned().notNullable().defaultTo(0);
    table.integer('manual_retry_count').unsigned().notNullable().defaultTo(0);
    table.dateTime('last_manual_retry_at').nullable().index();
  });

  // Existing installations may already have attempts from Phase 4/5.
  await knex.raw('UPDATE VERIFACTU_DISPATCH SET TOTAL_ATTEMPTS = ATTEMPTS');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('verifactu_dispatch', (table) => {
    table.dropIndex(['last_manual_retry_at']);
    table.dropColumn('last_manual_retry_at');
    table.dropColumn('manual_retry_count');
    table.dropColumn('total_attempts');
  });
}
