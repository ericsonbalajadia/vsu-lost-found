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
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailConfirmationRequired(false);

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

    if (data.session) {
      navigate('/inventory');
    } else {
      setEmailConfirmationRequired(true);
    }
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
<section className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden group">
  <div className="absolute inset-0 bg-primary/40 z-10  transition-colors group-hover:bg-primary/30"></div>
  <img
    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
    src="/vsu-map-v2.png"
    alt="VSU Campus"
  />
  <div className="relative z-20 flex flex-col justify-start items-start h-full px-16 lg:px-24 max-w-3xl pt-98">
    <div className="mb-12">
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

      {/* Right Side: Registration Form */}
<section className="flex-1 bg-white flex flex-col justify-center items-center p-8 md:p-16 relative">
  <div className="w-full max-w-md">
    {/* Mobile Logo */}
    {/* Logo – visible on all screens */}
    <div className="flex items-center justify-center md:justify-start gap-2 mb-8">
      <img
        alt="FoundPath Logo"
        className="h-10 w-10"
        src="https://lh3.googleusercontent.com/aida/ADBb0ui4qrGuDDysIJRTTSJmvXAFtWBUUhiSJuAKYZx7IxSplDEwpnafzSuZSg_oI2tWc1yDx3kTQptO_1m_8JC6XENNO3QdWk7DbG1tsMi9Lrd4f3SvtcVRkm6yKCloFyoPOVOuUXhHWP_kCxAdYnid4XROiNpl3r9BaetfvBnHn_3CkSKf8bhvzbvrDVE-xyi4zpZ2PlFBebygkAvxzWEBgZvNonReydrwBVBjd4Fsj86AxCa_ZYA4P5UbQjIBLdQS0L5Dr1YUQ5-ouw"
      />
      <span className="text-on-surface font-headline font-extrabold text-xl tracking-tighter text-yellow-500">FoundPath</span>
    </div>

    <header className="mb-10 text-center md:text-left">
      <h2 className="text-3xl font-bold text-[#191c1d] mb-2">Create Your Account</h2>
      <p className="text-base text-[#434652]">Join the crowd‑driven recovery network.</p>
    </header>


    <form className="space-y-6" onSubmit={handleEmailSignUp}>
      {/* Full Name */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wide text-[#434652] ml-1" htmlFor="name">
          Full Name
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737783] text-sm">
            person
          </span>
          <input
            id="name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full pl-12 pr-4 py-3 bg-[#f2f4f5] border border-[#c3c6d4] rounded-xl focus:ring-2 focus:ring-[#0d47a1] focus:border-[#0d47a1] transition-all text-base"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wide text-[#434652] ml-1" htmlFor="email">
          Email Address
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737783] text-sm">
            alternate_email
          </span>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="j.doe@university.edu"
            className="w-full pl-12 pr-4 py-3 bg-[#f2f4f5] border border-[#c3c6d4] rounded-xl focus:ring-2 focus:ring-[#0d47a1] focus:border-[#0d47a1] transition-all text-base"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wide text-[#434652] ml-1" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#737783] text-sm">
            lock
          </span>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-12 pr-4 py-3 bg-[#f2f4f5] border border-[#c3c6d4] rounded-xl focus:ring-2 focus:ring-[#0d47a1] focus:border-[#0d47a1] transition-all text-base"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {emailConfirmationRequired && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          Check your email to confirm your account before logging in.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0d47a1] text-white py-4 rounded-xl text-xl font-semibold shadow-sm hover:bg-[#0d47a1]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <span>{loading ? 'Creating account…' : 'Create Account'}</span>
        {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
      </button>
    </form>

    {/* Divider */}
    <div className="relative my-10">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#c3c6d4]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-4 text-xs font-semibold tracking-wide text-[#434652]">OR</span>
      </div>
    </div>

    {/* Google Sign Up */}
    <button
      onClick={handleGoogleSignUp}
      className="w-full border border-[#c3c6d4] py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#f2f4f5] transition-colors text-xl font-semibold text-[#434652]"
    >
      <svg className="w-6 h-6" viewBox="0 0 48 48">
        <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"/>
        <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"/>
        <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"/>
        <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"/>
      </svg>
      Sign up with Google
    </button>

    {/* Footer Links */}
    <footer className="mt-12 text-center space-y-4">
      <p className="text-base text-[#434652]">
        Already have an account?{' '}
        <Link to="/login" className="text-[#0d47a1] font-bold hover:underline">
          Log in
        </Link>
      </p>
      <p className="text-xs text-[#737783] leading-relaxed max-w-xs mx-auto">
        By signing up, you agree to the{' '}
        <a className="text-on-surface-variant underline" href="#">Campus Safety Guidelines</a>{' '}
        and{' '}
        <a className="text-on-surface-variant underline" href="#">Privacy Policy</a>.
      </p>
    </footer>
  </div>
</section>
    </main>
  );
}
