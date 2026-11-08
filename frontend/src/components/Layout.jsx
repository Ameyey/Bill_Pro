  import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscriptionBanner from './SubscriptionBanner';
import PaymentModal from './PaymentModal';
import {
  LayoutDashboard,
  FilePlus,
  Receipt,
  Users,
  Package,
  Image as ImageIcon,
  Crown,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Building2,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, company, subscription, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.email === 'admin@billpro.com';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Create Bill', path: '/invoices/create', icon: FilePlus, highlight: true },
    { label: 'Bills', path: '/invoices', icon: Receipt },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Images', path: '/images', icon: ImageIcon },
    { label: 'Subscription', path: '/subscription', icon: Crown },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
    ...(isSuperAdmin ? [
      { label: 'My Users', path: '/my_user', icon: ShieldCheck }
    ] : [])
  ];

  const isLifetime = subscription?.is_lifetime || subscription?.plan_type === 'lifetime';
  const daysRemaining = subscription?.days_remaining ?? 29;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Persistent Trial / Lifetime Banner */}
      <SubscriptionBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'
          } no-print`}
        >
          {/* Logo & Company header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  BillPro <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">GST</span>
                </h2>
                <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {company?.company_name || 'My Business'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              if (item.highlight) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-brand-500/30'
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800 text-white font-bold border-l-4 border-brand-500 pl-2.5'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Subscription Mini Card in Sidebar */}
          <div className="p-3 mx-3 mb-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  {isLifetime ? 'Lifetime Access' : 'Free Trial'}
                </span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isLifetime ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/20 text-brand-400'}`}>
                {isLifetime ? 'Active' : `${daysRemaining}d left`}
              </span>
            </div>
            {!isLifetime && (
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-2 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade ₹299</span>
              </button>
            )}
          </div>

          {/* Logout button */}
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 z-30 no-print">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>{company?.company_name || 'My Business'}</span>
                {company?.gstin && <span className="text-slate-400 font-mono">({company.gstin})</span>}
              </div>
            </div>

            {/* Right Navbar items */}
            <div className="flex items-center gap-3">
              {/* Subscription Status Tag */}
              <div className="hidden md:flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isLifetime
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : daysRemaining <= 4
                    ? 'bg-amber-50 text-amber-800 border border-amber-300'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}>
                  <Crown className={`w-3.5 h-3.5 ${isLifetime ? 'text-emerald-600' : daysRemaining <= 4 ? 'text-amber-600' : 'text-brand-600'}`} />
                  <span>{isLifetime ? 'Lifetime Member' : `Trial: ${daysRemaining} Days`}</span>
                </span>
                {!isLifetime && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full shadow-sm transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Pay ₹299</span>
                  </button>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Admin User'}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{user?.email || 'admin@billpro.com'}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs font-semibold animate-fade-in"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900">{user?.name}</p>
                      <p className="text-[11px] text-slate-400">{user?.email}</p>
                    </div>
                    <NavLink to="/settings" className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50">
                      <Settings className="w-4 h-4 text-slate-400" /> Settings
                    </NavLink>
                    <NavLink to="/subscription" className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50">
                      <Crown className="w-4 h-4 text-amber-500" /> Subscription Plan
                    </NavLink>
                    {isSuperAdmin && (
                      <NavLink to="/my_user" className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 font-bold">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" /> My Users (/my_user)
                      </NavLink>
                    )}
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 font-bold"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children || <Outlet />}
          </main>
        </div>
      </div>

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </div>
  );
}
