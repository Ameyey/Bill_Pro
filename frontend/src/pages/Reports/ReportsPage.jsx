import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Users,
  Package,
  TrendingUp,
  Percent,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'customer', 'product'
  const { success, error } = useToast();

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const [repRes, dashRes] = await Promise.all([
        api.get(`/reports/detailed?${params.toString()}`),
        api.get('/reports/dashboard')
      ]);

      if (repRes.success) setReportData(repRes);
      if (dashRes.success) setStatsData(dashRes);
    } catch (err) {
      error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (activeTab === 'daily') {
      csvContent += 'Date,Invoice Count,Taxable Value,GST Amount,Grand Total\n';
      reportData?.daily_sales?.forEach(row => {
        csvContent += `"${row.date}","${row.invoice_count}","${row.taxable}","${row.gst}","${row.total}"\n`;
      });
    } else if (activeTab === 'customer') {
      csvContent += 'Customer Name,Total Invoices,Total Spent,GST Collected\n';
      reportData?.customer_sales?.forEach(row => {
        csvContent += `"${row.customer_name}","${row.total_invoices}","${row.total_spent}","${row.total_gst}"\n`;
      });
    } else if (activeTab === 'product') {
      csvContent += 'Product Description,Quantity Sold,Total Sq.Ft,Total Revenue\n';
      reportData?.product_sales?.forEach(row => {
        csvContent += `"${row.product_name}","${row.total_quantity}","${row.total_sq_ft}","${row.total_revenue}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BillPro_Report_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Report exported successfully!');
  };

  const stats = statsData?.stats || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-600" />
            <span>Sales & GST Tax Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze daily sales, monthly GST breakdowns, customer totals, and export data
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sales</span>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(stats.total_sales || 0)}</div>
          <span className="text-[10px] text-slate-400 font-medium">{stats.total_bills || 0} Invoices</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total GST Collected</span>
          <div className="text-xl font-black text-brand-600 mt-1">{formatCurrency(stats.total_gst || 0)}</div>
          <span className="text-[10px] text-slate-400 font-medium">CGST + SGST + IGST</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid Amount</span>
          <div className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(stats.paid_amount || 0)}</div>
          <span className="text-[10px] text-emerald-600 font-bold">Settled</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding (Unpaid)</span>
          <div className="text-xl font-black text-amber-600 mt-1">{formatCurrency(stats.unpaid_amount || 0)}</div>
          <span className="text-[10px] text-amber-600 font-bold">Pending Payment</span>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Report Category Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Daily / Date-wise Sales
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'customer' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Customer-wise Revenue
          </button>
          <button
            onClick={() => setActiveTab('product')}
            className={`px-4 py-1.5 rounded-lg transition ${
              activeTab === 'product' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Product / Job Work Stats
          </button>
        </div>

        {/* Date pickers */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Filter:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'daily' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3 text-center">Invoices</th>
                <th className="py-3 px-3 text-right">Taxable Amount</th>
                <th className="py-3 px-3 text-right">GST Collected</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData?.daily_sales?.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800">{formatDate(d.date)}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">{d.invoice_count}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">{formatCurrency(d.taxable)}</td>
                  <td className="py-3 px-3 text-right font-mono text-brand-600 font-semibold">{formatCurrency(d.gst)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(d.total)}</td>
                </tr>
              ))}
              {(!reportData?.daily_sales || reportData.daily_sales.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No data found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'customer' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Customer / Company</th>
                <th className="py-3 px-3 text-center">Total Invoices</th>
                <th className="py-3 px-3 text-right">Total GST</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData?.customer_sales?.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-bold text-slate-800">{c.customer_name}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">{c.total_invoices}</td>
                  <td className="py-3 px-3 text-right font-mono text-brand-600 font-semibold">{formatCurrency(c.total_gst)}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatCurrency(c.total_spent)}</td>
                </tr>
              ))}
              {(!reportData?.customer_sales || reportData.customer_sales.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">No data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'product' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Product / Job Work Description</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-3 text-center">Sq.Ft Processed</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData?.product_sales?.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-bold text-slate-800">{p.product_name}</td>
                  <td className="py-3 px-3 text-center font-mono text-slate-700">{formatNumber(p.total_quantity)}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{formatNumber(p.total_sq_ft)}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatCurrency(p.total_revenue)}</td>
                </tr>
              ))}
              {(!reportData?.product_sales || reportData.product_sales.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">No data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
