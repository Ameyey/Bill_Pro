import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PaymentModal from '../../components/PaymentModal';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Receipt,
  ArrowRight,
  Zap,
  Lock,
  ArrowLeft
} from 'lucide-react';

function TrialDaysSwitcher() {
  const { subscription, resetTrialDays } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleSetDays = async (days) => {
    setUpdating(true);
    await resetTrialDays(days);
    setUpdating(false);
  };

  const daysRemaining = subscription?.days_remaining ?? 29;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={updating}
        onClick={() => handleSetDays(29)}
        className={`px-2.5 py-1 rounded-xl font-bold text-xs border transition ${
          daysRemaining > 4
            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
        title="Hide banner - full 29 days remaining"
      >
        29 Days (Banner Hidden)
      </button>

      <button
        type="button"
        disabled={updating}
        onClick={() => handleSetDays(4)}
        className={`px-2.5 py-1 rounded-xl font-bold text-xs border transition ${
          daysRemaining === 4
            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
        title="Show banner - simulate 4 days remaining"
      >
        4 Days
      </button>

      <button
        type="button"
        disabled={updating}
        onClick={() => handleSetDays(3)}
        className={`px-2.5 py-1 rounded-xl font-bold text-xs border transition ${
          daysRemaining === 3
            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
        title="Show banner - simulate 3 days remaining"
      >
        3 Days (Banner Shown)
      </button>
    </div>
  );
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { subscription, refreshMe } = useAuth();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscriptions/status');
      if (res.success) {
        setPaymentHistory(res.payments || []);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLifetime = subscription?.is_lifetime || subscription?.plan_type === 'lifetime';
  const daysRemaining = subscription?.days_remaining ?? 29;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-sm flex items-center justify-center shrink-0"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-500" />
            <span>Subscription & Billing Plans</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your 29-day free trial status, access permissions, and lifetime ₹299 upgrade
          </p>
        </div>
      </div>

      {/* Plan Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Active Status Card */}
        <div className="md:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                isLifetime
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-brand-100 text-brand-800 border border-brand-200'
              }`}>
                {isLifetime ? 'Lifetime Access • Active' : `Trial: ${daysRemaining} Days Remaining`}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isLifetime ? 'BillPro Unlimited Lifetime Plan' : '29-Day Free Trial Plan'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isLifetime
                ? 'Your account has full unrestricted access forever with zero renewal fees.'
                : 'Enjoy all premium GST billing features free for 29 days from your registration date.'}
            </p>
          </div>

          {/* Key Dates Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Trial Start Date:</span>
              <span className="font-semibold text-slate-800">{formatDate(subscription?.trial_start)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Trial Expiry Date:</span>
              <span className="font-semibold text-slate-800">{formatDate(subscription?.trial_end)}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Payment Status:</span>
              <span className={`font-bold uppercase text-[11px] ${isLifetime ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isLifetime ? 'Paid (₹299)' : 'Trial Active'}
              </span>
            </div>
          </div>

          {!isLifetime && (
            <div className="space-y-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Lifetime Access for ₹299</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Trial Days Control */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-600">
                  Test Banner Display:
                </span>
                <TrialDaysSwitcher />
              </div>
            </div>
          )}
        </div>

        {/* Right: Plan Highlights Card */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" /> All Features Included
            </div>
            <div className="text-3xl font-black text-white mt-1">₹299</div>
            <div className="text-xs text-slate-400 uppercase font-semibold">One-Time • Lifetime Access</div>

            <div className="mt-6 space-y-2.5 text-xs text-slate-300">
              {[
                '29-Day Free Trial included',
                'Unlimited invoices & job work DC',
                'Multiple GST numbers per client',
                'Intra & Inter-State GST engine',
                'Amount in words converter',
                'Print & high-res PDF generation',
                'Detailed tax reports & analytics'
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stored permanently in your database</span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-brand-600" />
          <span>Payment & Transaction History</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentHistory.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.transaction_id}</td>
                  <td className="py-3 px-3 text-slate-600">{formatDate(p.payment_date)}</td>
                  <td className="py-3 px-3 font-mono font-black text-slate-900">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-3 text-slate-700">{p.payment_method}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{p.notes || 'Lifetime Access Activation'}</td>
                </tr>
              ))}

              {paymentHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No payment transactions yet. Active on 29-day free trial.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          fetchSubscriptionDetails();
          refreshMe();
        }}
      />
    </div>
  );
}
