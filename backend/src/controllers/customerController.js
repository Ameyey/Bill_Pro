const db = require('../config/db');

// Get all customers with their GST numbers
exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      sql += ' AND (name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    sql += ' ORDER BY name ASC';

    const customers = await db.query(sql, params);

    // Attach GST numbers
    const customersWithGst = await Promise.all(
      customers.map(async (cust) => {
        const gstList = await db.query(
          'SELECT * FROM customer_gst_numbers WHERE customer_id = ? ORDER BY is_default DESC, id ASC',
          [cust.id]
        );
        const defaultGst = gstList.find((g) => g.is_default === 1) || gstList[0] || null;
        return {
          ...cust,
          gst_numbers: gstList,
          default_gst_number: defaultGst ? defaultGst.gst_number : ''
        };
      })
    );

    return res.json({ success: true, customers: customersWithGst });
  } catch (error) {
    console.error('getCustomers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single customer
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await db.get('SELECT * FROM customers WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const gst_numbers = await db.query(
      'SELECT * FROM customer_gst_numbers WHERE customer_id = ? ORDER BY is_default DESC, id ASC',
      [id]
    );

    return res.json({ success: true, customer: { ...customer, gst_numbers } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, city, state, state_code, pincode, notes, gst_numbers } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Customer/Company name is required.' });
    }

    const result = await db.run(
      `INSERT INTO customers (user_id, name, contact_person, phone, email, address, city, state, state_code, pincode, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, contact_person || '', phone || '', email || '', address || '', city || '', state || '', state_code || '', pincode || '', notes || '']
    );

    const customerId = result.lastInsertRowid;

    // Insert GST numbers if provided
    if (Array.isArray(gst_numbers) && gst_numbers.length > 0) {
      for (let i = 0; i < gst_numbers.length; i++) {
        const gst = gst_numbers[i];
        const gstVal = typeof gst === 'string' ? gst : gst.gst_number;
        const branch = typeof gst === 'object' ? (gst.branch_name || '') : '';
        const stateName = typeof gst === 'object' ? (gst.state_name || '') : '';
        const isDefault = i === 0 || (typeof gst === 'object' && gst.is_default) ? 1 : 0;

        if (gstVal && gstVal.trim()) {
          await db.run(
            `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
             VALUES (?, ?, ?, ?, ?)`,
            [customerId, gstVal.trim().toUpperCase(), branch, stateName, isDefault]
          );
        }
      }
    }

    const newCustomer = await db.get('SELECT * FROM customers WHERE id = ?', [customerId]);
    const savedGstList = await db.query('SELECT * FROM customer_gst_numbers WHERE customer_id = ?', [customerId]);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      customer: { ...newCustomer, gst_numbers: savedGstList }
    });
  } catch (error) {
    console.error('createCustomer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, city, state, state_code, pincode, notes, gst_numbers } = req.body;

    const existing = await db.get('SELECT id FROM customers WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    await db.run(
      `UPDATE customers SET 
         name = ?, contact_person = ?, phone = ?, email = ?, 
         address = ?, city = ?, state = ?, state_code = ?, pincode = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [name, contact_person || '', phone || '', email || '', address || '', city || '', state || '', state_code || '', pincode || '', notes || '', id, req.user.id]
    );

    if (Array.isArray(gst_numbers)) {
      await db.run('DELETE FROM customer_gst_numbers WHERE customer_id = ?', [id]);
      for (let i = 0; i < gst_numbers.length; i++) {
        const gst = gst_numbers[i];
        const gstVal = typeof gst === 'string' ? gst : gst.gst_number;
        const branch = typeof gst === 'object' ? (gst.branch_name || '') : '';
        const stateName = typeof gst === 'object' ? (gst.state_name || '') : '';
        const isDefault = (typeof gst === 'object' && gst.is_default) || i === 0 ? 1 : 0;

        if (gstVal && gstVal.trim()) {
          await db.run(
            `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
             VALUES (?, ?, ?, ?, ?)`,
            [id, gstVal.trim().toUpperCase(), branch, stateName, isDefault]
          );
        }
      }
    }

    const updated = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
    const savedGstList = await db.query('SELECT * FROM customer_gst_numbers WHERE customer_id = ?', [id]);

    return res.json({
      success: true,
      message: 'Customer updated successfully.',
      customer: { ...updated, gst_numbers: savedGstList }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT id FROM customers WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    await db.run('DELETE FROM customer_gst_numbers WHERE customer_id = ?', [id]);
    await db.run('DELETE FROM customers WHERE id = ? AND user_id = ?', [id, req.user.id]);

    return res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add single GST number to existing customer
exports.addCustomerGstNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { gst_number, branch_name, state_name, is_default } = req.body;

    if (!gst_number || !gst_number.trim()) {
      return res.status(400).json({ success: false, message: 'GST number is required.' });
    }

    const customer = await db.get('SELECT id FROM customers WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (is_default) {
      await db.run('UPDATE customer_gst_numbers SET is_default = 0 WHERE customer_id = ?', [id]);
    }

    const result = await db.run(
      `INSERT INTO customer_gst_numbers (customer_id, gst_number, branch_name, state_name, is_default)
       VALUES (?, ?, ?, ?, ?)`,
      [id, gst_number.trim().toUpperCase(), branch_name || '', state_name || '', is_default ? 1 : 0]
    );

    const newGst = await db.get('SELECT * FROM customer_gst_numbers WHERE id = ?', [result.lastInsertRowid]);
    const allGsts = await db.query('SELECT * FROM customer_gst_numbers WHERE customer_id = ? ORDER BY is_default DESC, id ASC', [id]);

    return res.status(201).json({
      success: true,
      message: 'GST number added successfully.',
      gst: newGst,
      gst_numbers: allGsts
    });
  } catch (error) {
    console.error('addCustomerGstNumber error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete single GST number from customer
exports.deleteCustomerGstNumber = async (req, res) => {
  try {
    const { id, gstId } = req.params;
    const customer = await db.get('SELECT id FROM customers WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    await db.run('DELETE FROM customer_gst_numbers WHERE id = ? AND customer_id = ?', [gstId, id]);
    const remainingGsts = await db.query('SELECT * FROM customer_gst_numbers WHERE customer_id = ? ORDER BY is_default DESC, id ASC', [id]);

    return res.json({
      success: true,
      message: 'GST number deleted successfully.',
      gst_numbers: remainingGsts
    });
  } catch (error) {
    console.error('deleteCustomerGstNumber error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

