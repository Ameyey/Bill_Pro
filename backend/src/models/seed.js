const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { createSchema } = require('./schema');
const { calculateInvoiceTotals } = require('../utils/gstCalculator');

async function seedData() {
  await createSchema();

  // Check if admin user already exists
  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', ['admin@billpro.com']);
  if (existingAdmin) {
    console.log('[MySQL] Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('[MySQL] Seeding initial data into MySQL...');

  // 1. Primary Admin User
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const userRes = await db.run(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?)`,
    ['Admin User', 'admin@billpro.com', adminPasswordHash, '9371101561', 'admin']
  );
  const userId = userRes.lastInsertRowid;

  // Subscription (29-day free trial)
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
  await db.run(
    `INSERT INTO subscriptions (user_id, plan_type, trial_start, trial_end, status)
     VALUES (?, 'trial', ?, ?, 'active')`,
    [userId, now.toISOString(), trialEnd.toISOString()]
  );

  // Company Settings (Matching sample PDF: Vaishali Industries)
  await db.run(
    `INSERT INTO company_settings (
      user_id, company_name, tagline, works_address, address, city, state, state_code, pincode,
      phone, email, website, gstin, pan, bank_name, bank_branch, account_no, ifsc_code, account_holder,
      invoice_prefix, next_invoice_no, default_gst_rate, terms_conditions, footer_text, signature_title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'Vaishali Industries',
      'POWDER COATING SPECIALISTS',
      'Works : Sr.NO ; 25/3 Nanded Phata Near Savali Dhaba\nSinhgad Road , Pune - 411 041\nTel : 9371101561',
      'Sinhgad Road, Pune - 411041',
      'Pune',
      'Maharashtra',
      '27',
      '411041',
      '9371101561',
      'contact@vaishaliindustries.com',
      'www.vaishaliindustries.com',
      '27AAACV1234F1Z5',
      'CDBPB8308N',
      'Janata Sahakari Bank Ltd.',
      'Sinhagad Road , Pune',
      '037230100003478',
      'JSBP0000037',
      'Vaishali Industries',
      'INV-',
      119,
      18,
      '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is not made within 15 days.\n3. Subject to Pune jurisdiction.',
      'Thank you for your business!',
      'Proprietor'
    ]
  );

  // 2. Customers with multiple GST numbers
  const cust1Res = await db.run(
    `INSERT INTO customers (user_id, name, contact_person, phone, email, address, city, state, state_code, pincode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'V.P Engineering',
      'Mr. Vijay Patil',
      '9822001122',
      'accounts@vpengg.com',
      'Nanded Phata Near Savali Dhaba, Sinhgad Road',
      'Pune',
      'Maharashtra',
      '27',
      '411041'
    ]
  );
  const cust1Id = cust1Res.lastInsertRowid;

  // Add 3 GST numbers for V.P Engineering
  await db.run(
    `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
     VALUES (?, '27ABCDE1234F1Z5', 'Head Office - Pune', 'Maharashtra', 1)`,
    [cust1Id]
  );
  await db.run(
    `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
     VALUES (?, '29XYZAB5678C2Z6', 'Bengaluru Unit', 'Karnataka', 0)`,
    [cust1Id]
  );
  await db.run(
    `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
     VALUES (?, '24LMNOP9876D3Z7', 'Ahmedabad Plant', 'Gujarat', 0)`,
    [cust1Id]
  );

  // Customer 2: ABC Industries Pvt Ltd
  const cust2Res = await db.run(
    `INSERT INTO customers (user_id, name, contact_person, phone, email, address, city, state, state_code, pincode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'ABC Industries Pvt Ltd',
      'Rajesh Sharma',
      '9811223344',
      'billing@abcindustries.com',
      'Plot No 45, MIDC Industrial Area',
      'Navi Mumbai',
      'Maharashtra',
      '27',
      '400703'
    ]
  );
  const cust2Id = cust2Res.lastInsertRowid;
  await db.run(
    `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
     VALUES (?, '27ABCDE9999F1Z1', 'Main Branch', 'Maharashtra', 1)`,
    [cust2Id]
  );
  await db.run(
    `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
     VALUES (?, '27XYZAB8888C2Z2', 'Warehouse 2', 'Maharashtra', 0)`,
    [cust2Id]
  );

  // Customer 3: Apex Precision Tech
  const cust3Res = await db.run(
    `INSERT INTO customers (user_id, name, contact_person, phone, email, address, city, state, state_code, pincode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'Apex Precision Tech',
      'Sunil Verma',
      '9765432100',
      'sales@apexprecision.com',
      'Gat No 123, Chakan Industrial Phase 2',
      'Pune',
      'Maharashtra',
      '27',
      '410501'
    ]
  );
  const cust3Id = cust3Res.lastInsertRowid;
  await db.run(
    `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
     VALUES (?, '27PQRST4321A1Z9', 'Chakan Plant', 'Maharashtra', 1)`,
    [cust3Id]
  );

  // 3. Products
  const prod1Res = await db.run(
    `INSERT INTO products (user_id, name, sku, description, price, unit, gst_rate, hsn_sac, stock_qty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'Powder Coating - Pure Polyester (Matt Finish)',
      'PC-PP-01',
      'Standard industrial job work powder coating',
      4.50,
      'Sq.Ft',
      18,
      '9988',
      10000
    ]
  );
  const prod1Id = prod1Res.lastInsertRowid;

  const prod2Res = await db.run(
    `INSERT INTO products (user_id, name, sku, description, price, unit, gst_rate, hsn_sac, stock_qty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'Sheet Metal Fabricated Enclosure Box',
      'SM-ENCL-10',
      'CRCA sheet enclosure with phosphate pre-treatment',
      5294.00,
      'Nos',
      18,
      '7326',
      250
    ]
  );
  const prod2Id = prod2Res.lastInsertRowid;

  const prod3Res = await db.run(
    `INSERT INTO products (user_id, name, sku, description, price, unit, gst_rate, hsn_sac, stock_qty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      'Structural Steel Bracket (Epoxy Coated)',
      'BRK-ST-05',
      'Mild steel bracket assembly',
      125.00,
      'Pcs',
      18,
      '7308',
      1500
    ]
  );
  const prod3Id = prod3Res.lastInsertRowid;

  // 4. Sample Invoices
  // Invoice 1: Matching the provided sample bill exactly
  const sampleItems1 = [
    {
      product_id: prod1Id,
      description: 'JOB WORK POWDER COATING ON FABRICATED ITEMS',
      sq_ft: 1176.44,
      quantity: 1,
      unit: 'Lot',
      rate: 4.50,
      discount: 0,
      gst_rate: 18
    }
  ];

  const calc1 = calculateInvoiceTotals(sampleItems1, '27', '27', false, 18, true);

  const inv1Res = await db.run(
    `INSERT INTO invoices (
      user_id, customer_id, customer_gst_id, selected_gst_number, invoice_number,
      invoice_date, due_date, in_dc_no, in_dc_date, out_dc_no, out_dc_date,
      customer_name, customer_address, customer_phone, customer_email,
      customer_city, customer_state, customer_state_code,
      subtotal, discount_total, taxable_amount, cgst_amount, sgst_amount, igst_amount,
      total_gst, grand_total, amount_in_words, payment_status, payment_mode, notes, terms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      cust1Id,
      1,
      '27ABCDE1234F1Z5',
      'INV-101',
      '2026-02-10',
      '2026-02-25',
      'IN-744',
      '2026-02-08',
      'OUT-619',
      '2026-02-10',
      'V.P Engineering',
      'Nanded Phata Near Savali Dhaba, Sinhgad Road, Pune - 411041',
      '9822001122',
      'accounts@vpengg.com',
      'Pune',
      'Maharashtra',
      '27',
      calc1.subtotal,
      calc1.discount_total,
      calc1.taxable_amount,
      calc1.cgst_amount,
      calc1.sgst_amount,
      calc1.igst_amount,
      calc1.total_gst,
      calc1.grand_total,
      calc1.amount_in_words,
      'paid',
      'Cheque / NEFT',
      'Payment received in full against bill #101',
      '1. Goods once sold will not be taken back.\n2. Subject to Pune jurisdiction.'
    ]
  );
  const inv1Id = inv1Res.lastInsertRowid;

  for (let idx = 0; idx < calc1.items.length; idx++) {
    const item = calc1.items[idx];
    await db.run(
      `INSERT INTO invoice_items (invoice_id, product_id, item_no, description, sq_ft, quantity, unit, rate, discount, taxable_value, gst_rate, gst_amount, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [inv1Id, item.product_id, idx + 1, item.description, item.sq_ft, item.quantity, item.unit, item.rate, item.discount, item.taxable_value, item.gst_rate, item.gst_amount, item.total_amount]
    );
  }

  // 5. 7-Day Trial Demo Account (trial7@billpro.com / trial123)
  const trial7PasswordHash = bcrypt.hashSync('trial123', 10);
  const trial7UserRes = await db.run(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?)`,
    ['7-Day Trial User', 'trial7@billpro.com', trial7PasswordHash, '9876543210', 'admin']
  );
  const trial7UserId = trial7UserRes.lastInsertRowid;

  const trial7End = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db.run(
    `INSERT INTO subscriptions (user_id, plan_type, trial_start, trial_end, status)
     VALUES (?, 'trial_7d', ?, ?, 'active')`,
    [trial7UserId, now.toISOString(), trial7End.toISOString()]
  );

  await db.run(
    `INSERT INTO company_settings (
      user_id, company_name, tagline, works_address, address, city, state, state_code, pincode,
      phone, email, website, gstin, pan, bank_name, bank_branch, account_no, ifsc_code, account_holder,
      invoice_prefix, next_invoice_no, default_gst_rate, terms_conditions, footer_text, signature_title
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trial7UserId,
      '7-Day Trial Enterprise',
      '7-DAY ACCESS DEMO',
      'Works Address Line 1, Industrial Area\nPune - 411001',
      'Business Park, Pune',
      'Pune',
      'Maharashtra',
      '27',
      '411001',
      '9876543210',
      'trial7@billpro.com',
      'www.trial7.com',
      '27ABCDE1234F1Z5',
      'ABCDE1234F',
      'HDFC Bank',
      'Main Branch',
      '50200012345678',
      'HDFC0001234',
      '7-Day Trial Enterprise',
      'INV-',
      1,
      18,
      '1. Valid for 7-day trial demo.\n2. Invoices and customer data are removed once the 7 days expire.',
      'Thank you for testing BillPro!',
      'Proprietor'
    ]
  );

  console.log('[MySQL] Seeding completed successfully!');
  console.log('  -> Admin: admin@billpro.com / admin123 (29-day free trial)');
  console.log('  -> Demo:  trial7@billpro.com / trial123 (7-day free trial)');
}

module.exports = { seedData };

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
