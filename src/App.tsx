// src/App.tsx 
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard  from './guards/AuthGuard'
import AdminGuard from './guards/AdminGuard'

// Public pages
import SignUp from './pages/public/SignUp'
import Login  from './pages/public/Login'

// Placeholder pages (will be built in Phase 3+)
const Landing         = () => <div className="p-8 text-center font-headline text-2xl">Landing — Phase 3</div>
const BrowseGallery   = () => <div className="p-8 text-center font-headline text-2xl">Browse — Phase 3</div>
const Inventory       = () => <div className="p-8 text-center font-headline text-2xl">Inventory — Phase 3</div>

// Settings pages
// import ProfileSettings  from './pages/auth/settings/ProfileSettings'
// import SecuritySettings from './pages/auth/settings/SecuritySettings'
// import NotifSettings    from './pages/auth/settings/NotifSettings'

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
          {/* <Route path="/settings/profile"       element={<ProfileSettings />} />
          <Route path="/settings/security"      element={<SecuritySettings />} />
          <Route path="/settings/notifications" element={<NotifSettings />} /> */}
        </Route>

        {/* Admin scaffold */}
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<div className="p-8">Admin — Phase 5+</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}