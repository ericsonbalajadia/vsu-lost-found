// src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import AuthGuard from './guards/AuthGuard';
import AdminGuard from './guards/AdminGuard';

// ─────────────────────────────────────────────────────────────
// Lazy‑loaded page components (all pages that were static)
// ─────────────────────────────────────────────────────────────

// Public pages
const Landing = lazy(() => import('./pages/public/Landing'));
const SignUp = lazy(() => import('./pages/public/SignUp'));
const Login = lazy(() => import('./pages/public/Login'));

// Authenticated pages
const Inventory = lazy(() => import('./pages/auth/Inventory'));
const Report = lazy(() => import('./pages/auth/Report'));
const MyItems = lazy(() => import('./pages/auth/MyItems'));
const Claims = lazy(() => import('./pages/auth/Claims'));
const MyClaims = lazy(() => import('./pages/auth/MyClaims'));
const ClaimantHandshake = lazy(() => import('./pages/claimant/ClaimantHandshake'));

// Settings pages
const SettingsPage = lazy(() => import('./pages/auth/settings/SettingsPage'));


// 404 page
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin stub (small – keep static)
const AdminStub = () => (
  <div className="min-h-screen flex items-center justify-center p-8 text-center">
    <div>
      <h1 className="text-2xl font-bold font-headline mb-3">Admin Access</h1>
      <p className="text-[--color-on-surface-variant] max-w-sm">
        FoundPath admins manage the platform via{' '}
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[--color-primary] underline underline-offset-4"
        >
          Supabase Dashboard
        </a>.
      </p>
    </div>
  </div>
);

// Loading fallback (shown while a chunk is fetched)
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-primary]"></div>
  </div>
);

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Manrope, sans-serif', fontSize: '14px' },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />

            {/* Authenticated routes */}
            <Route element={<AuthGuard />}>
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/report" element={<Report />} />
              <Route path="/my-items" element={<MyItems />} />
              {/* <Route path="/settings/profile" element={<ProfileSettings />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
              <Route path="/settings/notifications" element={<NotifSettings />} /> */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/claims/:id/handshake" element={<ClaimantHandshake />} />
              <Route path="/my-claims" element={<MyClaims />} />
              <Route path="/claims" element={<Claims />} />
            </Route>

            {/* Admin scaffold */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<AdminStub />} />
            </Route>

            {/* 404 catch‑all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}