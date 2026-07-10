process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function test(port) {
  const host = '2600:1f14:b9e:7b02:e95b:c5c1:949c:9329';
  const connectionString = `postgresql://postgres:s_%247%2BZm4N%2Bp%2FS%237@[${host}]:${port}/postgres?sslmode=require`;
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`SUCCESS connected to IPv6 on port ${port}!`);
    const res = await client.query('SELECT now()');
    console.log('Time:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED for port ${port}: ${err.message}`);
    return false;
  }
}

async function main() {
  await test(5432);
  await test(6543);
}

main();
