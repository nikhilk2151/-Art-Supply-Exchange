import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../firebase';

const DUMMY_ACCOUNTS = [
  {
    name: 'Platform Admin',
    email: 'admin@example.com',
    role: 'admin',
    badge: '👑 Admin Lead',
    city: 'Mumbai',
    state: 'Maharashtra',
    tagline: 'Full moderation & administrative powers',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    color: 'border-amber-400 bg-amber-50/70 text-amber-900'
  },
  {
    name: 'Asha Menon',
    email: 'asha@example.com',
    role: 'user',
    badge: '🎨 Watercolorist',
    city: 'Mumbai',
    state: 'Maharashtra',
    tagline: 'Swaps paints, half-pans & detail brushes',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    color: 'border-sky-300 bg-sky-50/70 text-sky-900'
  },
  {
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
    role: 'user',
    badge: '🖌️ Illustrator',
    city: 'Delhi',
    state: 'Delhi',
    tagline: 'Has Velvet Touch brush set & cotton canvases',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    color: 'border-indigo-300 bg-indigo-50/70 text-indigo-900'
  },
  {
    name: 'Meera Iyer',
    email: 'meera@example.com',
    role: 'user',
    badge: '🖼️ Mural Artist',
    city: 'Bengaluru',
    state: 'Karnataka',
    tagline: 'Has heavy sketchbooks & table easels',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    color: 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
  },
  {
    name: 'Karan Patel',
    email: 'karan@example.com',
    role: 'user',
    badge: '🎒 Sketchbook Collector',
    city: 'Ahmedabad',
    state: 'Gujarat',
    tagline: 'Offers Mont Marte acrylics & drawing lamps',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    color: 'border-amber-300 bg-amber-50/70 text-amber-900'
  },
  {
    name: 'Nisha Rao',
    email: 'nisha@example.com',
    role: 'user',
    badge: '🎭 Oil Painter',
    city: 'Pune',
    state: 'Maharashtra',
    tagline: 'Swaps palette knife sets & Faber markers',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    color: 'border-rose-300 bg-rose-50/70 text-rose-900'
  },
  {
    name: 'Vikram Sood',
    email: 'vikram@example.com',
    role: 'user',
    badge: '👨‍🏫 Art Teacher',
    city: 'Chennai',
    state: 'Tamil Nadu',
    tagline: 'Supplies poster colors & studio easels',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    color: 'border-teal-300 bg-teal-50/70 text-teal-900'
  },
  {
    name: 'Priya Sen',
    email: 'priya@example.com',
    role: 'user',
    badge: '🏺 Ceramicist',
    city: 'Kolkata',
    state: 'West Bengal',
    tagline: 'Clay modelling tools & glaze brushes',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    color: 'border-purple-300 bg-purple-50/70 text-purple-900'
  },
  {
    name: 'Arjun Das',
    email: 'arjun@example.com',
    role: 'user',
    badge: '🎨 Mixed Media',
    city: 'Hyderabad',
    state: 'Telangana',
    tagline: 'Acrylic mediums & drawing boards',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    color: 'border-orange-300 bg-orange-50/70 text-orange-900'
  }
];

export default function AuthPage({ onLogin, api }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dummy'); // 'dummy' | 'form' | 'google'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingInEmail, setLoggingInEmail] = useState('');
  const [copiedText, setCopiedText] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [stateName, setStateName] = useState('Maharashtra');

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

  const handleDummyLogin = async (account) => {
    setError('');
    setLoggingInEmail(account.email);
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: account.email,
        password: 'password123'
      });

      onLogin(data.token, data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/marketplace');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Login failed for test account');
    } finally {
      setLoading(false);
      setLoggingInEmail('');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const { data } = await api.post('/auth/login', { email, password });
        onLogin(data.token, data.user);
        if (!data.user.isProfileCompleted) {
          navigate('/customize-profile');
        } else if (data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/marketplace');
        }
      } else {
        const { data } = await api.post('/auth/register', {
          name,
          email,
          password,
          city,
          state: stateName
        });
        onLogin(data.token, data.user);
        navigate('/marketplace');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2500);
  };

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center px-4 py-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-stone-300 bg-white shadow-2xl lg:grid-cols-[1fr,1.3fr]">
        {/* Left Side Banner */}
        <div className="bg-gradient-to-br from-terra-cotta via-amber-700 to-amber-800 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <span className="inline-block rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-100 shadow-xs">
              🎨 Art Supply Exchange
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">Welcome to the Creator Community</h1>
            <p className="text-sm leading-relaxed text-amber-50/90 font-medium">
              Trade, sell, or swap pre-loved paints, brushes, sketchbooks, and studio tools with local artists.
            </p>
          </div>

          {/* Testing Tips Card */}
          <div className="relative z-10 mt-8 rounded-2xl bg-black/25 p-4 border border-white/20 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-200">🧪 Dummy Testing Accounts</p>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-400/30">
                Ready to Use
              </span>
            </div>
            <p className="text-xs text-stone-100 leading-relaxed font-medium">
              Use our pre-configured test profiles to instantly explore buying, swapping, real-time messaging, and admin controls without needing a Google account.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-amber-200/90 font-mono bg-black/30 px-2.5 py-1 rounded-lg border border-white/10">
                Password: <strong>password123</strong>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard('password123', 'Password')}
                className="text-[10px] px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white font-semibold transition"
              >
                {copiedText === 'Password' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Interaction Panel */}
        <div className="p-6 sm:p-8 flex flex-col justify-start bg-stone-50/40 overflow-y-auto max-h-[85vh]">
          {/* Navigation Tabs */}
          <div className="flex rounded-2xl bg-stone-200/70 p-1 mb-6 text-xs font-bold text-stone-700">
            <button
              type="button"
              onClick={() => setActiveTab('dummy')}
              className={`flex-1 rounded-xl py-2.5 px-3 transition text-center flex items-center justify-center gap-1.5 ${activeTab === 'dummy' ? 'bg-white text-terra-cotta shadow-sm' : 'hover:text-stone-900'}`}
            >
              <span>⚡</span>
              <span>1-Click Test Accounts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 rounded-xl py-2.5 px-3 transition text-center flex items-center justify-center gap-1.5 ${activeTab === 'form' ? 'bg-white text-terra-cotta shadow-sm' : 'hover:text-stone-900'}`}
            >
              <span>🔑</span>
              <span>Email / Password</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`flex-1 rounded-xl py-2.5 px-3 transition text-center flex items-center justify-center gap-1.5 ${activeTab === 'google' ? 'bg-white text-terra-cotta shadow-sm' : 'hover:text-stone-900'}`}
            >
              <span>🌐</span>
              <span>Google</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 text-left">
              <span>⚠️</span>
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError('')} className="text-rose-900 hover:text-rose-950 font-bold">✕</button>
            </div>
          )}

          {/* TAB 1: 1-Click Test Accounts */}
          {activeTab === 'dummy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">Select a Test Account</h3>
                  <p className="text-xs text-stone-500 font-medium">Click any profile below to sign in immediately.</p>
                </div>
                <span className="text-[11px] font-bold text-terra-cotta bg-terra-cotta/10 px-2.5 py-1 rounded-full">
                  {DUMMY_ACCOUNTS.length} Test Profiles
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-1">
                {DUMMY_ACCOUNTS.map((acc) => {
                  const isCurrentLoading = loading && loggingInEmail === acc.email;
                  return (
                    <div
                      key={acc.email}
                      className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition shadow-xs hover:shadow-md bg-white ${acc.color}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="h-11 w-11 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=c2593f&color=fff`;
                          }}
                        />
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">{acc.name}</span>
                            <span className="rounded-md bg-stone-900/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                              {acc.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 truncate">{acc.email} • {acc.city}</p>
                          <p className="text-[10px] text-stone-400 truncate italic">{acc.tagline}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => copyToClipboard(acc.email, acc.email)}
                          title="Copy Email"
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-xs transition"
                        >
                          {copiedText === acc.email ? '✓' : '📋'}
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleDummyLogin(acc)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-terra-cotta text-white hover:bg-terra-cotta/90 font-bold text-xs shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
                        >
                          {isCurrentLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <span>⚡ Login</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Email & Password Form */}
          {activeTab === 'form' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {authMode === 'login' ? 'Sign In with Credentials' : 'Create Custom Test Account'}
                </h3>
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-xs font-bold text-terra-cotta hover:underline"
                >
                  {authMode === 'login' ? '+ Register New Account' : 'Back to Login'}
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3 text-left">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Maya Patel"
                        className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-terra-cotta focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Mumbai"
                          className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-terra-cotta focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          placeholder="e.g. Maharashtra"
                          className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-terra-cotta focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">Email Address</label>
                    {authMode === 'login' && (
                      <span className="text-[11px] text-stone-400">e.g. asha@example.com</span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-terra-cotta focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">Password</label>
                    <span className="text-[11px] text-stone-400">Dummy pass: password123</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm text-stone-900 focus:border-terra-cotta focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-terra-cotta py-3 text-sm font-bold text-white shadow-md hover:bg-terra-cotta/90 transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : authMode === 'login' ? (
                    'Sign In'
                  ) : (
                    'Create Account & Sign In'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Google Sign In */}
          {activeTab === 'google' && (
            <div className="space-y-6 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-terra-cotta/15 text-terra-cotta text-3xl font-bold shadow-xs">
                🌐
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-stone-900">Sign In with Google</h3>
                <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
                  Authenticate securely using your Google account to automatically sync your profile name and avatar.
                </p>
              </div>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
