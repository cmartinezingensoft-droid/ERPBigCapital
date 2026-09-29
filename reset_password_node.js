const path = require('path');
const serverModules = path.join(__dirname, 'packages', 'server', 'node_modules');
const bcrypt = require(path.join(serverModules, 'bcrypt'));
const mysql = require(path.join(serverModules, 'mysql2', 'promise'));

(async () => {
  const hash = await bcrypt.hash('Valencia170', 10);
  console.log('Hash generado:', hash);
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'bigcapital',
    password: 'bigcapital',
    database: 'bigcapital_system'
  });
  const [result] = await conn.execute('UPDATE USERS SET password = ? WHERE email = ?', [hash, 'cmartinez@ingensoft.es']);
  console.log('Filas actualizadas:', result.affectedRows);
  const [rows] = await conn.execute('SELECT email, LEFT(password,30) as hash_prefix FROM USERS WHERE email = ?', ['cmartinez@ingensoft.es']);
  console.log('Verificacion:', rows[0]);
  await conn.end();
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
