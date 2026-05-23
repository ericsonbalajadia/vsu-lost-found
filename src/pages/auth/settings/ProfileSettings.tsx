// src/pages/auth/settings/ProfileSettings.tsx
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import SidebarSettings from '../../../components/layout/SidebarSettings'
import { useAuth } from '../../../contexts/AuthContext'
import { profilesApi } from '../../../api/profilesApi'
import type { UpdateProfilePayload } from '../../../types/api'
import ReputationBadge from '../../../components/ui/ReputationBadge'

// Skeleton component defined at top level (no render-time creation)
const ProfileSkeleton = () => (
  <div role="status" aria-live="polite" className="animate-pulse space-y-8">
    <div className="h-8 bg-surface-container-high rounded w-1/3" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-surface-container-lowest p-8 rounded-xl">
          <div className="w-32 h-32 mx-auto rounded-full bg-surface-container-high" />
          <div className="h-4 bg-surface-container-high rounded mt-4 w-3/4 mx-auto" />
          <div className="h-3 bg-surface-container-high rounded mt-2 w-1/2 mx-auto" />
          <div className="h-10 bg-surface-container-high rounded-xl mt-6" />
        </div>
        <div className="h-40 bg-surface-container-high rounded-xl" />
      </div>
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-surface-container-lowest p-8 rounded-xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-surface-container-high rounded w-1/3" />
                <div className="h-12 bg-surface-container-high rounded-xl" />
              </div>
            ))}
            <div className="col-span-2 space-y-2">
              <div className="h-3 bg-surface-container-high rounded w-1/4" />
              <div className="h-24 bg-surface-container-high rounded-xl" />
            </div>
          </div>
          <div className="h-12 bg-surface-container-high rounded-xl w-32 ml-auto" />
        </div>
      </div>
    </div>
  </div>
)

export default function ProfileSettings() {
  const { user, profile } = useAuth() // refreshProfile not needed if no retry button
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [building, setBuilding] = useState('General Campus')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setBuilding(profile.campus_building ?? 'General Campus')
      setBio(profile.bio ?? '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!user || !profile) return
    setSaving(true)
    setError(null)
    try {
      const payload: UpdateProfilePayload = {
        full_name: fullName,
        phone: phone || undefined,
        campus_building: building,
        bio: bio || undefined,
      }
      await profilesApi.updateProfile(user.id, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Show skeleton while profile is being fetched (or if missing)
  if (!profile) {
    return (
      <SidebarSettings>
        <ProfileSkeleton />
      </SidebarSettings>
    )
  }

  return (
    <SidebarSettings>
      <div id="main-content" className="w-full space-y-10">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-on-surface">
            Personal Profile
          </h1>
          <p className="text-on-surface-variant max-w-xl leading-relaxed">
            This information helps identify and return your items. Keep your contact details
            up-to-date.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column – Avatar & Reputation */}
          <div className="lg:col-span-4 space-y-6">
            {/* Avatar Card */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-surface-variant ring-4 ring-surface-container">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-container text-primary text-4xl">
                    {profile.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-on-surface font-headline">
                {profile.full_name}
              </h3>
              <p className="text-sm text-on-surface-variant font-medium mb-6">{profile.email}</p>
              <button className="w-full py-3 px-6 bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-surface-container-high transition-colors text-sm">
                Change Avatar
              </button>
            </div>

            {/* Reputation Card */}
            <div className="bg-[--color-surface-container-lowest] p-6 rounded-xl shadow-sm border border-[--color-outline-variant]/10 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[--color-on-surface] font-headline">
                  Trust Score
                </h4>
                <ReputationBadge score={profile.reputation} size="md" showLabel />
              </div>
              <div className="space-y-1.5">
                <div className="w-full h-2 rounded-full overflow-hidden bg-[--color-surface-container-highest]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min((profile.reputation / 200) * 100, 100)}%`,
                      background:
                        profile.reputation >= 150
                          ? 'linear-gradient(90deg, var(--color-success), color-mix(in srgb, var(--color-success) 70%, var(--color-primary)))'
                          : profile.reputation >= 100
                            ? 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary))'
                            : profile.reputation >= 50
                              ? 'linear-gradient(90deg, var(--color-warning), color-mix(in srgb, var(--color-warning) 80%, var(--color-error)))'
                              : 'linear-gradient(90deg, var(--color-error), color-mix(in srgb, var(--color-error) 70%, var(--color-warning)))',
                    }}
                    role="progressbar"
                    aria-valuenow={profile.reputation}
                    aria-valuemin={0}
                    aria-valuemax={200}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[--color-outline]">
                  <span>0</span>
                  <span className="font-medium">{profile.reputation} / 200</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-[--color-on-surface-variant] pt-1 border-t border-[--color-outline-variant]/10">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ color: 'var(--color-success)', fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    add_circle
                  </span>
                  +10 when you complete a physical handoff
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ color: 'var(--color-error)', fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    remove_circle
                  </span>
                  -10 if a Samaritan rejects your claim as false
                </div>
              </div>
            </div>
          </div>

          {/* Right Column – Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-xl shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Juan dela Cruz"
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-5 text-on-surface font-medium focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    University Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      placeholder="j.doe@university.edu"
                      className="w-full bg-surface-container-high/50 border-none rounded-xl py-4 px-5 text-on-surface-variant cursor-not-allowed"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant/60">
                      lock
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-5 text-on-surface font-medium focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                  />
                </div>

                {/* Campus Building (free text) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Primary Campus Building
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g. Main Library, Science Building"
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-5 text-on-surface font-medium focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                  />
                </div>

                {/* Bio */}
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Short Recovery Bio (Optional)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="e.g. Usually found in the north-end labs"
                    className="w-full bg-surface-container-highest border-none rounded-xl py-4 px-5 text-on-surface font-medium focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary to-primary-dim text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Campus Map Aesthetic */}
            <div className="bg-surface-container p-6 rounded-xl overflow-hidden flex items-center gap-6">
              <div className="w-24 h-24 rounded-lg bg-surface-variant overflow-hidden flex-shrink-0">
                <img
                  alt="Campus map snippet"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQU8SpCWDSRp7I4QtHGf-7NwnD26nGAS24WTBdtra1LKkeVrHmo1RcSnsiZLslcl6ZNpmyzzxmvQq46bQoHBrSEm7LGvWMnyijQoHd7Z9Zbiy6FRnSOHa4yg7Diaq94PJLp81ItaghWOBPZAa2PuDXrkypIPixurhB1uY3jiycMtf0uegVWa1jaxz1wtRumeM-NW9YVlpt8gEaAFXItMy2klysQfJXlCFSyB8OYwzBS0QykZvm_BZ3JZPhHJtzdsMzMiIIKbSgT6s"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                  Campus Hub
                </p>
                <h4 className="text-lg font-bold text-on-surface font-headline leading-tight">
                  {building || 'Science & Engineering Center'}
                </h4>
                <p className="text-sm text-on-surface-variant">
                  Default location for found item notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarSettings>
  )
}
