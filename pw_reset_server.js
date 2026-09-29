const http = require('http');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
  if (req.url === '/reset') {
    const cmd = 'docker exec faroerpbigcapital-mariadb-1 mysql -ubigcapital -pbigcapital bigcapital_system -e "UPDATE USERS SET password=\'$2b$10$Ti6qVu2IKGXBVDiVGnXl/eL7wHMEm2MgSq6KmTDdDMTgyFdzJOD5i\' WHERE email=\'cmartinez@ingensoft.es\'; SELECT email, LEFT(password,50) as pw FROM USERS WHERE email=\'cmartinez@ingensoft.es\';"';
    exec(cmd, (error, stdout, stderr) => {
      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
      res.end(JSON.stringify({error: error ? error.message : null, stdout, stderr}));
    });
  } else if (req.url === '/check') {
    const cmd = 'docker exec faroerpbigcapital-mariadb-1 mysql -ubigcapital -pbigcapital bigcapital_system -e "SELECT email, LEFT(password,60) as pw FROM USERS WHERE email=\'cmartinez@ingensoft.es\';"';
    exec(cmd, (error, stdout, stderr) => {
      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
      res.end(JSON.stringify({error: error ? error.message : null, stdout, stderr}));
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Password Reset Server</h1><a href="/reset">Reset Password</a> | <a href="/check">Check Password</a>');
  }
});

server.listen(9999, () => console.log('Server running on http://localhost:9999'));
