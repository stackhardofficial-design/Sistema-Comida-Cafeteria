process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.mylukzjucxgjjmvbteuf:s_%247%2BZm4N%2Bp%2FS%237@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function main() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('Connected to Database successfully!');

    console.log('Adding coordinates and shape columns to restaurant_tables...');
    await client.query(`
      ALTER TABLE restaurant_tables 
      ADD COLUMN IF NOT EXISTS pos_x INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pos_y INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS shape VARCHAR(20) DEFAULT 'square',
      ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT NULL;
    `);
    console.log('Columns added successfully.');

    // Let's verify the columns of the restaurant_tables table
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'restaurant_tables';
    `);
    console.log('Columns in restaurant_tables table:');
    console.log(res.rows);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.end();
  }
}

main();
