import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import SafetyBanner from '@/components/SafetyBanner';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import NewEntry from '@/pages/NewEntry';
import EntryDetail from '@/pages/EntryDetail';
import Calendar from '@/pages/Calendar';
import Trends from '@/pages/Trends';
import Letters from '@/pages/Letters';
import AiCompanion from '@/pages/AiCompanion';
import PrivacyLock from '@/pages/PrivacyLock';
import Settings from '@/pages/Settings';
import Membership from '@/pages/Membership';
import Tarot from '@/pages/Tarot';
import NameTest from '@/pages/NameTest';
import Healing from '@/pages/Healing';
import Payment from '@/pages/Payment';

function ProtectedLayout() {
  const { userId, isLoading } = useAuth();

  if (isLoading) return <div className="py-20 text-center text-muted">加载中...</div>;
  if (!userId) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-full px-4 py-4">
        <Outlet />
      </main>
      <SafetyBanner />
    </div>
  );
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { userId, isLoading } = useAuth();
  if (isLoading) return <div className="py-20 text-center text-muted">加载中...</div>;
  if (userId) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AuthRedirect><Landing /></AuthRedirect>} />
          <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />

          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/entry/new" element={<NewEntry />} />
            <Route path="/entry/:id" element={<EntryDetail />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/letters" element={<Letters />} />
            <Route path="/ai" element={<AiCompanion />} />
            <Route path="/privacy-lock" element={<PrivacyLock />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/healing" element={<Healing />} />
            <Route path="/tarot" element={<Tarot />} />
            <Route path="/name-test" element={<NameTest />} />
            <Route path="/payment" element={<Payment />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
