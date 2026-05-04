// src/pages/auth/settings/SecuritySettings.tsx
import { useState } from 'react'
import SidebarSettings from '../../../components/layout/SidebarSettings'
import { profilesApi } from '../../../api/profilesApi'

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await profilesApi.updatePassword(newPassword)
      if (error) throw new Error(error.message)
      setMessage({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarSettings>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-[--color-on-surface]">
            Security Settings
          </h1>
          <p className="text-[--color-on-surface-variant] max-w-xl leading-relaxed">
            Manage your password and account security.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm ${
            message.type === 'success' 
              ? 'bg-[--color-primary-container]/10 border border-[--color-primary]/20 text-[--color-primary]'
              : 'bg-[--color-error-container]/20 border border-[--color-error]/20 text-[--color-error]'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-[--color-surface-container-lowest] p-8 rounded-xl shadow-sm">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[--color-on-surface-variant]">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-[--color-surface-container-highest] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[--color-primary-container]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[--color-on-surface-variant]">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[--color-surface-container-highest] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[--color-primary-container]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl font-bold text-[--color-on-primary] shadow-lg hover:scale-105 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </SidebarSettings>
  )
}