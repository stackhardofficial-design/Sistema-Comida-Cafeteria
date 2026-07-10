process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function main() {
  const host = `aws-0-sa-east-1.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.mylukzjucxgjjmvbteuf:s_%247%2BZm4N%2Bp%2FS%237@${host}:6543/postgres?sslmode=require`;
  const client = new Client({
    connectionString,
  });
  try {
    await client.connect();
    console.log(`SUCCESS connected to sa-east-1!`);
    
    // Let's run a test query
    const res = await client.query('SELECT now()');
    console.log('Current time from DB:', res.rows[0]);
    
    await client.end();
  } catch (err) {
    console.log(`FAILED for sa-east-1: (${err.message})`);
  }
}

main();
