import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import InvoicePreviewModal from '../../components/InvoicePreviewModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Download,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  Building2,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

export default function InvoiceList() {
  const { company } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Preview & Delete State
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [search, customerId, paymentStatus, startDate, endDate]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (customerId) params.append('customer_id', customerId);
      if (paymentStatus) params.append('payment_status', paymentStatus);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get(`/invoices?${params.toString()}`);
      if (res.success) {
        setInvoices(res.invoices);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch invoices.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) { }
  };

  const handlePreview = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      if (res.success) {
        setPreviewInvoice(res.invoice);
      }
    } catch (err) {
      error('Failed to load invoice details.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/invoices/${deleteId}`);
      if (res.success) {
        success('Invoice deleted successfully.');
        setDeleteId(null);
        fetchInvoices();
      }
    } catch (err) {
      error(err.message || 'Failed to delete invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    setUpdatingStatusId(invoiceId);
    // Optimistic UI update
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, payment_status: newStatus } : inv));
    try {
      const res = await api.patch(`/invoices/${invoiceId}/payment`, {
        payment_status: newStatus
      });
      if (res.success) {
        success(`Invoice status updated to ${newStatus.toUpperCase()}`);
      } else {
        error(res.message || 'Failed to update status.');
        fetchInvoices();
      }
    } catch (err) {
      error(err.message || 'Failed to update status.');
      fetchInvoices();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-brand-600" />
            <span>Bills & Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, filter, print, and export all your issued invoices and job work challans
          </p>
        </div>

        <Link
          to="/invoices/create"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Bill</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, customer, GST, DC No..."
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
            >
              <option value="">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none font-medium"
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setCustomerId('');
                setPaymentStatus('all');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Date Filter:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-3">Customer / Company</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 px-3">GST Number</th>
                <th className="py-3.5 px-3">Out DC #</th>
                <th className="py-3.5 px-3 text-right">Amount (₹)</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-800">{inv.customer_name}</div>
                    {inv.customer_city && (
                      <span className="text-[10px] text-slate-400">{inv.customer_city}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-600">
                    {formatDate(inv.invoice_date)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                    {inv.selected_gst_number || '-'}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-600 font-semibold">
                    {inv.out_dc_no || '-'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 text-sm">
                    {formatCurrency(inv.grand_total)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="relative inline-flex items-center">
                      <select
                        value={inv.payment_status || 'unpaid'}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        disabled={updatingStatusId === inv.id}
                        className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer border transition focus:outline-none focus:ring-2 shadow-sm font-mono ${inv.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 focus:ring-emerald-400'
                            : inv.payment_status === 'partial'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 focus:ring-blue-400'
                              : inv.payment_status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 focus:ring-rose-400'
                                : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 focus:ring-amber-400'
                          }`}
                        title="Click to manually change payment status"
                      >
                        <option value="paid" className="bg-white text-emerald-700 font-bold">● PAID</option>
                        <option value="unpaid" className="bg-white text-amber-700 font-bold">● UNPAID</option>
                        <option value="partial" className="bg-white text-blue-700 font-bold">● PARTIAL</option>
                        <option value="cancelled" className="bg-white text-rose-700 font-bold">● CANCELLED</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-current absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handlePreview(inv.id)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="View & Print Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/invoices/edit/${inv.id}`}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="Edit Invoice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteId(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No Invoices Found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or create a new bill.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        isOpen={Boolean(previewInvoice)}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
        company={company}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice?"
        message="Are you sure you want to delete this invoice? This will remove all associated line items permanently."
        loading={isDeleting}
      />
    </div>
  );
}
