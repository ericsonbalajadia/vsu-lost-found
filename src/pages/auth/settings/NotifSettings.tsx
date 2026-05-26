// src/pages/auth/settings/NotifSettings.tsx
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import SidebarSettings from '../../../components/layout/SidebarSettings'
import { useAuth } from '../../../contexts/AuthContext'
import { profilesApi } from '../../../api/profilesApi'
import type { UpdateNotifPrefsPayload } from '../../../types/api'

interface NotifSettingsProps {
  standalone?: boolean
}

export default function NotifSettings({ standalone = false }: NotifSettingsProps)  {
  const { user, profile } = useAuth()
  const [matchNotif, setMatchNotif] = useState(true)
  const [claimNotif, setClaimNotif] = useState(true)
  const [messageNotif, setMessageNotif] = useState(false)
  const [frequency, setFrequency] = useState<'realtime' | 'daily' | 'weekly'>('realtime')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setMatchNotif(profile.notif_matches);
      setClaimNotif(profile.notif_claims ?? true);
      setMessageNotif(profile.notif_messages ?? false);
      setFrequency(profile.notif_frequency as 'realtime' | 'daily' | 'weekly');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setSaved(false)

    const payload: UpdateNotifPrefsPayload = {
      notif_matches: matchNotif,
      notif_claims: claimNotif,
      notif_messages: messageNotif,
      notif_frequency: frequency,
    }

    try {
      const result = await profilesApi.updateNotifPrefs(user.id, payload)
      const error = result && typeof result === 'object' && 'error' in result ? result.error : null

      if (error) {
        throw error
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save notification preferences.'
      window.alert(message)
    } finally {
      setSaving(false)
    }
  }

  const content = (
      <div id="main-content" className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight mb-2">
            Notification Preferences
          </h1>
          <p className="text-on-surface-variant text-lg">
            Choose how you want to be alerted about your lost items and community updates.
          </p>
        </header>

        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-8">
          <div className="space-y-6">
            {/* Match Alerts Toggle */}
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
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={matchNotif}
                  onChange={(e) => setMatchNotif(e.target.checked)}
                  aria-label="Toggle new match alerts"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary-container"></div>
              </label>
            </div>

            {/* Claim Updates Toggle */}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-1 bg-outline-variant/30 rounded-full self-stretch" />
                <div>
                  <h4 className="font-semibold text-on-surface">Claim Updates</h4>
                  <p className="text-sm text-on-surface-variant max-w-sm">
                    Updates regarding your ongoing claims, verification requests, and administrative
                    news.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={claimNotif}
                  onChange={(e) => setClaimNotif(e.target.checked)}
                  aria-label="Toggle claim update" // ← fixes the warning
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary-container"></div>
              </label>
            </div>

            {/* Direct Message Alerts Toggle */}
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
                  className="sr-only peer"
                  checked={messageNotif}
                  onChange={(e) => setMessageNotif(e.target.checked)}
                  aria-label="Toggle direct message alerts"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-primary-container"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Frequency Settings – unchanged */}
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
          <div className="mb-6">
            <h3 className="font-headline font-bold text-on-surface">Digest Frequency</h3>
            <p className="text-sm text-on-surface-variant">
              How often should we send you summary reports?
            </p>
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
                <span
                  className={`font-bold ${frequency === option ? 'text-primary' : 'text-on-surface'}`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">
                  {option === 'realtime'
                    ? 'Recommended'
                    : option === 'daily'
                      ? 'Summary'
                      : 'Archive'}
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
  )

  if (standalone) return content
  return <SidebarSettings>{content}</SidebarSettings>

}
