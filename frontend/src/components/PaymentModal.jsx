import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Crown, Check, ShieldCheck, Zap } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose }) {
  const { refreshSubscription } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePay = async () => {
    try {
      setLoading(true);
      const res = await api.post('/subscriptions/pay-lifetime', {
        payment_method: 'UPI / QR',
        transaction_id: `TXN_${Date.now()}`
      });

      if (res.success) {
        showToast('Upgraded to Lifetime Access successfully!', 'success');
        if (refreshSubscription) await refreshSubscription();
        onClose();
      } else {
        showToast(res.message || 'Payment failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Payment simulation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Lifetime Access</h3>
            <p className="text-xs text-gray-500">One-time payment. No recurring monthly fees.</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 mb-5 border border-indigo-100 text-center">
          <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">Special Offer</p>
          <div className="text-4xl font-extrabold text-gray-900 mt-1">₹299</div>
          <p className="text-xs text-gray-500 mt-1 line-through">Regular: ₹2,999</p>
        </div>

        <div className="space-y-2.5 mb-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Unlimited GST Tax Invoices & Challans</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Multiple GST Numbers per Customer</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>PDF Print & Professional Templates</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Zero Annual Renewal Charges</span>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Pay ₹299 (Instant Activate)</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          100% Secure Checkout
        </p>
      </div>
    </div>,
    document.body
  );
}

