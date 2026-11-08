const db = require('./src/config/db');
const { createSchema } = require('./src/models/schema');
const { seedData } = require('./src/models/seed');

async function verify() {
  console.log('Testing database connection and schema...');
  db.init();
  await createSchema();
  await seedData();

  const user = await db.get('SELECT id, name, email FROM users LIMIT 1');
  console.log('Admin user verified:', user);

  const sub = await db.get('SELECT * FROM subscriptions WHERE user_id = ?', [user.id]);
  console.log('Subscription verified:', sub);

  const company = await db.get('SELECT company_name, gstin FROM company_settings WHERE user_id = ?', [user.id]);
  console.log('Company settings verified:', company);

  const customers = await db.query('SELECT name, phone FROM customers WHERE user_id = ?', [user.id]);
  console.log(`Found ${customers.length} customer(s).`);

  console.log('Verification test completed successfully!');
}

verify().catch(console.error);

