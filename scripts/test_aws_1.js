process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const hosts = [
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-1-us-west-2.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-1-sa-east-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-1-us-east-1.pooler.supabase.com',
];

async function testHost(host) {
  const connectionString = `postgresql://postgres.mylukzjucxgjjmvbteuf:s_%247%2BZm4N%2Bp%2FS%237@${host}:6543/postgres?sslmode=require`;
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`SUCCESS for host: ${host}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED for host ${host}: (${err.message})`);
    return false;
  }
}

async function main() {
  for (const host of hosts) {
    const success = await testHost(host);
    if (success) break;
  }
}

main();
