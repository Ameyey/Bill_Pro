const db = require('../config/db');

/**
 * Controller for Master User Dashboard (/my_user)
 * Gathers complete metadata for all users, company profiles, subscriptions & days remaining,
 * customer accounts with multi-GST numbers, and all invoices with amounts & payment statuses.
 */
exports.getMyUsersDashboard = async (req, res) => {
  try {
    const { search, status } = req.query;

    // 1. Fetch all users
    let userQuery = `SELECT id, name, email, phone, role, created_at, COALESCE(login_allowed, 1) AS login_allowed, COALESCE(password_plain, '') AS password_plain FROM users ORDER BY id ASC`;
    const users = await db.query(userQuery);

    // 2. Fetch all company settings
    const companySettingsList = await db.query(`SELECT * FROM company_settings`);
    const companyMap = new Map();
    for (const cs of companySettingsList) {
      companyMap.set(cs.user_id, cs);
    }

    // 3. Fetch all subscriptions
    const subscriptionsList = await db.query(`SELECT * FROM subscriptions`);
    const subMap = new Map();
    for (const sub of subscriptionsList) {
      subMap.set(sub.user_id, sub);
    }

    // 4. Fetch all customers and their GST numbers
    const customersList = await db.query(`SELECT * FROM customers ORDER BY id DESC`);
    const gstNumbersList = await db.query(`SELECT * FROM customer_gst_numbers ORDER BY id ASC`);
    const gstMap = new Map();
    for (const gst of gstNumbersList) {
      if (!gstMap.has(gst.customer_id)) {
        gstMap.set(gst.customer_id, []);
      }
      gstMap.get(gst.customer_id).push(gst);
    }

    const customersByUser = new Map();
    for (const cust of customersList) {
      const gsts = gstMap.get(cust.id) || [];
      const enhancedCustomer = {
        ...cust,
        gst_count: gsts.length,
        gst_numbers: gsts
      };
      if (!customersByUser.has(cust.user_id)) {
        customersByUser.set(cust.user_id, []);
      }
      customersByUser.get(cust.user_id).push(enhancedCustomer);
    }

    // 5. Fetch all invoices
    const invoicesList = await db.query(`
      SELECT 
        id, user_id, customer_id, customer_name, invoice_number, 
        invoice_date, due_date, in_dc_no, out_dc_no, subtotal, 
        taxable_amount, total_gst, grand_total, payment_status, 
        payment_mode, created_at 
      FROM invoices 
      ORDER BY id DESC
    `);
    const invoicesByUser = new Map();
    for (const inv of invoicesList) {
      if (!invoicesByUser.has(inv.user_id)) {
        invoicesByUser.set(inv.user_id, []);
      }
      invoicesByUser.get(inv.user_id).push(inv);
    }

    // 6. Assemble rich user details
    const now = new Date();
    const enrichedUsers = users.map(u => {
      const company = companyMap.get(u.id) || null;
      const sub = subMap.get(u.id) || null;
      const userInvoices = invoicesByUser.get(u.id) || [];
      const userCustomers = customersByUser.get(u.id) || [];

      // Calculate subscription days remaining & progress
      let daysRemaining = null;
      let totalDays = 30;
      let percentageRemaining = 100;
      let isExpired = false;
      let isExpiringSoon = false;
      let planFormatted = 'Trial';

      if (sub && sub.trial_end) {
        const endDate = new Date(sub.trial_end);
        const startDate = sub.trial_start ? new Date(sub.trial_start) : new Date(u.created_at);
        const diffMs = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const elapsed = Math.max(0, totalDays - Math.max(0, daysRemaining));
        percentageRemaining = Math.max(0, Math.min(100, Math.round((Math.max(0, daysRemaining) / totalDays) * 100)));

        isExpired = daysRemaining <= 0 || sub.status === 'expired';
        isExpiringSoon = daysRemaining > 0 && daysRemaining <= 5;

        if (sub.plan_type === 'trial' || sub.plan_type === 'free_trial') {
          planFormatted = '30-Day Free Trial';
        } else if (sub.plan_type === 'trial_7d') {
          planFormatted = '7-Day Quick Trial';
        } else if (sub.plan_type === 'pro') {
          planFormatted = 'Pro Plan';
        } else if (sub.plan_type === 'enterprise') {
          planFormatted = 'Enterprise Plan';
        } else {
          planFormatted = sub.plan_type ? sub.plan_type.toUpperCase() : 'Trial';
        }
      }

      // Calculate invoice totals
      let totalAmount = 0;
      let paidAmount = 0;
      let unpaidAmount = 0;
      let paidCount = 0;
      let unpaidCount = 0;

      for (const inv of userInvoices) {
        const amt = parseFloat(inv.grand_total) || 0;
        totalAmount += amt;
        if (inv.payment_status === 'paid') {
          paidAmount += amt;
          paidCount++;
        } else {
          unpaidAmount += amt;
          unpaidCount++;
        }
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        password: u.password_plain || (u.id === 1 ? 'admin123' : u.id === 2 ? 'trial123' : 'password123'),
        login_allowed: u.login_allowed !== undefined && u.login_allowed !== null ? Number(u.login_allowed) : 1,
        created_at: u.created_at,
        company: company ? {
          company_name: company.company_name || '',
          tagline: company.tagline || '',
          works_address: company.works_address || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          state_code: company.state_code || '',
          pincode: company.pincode || '',
          phone: company.phone || '',
          email: company.email || '',
          gstin: company.gstin || '',
          pan: company.pan || '',
          bank_name: company.bank_name || '',
          bank_branch: company.bank_branch || '',
          account_no: company.account_no || '',
          ifsc_code: company.ifsc_code || '',
          account_holder: company.account_holder || '',
          invoice_prefix: company.invoice_prefix || 'INV-',
          next_invoice_no: company.next_invoice_no !== null ? company.next_invoice_no : 1,
          default_gst_rate: company.default_gst_rate !== null ? company.default_gst_rate : 18
        } : null,
        subscription: sub ? {
          id: sub.id,
          plan_type: sub.plan_type,
          plan_formatted: planFormatted,
          status: isExpired ? 'expired' : sub.status,
          trial_start: sub.trial_start,
          trial_end: sub.trial_end,
          amount_paid: parseFloat(sub.amount_paid) || 0,
          payment_date: sub.payment_date,
          days_remaining: daysRemaining,
          total_days: totalDays,
          percentage_remaining: percentageRemaining,
          is_expired: isExpired,
          is_expiring_soon: isExpiringSoon
        } : null,
        billing_stats: {
          total_invoices: userInvoices.length,
          total_amount: Number(totalAmount.toFixed(2)),
          paid_amount: Number(paidAmount.toFixed(2)),
          unpaid_amount: Number(unpaidAmount.toFixed(2)),
          paid_count: paidCount,
          unpaid_count: unpaidCount
        },
        invoices: userInvoices,
        total_customers: userCustomers.length,
        customers: userCustomers
      };
    });

    // Optional query filtering
    let filteredUsers = enrichedUsers;
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredUsers = filteredUsers.filter(u => {
        return (
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          (u.company?.company_name && u.company.company_name.toLowerCase().includes(q)) ||
          (u.company?.gstin && u.company.gstin.toLowerCase().includes(q)) ||
          u.customers.some(c => (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.toLowerCase().includes(q))) ||
          u.invoices.some(inv => (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) || (inv.customer_name && inv.customer_name.toLowerCase().includes(q)))
        );
      });
    }

    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(u => {
        if (status === 'active') return u.subscription && !u.subscription.is_expired;
        if (status === 'expiring_soon') return u.subscription && u.subscription.is_expiring_soon;
        if (status === 'expired') return u.subscription && u.subscription.is_expired;
        if (status === 'has_bills') return u.billing_stats.total_invoices > 0;
        if (status === 'has_customers') return u.total_customers > 0;
        return true;
      });
    }

    // 7. Calculate overall system-wide summary metrics
    let totalInvoicesAll = 0;
    let totalRevenueAll = 0;
    let totalPaidAll = 0;
    let totalUnpaidAll = 0;
    let totalCustomersAll = 0;
    let activeSubsCount = 0;
    let expiringSoonCount = 0;
    let expiredSubsCount = 0;

    let loginAllowedCount = 0;
    let loginBlockedCount = 0;

    for (const u of enrichedUsers) {
      if (u.login_allowed === 0) loginBlockedCount++;
      else loginAllowedCount++;

      totalInvoicesAll += u.billing_stats.total_invoices;
      totalRevenueAll += u.billing_stats.total_amount;
      totalPaidAll += u.billing_stats.paid_amount;
      totalUnpaidAll += u.billing_stats.unpaid_amount;
      totalCustomersAll += u.total_customers;

      if (u.subscription) {
        if (u.subscription.is_expired) expiredSubsCount++;
        else {
          activeSubsCount++;
          if (u.subscription.is_expiring_soon) expiringSoonCount++;
        }
      }
    }

    const summary = {
      total_users: enrichedUsers.length,
      filtered_users_count: filteredUsers.length,
      login_allowed_count: loginAllowedCount,
      login_blocked_count: loginBlockedCount,
      total_bills: totalInvoicesAll,
      total_revenue: Number(totalRevenueAll.toFixed(2)),
      paid_revenue: Number(totalPaidAll.toFixed(2)),
      unpaid_revenue: Number(totalUnpaidAll.toFixed(2)),
      total_customers: totalCustomersAll,
      active_subscriptions: activeSubsCount,
      expiring_soon: expiringSoonCount,
      expired_subscriptions: expiredSubsCount
    };

    return res.json({
      success: true,
      summary,
      users: filteredUsers,
      generated_at: new Date()
    });
  } catch (error) {
    console.error('getMyUsersDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle or update whether a user is allowed to log in (OK / Allowed vs Blocked / Disallowed)
 */
exports.toggleLoginAllowed = async (req, res) => {
  try {
    const { userId, allowLogin } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const user = await db.get('SELECT id, name, email, login_allowed FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const currentAllowed = user.login_allowed === undefined || user.login_allowed === null ? 1 : Number(user.login_allowed);
    const nextStatus = allowLogin !== undefined 
      ? (allowLogin ? 1 : 0) 
      : (currentAllowed === 1 ? 0 : 1);

    await db.run('UPDATE users SET login_allowed = ? WHERE id = ?', [nextStatus, userId]);

    return res.json({
      success: true,
      message: nextStatus === 1 
        ? `Login permission granted (OK) for ${user.name}. User can now log in!` 
        : `Login permission revoked (Not Allowed) for ${user.name}. User is blocked from logging in.`,
      userId: Number(userId),
      login_allowed: nextStatus
    });
  } catch (error) {
    console.error('toggleLoginAllowed error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user login access: ' + error.message });
  }
};

/**
 * Log in directly as that user from the dashboard (Impersonate / Quick Login)
 */
exports.loginAsUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const user = await db.get('SELECT id, name, email, phone, role, login_allowed FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify user is allowed to log in
    if (user.login_allowed !== undefined && user.login_allowed !== null && (user.login_allowed === 0 || user.login_allowed === '0')) {
      return res.status(403).json({
        success: false,
        message: 'This user is currently marked as NOT ALLOWED to log in. Please click OK / Allow Login first.'
      });
    }

    const { generateToken } = require('../config/jwt');
    const { getSubscriptionInfo } = require('../middleware/subscriptionCheck');
    const token = generateToken(user);
    const subscription = await getSubscriptionInfo(user.id);
    const company = await db.get('SELECT * FROM company_settings WHERE user_id = ?', [user.id]);

    return res.json({
      success: true,
      message: `Logged in as ${user.name} successfully!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      subscription,
      company
    });
  } catch (error) {
    console.error('loginAsUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to login as user: ' + error.message });
  }
};

/**
 * Admin change or reset password for any user
 */
exports.updateUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || !newPassword.trim()) {
      return res.status(400).json({ success: false, message: 'User ID and a non-empty password are required.' });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
    await db.run(
      'UPDATE users SET password_hash = ?, password_plain = ? WHERE id = ?',
      [passwordHash, newPassword.trim(), userId]
    );

    return res.json({
      success: true,
      message: `Password updated successfully for user #${userId}!`,
      userId: Number(userId),
      password: newPassword.trim()
    });
  } catch (error) {
    console.error('updateUserPassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user password: ' + error.message });
  }
};

/**
 * Super Admin Login specifically for the /my_user route gate
 * Strictly restricts login to email: admin@billpro.com
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail !== 'admin@billpro.com') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only admin@billpro.com is authorized to access the /my_user dashboard.'
      });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Admin account not found.' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials. Please enter admin123.' });
    }

    const { generateToken } = require('../config/jwt');
    const { getSubscriptionInfo } = require('../middleware/subscriptionCheck');
    const token = generateToken(user);
    const subscription = await getSubscriptionInfo(user.id);
    const company = await db.get('SELECT * FROM company_settings WHERE user_id = ?', [user.id]);

    return res.json({
      success: true,
      message: 'Super Admin authenticated successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      subscription,
      company
    });
  } catch (error) {
    console.error('adminLogin error:', error);
    return res.status(500).json({ success: false, message: 'Admin login failed: ' + error.message });
  }
};
