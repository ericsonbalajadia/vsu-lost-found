// src/pages/public/SignUp.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Manually create profile row using the RPC function (bypasses trigger)
    const userId = data.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        user_email: email,
        user_name: fullName,
      });
      if (profileError) {
        console.error('Profile creation failed:', profileError);
        // Optionally show a warning, but sign-up already succeeded
      }
    }

    // After successful sign-up, redirect to inventory
    navigate('/inventory');
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.VITE_APP_URL}/inventory`,
      },
    });
  };

  return (
    <main className="flex w-full min-h-screen overflow-hidden bg-surface text-on-surface">
      {/* Left Side: Hero Brand Presence (Hidden on mobile) */}
      <section className="hidden lg:flex flex-1 relative bg-primary-dim overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
            alt="campus"
            src="/vsu-map.png"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-dim via-primary/40 to-transparent"></div>
        </div>
        <div className="relative z-10 p-16 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-4xl">account_balance</span>
            <span className="text-white font-headline font-extrabold text-2xl tracking-tighter">Campus Archive</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-white font-headline text-5xl font-bold leading-tight tracking-tight mb-6">
              The Empathetic Archive
            </h1>
            <p className="text-on-primary/80 text-lg leading-relaxed font-body">
              Recovering lost belongings through community trust and crowd-sourced campus oversight. Your peace of mind, restored.
            </p>
            {/* <div className="mt-12 flex gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary-dim bg-surface-container-high overflow-hidden">
                  <img className="w-full h-full object-cover" alt="Student avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGP7yNTV-hGRHdHL2j_v3n8XkpmYcA5j7sCHkMwAvyHMTSc151-HPEe2p_3dFWLnKPTP74tDyYu7Pe3SUUNtriTOYEHXk4WrfJ7hsLicfBfL9fErxG7sHJt_k0grjuxokR790H0soRj8NdDjHntTl8Jc3paqEldodq1_sv0JoQZuPRX2njA1J_COFgvcA6owUbRGFxTKIYLFkeKRt2oGq-zAe7fLR-BaCTrO2UTlrHDfrO6LJiD-J4_zPrTwsWCg6rF0A0F2Xlp6c" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-primary-dim bg-surface-container-high overflow-hidden">
                  <img className="w-full h-full object-cover" alt="Student avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0BiUUQ_WLUsCPs2qzzqxdhGHaxNMAzgXdq5m8D49VMgDQ_DXpCiyKAre0v0yf-hMjAC23mr09rlL_2lCTV4vm4G15SJTg8tUG3lRoF6yOQcC61UHtBgq-8I2Hazk-GX1Oz6AVEZmJ8F9Xvp6rP1XW_n3xv5FCObKYXvrxecOFIIFSjYHZ385SOhBlio3skRxvY5HbMwFjXEYMfLu3iZ7OfhOAbt1Gr2VslWKLh-x6HXzWDgdedjcR0YPWvGLndVhBGMH5qRUwc_Y" />
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-primary-dim bg-surface-container-high overflow-hidden">
                  <img className="w-full h-full object-cover" alt="Faculty avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVQxen0U95nRcA77bXGODEdyWLFv0HcSu116OGyO_29LDoO0WRImYmDyxemNC9I6ZlSa_myOdHclkDq7qMeqDxuU8QQ2iGGFP6jwi32h09rz4Qd5ToPnwCUFvWw5pzq5g750P5UEGx02vOdNPm5C9BvoW6cFb0s4_fUyyj2aJuxc_wvGJT2yQtU331OzOwBo5Wfp6oaLAuypwtvMEsczjkkC0ywbPlIi9nK1vxI77i9NXFyLX21Bo3liY-fCHj2mtXnRc6D6IUF0Y" />
                </div>
              </div>
              <p className="text-on-primary/70 text-sm self-center">
                Join <span className="font-bold text-white">2,400+</span> campus members
              </p>
            </div> */}
          </div>
          <div className="flex gap-8 text-xs font-label uppercase tracking-widest text-on-primary/50">
            <span>© 2026 University Campus Archive.</span>
            <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
          </div>
        </div>
      </section>

      {/* Right Side: Registration Form */}
      <section className="flex-1 bg-surface flex flex-col justify-center items-center p-8 md:p-16 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
            <span className="text-on-surface font-headline font-extrabold text-xl tracking-tighter">Campus Archive</span>
          </div>

          <header className="mb-10 text-center lg:text-left">
            <h2 className="text-on-surface font-headline text-3xl font-extrabold tracking-tight mb-3">Create Your Account</h2>
            <p className="text-on-surface-variant font-body">Join the university's official recovery network.</p>
          </header>

          <form className="space-y-6" onSubmit={handleEmailSignUp}>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-label font-semibold text-on-surface-variant" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">person</span>
                <input
                  id="name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-label font-semibold text-on-surface-variant" htmlFor="email">
                University Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">alternate_email</span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="j.doe@university.edu"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-label font-semibold text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">lock</span>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-dim text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{loading ? 'Creating account…' : 'Create Account'}</span>
              {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-container-high"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest text-outline bg-surface px-4 font-label">or</div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            className="w-full py-3.5 px-6 bg-surface-container-lowest border border-surface-container-high text-on-surface-variant font-label font-semibold rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          {/* Footer Links */}
          <footer className="mt-12 text-center space-y-4">
            <p className="text-on-surface-variant font-body text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log in
              </Link>
            </p>
            <p className="text-outline font-body text-xs leading-relaxed max-w-xs mx-auto">
              By signing up, you agree to the{' '}
              <a className="text-on-surface-variant underline" href="#">Campus Safety Guidelines</a>{' '}
              and{' '}
              <a className="text-on-surface-variant underline" href="#">Privacy Policy</a>.
            </p>
          </footer>
        </div>

        {/* Help and Language Buttons (absolute positioned) */}
        {/* <div className="absolute top-8 right-8 flex gap-4 items-center">
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-sm font-label">
            <span className="material-symbols-outlined text-lg">language</span>
            <span>English</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-all">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div> */}
      </section>
    </main>
  );
}