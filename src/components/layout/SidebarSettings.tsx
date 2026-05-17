// src/components/layout/SidebarSettings.tsx
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/inventory',    icon: 'dashboard',   label: 'Dashboard' },
  { to: '/settings/profile',       icon: 'dashboard',     label: 'Overview' },
  { to: '/settings/security',      icon: 'shield',        label: 'Security' },
  { to: '/settings/notifications', icon: 'notifications', label: 'Notifications' },
];

export default function SidebarSettings({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen w-full">
      {/* Fixed sidebar – always on the left, independent of content width */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[--color-surface-container] border-r border-[--color-outline-variant]/20 overflow-y-auto z-30">
        <div className="py-8 px-4">
          <div className="px-4 mb-8">
            <h2 className="text-lg font-bold font-headline text-[--color-on-surface]">Account Settings</h2>
            <p className="text-xs text-[--color-on-surface-variant] font-medium">Manage your recovery profile</p>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map(item => {
              const isActive = pathname === item.to;
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
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content – pushed to the right by the fixed sidebar width */}
      <main className="flex-1 ml-64 bg-[--color-surface] min-h-screen p-6 md:p-12">
        {children}
      </main>
    </div>
  );
}