import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Upgrade from './pages/Upgrade';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminPlans from './pages/admin/Plans';
import AdminPayments from './pages/admin/Payments';
import AdminPromo from './pages/admin/Promo';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminSettings from './pages/admin/Settings';
import { ToastContainer, useToastInit } from './components/admin/AdminUI';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f11]">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f11]">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/chat" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/chat" replace /> : children;
}

function AppInner() {
  const toasts = useToastInit();
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/chat"           element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:chatId"   element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/upgrade"        element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users"          element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/plans"          element={<AdminRoute><AdminPlans /></AdminRoute>} />
        <Route path="/admin/payments"       element={<AdminRoute><AdminPayments /></AdminRoute>} />
        <Route path="/admin/promo"          element={<AdminRoute><AdminPromo /></AdminRoute>} />
        <Route path="/admin/announcements"  element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
        <Route path="/admin/settings"       element={<AdminRoute><AdminSettings /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}
