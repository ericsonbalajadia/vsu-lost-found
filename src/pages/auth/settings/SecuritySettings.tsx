// src/pages/auth/settings/SecuritySettings.tsx
import { useState } from 'react';
import SidebarSettings from '../../../components/layout/SidebarSettings';
import { profilesApi } from '../../../api/profilesApi';

interface SecuritySettingsProps {
  standalone?: boolean
}


export default function SecuritySettings({ standalone = false }: SecuritySettingsProps)  {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true); // UI only

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // Note: Supabase does not require current password for authenticated users
      const { error } = await profilesApi.updatePassword(newPassword);
      if (error) throw new Error(error.message);
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  const content = (
      <div id="main-content" className="w-full space-y-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline text-on-surface">
            Security Settings
          </h1>
          <p className="text-on-surface-variant max-w-xl leading-relaxed">
            Ensure your account and lost items are protected with advanced security measures.
          </p>
        </div>

        {/* Two settings cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Password Update Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h3 className="text-xl font-bold font-headline">Update Password</h3>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Current Password field – optional, but kept for UX */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                  />
                </div>
              </div>
              {message && (
                <div className={`p-3 rounded-xl text-sm ${
                  message.type === 'success'
                    ? 'bg-primary-container/10 border border-primary/20 text-primary'
                    : 'bg-error-container/20 border border-error/20 text-error'
                }`}>
                  {message.text}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary to-primary-dim text-white font-bold rounded-xl shadow-lg shadow-primary/10 hover:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {loading ? 'Updating…' : 'Save New Password'}
              </button>
            </form>
          </div>

          {/* 2FA Toggle Card – UI only */}
          <div className="lg:col-span-5 bg-surface-container-highest rounded-xl p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-headline">Two-Factor Auth</h3>
                <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Add an extra layer of security by requiring a code from your mobile device when you sign in.
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim">smartphone</span>
                <span className="font-semibold text-sm">Authenticator App</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle two-factor authentication">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Login Activity (mock data) */}
          <div className="lg:col-span-12 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-extrabold font-headline tracking-tight">Login Activity</h3>
              <button className="text-primary font-bold text-sm hover:underline">
                Sign out of all sessions
              </button>
            </div>
            <div className="space-y-1">
              {/* Activity items – static for now */}
              <div className="flex items-center justify-between p-6 bg-surface-container-lowest rounded-xl hover:bg-white transition-colors group">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-fixed-dim">
                    <span className="material-symbols-outlined text-3xl">desktop_windows</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-on-surface">Chrome on Windows 11</h4>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider">
                        Current
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">San Francisco, CA • 192.168.1.45</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-8">
                  <span className="text-sm font-medium text-on-surface-variant">Active now</span>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-error transition-colors cursor-pointer">
                    logout
                  </span>
                </div>
              </div>
              {/* Additional items can be added similarly */}
            </div>
          </div>

          {/* Security Tips Banner */}
          <div className="lg:col-span-12">
            <div className="relative overflow-hidden rounded-3xl bg-primary-container p-10 flex flex-col md:flex-row items-center gap-10">
              <div className="z-10 flex-1 space-y-4 text-on-primary-container">
                <h2 className="text-3xl font-extrabold font-headline">Stay safe on Campus</h2>
                <p className="text-lg opacity-80 leading-relaxed max-w-xl">
                  Our archive is built on trust. Use unique passwords for campus services and never share your 2FA codes with anyone.
                </p>
                <button className="bg-surface-container-lowest text-primary px-6 py-3 rounded-xl font-bold hover:bg-on-primary hover:text-primary-dim transition-all">
                  Security Guide
                </button>
              </div>
              <div className="relative w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden shadow-2xl rotate-3">
                <img
                  className="w-full h-full object-cover"
                  alt="Digital security art"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm4lXcird-9D854k7k2qqFUcbjrFItlrs3tnlxstxND4iF8E9TvbQnWuCvu35ubHYgE3NxtLU3wrRymdDiKsfk1yXbKGy4VgHTB1YOhWshpxzQo-g32nWR-ZzM4KwPbmioYJGg2y0cbYZjjfJ9a6iArKxnhZhMwmB-i06fRHF1hrLfaTiCLEL613IjI7NC92hr60GGzic0IXfUodF34rvTz0PFgVbLLcn3ZF2aZogQxT7xuaJNxEVwOAiLfKs_YVLWQ52SjOgvEGA"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  )

  if (standalone) return content
  return <SidebarSettings>{content}</SidebarSettings>


}