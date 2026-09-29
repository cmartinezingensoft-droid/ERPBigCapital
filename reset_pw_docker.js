const b = require('bcrypt');
const m = require('mysql2/promise');
(async () => {
  const h = await b.hash('Valencia170', 10);
  console.log('Hash:', h);
  const c = await m.createConnection({host:'mariadb', user:'bigcapital', password:'bigcapital', database:'bigcapital_system'});
  const [r] = await c.execute('UPDATE USERS SET password=? WHERE email=?', [h, 'cmartinez@ingensoft.es']);
  console.log('Filas actualizadas:', r.affectedRows);
  await c.end();
  console.log('HECHO - password cambiada a Valencia170');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
