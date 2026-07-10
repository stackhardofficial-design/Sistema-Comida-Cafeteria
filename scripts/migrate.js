process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.mylukzjucxgjjmvbteuf:s_%247%2BZm4N%2Bp%2FS%237@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function main() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to Database successfully via aws-1-us-west-2 pooler!');

    // 1. Add roles column
    console.log('Adding roles column...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}';
    `);
    console.log('roles column added/verified.');

    // 2. Initialize roles column with current role for existing users
    console.log('Initializing roles column with current role value...');
    await client.query(`
      UPDATE users 
      SET roles = ARRAY[role] 
      WHERE roles IS NULL OR cardinality(roles) = 0;
    `);
    console.log('Initialization complete.');

    // Let's verify the columns of the users table
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('Columns in users table:');
    console.log(res.rows);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.end();
  }
}

main();
