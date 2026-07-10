const { Client } = require('pg');

const regions = [
  'aws-0-sa-east-1',
  'aws-0-us-east-1',
  'aws-0-us-east-2',
  'aws-0-us-west-1',
  'aws-0-us-west-2',
  'gcp-0-us-east4',
  'gcp-0-us-central1',
  'gcp-0-us-west1',
  'gcp-0-europe-west3',
  'gcp-0-europe-west1',
  'gcp-0-southamerica-east1',
];

async function testRegion(region) {
  const host = `${region}.pooler.supabase.com`;
  const connectionString = `postgresql://postgres.mylukzjucxgjjmvbteuf:s_%247%2BZm4N%2Bp%2FS%237@${host}:6543/postgres`;
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`SUCCESS for region ${region}! Host: ${host}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`FAILED for region ${region} (${err.message})`);
    return false;
  }
}

async function main() {
  for (const region of regions) {
    const success = await testRegion(region);
    if (success) {
      break;
    }
  }
}

main();
