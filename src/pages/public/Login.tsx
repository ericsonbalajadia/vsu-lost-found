// src/pages/public/Login.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/inventory';
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect when user becomes authenticated
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
    <main className="flex-grow flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      {/* Left Hero Section (Desktop Only) */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/40 z-10 transition-colors group-hover:bg-primary/30"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src="https://lh3.googleusercontent.com/aida/ADBb0uhd_akot95zeyYIcgsRy5rNpeyLaiof_QgiK43ttqy_C3UrtUR-qEwMI9A8a0NypMbp4XSyQf-04620XgGTJY_CtJWTOWso4GvKcoligrhVcYCDtsPf4vcuHM4IlZqJVqGJ6DBzMNvUgbWkXzd8Co5BiKWXhmfqFUy6sNVSMb0_K3dxt7jSGPjfWrn4CeoH1TGEvgYlN6zhRZAZ8wEy0_XpbXCXYbepiMF77Ph-MAzMllbv5ty5l0NI9pHw8suRcEPeLD1XO85u"
          alt="VSU Campus"
        />
        <div className="relative z-20 flex flex-col justify-center items-start h-full px-16 lg:px-24 max-w-3xl">
          <div className="mb-12">
            <img
              alt="FoundPath Logo"
              className="h-32 w-32 mb-8"
              src="https://lh3.googleusercontent.com/aida/ADBb0ui4qrGuDDysIJRTTSJmvXAFtWBUUhiSJuAKYZx7IxSplDEwpnafzSuZSg_oI2tWc1yDx3kTQptO_1m_8JC6XENNO3QdWk7DbG1tsMi9Lrd4f3SvtcVRkm6yKCloFyoPOVOuUXhHWP_kCxAdYnid4XROiNpl3r9BaetfvBnHn_3CkSKf8bhvzbvrDVE-xyi4zpZ2PlFBebygkAvxzWEBgZvNonReydrwBVBjd4Fsj86AxCa_ZYA4P5UbQjIBLdQS0L5Dr1YUQ5-ouw"
            />
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
  <span className="text-yellow-400">FoundPath</span>
</h1>
<p className="text-3xl font-bold tracking-tight text-white text-shadow-sm border-l-4 border-yellow-400 pl-6 py-2">
  Restoring peace of mind, one item at a time.
</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 max-w-md">
            <p className="body-lg text-white">
              Access the community‑driven lost and found platform. Secure, efficient, and trusted by users everywhere.
            </p>
          </div>
        </div>
        <div className="absolute bottom-8 left-16 z-20">
          <p className="label-sm text-white/80 uppercase tracking-widest">Community Recovery Team</p>
        </div>
      </section>

      {/* Right Form Section */}
      <section className="w-full md:w-1/2 lg:w-2/5 flex flex-col bg-surface-container-lowest overflow-y-auto custom-scrollbar">
        {/* Mobile Header */}
        <div className="md:hidden p-6 flex items-center justify-between border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <img
              alt="FoundPath Logo"
              className="h-10 w-10"
              src="https://lh3.googleusercontent.com/aida/ADBb0ui4qrGuDDysIJRTTSJmvXAFtWBUUhiSJuAKYZx7IxSplDEwpnafzSuZSg_oI2tWc1yDx3kTQptO_1m_8JC6XENNO3QdWk7DbG1tsMi9Lrd4f3SvtcVRkm6yKCloFyoPOVOuUXhHWP_kCxAdYnid4XROiNpl3r9BaetfvBnHn_3CkSKf8bhvzbvrDVE-xyi4zpZ2PlFBebygkAvxzWEBgZvNonReydrwBVBjd4Fsj86AxCa_ZYA4P5UbQjIBLdQS0L5Dr1YUQ5-ouw"
            />
            <span className="title-md"><span className="text-accent-yellow">FoundPath</span></span>
          </div>
        </div>

        <div className="flex-grow flex flex-col justify-center px-margin-mobile md:px-12 lg:px-20 py-12 max-w-xl mx-auto w-full">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2 text-bold">Welcome Back</h2>
            <p className="body-md text-on-surface-variant">Please log in to manage reports and items.</p>
          </div>

          <form className="space-y-6" onSubmit={handleEmailLogin}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block label-sm text-on-surface-variant ml-1" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@vsu.edu.ph"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all body-md"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block label-sm text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <a className="label-sm text-primary hover:underline font-bold" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all body-md"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="remember" className="body-md text-on-surface-variant cursor-pointer select-none">
                Keep me signed in
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
              className="w-full bg-primary text-on-primary py-4 rounded-xl title-md shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <span className="material-symbols-outlined">login</span>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center label-sm">
              <span className="bg-surface-container-lowest px-4 text-on-surface-variant">OR</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-outline-variant py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-container-low transition-colors title-md text-on-surface-variant"
          >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"/>
              <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"/>
              <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"/>
              <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"/>
            </svg>
            Continue with Google
          </button>

          {/* Sign Up Link */}
          <p className="mt-8 text-center body-md text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-8 px-12 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4 label-sm text-on-surface-variant">
          <p>© 2026 FoundPath. All Rights Reserved.</p>
          {/* <nav className="flex gap-6">
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Campus Map</a>
          </nav> */}
        </footer>
      </section>
    </main>
  );
}