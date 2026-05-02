// src/pages/public/Login.tsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/inventory'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate(from, { replace: true })
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL}${from}`,
      },
    })
  }

  return (
    // [UI Designer] ports from code_9.html — hero left panel + form right panel
    <div className="flex min-h-screen">
      {/* Left hero — [UI Designer] */}
      <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="<https://images.unsplash.com/photo-1562774053-701939374585?w=1200>"
            alt="VSU Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[--color-primary]/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[--color-primary-dim]/90 via-transparent to-[--color-primary]/20" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[--color-surface-container-lowest] rounded-xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-[--color-primary] font-bold">account_balance</span>
          </div>
          <span className="text-white font-headline font-extrabold text-2xl tracking-tighter">
            Campus Archive
          </span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-white font-headline font-extrabold text-5xl leading-tight tracking-tight mb-6">
            Restoring peace of mind,<br />one item at a time.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            The official lost and found repository for VSU. Secure, empathetic, and dedicated to reuniting you with what matters.
          </p>
        </div>
        <p className="relative z-10 text-white/60 text-sm">
          Joined by 2,000+ students this semester
        </p>
      </section>

      {/* Right — Login Form */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-[--color-surface]">
        <div className="w-full max-w-md">

          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-[--color-primary] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">account_balance</span>
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tighter">Campus Archive</span>
          </div>

          <header className="mb-10">
            <h2 className="font-headline font-extrabold text-3xl tracking-tight mb-2">Welcome Back</h2>
            <p className="text-[--color-on-surface-variant]">
              Please enter your credentials to continue.
            </p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-[--color-error-container]/20 border border-[--color-error]/20 rounded-xl text-sm text-[--color-error]">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[--color-on-surface-variant]" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[--color-on-surface-variant] text-xl">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@vsu.edu.ph"
                  className="w-full pl-12 pr-4 py-3.5 bg-[--color-surface-container-highest] border-none rounded-xl text-[--color-on-surface] placeholder:text-[--color-on-surface-variant]/50 focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-[--color-on-surface-variant]" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-[--color-primary] text-xs font-bold hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[--color-on-surface-variant] text-xl">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-[--color-surface-container-highest] border-none rounded-xl text-[--color-on-surface] placeholder:text-[--color-on-surface-variant]/50 focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-headline font-bold text-[--color-on-primary] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-10 flex items-center">
            <div className="flex-grow border-t border-[--color-outline-variant]/30" />
            <span className="mx-4 text-[--color-outline] text-xs font-bold uppercase tracking-widest bg-[--color-surface] px-2">
              OR
            </span>
            <div className="flex-grow border-t border-[--color-outline-variant]/30" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[--color-surface-container-lowest] border border-[--color-outline-variant]/20 py-3.5 rounded-xl font-semibold hover:bg-[--color-surface-container-low] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <footer className="mt-12 text-center">
            <p className="text-[--color-on-surface-variant] text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[--color-primary] font-bold hover:underline">
                Sign up
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}