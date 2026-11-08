import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DashboardHome from './pages/Dashboard/DashboardHome';
import CreateInvoice from './pages/Invoices/CreateInvoice';
import InvoiceList from './pages/Invoices/InvoiceList';
import CustomerList from './pages/Customers/CustomerList';
import ProductList from './pages/Products/ProductList';
import ImageGallery from './pages/Images/ImageGallery';
import SubscriptionPage from './pages/Subscriptions/SubscriptionPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import MyUserDashboard from './pages/MyUser/MyUserDashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return !user ? children : <Navigate to="/dashboard" replace />;
}

// Strict Super Admin Protected Route:
// ONLY accessible when logged in as admin@billpro.com.
// If logged in as ANY other email (e.g. trial7@billpro.com, etc.), this route DOES NOT open: immediately redirects to /dashboard.
// If unauthenticated, redirects to /login.
function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.email !== 'admin@billpro.com') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Master User & Customer Dashboard Routes - Super Admin (admin@billpro.com) Only */}
            <Route
              path="/my_user"
              element={
                <SuperAdminRoute>
                  <Layout>
                    <MyUserDashboard />
                  </Layout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/My_User"
              element={
                <SuperAdminRoute>
                  <Layout>
                    <MyUserDashboard />
                  </Layout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/My_user"
              element={
                <SuperAdminRoute>
                  <Layout>
                    <MyUserDashboard />
                  </Layout>
                </SuperAdminRoute>
              }
            />
            <Route
              path="/my-user"
              element={
                <SuperAdminRoute>
                  <Layout>
                    <MyUserDashboard />
                  </Layout>
                </SuperAdminRoute>
              }
            />

            {/* Protected routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="invoices/create" element={<CreateInvoice />} />
              <Route path="invoices/edit/:id" element={<CreateInvoice />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="products" element={<ProductList />} />
              <Route path="images" element={<ImageGallery />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="my_user" element={<SuperAdminRoute><MyUserDashboard /></SuperAdminRoute>} />
              <Route path="My_User" element={<SuperAdminRoute><MyUserDashboard /></SuperAdminRoute>} />
              <Route path="My_user" element={<SuperAdminRoute><MyUserDashboard /></SuperAdminRoute>} />
              <Route path="my-user" element={<SuperAdminRoute><MyUserDashboard /></SuperAdminRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

