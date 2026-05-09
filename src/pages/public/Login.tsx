// src/pages/public/Login.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext'; 

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/inventory';
  const { user } = useAuth();   // ✅ listen to auth state

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // ✅ Redirect when user becomes authenticated (after context updates)
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
    }
    setLoading(false);
    // No manual navigation – the useEffect will handle it
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL}${from}`,
      },
    });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex overflow-x-hidden">
      {/* Hero Side (Left) */}
      <section className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Academic Architecture"
            className="w-full h-full object-cover"
            src="/VSU_GATE_THUMB.jpg"
          />
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dim/90 via-transparent to-primary/20"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-lowest rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-primary font-bold">account_balance</span>
            </div>
            <span className="text-white font-headline font-extrabold text-2xl tracking-tighter">Campus Archive</span>
          </div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-white font-headline font-extrabold text-5xl leading-tight tracking-tight mb-6">
            Restoring peace of mind, one item at a time.
          </h1>
          <p className="text-white/80 font-body text-lg leading-relaxed">
            Welcome to the official lost and found repository. We specialize in professional recovery services to reconnect students with their valued belongings.
          </p>
        </div>
        <div className="relative z-10 flex gap-8">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-slate-300"></div>
            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-slate-400"></div>
            <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-slate-500"></div>
          </div>
          <p className="text-white/60 text-sm font-medium self-center">Joined by 2,000+ students this semester</p>
        </div>
      </section>

      {/* Login Form Side (Right) */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile Header Only */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">account_balance</span>
            </div>
            <span className="text-on-surface font-headline font-extrabold text-xl tracking-tighter">Campus Archive</span>
          </div>

          <header className="mb-10">
            <h2 className="text-on-surface font-headline font-extrabold text-3xl tracking-tight mb-2">Welcome Back</h2>
            <p className="text-on-surface-variant font-body">Please enter your university credentials to continue.</p>
          </header>

          <form className="space-y-6" onSubmit={handleEmailLogin}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-on-surface-variant font-label text-sm font-semibold tracking-wide" htmlFor="email">
                University Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">mail</span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-on-surface-variant font-label text-sm font-semibold tracking-wide" htmlFor="password">
                  Password
                </label>
                <a className="text-primary font-label text-xs font-bold hover:underline transition-all" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">lock</span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
              <label className="ml-3 text-on-surface-variant font-body text-sm select-none cursor-pointer" htmlFor="remember">
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full editorial-gradient text-white font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10 flex items-center">
            <div className="flex-grow border-t border-outline-variant/30"></div>
            <span className="mx-4 text-outline text-xs font-bold uppercase tracking-widest bg-surface px-2">OR</span>
            <div className="flex-grow border-t border-outline-variant/30"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest border border-outline-variant/20 py-3.5 rounded-xl text-on-surface font-body font-semibold hover:bg-surface-container-low transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer Links */}
          <footer className="mt-12 text-center space-y-6">
            <p className="text-on-surface-variant font-body text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-bold hover:underline">
                Sign up
              </Link>
            </p>
            {/* <div className="flex justify-center gap-6">
              <a className="text-outline text-xs uppercase tracking-widest font-semibold hover:text-primary transition-colors" href="#">
                Terms of Service
              </a>
              <a className="text-outline text-xs uppercase tracking-widest font-semibold hover:text-primary transition-colors" href="#">
                Privacy Policy
              </a>
            </div> */}
          </footer>
        </div>
      </main>

      {/* Floating Help Button
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-surface-container-lowest shadow-2xl rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300 group">
        <span className="material-symbols-outlined">help_outline</span>
      </button> */}
    </div>
  );
}