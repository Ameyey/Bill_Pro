const db = require('../config/db');

// List products
exports.getProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM products WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      sql += ' AND (name LIKE ? OR sku LIKE ? OR hsn_sac LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY name ASC';

    const products = await db.query(sql, params);
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const { name, sku, description, price, unit, gst_rate, hsn_sac, stock_qty } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    const result = await db.run(
      `INSERT INTO products (user_id, name, sku, description, price, unit, gst_rate, hsn_sac, stock_qty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name.trim(),
        sku || '',
        description || '',
        parseFloat(price) || 0,
        unit || 'Nos',
        parseFloat(gst_rate) || 18,
        hsn_sac || '',
        parseFloat(stock_qty) || 0
      ]
    );

    const product = await db.get('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, description, price, unit, gst_rate, hsn_sac, stock_qty } = req.body;

    const existing = await db.get('SELECT id FROM products WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await db.run(
      `UPDATE products SET 
         name = ?, sku = ?, description = ?, price = ?, 
         unit = ?, gst_rate = ?, hsn_sac = ?, stock_qty = ?
       WHERE id = ? AND user_id = ?`,
      [
        name.trim(),
        sku || '',
        description || '',
        parseFloat(price) || 0,
        unit || 'Nos',
        parseFloat(gst_rate) || 18,
        hsn_sac || '',
        parseFloat(stock_qty) || 0,
        id,
        req.user.id
      ]
    );

    const updated = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Product updated successfully.', product: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT id FROM products WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await db.run('DELETE FROM products WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

