import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StatCard from '../../components/StatCard';
import PaymentModal from '../../components/PaymentModal';
import InvoicePreviewModal from '../../components/InvoicePreviewModal';
import {
  Receipt,
  Users,
  Package,
  TrendingUp,
  Percent,
  FilePlus,
  ArrowUpRight,
  Eye,
  Crown,
  Sparkles,
  CheckCircle,
  Clock,
  Building2,
  Phone
} from 'lucide-react';

export default function DashboardHome() {
  const { user, company, subscription } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      if (res.success) {
        setPreviewInvoice(res.invoice);
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
    }
  };

  const stats = data?.stats || {};
  const isLifetime = subscription?.is_lifetime || subscription?.plan_type === 'lifetime';
  const daysRemaining = subscription?.days_remaining ?? 29;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md mb-3">
              <Building2 className="w-3.5 h-3.5 text-brand-400" />
              <span>{company?.company_name || user?.name || 'My Business'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {user?.name || 'Administrator'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Manage your GST billing, customer multiple-GST numbers, job work delivery challans, and real-time reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/invoices/create"
              className="px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 font-bold text-sm shadow-lg shadow-brand-500/25 transition flex items-center gap-2 text-white"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create New Bill</span>
            </Link>

            <Link
              to="/customers"
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 font-semibold text-sm border border-slate-700 transition flex items-center gap-2 text-slate-200"
            >
              <Users className="w-4 h-4 text-brand-400" />
              <span>Customers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isLifetime ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}>
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {isLifetime ? 'Lifetime Access Plan' : 'Free Trial Period'}
              </h3>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${isLifetime ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                {isLifetime ? 'Permanent Access' : `Trial: ${daysRemaining} Days`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isLifetime
                ? 'Your account is permanently unlocked with unlimited invoices and lifetime data storage.'
                : 'You are currently on the 29-day free trial. Upgrade anytime for ₹299 lifetime access.'}
            </p>
          </div>
        </div>

        {!isLifetime && (
          <button
            onClick={() => setShowPayment(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Unlock Lifetime for ₹299</span>
          </button>
        )}
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Bills"
          value={stats.total_bills || 0}
          subtitle="Generated Invoices"
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Total Sales"
          value={formatCurrency(stats.total_sales || 0)}
          subtitle="Gross Revenue"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total GST"
          value={formatCurrency(stats.total_gst || 0)}
          subtitle={`CGST+SGST: ${formatCurrency((stats.total_cgst || 0) + (stats.total_sgst || 0))}`}
          icon={Percent}
          color="indigo"
        />
        <StatCard
          title="Customers"
          value={stats.total_customers || 0}
          subtitle="Companies & Clients"
          icon={Users}
          color="violet"
        />
        <StatCard
          title="Products"
          value={stats.total_products || 0}
          subtitle="Catalog Items"
          icon={Package}
          color="amber"
        />
      </div>

      {/* Tables Section: Recent Invoices & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Bills</h3>
              <p className="text-xs text-slate-500">Latest invoices and job work challans</p>
            </div>
            <Link
              to="/invoices"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Out D.C</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data?.recent_bills?.length > 0 ? (
                  data.recent_bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900">{bill.invoice_number}</td>
                      <td className="py-3 font-medium text-slate-800">{bill.customer_name}</td>
                      <td className="py-3 text-slate-500">{formatDate(bill.invoice_date)}</td>
                      <td className="py-3 font-mono text-slate-500">{bill.out_dc_no || '-'}</td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(bill.grand_total)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${bill.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                          {bill.payment_status || 'unpaid'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handlePreview(bill.id)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          title="Preview Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No invoices created yet. Click "Create New Bill" to generate your first invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Customers (1 col) */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Customers</h3>
              <p className="text-xs text-slate-500">Recently active companies</p>
            </div>
            <Link
              to="/customers"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recent_customers?.length > 0 ? (
              data.recent_customers.map((cust) => (
                <div
                  key={cust.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{cust.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{cust.city || 'Pune'}, {cust.state || 'Maharashtra'}</p>
                  </div>
                  {cust.phone && (
                    <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1 shrink-0">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No customers added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Sales Summary Widget */}
      {data?.monthly_sales?.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Sales Summary</h3>
              <p className="text-xs text-slate-500">Revenue performance & GST trends</p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              Detailed Reports →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {data.monthly_sales.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase">{m.month}</span>
                <div className="text-sm font-black font-mono text-slate-900 mt-1">{formatCurrency(m.sales)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {m.invoice_count} Bills • GST {formatCurrency(m.gst)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
        company={company}
        onlyBill={true}
      />

      {/* Payment Modal */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
    </div>
  );
}
