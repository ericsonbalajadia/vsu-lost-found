// src/pages/auth/settings/NotifSettings.tsx
import { useState, useEffect } from 'react'
import SidebarSettings from '../../../components/layout/SidebarSettings'
import { useAuth } from '../../../hooks/useAuth'
import { profilesApi } from '../../../api/profilesApi'
import type { UpdateNotifPrefsPayload } from '../../../types/api'

export default function NotifSettings() {
  const { user, profile } = useAuth()
  const [matchNotif, setMatchNotif] = useState(true)
  const [claimNotif, setClaimNotif] = useState(true)
  const [messageNotif, setMessageNotif] = useState(false)
  const [frequency, setFrequency] = useState<'realtime' | 'daily' | 'weekly'>('realtime')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setMatchNotif(profile.notif_matches)
      setClaimNotif(profile.notif_claims)
      setMessageNotif(profile.notif_messages)
      setFrequency(profile.notif_frequency as 'realtime' | 'daily' | 'weekly')
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const payload: UpdateNotifPrefsPayload = {
      notif_matches: matchNotif,
      notif_claims: claimNotif,
      notif_messages: messageNotif,
      notif_frequency: frequency,
    }
    await profilesApi.updateNotifPrefs(user.id, payload)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <SidebarSettings>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-[--color-on-surface]">
            Notifications
          </h1>
          <p className="text-[--color-on-surface-variant] max-w-xl leading-relaxed">
            Choose how you want to be notified about matches, claims, and messages.
          </p>
        </div>

        <div className="bg-[--color-surface-container-lowest] p-8 rounded-xl shadow-sm space-y-8">
          {/* Checkboxes */}
          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={matchNotif}
                onChange={e => setMatchNotif(e.target.checked)}
                className="w-5 h-5 rounded accent-[--color-primary]"
              />
              <span className="font-medium">Smart match alerts – when an item matches your report</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={claimNotif}
                onChange={e => setClaimNotif(e.target.checked)}
                className="w-5 h-5 rounded accent-[--color-primary]"
              />
              <span className="font-medium">Claim updates – when someone claims your found item</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer">
              <input
                type="checkbox"
                checked={messageNotif}
                onChange={e => setMessageNotif(e.target.checked)}
                className="w-5 h-5 rounded accent-[--color-primary]"
              />
              <span className="font-medium">Messages from other users (via email thread – not implemented)</span>
            </label>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[--color-on-surface-variant]">
              Notification frequency
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as any)}
              className="bg-[--color-surface-container-highest] border-none rounded-xl px-4 py-3 w-full max-w-xs"
            >
              <option value="realtime">Real-time (push)</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl font-bold text-[--color-on-primary] shadow-lg hover:scale-105 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </SidebarSettings>
  )
}