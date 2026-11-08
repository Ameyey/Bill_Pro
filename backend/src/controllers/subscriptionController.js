const db = require('../config/db');
const { getSubscriptionInfo } = require('../middleware/subscriptionCheck');

exports.getStatus = async (req, res) => {
  try {
    const subInfo = await getSubscriptionInfo(req.user.id);
    return res.json({ success: true, subscription: subInfo });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.payLifetime = async (req, res) => {
  try {
    const { transaction_id, payment_method = 'UPI' } = req.body;
    const txId = transaction_id || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    await db.run(
      `INSERT INTO payments (user_id, amount, currency, transaction_id, payment_method, status, notes)
       VALUES (?, 299.00, 'INR', ?, ?, 'completed', 'Lifetime access upgrade')`,
      [req.user.id, txId, payment_method]
    );

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
    await db.run(
      `UPDATE subscriptions 
       SET plan_type = 'lifetime', status = 'active', amount_paid = 299.00, payment_date = ?, transaction_id = ?
       WHERE user_id = ?`,
      [formattedDate, txId, req.user.id]
    );

    const subInfo = await getSubscriptionInfo(req.user.id);
    return res.json({
      success: true,
      message: 'Congratulations! You have upgraded to Lifetime Access for ₹299.',
      subscription: subInfo
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetTrial = async (req, res) => {
  try {
    const days = parseInt(req.body.days, 10) || 29;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const startStr = now.toISOString().slice(0, 19).replace('T', ' ');
    const endStr = trialEnd.toISOString().slice(0, 19).replace('T', ' ');

    const existing = await db.get(
      'SELECT id FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [req.user.id]
    );

    if (existing) {
      await db.run(
        `UPDATE subscriptions 
         SET plan_type = 'trial', status = 'active', trial_start = ?, trial_end = ?
         WHERE id = ?`,
        [startStr, endStr, existing.id]
      );
    } else {
      await db.run(
        `INSERT INTO subscriptions (user_id, plan_type, trial_start, trial_end, status)
         VALUES (?, 'trial', ?, ?, 'active')`,
        [req.user.id, startStr, endStr]
      );
    }

    const subInfo = await getSubscriptionInfo(req.user.id);
    return res.json({
      success: true,
      message: `Trial period successfully reset to ${days} days.`,
      subscription: subInfo
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

