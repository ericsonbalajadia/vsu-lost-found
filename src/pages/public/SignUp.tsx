// src/pages/public/SignUp.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SignUp() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    setError(error.message);
  } else {
    // Manually create profile row using RPC
    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        user_email: email,
        user_name: fullName,
      });
      if (profileError) console.error('Profile creation failed:', profileError);
    }
    navigate('/inventory');
  }
  setLoading(false);


    // 1. Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Manually create the profile row (bypass trigger)
    const userId = authData.user?.id
    if (userId) {
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        user_email: email,
        user_name: fullName,
      })
      if (profileError) {
        console.error('Profile creation failed:', profileError)
        // Optionally set an error, but sign-up succeeded
      }
    }

    // 3. Redirect to inventory (or login page if email confirmation required)
    navigate('/inventory')
    setLoading(false)
  }

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL}/inventory`,
      },
    })
  }

  return (
    // JSX translated from code.html by [UI Designer]
    // All Tailwind classes from the original HTML are preserved exactly
    <main className="flex w-full min-h-screen overflow-hidden">

      {/* Left Hero Panel — [UI Designer] ports from code.html */}
      <section className="hidden lg:flex flex-1 relative bg-primary-dim overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
            src="<https://images.unsplash.com/photo-1562774053-701939374585?w=1200>"
            alt="VSU Campus"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-dim via-primary/40 to-transparent" />
        </div>
        <div className="relative z-10 p-16 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-4xl">account_balance</span>
            <span className="text-white font-headline font-extrabold text-2xl tracking-tighter">
              Campus Archive
            </span>
          </div>
          <div className="max-w-md">
            <h1 className="text-white font-headline text-5xl font-bold leading-tight tracking-tight mb-6">
              The Empathetic Archive
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Recovering lost belongings through community trust and professional campus oversight.
            </p>
          </div>
          <p className="text-white/60 text-sm font-medium">
            © {new Date().getFullYear()} Campus Recovery. Visayas State University.
          </p>
        </div>
      </section>

      {/* Right — Registration Form */}
      <section className="flex-1 bg-[--color-surface] flex flex-col justify-center items-center p-8 md:p-16 relative">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <span className="material-symbols-outlined text-[--color-primary] text-3xl">account_balance</span>
            <span className="font-headline font-extrabold text-xl tracking-tighter">Campus Archive</span>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight mb-3">
              Create Your Account
            </h2>
            <p className="text-[--color-on-surface-variant]">
              Join the university's official recovery network.
            </p>
          </header>

          {/* Error display */}
          {error && (
            <div className="mb-6 p-4 bg-[--color-error-container]/20 border border-[--color-error]/20 rounded-xl text-sm text-[--color-error]">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailSignUp}>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[--color-on-surface-variant]" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[--color-on-surface-variant] text-sm">
                  person
                </span>
                <input
                  id="name"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  className="w-full pl-12 pr-4 py-3.5 bg-[--color-surface-container-highest] border-none rounded-xl text-[--color-on-surface] placeholder:text-[--color-outline] focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[--color-on-surface-variant]" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[--color-on-surface-variant] text-sm">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="j.delacruz@vsu.edu.ph"
                  className="w-full pl-12 pr-4 py-3.5 bg-[--color-surface-container-highest] border-none rounded-xl text-[--color-on-surface] placeholder:text-[--color-outline] focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[--color-on-surface-variant]" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[--color-on-surface-variant] text-sm">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full pl-12 pr-4 py-3.5 bg-[--color-surface-container-highest] border-none rounded-xl text-[--color-on-surface] placeholder:text-[--color-outline] focus:ring-2 focus:ring-[--color-primary-container] focus:bg-[--color-surface-container-lowest] transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-headline font-bold text-[--color-on-primary] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
              {!loading && (
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[--color-surface-container-high]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest text-[--color-outline] bg-[--color-surface] px-4">
              or
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            className="w-full py-3.5 px-6 bg-[--color-surface-container-lowest] border border-[--color-surface-container-high] text-[--color-on-surface-variant] font-semibold rounded-xl hover:bg-[--color-surface-container] transition-colors flex items-center justify-center gap-3"
          >
            {/* Google SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <footer className="mt-12 text-center">
            <p className="text-[--color-on-surface-variant] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[--color-primary] font-bold hover:underline">
                Log in
              </Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  )
}