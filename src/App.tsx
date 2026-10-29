import { Suspense, lazy, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { isConfigured } from "./lib/supabase";
import { AppShell } from "./components/Layout";
import { Spinner } from "./components/ui";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Discover from "./pages/Discover";
import GuidePage from "./pages/GuidePage";
import Sessions from "./pages/Sessions";
import Messages from "./pages/Messages";
import Goals from "./pages/Goals";
import Saved from "./pages/Saved";
import BecomeGuide from "./pages/BecomeGuide";
import GuideSettings from "./pages/GuideSettings";
import Account from "./pages/Account";
import Admin from "./pages/Admin";

// The call library is large, so it only downloads when someone opens a call.
const Call = lazy(() => import("./pages/Call"));
import { About, Guidelines, NotFound, Privacy, Terms } from "./pages/Static";
import Setup from "./pages/Setup";

function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (profile && !profile.onboarded && location.pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
  if (admin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const inShell = (page: ReactNode, admin = false) => (
  <RequireAuth admin={admin}>
    <AppShell>{page}</AppShell>
  </RequireAuth>
);

export default function App() {
  if (!isConfigured) return <Setup />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/browse" element={<Discover />} />
      <Route path="/browse/:type" element={<Discover />} />
      <Route path="/guide/:id" element={<GuidePage />} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/dashboard" element={inShell(<Dashboard />)} />
      <Route path="/bookings" element={inShell(<Sessions />)} />
      <Route path="/messages" element={inShell(<Messages />)} />
      <Route path="/messages/:bookingId" element={inShell(<Messages />)} />
      <Route path="/call/:bookingId" element={inShell(<Suspense fallback={<Spinner />}><Call /></Suspense>)} />
      <Route path="/goals" element={inShell(<Goals />)} />
      <Route path="/saved" element={inShell(<Saved />)} />
      <Route path="/become-guide" element={inShell(<BecomeGuide />)} />
      <Route path="/guide-settings" element={inShell(<GuideSettings />)} />
      <Route path="/account" element={inShell(<Account />)} />
      <Route path="/admin" element={inShell(<Admin />, true)} />
      <Route path="/about" element={<About />} />
      <Route path="/guidelines" element={<Guidelines />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
