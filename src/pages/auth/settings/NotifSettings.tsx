// src/pages/auth/settings/NotifSettings.tsx
import { useState, useEffect } from 'react';
import SidebarSettings from '../../../components/layout/SidebarSettings';
import { useAuth } from '../../../contexts/AuthContext';
import { profilesApi } from '../../../api/profilesApi';
import type { UpdateNotifPrefsPayload } from '../../../types/api';


export default function NotifSettings() {
  const { user, profile } = useAuth();
  const [matchNotif, setMatchNotif] = useState(true);
  const [claimNotif, setClaimNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(false);
  const [frequency, setFrequency] = useState<'realtime' | 'daily' | 'weekly'>('realtime');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load current preferences from profile
  useEffect(() => {
    if (profile) {
      setMatchNotif(profile.notif_matches);
      setClaimNotif(profile.notif_claims ?? true);
      setMessageNotif(profile.notif_messages ?? false);
      setFrequency(profile.notif_frequency as 'realtime' | 'daily' | 'weekly');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload: UpdateNotifPrefsPayload = {
      notif_matches: matchNotif,
      notif_claims: claimNotif,
      notif_messages: messageNotif,
      notif_frequency: frequency,
    };
    await profilesApi.updateNotifPrefs(user.id, payload);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <SidebarSettings>
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">
            Notification Preferences
          </h1>
          <p className="text-on-surface-variant text-lg">
            Choose how you want to be alerted about your lost items and community updates.
          </p>
        </header>

        {/* Main card */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-8">
          <div className="space-y-6">
            {/* Match Alerts */}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-1 bg-primary rounded-full self-stretch" />
                <div>
                  <h4 className="font-semibold text-on-surface">New Match Alerts</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Receive notifications immediately when a new item matching your report is found.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle match notifications">
                <input
                  type="checkbox"
                  checked={matchNotif}
                  onChange={(e) => setMatchNotif(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-surface-container-highest peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Claim Updates */}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-1 bg-outline-variant/30 rounded-full self-stretch" />
                <div>
                  <h4 className="font-semibold text-on-surface">Claim Updates</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Updates regarding your ongoing claims, verification requests, and administrative news.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle claim notifications">
                <input
                  type="checkbox"
                  checked={claimNotif}
                  onChange={(e) => setClaimNotif(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-surface-container-highest peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Direct Message Alerts */}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-1 bg-outline-variant/30 rounded-full self-stretch" />
                <div>
                  <h4 className="font-semibold text-on-surface">Direct Message Alerts</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Get notified when another user or a campus staff member sends you a message.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  placeholder='xxxxx'
                  checked={messageNotif}
                  onChange={(e) => setMessageNotif(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-surface-container-highest peer-focus:ring-2 peer-focus:ring-primary-container rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
          <div className="mb-6">
            <h3 className="font-headline font-bold text-on-surface">Digest Frequency</h3>
            <p className="text-sm text-on-surface-variant">How often should we send you summary reports?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['realtime', 'daily', 'weekly'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFrequency(option)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                  frequency === option
                    ? 'bg-surface-container-lowest border-2 border-primary'
                    : 'bg-surface-container-highest/30 hover:bg-surface-container-highest'
                }`}
              >
                <span className={`font-bold ${frequency === option ? 'text-primary' : 'text-on-surface'}`}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">
                  {option === 'realtime' ? 'Recommended' : option === 'daily' ? 'Summary' : 'Archive'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-primary to-primary-dim text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Update Preferences'}
          </button>
        </div>
      </div>
    </SidebarSettings>
  );
}