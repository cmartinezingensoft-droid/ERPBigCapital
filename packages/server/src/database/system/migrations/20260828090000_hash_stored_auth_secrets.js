/** Security migration: remove stored clear-text API/reset secrets. */
exports.up = async function (knex) {
  const hasApiKeys = await knex.schema.hasTable('api_keys');
  if (hasApiKeys) {
    const hasPrefix = await knex.schema.hasColumn('api_keys', 'key_prefix');
    if (!hasPrefix) {
      await knex.schema.table('api_keys', (table) => table.string('key_prefix', 32).nullable().index());
    }
    await knex.raw(`UPDATE API_KEYS SET KEY_PREFIX = LEFT(\`KEY\`, 12), \`KEY\` = SHA2(\`KEY\`, 256) WHERE CHAR_LENGTH(\`KEY\`) <> 64 OR \`KEY\` NOT REGEXP '^[0-9a-fA-F]{64}$'`);
  }
  await knex.raw(`UPDATE PASSWORD_RESETS SET TOKEN = SHA2(TOKEN, 256) WHERE CHAR_LENGTH(TOKEN) <> 64 OR TOKEN NOT REGEXP '^[0-9a-fA-F]{64}$'`);
};

exports.down = async function (knex) {
  if ((await knex.schema.hasTable('api_keys')) && (await knex.schema.hasColumn('api_keys', 'key_prefix'))) {
    await knex.schema.table('api_keys', (table) => table.dropColumn('key_prefix'));
  }
  // Hashes are deliberately irreversible. Existing secrets must be regenerated after rollback.
};
