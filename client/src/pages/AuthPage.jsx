import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthPage({ onLogin, api }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleQuickLogin = async (email, password = 'password123') => {
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onLogin(data.token, data.user);
      navigate('/marketplace');
    } catch (err) {
      setError(err?.response?.data?.message || 'Quick login failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!auth) {
      setError('Google sign-in is not initialized. Please verify your Firebase API key configuration.');
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      const { data } = await api.post('/auth/google', {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        firebaseUid: firebaseUser.uid,
        avatar: firebaseUser.photoURL || ''
      });
      onLogin(data.token, { ...data.user, firebaseUid: firebaseUser.uid });
      navigate('/marketplace');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Google sign-in failed';
      setError(message);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center px-4 py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-stone-300 bg-white shadow-xl lg:grid-cols-2">
        <div className="bg-terra-cotta p-8 text-white flex flex-col justify-between">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-100 mb-3">
              Official Platform
            </span>
            <h1 className="font-serif text-3xl font-bold">Art Supply Exchange</h1>
            <p className="mt-4 text-sm leading-7 text-stone-100">
              Trade spare supplies, save money, and keep art materials in circulation with nearby artists, students, and studios.
            </p>
          </div>

          {/* Demo Personas section hidden (code retained, hidden from login page UI) */}
          {/*
          <div className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Demo Personas</p>
            <p className="mt-1 text-xs text-stone-200">Click any account to test instantly:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => handleQuickLogin('asha@example.com')} className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30 transition">
                Asha Menon (Mumbai)
              </button>
              <button onClick={() => handleQuickLogin('rohan@example.com')} className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30 transition">
                Rohan Sharma (Delhi)
              </button>
            </div>
          </div>
          */}
        </div>

        <div className="p-8 flex flex-col justify-center items-center text-center">
          <div className="w-full max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terra-cotta/10 text-terra-cotta">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457-.312-2.841-.873-4.084" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl font-bold text-charcoal">Art Supply Exchange</h2>
            <p className="mt-2 text-sm text-stone-600">
              Sign in or create your account using your Google account to get started.
            </p>

            <div className="mt-8">
              <button
                className="w-full flex items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white px-5 py-3.5 text-sm font-semibold text-charcoal shadow-sm hover:bg-stone-50 hover:border-stone-400 transition"
                onClick={handleGoogleSignIn}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
