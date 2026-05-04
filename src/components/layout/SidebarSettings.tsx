// src/components/layout/SidebarSettings.tsx
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/settings/profile',       icon: 'dashboard',     label: 'Overview' },
  { to: '/settings/security',      icon: 'shield',        label: 'Security' },
  { to: '/settings/notifications', icon: 'notifications', label: 'Notifications' },
]

export default function SidebarSettings({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="flex max-w-7xl mx-auto min-h-[calc(100vh-72px)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-full w-64 py-8 px-4 gap-2 bg-[--color-surface-container] sticky top-[72px] self-start min-h-screen">
        <div className="px-4 mb-8">
          <h2 className="text-lg font-bold font-headline text-[--color-on-surface]">Account Settings</h2>
          <p className="text-xs text-[--color-on-surface-variant] font-medium">Manage your recovery profile</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => {
            const isActive = pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold font-headline rounded-lg transition-all ${
                  isActive
                    ? 'text-[--color-primary] font-bold bg-[--color-primary-container]/10 translate-x-1'
                    : 'text-[--color-on-surface] hover:bg-[--color-surface-container-low]'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 md:p-12 bg-[--color-surface]">
        {children}
      </main>
    </div>
  )
}