import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import {
  Users,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  Copy,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Landmark,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Filter,
  Check,
  X,
  ExternalLink,
  LogIn,
  Key,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MyUserDashboard() {
  const { user: currentUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, login_ok, login_blocked, active, expiring_soon, expired, has_bills, has_customers
  const [expandedUsers, setExpandedUsers] = useState({});
  const [activeTabByUser, setActiveTabByUser] = useState({}); // userId -> 'overview' | 'invoices' | 'customers' | 'company'
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'login_as' | 'toggle_login', user, targetStatus }
  const [passwordModal, setPasswordModal] = useState(null); // { user, newPassword }
  const [revealedPasswords, setRevealedPasswords] = useState({}); // userId -> boolean
  const [actionLoading, setActionLoading] = useState(false);
  const { success, error } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/my_user');
      if (res.success) {
        setData(res);
      } else {
        error(res.message || 'Failed to fetch user dashboard data.');
        if (currentUser?.email !== 'admin@billpro.com') {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      error(err.message || 'Error loading dashboard data.');
      if (currentUser?.email !== 'admin@billpro.com') {
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    if (currentUser.email !== 'admin@billpro.com') {
      error('Access Denied: /my_user is strictly restricted to Super Admin (admin@billpro.com).');
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchDashboardData();
  }, [currentUser]);

  const toggleExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const expandAll = () => {
    if (!data?.users) return;
    const all = {};
    data.users.forEach(u => { all[u.id] = true; });
    setExpandedUsers(all);
  };

  const collapseAll = () => {
    setExpandedUsers({});
  };

  const setUserTab = (userId, tab) => {
    setActiveTabByUser(prev => ({
      ...prev,
      [userId]: tab
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (userId, e) => {
    if (e) e.stopPropagation();
    setRevealedPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Copy text to clipboard with toast notification
  const copyToClipboard = (text, label, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      success(`${label} copied to clipboard!`);
    } catch (err) {
      success(`${label} copied!`);
    }
  };

  // Admin update password for user
  const handleUpdatePassword = async () => {
    if (!passwordModal?.user || !passwordModal?.newPassword?.trim()) {
      error('Please enter a valid password.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.post('/my_user/update-password', {
        userId: passwordModal.user.id,
        newPassword: passwordModal.newPassword.trim()
      });

      if (res.success) {
        success(res.message);
        setData(prev => {
          if (!prev?.users) return prev;
          return {
            ...prev,
            users: prev.users.map(u => {
              if (u.id === passwordModal.user.id) {
                return { ...u, password: passwordModal.newPassword.trim() };
              }
              return u;
            })
          };
        });
        setPasswordModal(null);
      } else {
        error(res.message || 'Failed to update password.');
      }
    } catch (err) {
      error(err.message || 'Error updating password.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open confirmation modal for toggle login or direct login
  const openConfirmModal = (type, user, targetStatus = null) => {
    setConfirmModal({
      type,
      user,
      targetStatus
    });
  };

  // Close confirmation modal (When user clicks Cancel / not clicking OK)
  const closeConfirmModal = () => {
    if (actionLoading) return;
    setConfirmModal(null);
  };

  // Execute Toggle Login Permission (OK / Allowed vs Blocked / Not Allowed)
  const executeToggleLogin = async () => {
    if (!confirmModal?.user) return;
    const { user, targetStatus } = confirmModal;
    try {
      setActionLoading(true);
      const res = await api.post('/my_user/toggle-login', {
        userId: user.id,
        allowLogin: targetStatus
      });

      if (res.success) {
        success(res.message);
        // Update user state locally
        setData(prev => {
          if (!prev?.users) return prev;
          const updatedUsers = prev.users.map(u => {
            if (u.id === user.id) {
              return { ...u, login_allowed: res.login_allowed };
            }
            return u;
          });
          const loginAllowedCount = updatedUsers.filter(u => u.login_allowed !== 0).length;
          const loginBlockedCount = updatedUsers.filter(u => u.login_allowed === 0).length;
          return {
            ...prev,
            users: updatedUsers,
            summary: {
              ...prev.summary,
              login_allowed_count: loginAllowedCount,
              login_blocked_count: loginBlockedCount
            }
          };
        });
        setConfirmModal(null);
      } else {
        error(res.message || 'Failed to update user login access.');
      }
    } catch (err) {
      error(err.message || 'Error updating login access.');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Direct Login as User (Impersonate)
  const executeLoginAsUser = async () => {
    if (!confirmModal?.user) return;
    const { user } = confirmModal;
    try {
      setActionLoading(true);
      const res = await api.post('/my_user/login-as', {
        userId: user.id
      });

      if (res.success && res.token) {
        // Store session token and user info
        localStorage.setItem('billpro_token', res.token);
        localStorage.setItem('billpro_user', JSON.stringify(res.user));
        success(`Logged in as ${user.name}! Redirecting to dashboard...`);
        setConfirmModal(null);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        error(res.message || 'Failed to login as user.');
      }
    } catch (err) {
      error(err.message || 'Error logging in as user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users based on search and status filter
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    let list = [...data.users];

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter(u => u.subscription && !u.subscription.is_expired);
    } else if (statusFilter === 'expiring_soon') {
      list = list.filter(u => u.subscription && u.subscription.is_expiring_soon);
    } else if (statusFilter === 'expired') {
      list = list.filter(u => u.subscription && u.subscription.is_expired);
    } else if (statusFilter === 'has_bills') {
      list = list.filter(u => u.billing_stats.total_invoices > 0);
    } else if (statusFilter === 'has_customers') {
      list = list.filter(u => u.total_customers > 0);
    } else if (statusFilter === 'login_ok') {
      list = list.filter(u => u.login_allowed !== 0);
    } else if (statusFilter === 'login_blocked') {
      list = list.filter(u => u.login_allowed === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(u => {
        return (
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          (u.company?.company_name && u.company.company_name.toLowerCase().includes(q)) ||
          (u.company?.gstin && u.company.gstin.toLowerCase().includes(q)) ||
          (u.company?.city && u.company.city.toLowerCase().includes(q)) ||
          u.customers?.some(c => (c.name && c.name.toLowerCase().includes(q)) || (c.phone && c.phone.toLowerCase().includes(q))) ||
          u.invoices?.some(inv => (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) || (inv.customer_name && inv.customer_name.toLowerCase().includes(q)))
        );
      });
    }

    return list;
  }, [data?.users, statusFilter, searchQuery]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Export summary to CSV
  const exportCsv = () => {
    if (!filteredUsers.length) return;
    const headers = [
      'User ID',
      'User Name',
      'Email',
      'Password',
      'Phone',
      'Company Name',
      'GSTIN',
      'City',
      'Login Status',
      'Plan Type',
      'Subscription Status',
      'Days Remaining',
      'Trial End Date',
      'Total Bills',
      'Total Invoiced (INR)',
      'Paid (INR)',
      'Unpaid (INR)',
      'Total Customers'
    ];

    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.password || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.company?.company_name || ''}"`,
      `"${u.company?.gstin || ''}"`,
      `"${u.company?.city || ''}"`,
      `"${u.login_allowed !== 0 ? 'Allowed (OK)' : 'Blocked (Not Allowed)'}"`,
      `"${u.subscription?.plan_formatted || ''}"`,
      `"${u.subscription?.status || ''}"`,
      u.subscription?.days_remaining ?? '-',
      `"${formatDate(u.subscription?.trial_end)}"`,
      u.billing_stats.total_invoices,
      u.billing_stats.total_amount,
      u.billing_stats.paid_amount,
      u.billing_stats.unpaid_amount,
      u.total_customers
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `billpro_my_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('User data exported to CSV!');
  };

  // Strictly prevent rendering if not logged in as admin@billpro.com
  if (!currentUser || currentUser.email !== 'admin@billpro.com') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-sm animate-pulse">
          Loading Master User & Customer Dashboard (/my_user)...
        </p>
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-fade-in text-slate-800">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-xs font-bold backdrop-blur-md border border-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Super Admin Access Only: admin@billpro.com • Route: /my_user</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              All Users, Customers & Billing Overview
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Complete visibility into every registered account: company profiles, subscription trial countdowns, days remaining, customer lists with multi-GST numbers, and invoice totals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition cursor-pointer backdrop-blur-md shadow-xs"
              title="Go back to the Main Application"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Main App</span>
            </button>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition cursor-pointer backdrop-blur-md shadow-xs"
              title="Refresh all user metadata"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              title="Export all users to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={expandAll}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <span>Expand All</span>
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition cursor-pointer"
            >
              <span>Collapse All</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Global Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Users */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{summary.total_users || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Registered accounts</p>
          </div>
        </div>

        {/* Login Permissions (OK / Blocked) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Login Access</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{summary.login_allowed_count ?? 0} OK</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary.login_blocked_count > 0 ? (
                <span className="text-rose-600 font-bold">🚫 {summary.login_blocked_count} Blocked</span>
              ) : (
                <span className="text-emerald-600 font-medium">All users allowed</span>
              )}
            </p>
          </div>
        </div>

        {/* Total Bills / Invoices */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bills</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{summary.total_bills || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Invoices generated</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Invoiced</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">{formatCurrency(summary.total_revenue)}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Paid: {formatCurrency(summary.paid_revenue)}
            </p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Customers</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{summary.total_customers || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Total client businesses</p>
          </div>
        </div>

        {/* Subscriptions & Days Remaining */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Subscriptions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{summary.active_subscriptions || 0} Active</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {summary.expiring_soon > 0 ? (
                <span className="text-amber-600 font-bold">⚠️ {summary.expiring_soon} expiring soon</span>
              ) : (
                <span className="text-emerald-600 font-medium">All trials active</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search Bar and Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user name, email, phone, company, GSTIN, customer, or invoice #..."
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Result Badge */}
          <div className="text-xs font-semibold text-slate-500 shrink-0">
            Showing <strong className="text-slate-900">{filteredUsers.length}</strong> of {data?.users?.length || 0} users
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>

          {[
            { id: 'all', label: 'All Users', count: data?.users?.length || 0 },
            { id: 'login_ok', label: 'Login OK (Allowed)', count: summary.login_allowed_count ?? (data?.users?.filter(u => u.login_allowed !== 0).length || 0) },
            { id: 'login_blocked', label: 'Login NOT Allowed', count: summary.login_blocked_count ?? (data?.users?.filter(u => u.login_allowed === 0).length || 0) },
            { id: 'active', label: 'Active Subscriptions', count: summary.active_subscriptions || 0 },
            { id: 'expiring_soon', label: 'Expiring Soon (≤5d)', count: summary.expiring_soon || 0 },
            { id: 'expired', label: 'Expired', count: summary.expired_subscriptions || 0 },
            { id: 'has_bills', label: 'With Invoices / Bills', count: data?.users?.filter(u => u.billing_stats.total_invoices > 0).length || 0 },
            { id: 'has_customers', label: 'With Customers', count: data?.users?.filter(u => u.total_customers > 0).length || 0 }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-xl font-bold transition text-xs cursor-pointer flex items-center gap-1.5 ${statusFilter === f.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Users List Cards */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No users found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No registered user accounts match your search query or filter. Try clearing the filter or search bar.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-brand-700 transition cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isExpanded = Boolean(expandedUsers[user.id]);
            const activeTab = activeTabByUser[user.id] || 'overview';
            const sub = user.subscription;
            const daysLeft = sub?.days_remaining;

            return (
              <div
                key={user.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm transition hover:border-slate-300 overflow-hidden"
              >
                {/* User Summary Top Bar */}
                <div
                  onClick={() => toggleExpand(user.id)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-b from-white to-slate-50/50 hover:bg-slate-50/80 transition select-none"
                >
                  {/* Left: User identity & Company */}
                  <div className="flex items-start gap-4">
                    {/* User Avatar Initials */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-brand-500/20 shrink-0">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : `U${user.id}`}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                          User #{user.id}
                        </span>
                        <h2 className="text-base font-black text-slate-900">{user.name}</h2>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {user.role}
                        </span>

                        {user.company?.company_name && (
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-brand-600" />
                            <span>{user.company.company_name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.email}</span>
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.phone}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Joined {formatDate(user.created_at)}</span>
                        </span>

                        {/* Password Pill with Show/Hide, Copy & Edit */}
                        <div
                          className="inline-flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-200/90 px-2.5 py-0.5 rounded-lg border border-slate-200 text-slate-800 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pass:</span>
                          <span className="font-mono font-bold text-slate-900 tracking-wider">
                            {revealedPasswords[user.id] ? user.password : '••••••••'}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => togglePasswordVisibility(user.id, e)}
                            className="p-1 hover:text-indigo-600 text-slate-500 rounded transition cursor-pointer"
                            title={revealedPasswords[user.id] ? 'Hide password' : 'Show password'}
                          >
                            {revealedPasswords[user.id] ? (
                              <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(user.password, `Password for ${user.name}`, e)}
                            className="p-1 hover:text-emerald-600 text-slate-500 rounded transition cursor-pointer"
                            title="Copy password to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPasswordModal({ user, newPassword: user.password || '' }); }}
                            className="p-1 hover:text-indigo-600 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            title="Change this user's password"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Subscription Days Remaining & Billing Stats */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
                    {/* Subscription Countdown Badge */}
                    <div className="flex flex-col min-w-[140px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Trial Validity</span>
                      </span>

                      {sub ? (
                        <div className="space-y-1 mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${sub.is_expired
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : sub.is_expiring_soon
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                              {sub.is_expired
                                ? 'Expired'
                                : `${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">({sub.plan_formatted})</span>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${sub.percentage_remaining}%` }}
                              className={`h-full rounded-full transition-all ${sub.is_expired
                                ? 'bg-rose-500'
                                : sub.is_expiring_soon
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                }`}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">No active plan</span>
                      )}
                    </div>

                    {/* Quick Stats: Bills & Amount */}
                    <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-center px-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Bills</span>
                        <strong className="text-sm font-black text-slate-900">{user.billing_stats.total_invoices}</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200"></div>
                      <div className="text-center px-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Invoiced</span>
                        <strong className="text-sm font-black text-emerald-700">{formatCurrency(user.billing_stats.total_amount)}</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200"></div>
                      <div className="text-center px-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Customers</span>
                        <strong className="text-sm font-black text-indigo-700">{user.total_customers}</strong>
                      </div>
                    </div>

                    {/* Expand/Collapse Chevron */}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand full details'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* User Login Access Control & One-Click Login Bar */}
                <div className="px-5 sm:px-6 py-2.5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Left: Login Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>Login Permission:</span>
                    </span>

                    {user.login_allowed !== 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Login OK (Allowed)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>Login NOT Allowed (Blocked)</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {user.login_allowed !== 0 ? '• User can log in normally' : '• Login prevented by administrator'}
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle Login Allowed Button */}
                    {user.login_allowed !== 0 ? (
                      <button
                        type="button"
                        onClick={() => openConfirmModal('toggle_login', user, false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition shadow-2xs cursor-pointer"
                        title="Block this user from logging in"
                      >
                        <Lock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Block Login</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openConfirmModal('toggle_login', user, true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                        title="Click OK to allow this user to log in"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Set OK (Allow Login)</span>
                      </button>
                    )}

                    {/* One-Click Login As User Button */}
                    <button
                      type="button"
                      onClick={() => openConfirmModal('login_as', user)}
                      disabled={user.login_allowed === 0}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${
                        user.login_allowed === 0
                          ? 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                      }`}
                      title={user.login_allowed === 0 ? 'User is blocked from logging in. Click OK to allow first.' : `Log in directly as ${user.name}`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Log In As User</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-white p-5 sm:p-6 space-y-5 animate-fade-in">
                    {/* Navigation Tabs for this user */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold">
                      {[
                        { id: 'overview', label: '📊 Metadata & Overview' },
                        { id: 'invoices', label: `📄 Invoices & Bills (${user.billing_stats.total_invoices})` },
                        { id: 'customers', label: `👥 Customers (${user.total_customers})` },
                        { id: 'company', label: '🏢 Company & Bank Profile' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setUserTab(user.id, t.id)}
                          className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${activeTab === t.id
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                            }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab 1: Metadata & Overview */}
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* User Account Credentials & Password Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Key className="w-4 h-4 text-amber-600" />
                            <span>Account Credentials</span>
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Email (Login):</span>
                              <strong className="text-slate-900 font-bold truncate max-w-[130px]" title={user.email}>{user.email}</strong>
                            </div>

                            <div className="flex justify-between items-center py-1 border-b border-slate-200">
                              <span className="text-slate-500">Password:</span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-slate-900 tracking-wider">
                                  {revealedPasswords[user.id] ? user.password : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => togglePasswordVisibility(user.id, e)}
                                  className="p-1 hover:text-indigo-600 text-slate-400 rounded transition cursor-pointer"
                                  title={revealedPasswords[user.id] ? 'Hide password' : 'Show password'}
                                >
                                  {revealedPasswords[user.id] ? <EyeOff className="w-3 h-3 text-indigo-600" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => copyToClipboard(user.password, `Password for ${user.name}`, e)}
                                  className="p-1 hover:text-emerald-600 text-slate-400 rounded transition cursor-pointer"
                                  title="Copy password"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Login Status:</span>
                              <span className={`font-black px-2 py-0.5 rounded text-[10px] ${user.login_allowed !== 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {user.login_allowed !== 0 ? 'Allowed (OK)' : 'Blocked'}
                              </span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Account Role:</span>
                              <span className="font-bold text-indigo-700 uppercase">{user.role}</span>
                            </div>

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => setPasswordModal({ user, newPassword: user.password || '' })}
                                className="w-full py-1.5 px-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Change / Set Password</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Subscription & Days Remaining Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-brand-600" />
                            <span>Subscription & Trial Status</span>
                          </h4>

                          {sub ? (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between py-1 border-b border-slate-200">
                                <span className="text-slate-500">Plan Type:</span>
                                <strong className="text-slate-900 font-bold">{sub.plan_formatted}</strong>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-200">
                                <span className="text-slate-500">Days Remaining:</span>
                                <span className={`font-black px-2 py-0.5 rounded text-[11px] ${sub.is_expired ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {sub.is_expired ? 'Expired' : `${sub.days_remaining} Days Left`}
                                </span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-200">
                                <span className="text-slate-500">Trial Start:</span>
                                <span className="font-medium text-slate-700">{formatDate(sub.trial_start)}</span>
                              </div>
                              <div className="flex justify-between py-1 border-b border-slate-200">
                                <span className="text-slate-500">Trial End (Expiry):</span>
                                <span className="font-bold text-slate-900">{formatDate(sub.trial_end)}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-slate-500">Amount Paid:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(sub.amount_paid)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No active subscription record found.</p>
                          )}
                        </div>

                        {/* Billing & Invoice Summary Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-brand-600" />
                            <span>Billing & Invoice Totals</span>
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Total Invoices Created:</span>
                              <strong className="text-slate-900 font-bold">{user.billing_stats.total_invoices}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Total Invoiced Amount:</span>
                              <strong className="text-emerald-700 font-black">{formatCurrency(user.billing_stats.total_amount)}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Paid Bills Amount:</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(user.billing_stats.paid_amount)} ({user.billing_stats.paid_count})</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Pending / Unpaid:</span>
                              <span className="font-bold text-amber-700">{formatCurrency(user.billing_stats.unpaid_amount)} ({user.billing_stats.unpaid_count})</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-500">Invoice Prefix / Next No:</span>
                              <span className="font-mono font-bold text-slate-700">{user.company?.invoice_prefix || 'INV-'}{user.company?.next_invoice_no ?? 1}</span>
                            </div>
                          </div>
                        </div>

                        {/* Company Summary Quick Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-brand-600" />
                            <span>Company Profile Summary</span>
                          </h4>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Company Name:</span>
                              <strong className="text-slate-900 font-bold">{user.company?.company_name || 'Not Configured'}</strong>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">GSTIN:</span>
                              <span className="font-mono font-bold text-slate-700">{user.company?.gstin || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">PAN:</span>
                              <span className="font-mono font-bold text-slate-700">{user.company?.pan || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Bank Name:</span>
                              <span className="font-medium text-slate-800">{user.company?.bank_name || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-slate-500">Total Customers:</span>
                              <strong className="text-indigo-700 font-bold">{user.total_customers}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Invoices & Bills Table */}
                    {activeTab === 'invoices' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Invoices Generated by {user.name} ({user.invoices.length})
                          </h4>
                          <span className="text-xs font-bold text-emerald-700">
                            Total: {formatCurrency(user.billing_stats.total_amount)}
                          </span>
                        </div>

                        {user.invoices.length === 0 ? (
                          <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-400 border border-slate-200">
                            No invoices generated yet by this user.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3">Invoice #</th>
                                  <th className="py-2.5 px-3">Date</th>
                                  <th className="py-2.5 px-3">Customer Name</th>
                                  <th className="py-2.5 px-3">Taxable</th>
                                  <th className="py-2.5 px-3">GST Total</th>
                                  <th className="py-2.5 px-3">Grand Total</th>
                                  <th className="py-2.5 px-3">Status</th>
                                  <th className="py-2.5 px-3">Mode</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {user.invoices.map(inv => (
                                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                                    <td className="py-2.5 px-3 text-slate-600">{formatDate(inv.invoice_date)}</td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.customer_name || '-'}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrency(inv.taxable_amount)}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatCurrency(inv.total_gst)}</td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatCurrency(inv.grand_total)}</td>
                                    <td className="py-2.5 px-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${inv.payment_status === 'paid'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                        }`}>
                                        {inv.payment_status}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500">{inv.payment_mode || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Customer Details & Multi-GST List */}
                    {activeTab === 'customers' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                            Customers Registered by {user.name} ({user.customers.length})
                          </h4>
                        </div>

                        {user.customers.length === 0 ? (
                          <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-400 border border-slate-200">
                            No customers added yet by this user.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {user.customers.map(cust => (
                              <div
                                key={cust.id}
                                className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                                  <div>
                                    <h5 className="text-sm font-black text-slate-900">{cust.name}</h5>
                                    {cust.contact_person && (
                                      <p className="text-[11px] text-slate-500 font-medium">Contact: {cust.contact_person}</p>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0">
                                    {cust.gst_count} GST No{cust.gst_count === 1 ? '' : 's'}
                                  </span>
                                </div>

                                <div className="space-y-1 text-xs text-slate-600">
                                  {cust.phone && (
                                    <div className="flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{cust.phone}</span>
                                    </div>
                                  )}
                                  {cust.email && (
                                    <div className="flex items-center gap-1.5">
                                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{cust.email}</span>
                                    </div>
                                  )}
                                  {cust.address && (
                                    <div className="flex items-start gap-1.5">
                                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                      <span className="text-[11px]">{cust.address}, {cust.city} {cust.state} {cust.pincode ? `- ${cust.pincode}` : ''}</span>
                                    </div>
                                  )}
                                </div>

                                {/* GST Numbers Badges */}
                                {cust.gst_numbers && cust.gst_numbers.length > 0 && (
                                  <div className="pt-2 border-t border-slate-200/70 space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                      Customer GSTINs:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {cust.gst_numbers.map((g, idx) => (
                                        <span
                                          key={g.id || idx}
                                          className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-800 shadow-2xs"
                                        >
                                          {g.gst_number}
                                          {g.branch_name && <span className="text-slate-400 font-sans ml-1">({g.branch_name})</span>}
                                          {Boolean(g.is_default) && <span className="text-emerald-600 font-sans ml-1 font-bold">★ Primary</span>}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Full Company & Bank Details */}
                    {activeTab === 'company' && (
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-brand-600" />
                            <span>Complete Firm & Banking Information</span>
                          </h4>
                          <span className="text-xs font-bold text-slate-500">User #{user.id}</span>
                        </div>

                        {user.company ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Registered Firm
                              </span>
                              <div><span className="text-slate-500">Company Name:</span> <strong className="text-slate-900 ml-1">{user.company.company_name || '-'}</strong></div>
                              <div><span className="text-slate-500">Tagline:</span> <span className="text-slate-700 ml-1 font-medium">{user.company.tagline || '-'}</span></div>
                              <div><span className="text-slate-500">GSTIN:</span> <strong className="font-mono text-slate-800 ml-1">{user.company.gstin || '-'}</strong></div>
                              <div><span className="text-slate-500">PAN:</span> <strong className="font-mono text-slate-800 ml-1">{user.company.pan || '-'}</strong></div>
                              <div><span className="text-slate-500">Works Address:</span> <span className="text-slate-700 ml-1">{user.company.works_address || '-'}</span></div>
                              <div><span className="text-slate-500">Registered Office:</span> <span className="text-slate-700 ml-1">{user.company.address || '-'}, {user.company.city} {user.company.state}</span></div>
                            </div>

                            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Bank Details & Invoice Defaults
                              </span>
                              <div><span className="text-slate-500">Bank Name:</span> <strong className="text-slate-900 ml-1">{user.company.bank_name || '-'}</strong></div>
                              <div><span className="text-slate-500">Bank Branch:</span> <span className="text-slate-700 ml-1">{user.company.bank_branch || '-'}</span></div>
                              <div><span className="text-slate-500">Account Number:</span> <strong className="font-mono text-slate-800 ml-1">{user.company.account_no || '-'}</strong></div>
                              <div><span className="text-slate-500">IFSC Code:</span> <strong className="font-mono text-slate-800 ml-1">{user.company.ifsc_code || '-'}</strong></div>
                              <div><span className="text-slate-500">Invoice Prefix:</span> <span className="font-mono font-bold text-slate-700 ml-1">{user.company.invoice_prefix || 'INV-'}</span></div>
                              <div><span className="text-slate-500">Next Invoice No:</span> <strong className="font-mono text-brand-700 ml-1">{user.company.next_invoice_no ?? 1}</strong></div>
                              <div><span className="text-slate-500">Default GST Rate:</span> <span className="font-bold text-slate-700 ml-1">{user.company.default_gst_rate}%</span></div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Company settings not configured yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Confirmation Modal for Login Actions */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
            {/* Header / Icon */}
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                confirmModal.type === 'login_as'
                  ? 'bg-indigo-50 text-indigo-600'
                  : confirmModal.targetStatus
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}>
                {confirmModal.type === 'login_as' ? (
                  <LogIn className="w-6 h-6" />
                ) : confirmModal.targetStatus ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {confirmModal.type === 'login_as'
                    ? `Log In as ${confirmModal.user.name}`
                    : confirmModal.targetStatus
                    ? `Allow Login (Set OK)`
                    : `Block User Login`}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  User ID #{confirmModal.user.id} • {confirmModal.user.email}
                </p>
              </div>
            </div>

            {/* Explanatory Message */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {confirmModal.type === 'login_as' && (
                <>
                  When you click <strong className="text-indigo-700 font-bold">OK, Log In Now</strong>, you will immediately be authenticated as <strong className="text-slate-900">{confirmModal.user.name}</strong> ({confirmModal.user.company?.company_name || 'Business'}) and redirected to their dashboard.
                  <br /><br />
                  <span className="text-slate-500">If you do not click OK (or click Cancel), you will not be logged in.</span>
                </>
              )}

              {confirmModal.type === 'toggle_login' && confirmModal.targetStatus && (
                <>
                  Allow <strong className="text-slate-900">{confirmModal.user.name}</strong> to log in to the application?
                  <br /><br />
                  When you click <strong className="text-emerald-700 font-bold">OK, Allow Login</strong>, the user status will be set to <span className="font-bold text-emerald-700">OK (Allowed)</span> and the user will be able to log in normally.
                  <br /><br />
                  <span className="text-slate-500">If you do not click OK (or click Cancel), the user remains NOT allowed to log in.</span>
                </>
              )}

              {confirmModal.type === 'toggle_login' && !confirmModal.targetStatus && (
                <>
                  Revoke login permission for <strong className="text-slate-900">{confirmModal.user.name}</strong>?
                  <br /><br />
                  When you click <strong className="text-rose-700 font-bold">OK, Block User</strong>, this user will <span className="font-bold text-rose-700">NOT be allowed to log in</span>. Any login attempt on the login page will be rejected by the server.
                  <br /><br />
                  <span className="text-slate-500">If you do not click OK (or click Cancel), the user remains allowed.</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              {confirmModal.type === 'login_as' ? (
                <button
                  type="button"
                  onClick={executeLoginAsUser}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>OK, Log In Now</span>
                </button>
              ) : confirmModal.targetStatus ? (
                <button
                  type="button"
                  onClick={executeToggleLogin}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>OK, Allow Login</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={executeToggleLogin}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>OK, Block User</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Change Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900">Change User Password</h3>
                <p className="text-xs text-slate-500 font-medium">User #{passwordModal.user.id} • {passwordModal.user.name} ({passwordModal.user.email})</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">New Password:</label>
                <input
                  type="text"
                  value={passwordModal.newPassword}
                  onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                  placeholder="Enter new password..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400">
                This updates both the visible password and the database credentials. The user will be able to log in with this password immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPasswordModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={actionLoading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Password</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
