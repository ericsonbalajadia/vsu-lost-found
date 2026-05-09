// src/pages/auth/settings/ProfileSettings.tsx
import { useState, useEffect } from 'react';
import SidebarSettings from '../../../components/layout/SidebarSettings';
import { useAuth } from '../../../contexts/AuthContext';
import { profilesApi } from '../../../api/profilesApi';
import type { UpdateProfilePayload } from '../../../types/api';


export default function ProfileSettings() {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('General Campus');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? '');
      setBuilding(profile.campus_building);
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateProfilePayload = {
        full_name: fullName,
        phone: phone || undefined,
        campus_building: building,
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

  // If profile is missing, show error (should not happen after proper sign-up)
  if (!profile) {
    return (
      <SidebarSettings>
        <div className="p-8 text-center">
          <p className="text-error">Profile not found. Please contact support.</p>
        </div>
      </SidebarSettings>
    );
  }

  return (
    <SidebarSettings>
      <div className="w-full space-y-10">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-on-surface">
            Personal Profile
          </h1>
          <p className="text-on-surface-variant max-w-xl leading-relaxed">
            This information helps identify and return your items. Keep your contact details up-to-date.
          </p>
        </div>

        {/* Bento Grid: Left Column (Avatar & Reputation) + Right Column (Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column – Avatar & Reputation */}
          <div className="lg:col-span-4 space-y-6">
            {/* Avatar Card */}
            <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-surface-variant ring-4 ring-surface-container">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-container text-primary text-4xl">
                    {profile.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-on-surface font-headline">{profile.full_name}</h3>
              <p className="text-sm text-on-surface-variant font-medium mb-6">
                {profile.email}
              </p>
              <button className="w-full py-3 px-6 bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-surface-container-high transition-colors text-sm">
                Change Avatar
              </button>
            </div>

            {/* Reputation Card – Added because original HTML lacked it */}
            <div className="bg-primary bg-gradient-to-br from-primary to-primary-dim p-6 rounded-xl text-on-primary shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-4xl">star</span>
                <span className="text-4xl font-extrabold font-headline">{profile.reputation}</span>
              </div>
              <h4 className="text-lg font-bold font-headline mb-2">Trust Score</h4>
              <p className="text-sm opacity-90 leading-snug">
                Your reputation grows when you successfully return items (+10) and decreases if you submit false claims (-10). 
                Higher trust helps owners prioritise genuine claimants.
              </p>
              <div className="mt-4 text-xs opacity-70 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                Minimum 0 – Maximum 200
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

            {/* Campus Map Aesthetic (optional – kept from original) */}
            <div className="bg-surface-container p-6 rounded-xl overflow-hidden flex items-center gap-6">
              <div className="w-24 h-24 rounded-lg bg-surface-variant overflow-hidden flex-shrink-0">
                <img
                  alt="Campus map snippet"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQU8SpCWDSRp7I4QtHGf-7NwnD26nGAS24WTBdtra1LKkeVrHmo1RcSnsiZLslcl6ZNpmyzzxmvQq46bQoHBrSEm7LGvWMnyijQoHd7Z9Zbiy6FRnSOHa4yg7Diaq94PJLp81ItaghWOBPZAa2PuDXrkypIPixurhB1uY3jiycMtf0uegVWa1jaxz1wtRumeM-NW9YVlpt8gEaAFXItMy2klysQfJXlCFSyB8OYwzBS0QykZvm_BZ3JZPhHJtzdsMzMiIIKbSgT6s"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Campus Hub</p>
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
  );
}