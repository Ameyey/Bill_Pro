import React from 'react';
import { Crown, Sparkles, AlertCircle } from 'lucide-react';

export default function SubscriptionBanner({ subscription, onUpgrade }) {
  if (!subscription) return null;

  const isLifetime = subscription.is_lifetime || subscription.plan_type === 'lifetime';
  if (isLifetime) return null;

  const daysRemaining = subscription.days_remaining ?? 0;
  const isExpiringSoon = daysRemaining <= 5;

  return (
    <div className={`px-4 py-2.5 text-sm flex flex-wrap items-center justify-between gap-3 ${
      isExpiringSoon ? 'bg-amber-500 text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
    }`}>
      <div className="flex items-center gap-2">
        {isExpiringSoon ? (
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-200" />
        ) : (
          <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
        )}
        <span>
          <strong>Trial Plan:</strong> {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining. Unlock unlimited billing forever for just ₹299!
        </span>
      </div>

      <button
        onClick={onUpgrade}
        className="px-3 py-1 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
      >
        <Crown className="w-3.5 h-3.5 text-amber-500" />
        Upgrade to Lifetime (₹299)
      </button>
    </div>
  );
}

