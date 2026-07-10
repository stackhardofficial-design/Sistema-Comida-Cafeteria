process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function main() {
  const host = `aws-0-us-west-2.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.mylukzjucxgjjmvbteuf:s_%247%2BZm4N%2Bp%2FS%237@${host}:6543/postgres?sslmode=require`;
  const client = new Client({
    connectionString,
  });
  try {
    await client.connect();
    console.log(`SUCCESS connected to us-west-2!`);
    await client.end();
  } catch (err) {
    console.log(`FAILED for us-west-2: (${err.message})`);
  }
}

main();
