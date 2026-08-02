// Login.jsx
import { useState } from 'react';
import { api } from '../api';
import Logo from './Logo';

export default function Login({ onSuccess, onClose }) {
  const [screen, setScreen] = useState('login'); // login | signup | forgot | otp | newpass
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(''); setLoading(false); };

  // Login / Signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const data = screen === 'signup'
        ? await api.signup(name, email, password)
        : await api.login(email, password);
      localStorage.setItem('setrxai_token', data.token);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1 — Email daalo, OTP bhejo
  const handleSendOTP = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setScreen('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — OTP verify karo
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await api.verifyOTP(email, otp);
      setScreen('newpass');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Naya password set karo
  const handleResetPassword = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await api.resetPassword(email, otp, newPassword);
      setScreen('login');
      setError('');
      alert('Password updated! Please log in.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500";
  const btnClass = "w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium shadow-lg shadow-purple-500/20 transition-all";

  const titles = {
    login: 'Log in to save your chat history',
    signup: 'Create your account',
    forgot: 'Enter your registered email',
    otp: `Enter the 4-digit code sent to ${email}`,
    newpass: 'Set your new password',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-fadeInUp" onClick={(e) => e.stopPropagation()}>

        <div className="flex flex-col items-center mb-6">
          <Logo size={44} />
          <h1 className="mt-3 text-xl font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">SetrxAI</h1>
          <p className="text-xs text-zinc-500 mt-1 text-center">{titles[screen]}</p>
        </div>

        {/* ---- LOGIN / SIGNUP ---- */}
        {(screen === 'login' || screen === 'signup') && (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {screen === 'signup' && (
                <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              )}
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
              <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? 'Please wait...' : screen === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            {screen === 'login' && (
              <button onClick={() => { setScreen('forgot'); setError(''); }} className="w-full text-center text-xs text-purple-500 hover:underline mt-3">
                Forgot password?
              </button>
            )}

            <p className="text-xs text-center text-zinc-500 mt-4">
              {screen === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => { setScreen(screen === 'signup' ? 'login' : 'signup'); setError(''); }} className="text-purple-500 hover:underline font-medium">
                {screen === 'signup' ? 'Log In' : 'Sign Up'}
              </button>
            </p>
            <button onClick={onClose} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mt-4">
              Continue as guest
            </button>
          </>
        )}

        {/* ---- STEP 1: EMAIL ---- */}
        {screen === 'forgot' && (
          <form onSubmit={handleSendOTP} className="space-y-3">
            <input type="email" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? 'Sending code...' : 'Send 4-Digit Code'}
            </button>
            <button type="button" onClick={() => { setScreen('login'); setError(''); }} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-700 mt-2">
              Back to Login
            </button>
          </form>
        )}

        {/* ---- STEP 2: OTP ---- */}
        {screen === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-3">
            <input
              type="text"
              placeholder="Enter 4-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              maxLength={4}
              className={`${inputClass} text-center text-2xl tracking-[1rem] font-bold`}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading || otp.length !== 4} className={btnClass}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button type="button" onClick={() => { setScreen('forgot'); setOtp(''); setError(''); }} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-700 mt-2">
              Resend code
            </button>
          </form>
        )}

        {/* ---- STEP 3: NEW PASSWORD ---- */}
        {screen === 'newpass' && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <input type="password" placeholder="New password (min 6 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputClass} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
    }
    
