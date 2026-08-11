import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthPage({ onLogin, api }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle redirect result if mobile browser uses redirect
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const firebaseUser = result.user;
          const { data } = await api.post('/auth/google', {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            firebaseUid: firebaseUser.uid,
            avatar: firebaseUser.photoURL || ''
          });
          onLogin(data.token, { ...data.user, firebaseUid: firebaseUser.uid });
          if (!data.user.isProfileCompleted) {
            navigate('/customize-profile');
          } else {
            navigate('/marketplace');
          }
        }
      })
      .catch((err) => {
        console.warn('Redirect result notice:', err?.message);
      });
  }, [api, navigate, onLogin]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    if (!auth) {
      setError('Google sign-in is not initialized. Please verify your Firebase API key configuration.');
      setLoading(false);
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      let userCredential = null;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        try {
          userCredential = await signInWithPopup(auth, provider);
        } catch (popupErr) {
          if (
            popupErr?.code === 'auth/popup-blocked' ||
            popupErr?.code === 'auth/popup-closed-by-user' ||
            popupErr?.code === 'auth/internal-error' ||
            (popupErr?.message && (popupErr.message.includes('closing') || popupErr.message.includes('hidden')))
          ) {
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupErr;
        }
      } else {
        userCredential = await signInWithPopup(auth, provider);
      }

      if (userCredential && userCredential.user) {
        const firebaseUser = userCredential.user;
        const { data } = await api.post('/auth/google', {
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL || ''
        });
        onLogin(data.token, { ...data.user, firebaseUid: firebaseUser.uid });
        if (!data.user.isProfileCompleted) {
          navigate('/customize-profile');
        } else {
          navigate('/marketplace');
        }
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Google sign-in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-4xl items-center justify-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-3xl border border-stone-300 bg-white shadow-2xl lg:grid-cols-2">
        {/* Left Side Banner */}
        <div className="bg-gradient-to-br from-terra-cotta via-amber-700 to-amber-800 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-100 shadow-xs">
              🎨 Official Platform
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">Art Supply Exchange</h1>
            <p className="text-sm leading-relaxed text-amber-50/90 font-medium">
              Trade spare art supplies, save money, and keep high-quality art materials circulating among nearby artists and studios.
            </p>
          </div>

          <div className="relative z-10 mt-8 rounded-2xl bg-black/20 p-4 border border-white/20 backdrop-blur-md space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-200">✨ Fast & Secure Access</p>
            <ul className="text-xs space-y-1.5 text-stone-100 font-medium">
              <li>✓ One-click sign in with Google</li>
              <li>✓ First-time profile customization setup</li>
              <li>✓ Swap, buy, and message local creators</li>
            </ul>
          </div>
        </div>

        {/* Right Side Form (Only Google Sign-in) */}
        <div className="p-8 sm:p-12 flex flex-col justify-center items-center text-center bg-stone-50/50">
          <div className="w-full max-w-sm space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-terra-cotta/15 text-terra-cotta text-3xl font-bold shadow-xs">
              🎨
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Sign Up / Sign In</h2>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                Continue with your Google account to create your artist profile and access the marketplace.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 text-left">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-in Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3.5 rounded-2xl border border-stone-300 bg-white px-5 py-4 text-sm font-bold text-stone-800 shadow-md hover:bg-stone-50 hover:border-stone-400 hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-terra-cotta border-t-transparent" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
              By continuing, your profile picture and name will be imported from Google to help initialize your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
