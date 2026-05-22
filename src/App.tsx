// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './guards/AuthGuard'
import AdminGuard from './guards/AdminGuard';
import ProfileSettings from './pages/auth/settings/ProfileSettings'
import SecuritySettings from './pages/auth/settings/SecuritySettings'
import NotifSettings from './pages/auth/settings/NotifSettings'

// Public pages
import SignUp from './pages/public/SignUp'
import Login from './pages/public/Login'
import Landing from './pages/public/Landing'

// Authenticated pages
import Inventory from './pages/auth/Inventory'
import Report from './pages/auth/Report'
import MyItems from './pages/auth/MyItems'

import ClaimantHandshake from './pages/claimant/ClaimantHandshake'
//import HandshakeConfirmed from './pages/samaritan/HandshakeConfirmed'
// import SamaritanItemDetail from './pages/samaritan/SamaritanItemDetail'
import MyClaims from './pages/auth/MyClaims';
import Claims from './pages/auth/Claims';
import NotFound from './pages/NotFound';

import { Toaster } from 'react-hot-toast'

// Placeholder pages (will be built in Phase 3+)
// const BrowseGallery = () => (
//   <div className="p-8 text-center font-headline text-2xl">Browse — Phase 3</div>
// )

const AdminStub = () => (
  <div className="min-h-screen flex items-center justify-center p-8 text-center">
    <div>
      <h1 className="text-2xl font-bold font-headline mb-3">Admin Access</h1>
      <p className="text-[--color-on-surface-variant] max-w-sm">
        FoundPath admins manage the platform via{' '}
        <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer noopener" className="text-[--color-primary] underline underline-offset-4">Supabase Dashboard</a>.
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 4000, style: { fontFamily: 'Manrope, sans-serif', fontSize: '14px' } }} />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* Authenticated */}
          <Route element={<AuthGuard />}>
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/report" element={<Report />} />
            <Route path="/my-items" element={<MyItems />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="/settings/security" element={<SecuritySettings />} />
            <Route path="/settings/notifications" element={<NotifSettings />} />
            {/* <Route path="/user/items/:id" element={<SamaritanItemDetail />} /> */}
            {/* <Route path="/user/claims/:id/resolved" element={<HandshakeConfirmed />} /> */}
            <Route path="/claims/:id/handshake" element={<ClaimantHandshake />} />
            <Route path="/my-claims" element={<MyClaims />} />
            <Route path="/claims" element={<Claims />} />
          </Route>

          {/* Admin scaffold */}
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<AdminStub />} />
          </Route> 

          <Route path="*" element={<NotFound />} />


        </Routes>
      </BrowserRouter>
    </>
  )
}
