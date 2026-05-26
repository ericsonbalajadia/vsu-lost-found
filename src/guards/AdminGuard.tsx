// src/guards/AdminGuard.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext';

export default function AdminGuard() {
  const { user, isAdmin, loading, profileLoading } = useAuth()

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-surface]">
        <div className="text-[--color-on-surface-variant] text-sm">Loading…</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
