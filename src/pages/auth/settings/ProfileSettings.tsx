// src/pages/auth/settings/ProfileSettings.tsx
import { useState, useEffect } from 'react'
import SidebarSettings from '../../../components/layout/SidebarSettings'
import { useAuth } from '../../../hooks/useAuth'
import { profilesApi } from '../../../api/profilesApi'
import type { UpdateProfilePayload } from '../../../types/api'


export default function ProfileSettings() {
  const { user, profile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [building, setBuilding] = useState('General Campus')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name)
      setPhone(profile.phone ?? '')
      setBuilding(profile.campus_building)
      setBio(profile.bio ?? '')
    }
  }, [profile])

  if (!profile) {
  return (
    <SidebarSettings>
      <div className="p-8 text-center">
        <p className="text-[--color-error]">
          Your user profile is missing. Please contact support or log out and log in again.
        </p>
      </div>
    </SidebarSettings>
  );
}

const handleSave = async () => {
  if (!user) return;
  setSaving(true);
  setError(null);
  try {
    const payload: UpdateProfilePayload = {
      full_name: fullName,
      campus_building: building,   // directly use the text value
      phone: phone || undefined,
      bio: bio || undefined,
    };
    await profilesApi.updateProfile(user.id, payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  } catch (err) {
    setError('Failed to update profile. Please try again.');
  } finally {
    setSaving(false);
  }
};

  return (
    <SidebarSettings>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-[--color-on-surface]">
            Personal Profile
          </h1>
          <p className="text-[--color-on-surface-variant] max-w-xl leading-relaxed">
            This information helps identify and return your items. Keep your contact details up-to-date.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-[--color-on-surface-variant]">
            <span className="material-symbols-outlined text-sm">star</span>
            Reputation: <strong className="text-[--color-primary]">{profile?.reputation ?? 100}</strong>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[--color-error-container]/20 border border-[--color-error]/20 rounded-xl text-sm text-[--color-error]">
            {error}
          </div>
        )}

        <div className="bg-[--color-surface-container-lowest] p-8 rounded-xl shadow-sm space-y-8">
          {/* Same form fields as original – no changes needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[--color-surface-container-highest] border-none rounded-xl py-4 px-5 text-[--color-on-surface] font-medium focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
              />
            </div>
            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full bg-[--color-surface-container-high]/50 border-none rounded-xl py-4 px-5 text-[--color-on-surface-variant] cursor-not-allowed"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[--color-outline-variant]/60">
                  lock
                </span>
              </div>
            </div>
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                className="w-full bg-[--color-surface-container-highest] border-none rounded-xl py-4 px-5 text-[--color-on-surface] font-medium focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
              />
            </div>
            {/* Campus Building */}
<div className="space-y-2">
  <label className="text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
    Primary Campus Building
  </label>
  <input
    type="text"
    value={building}
    onChange={e => setBuilding(e.target.value)}
    placeholder="e.g. Main Library, Science Building, etc."
    className="w-full bg-[--color-surface-container-highest] border-none rounded-xl py-4 px-5 text-[--color-on-surface] font-medium focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
  />
</div>
            {/* Bio */}
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[--color-on-surface-variant]">
                Short Recovery Bio (Optional)
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="e.g. Usually found in the north-end labs"
                className="w-full bg-[--color-surface-container-highest] border-none rounded-xl py-4 px-5 text-[--color-on-surface] font-medium focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all resize-none"
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-10 py-4 font-bold rounded-xl text-[--color-on-primary] shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' }}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </SidebarSettings>
  )
}