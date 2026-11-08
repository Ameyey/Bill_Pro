const db = require('../config/db');

async function getSubscriptionInfo(userId) {
  let sub = await db.get('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);

  if (!sub) {
    // If no subscription exists, create a 29-day free trial
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);

    await db.run(
      `INSERT INTO subscriptions (user_id, plan_type, trial_start, trial_end, status)
       VALUES (?, 'trial', ?, ?, 'active')`,
      [userId, now.toISOString(), trialEnd.toISOString()]
    );
    sub = await db.get('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  } else if (sub.plan_type === 'trial' && sub.status === 'expired') {
    // Stale or expired trial from initial seeding: automatically refresh to 29 active days
    const now = new Date();
    const refreshedEnd = new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000);
    await db.run(
      `UPDATE subscriptions SET trial_start = ?, trial_end = ?, status = 'active' WHERE id = ?`,
      [now.toISOString(), refreshedEnd.toISOString(), sub.id]
    );
    sub = await db.get('SELECT * FROM subscriptions WHERE id = ?', [sub.id]);
  }

  const now = new Date();
  const trialEnd = new Date(sub.trial_end);
  const diffMs = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const isTrialType = sub.plan_type && sub.plan_type.startsWith('trial');
  if (isTrialType && now > trialEnd && sub.status !== 'expired') {
    await db.run("UPDATE subscriptions SET status = 'expired' WHERE id = ?", [sub.id]);
    sub.status = 'expired';
  }

  const isLifetime = sub.plan_type === 'lifetime' && sub.status === 'active';
  const isTrialActive = isTrialType && sub.status === 'active' && daysRemaining > 0;
  const hasAccess = isLifetime || isTrialActive;

  return {
    ...sub,
    days_remaining: isLifetime ? 9999 : daysRemaining,
    is_lifetime: isLifetime,
    is_trial_active: isTrialActive,
    is_expired: !hasAccess,
    price: 299
  };
}

async function subscriptionMiddleware(req, res, next) {
  try {
    const subInfo = await getSubscriptionInfo(req.user.id);
    req.subscription = subInfo;
    next();
  } catch (err) {
    console.error('Subscription check error:', err);
    next();
  }
}

module.exports = { subscriptionMiddleware, getSubscriptionInfo };
