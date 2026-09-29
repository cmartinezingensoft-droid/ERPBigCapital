const path = require('path');
const bcrypt = require(path.join(__dirname, 'node_modules', 'bcrypt'));
const mysql = require(path.join(__dirname, 'node_modules', 'mysql2', 'promise'));

(async () => {
  const hash = await bcrypt.hash('Valencia170', 10);
  console.log('Hash generado:', hash);
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'bigcapital',
    password: 'bigcapital',
    database: 'bigcapital_system'
  });
  const [result] = await conn.execute('UPDATE USERS SET password = ? WHERE email = ?', [hash, 'cmartinez@ingensoft.es']);
  console.log('Filas actualizadas:', result.affectedRows);
  const [rows] = await conn.execute('SELECT email, LEFT(password,20) as pw FROM USERS WHERE email = ?', ['cmartinez@ingensoft.es']);
  console.log('Verificacion:', rows[0]);
  await conn.end();
  console.log('HECHO - password cambiada a Valencia170');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
