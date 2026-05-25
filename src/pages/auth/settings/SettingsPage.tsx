// src/pages/auth/settings/SettingsPage.tsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import SidebarSettings from '../../../components/layout/SidebarSettings'
import ProfileSettings from './ProfileSettings'
import SecuritySettings from './SecuritySettings'
import NotifSettings from './NotifSettings'

// ─────────────────────────────────────────────────────────────
// Skeleton components matching each settings page layout
// ─────────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="w-full space-y-10 animate-pulse">
    <div className="space-y-2">
      <div className="h-10 bg-surface-container-high rounded w-1/3" />
      <div className="h-5 bg-surface-container-high rounded w-2/3" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <div className="w-32 h-32 mx-auto rounded-full bg-surface-container-high" />
          <div className="h-5 bg-surface-container-high rounded mt-4 w-3/4 mx-auto" />
          <div className="h-4 bg-surface-container-high rounded mt-2 w-1/2 mx-auto" />
          <div className="h-10 bg-surface-container-high rounded-xl mt-6" />
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
          <div className="h-6 bg-surface-container-high rounded w-1/2" />
          <div className="h-10 bg-surface-container-high rounded w-full" />
          <div className="h-4 bg-surface-container-high rounded w-full" />
          <div className="h-4 bg-surface-container-high rounded w-3/4" />
        </div>
      </div>
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-surface-container-lowest p-8 rounded-xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-surface-container-high rounded w-1/3" />
                <div className="h-12 bg-surface-container-high rounded-xl" />
              </div>
            ))}
            <div className="col-span-2 space-y-2">
              <div className="h-4 bg-surface-container-high rounded w-1/4" />
              <div className="h-24 bg-surface-container-high rounded-xl" />
            </div>
          </div>
          <div className="h-12 bg-surface-container-high rounded-xl w-32 ml-auto" />
        </div>
      </div>
    </div>
  </div>
)

const SecuritySkeleton = () => (
  <div className="w-full space-y-10 animate-pulse">
    <div className="space-y-2">
      <div className="h-10 bg-surface-container-high rounded w-1/3" />
      <div className="h-5 bg-surface-container-high rounded w-2/3" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7">
        <div className="bg-surface-container-lowest rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-surface-container-high rounded-full" />
            <div className="h-7 bg-surface-container-high rounded w-40" />
          </div>
          <div className="space-y-4">
            <div className="h-12 bg-surface-container-high rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-surface-container-high rounded-xl" />
              <div className="h-12 bg-surface-container-high rounded-xl" />
            </div>
            <div className="h-10 bg-surface-container-high rounded-xl w-32" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-5">
        <div className="bg-surface-container-highest rounded-xl p-8 space-y-4">
          <div className="h-7 bg-surface-container-high rounded w-40" />
          <div className="h-20 bg-surface-container-high rounded w-full" />
          <div className="h-16 bg-surface-container-lowest rounded-xl" />
        </div>
      </div>
      <div className="lg:col-span-12 space-y-4">
        <div className="h-8 bg-surface-container-high rounded w-48" />
        <div className="h-24 bg-surface-container-lowest rounded-xl" />
        <div className="h-48 bg-surface-container-low rounded-xl" />
      </div>
    </div>
  </div>
)

const NotifSkeleton = () => (
  <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
    <div className="space-y-2">
      <div className="h-10 bg-surface-container-high rounded w-2/3" />
      <div className="h-5 bg-surface-container-high rounded w-full" />
    </div>
    <div className="bg-surface-container-lowest rounded-xl p-6 space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-1 bg-surface-container-high rounded-full" />
            <div className="space-y-2">
              <div className="h-5 bg-surface-container-high rounded w-32" />
              <div className="h-4 bg-surface-container-high rounded w-64" />
            </div>
          </div>
          <div className="w-11 h-6 bg-surface-container-highest rounded-full" />
        </div>
      ))}
    </div>
    <div className="bg-surface-container-low rounded-xl p-8 space-y-4">
      <div className="h-6 bg-surface-container-high rounded w-40" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-container-highest rounded-xl" />
        ))}
      </div>
    </div>
    <div className="flex justify-end">
      <div className="h-12 bg-surface-container-high rounded-xl w-36" />
    </div>
  </div>
)

export default function SettingsPage() {
  const { profileLoading } = useAuth()
  const profileRef = useRef<HTMLDivElement>(null)
  const securityRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications'>(
    'profile'
  )

  const scrollToSection = (section: 'profile' | 'security' | 'notifications') => {
    const refs = { profile: profileRef, security: securityRef, notifications: notifRef }
    refs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(section)
  }

  // Intersection Observer for scroll‑spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section')
            if (id === 'profile') setActiveSection('profile')
            else if (id === 'security') setActiveSection('security')
            else if (id === 'notifications') setActiveSection('notifications')
          }
        })
      },
      { rootMargin: '-100px 0px -50% 0px', threshold: 0.3 }
    )

    const sections = [
      { ref: profileRef, id: 'profile' },
      { ref: securityRef, id: 'security' },
      { ref: notifRef, id: 'notifications' },
    ]

    sections.forEach(({ ref, id }) => {
      if (ref.current) {
        ref.current.setAttribute('data-section', id)
        observer.observe(ref.current)
      }
    })

    return () => observer.disconnect()
  }, [])

  const customSidebar = (
    <div className="py-8 px-4">
      {/* Back button */}
      <div className="mb-6 px-4">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Dashboard
        </Link>
      </div>
      <div className="px-4 mb-8">
        <h2 className="text-lg font-bold font-headline text-[--color-on-surface]">
          Account Settings
        </h2>
        <p className="text-xs text-[--color-on-surface-variant] font-medium">
          Manage your recovery profile
        </p>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => scrollToSection('profile')}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
            activeSection === 'profile'
              ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => scrollToSection('security')}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
            activeSection === 'security'
              ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Security
        </button>
        <button
          onClick={() => scrollToSection('notifications')}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
            activeSection === 'notifications'
              ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          Notifications
        </button>
      </div>
    </div>
  )

  return (
    <SidebarSettings customSidebar={customSidebar}>
      <div className="space-y-16 pb-20">
        {profileLoading ? (
          <>
            <div>
              <ProfileSkeleton />
            </div>
            <div className="pt-8 border-t border-outline-variant/20">
              <SecuritySkeleton />
            </div>
            <div className="pt-8 border-t border-outline-variant/20">
              <NotifSkeleton />
            </div>
          </>
        ) : (
          <>
            <div ref={profileRef}>
              <ProfileSettings standalone />
            </div>
            <div ref={securityRef} className="pt-8 border-t border-outline-variant/20">
              <SecuritySettings standalone />
            </div>
            <div ref={notifRef} className="pt-8 border-t border-outline-variant/20">
              <NotifSettings standalone />
            </div>
          </>
        )}
      </div>
    </SidebarSettings>
  )
}
