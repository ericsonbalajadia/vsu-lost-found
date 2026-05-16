// src/components/layout/AuthenticatedLayout.tsx
import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/inventory', label: 'Dashboard', icon: 'dashboard' },
  { path: '/my-items', label: 'My Items', icon: 'inventory_2' },
  { path: '/report', label: 'Report', icon: 'add_circle' },
  { path: '/settings/profile', label: 'Settings', icon: 'settings' },
];

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();

  // Sidebar collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  // Avatar dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key and scroll
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
    const handleScroll = () => {
      setDropdownOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [dropdownOpen]);

  const isActive = (path: string) => {
    if (path === '/settings/profile') {
      return location.pathname.startsWith('/settings');
    }
    return location.pathname === path;
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/inventory') return 'Inventory';
    if (path === '/my-items') return 'My Items';
    if (path === '/report') return 'Report';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar – hidden on mobile */}
      <aside
        className={`hidden md:flex flex-col h-full bg-surface-container-lowest border-r border-outline-variant/50 shrink-0 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`p-6 mb-2 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <img alt="FoundPath Logo" className="h-10 w-auto object-contain" src="/FoundPath.png" />
          {!collapsed && (
            <span className="font-headline font-bold text-xl tracking-tight text-primary">FoundPath</span>
          )}
        </div>

        <nav className="flex-1 px-4">
          <ul className="space-y-1.5">
            {navItems.slice(0, 2).map(item => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 gap-3 rounded-xl transition-all duration-200 font-headline font-semibold text-sm ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6">
          <nav className={`px-4 pb-6 border-t border-outline-variant/50 pt-6 ${collapsed ? 'px-0' : ''}`}>
            <ul className="space-y-1.5">
              <li>
                <Link
                  to="/settings/profile"
                  className={`flex items-center px-4 py-3 gap-3 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 font-headline font-semibold text-sm ${
                    collapsed ? 'justify-center' : ''
                  }`}
                >
                  <span className="material-symbols-outlined">settings</span>
                  {!collapsed && <span>Settings</span>}
                </Link>
              </li>
              <li>
                <button
                  onClick={signOut}
                  aria-label="Log Out"
                  className={`w-full flex items-center px-4 py-3 gap-3 hover:text-error hover:bg-error/5 rounded-xl transition-all duration-200 font-headline font-semibold text-sm text-error ${
                    collapsed ? 'justify-center' : ''
                  }`}
                >
                  <span className="material-symbols-outlined">logout</span>
                  {!collapsed && <span>Log Out</span>}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        <header className="h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/10 sticky top-0 z-50 w-full flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant group"
            >
              <svg
                className="lucide lucide-panel-right group-hover:text-primary transition-colors"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect height="18" rx="2" width="18" x="3" y="3" />
                <path d="M15 3v18" />
              </svg>
            </button>
            <div className="hidden md:flex flex-col">
              <span className="font-display text-sm font-extrabold text-primary">{getPageTitle()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 pr-2">
            {/* Temporary notification bell placeholder */}
            <button
              aria-label="Notifications"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant relative"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-error rounded-full ring-1 ring-surface-container-lowest" />
            </button>
            <div className="h-6 w-[1px] bg-outline-variant/30 mx-2 self-center" />

            {/* Avatar with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors group ml-1"
              >
                <img
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high shadow-sm"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBq-pYJZb16ybDcp-MiDfG3MpFohQ2WPKL2Eu46UlDcH1n5EicTaJ0yG1-eSG9E87aUMMspOUgy9_NGwas70Tihj2LYXNVivkOkIQn6jL0dcKwIZLJVadFZUz7NxA4XV-SJ2LcVrtKg4t9898t1JrOIX8IQkYORzh4WtuX3FWMhZUTm0vGkJ567ORnG3q32Srs8o7ibe5Lxjrpjgd2rF9zp6fOxDEBzcFY4oBqRAm1elYZBfW-5Png59aww-aTxwl7hfn43g5NRsZ8"
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-container-lowest/90 backdrop-blur-md shadow-lg border border-outline-variant/20 z-50 overflow-hidden">
                  <div className="py-2">
                    <Link
                      to="/settings/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">account_circle</span>
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/settings/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">settings</span>
                      <span>Settings</span>
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">help</span>
                      <span>Help</span>
                    </Link>
                    <div className="border-t border-outline-variant/20 my-1" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">logout</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/10 md:hidden flex justify-around items-center h-16 px-4">
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={signOut}
          aria-label="Log Out"
          className="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          <span className="text-[11px] font-medium">Logout</span>
        </button>
      </nav>
    </div>
  );
}