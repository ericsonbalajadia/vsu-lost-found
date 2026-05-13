// src/App.tsx 
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard  from './guards/AuthGuard'
import AdminGuard from './guards/AdminGuard'
import ProfileSettings from './pages/auth/settings/ProfileSettings'
import SecuritySettings from './pages/auth/settings/SecuritySettings'
import NotifSettings from './pages/auth/settings/NotifSettings'

// Public pages
import SignUp from './pages/public/SignUp'
import Login  from './pages/public/Login'
import Landing from './pages/public/Landing'

// Authenticated pages
import Inventory       from './pages/auth/Inventory'
import Report          from './pages/auth/Report'
import MyItems         from './pages/auth/MyItems'


// Placeholder pages (will be built in Phase 3+)
const BrowseGallery   = () => <div className="p-8 text-center font-headline text-2xl">Browse — Phase 3</div>


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/browse" element={<BrowseGallery />} />

        {/* Authenticated */}
        <Route element={<AuthGuard />}>
          <Route path="/inventory"              element={<Inventory />} />
          <Route path="/report"                 element={<Report />} />
          <Route path="/my-items"               element={<MyItems />} />
          <Route path="/settings/profile"       element={<ProfileSettings />} />
          <Route path="/settings/security"      element={<SecuritySettings />} />
          <Route path="/settings/notifications" element={<NotifSettings />} />
        </Route>

        {/* Admin scaffold */}
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<div className="p-8">Admin — Phase 5+</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}