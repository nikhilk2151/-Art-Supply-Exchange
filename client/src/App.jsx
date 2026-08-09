import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetailPage from './pages/ListingDetailPage';
import ChatPage from './pages/ChatPage';
import SwapPage from './pages/SwapPage';
import AdminPage from './pages/AdminPage';
import EditProfileModal from './components/EditProfileModal';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [newBuyNotification, setNewBuyNotification] = useState(null);
  const [seenBuyIds, setSeenBuyIds] = useState(new Set());
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingAuth(false);
      return;
    }
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoadingAuth(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkIncomingRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };

        const [swapsRes, buysRes] = await Promise.all([
          api.get('/swaps/received', { headers }),
          api.get('/transactions/received', { headers })
        ]);

        const pendingSwaps = (swapsRes.data.swaps || []).filter((s) => s.status === 'pending');
        const pendingBuys = (buysRes.data.transactions || []).filter((b) => b.status === 'pending');

        setPendingRequestsCount(pendingSwaps.length + pendingBuys.length);

        if (pendingBuys.length > 0) {
          const latestBuy = pendingBuys[0];
          setSeenBuyIds((prevSeen) => {
            if (!prevSeen.has(latestBuy._id)) {
              setNewBuyNotification(latestBuy);
              return new Set([...prevSeen, latestBuy._id]);
            }
            return prevSeen;
          });
        }
      } catch (err) {
        // silent check
      }
    };

    checkIncomingRequests();
    const interval = setInterval(checkIncomingRequests, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const login = (token, currentUser) => {
    localStorage.setItem('token', token);
    setUser(currentUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const isActive = (path) => location.pathname === path;

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream font-serif text-stone-700">
        <div className="glass-card p-6 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-terra-cotta border-t-transparent" />
          <span className="text-sm font-semibold">Restoring session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-stone-800 font-sans selection:bg-terra-cotta selection:text-white">
      {/* Real-time Seller Buy Request Pop-up Toast */}
      {newBuyNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-md w-full glass-card p-5 border-2 border-terra-cotta/40 shadow-2xl rounded-3xl animate-bounce-short space-y-3 bg-white/95 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center text-xl font-bold shadow-xs">
                🛒
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900">New Purchase Request!</h4>
                <p className="text-xs text-stone-600">
                  <strong className="text-stone-800">{newBuyNotification.buyer?.name}</strong> wants to buy your item:
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewBuyNotification(null)}
              className="text-stone-400 hover:text-stone-700 p-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="rounded-2xl bg-stone-100/90 p-3 flex items-center gap-3 border border-stone-200">
            {newBuyNotification.listing?.images?.[0] && (
              <img src={newBuyNotification.listing.images[0]} alt="" className="h-12 w-12 rounded-xl object-cover border border-stone-300" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-stone-900 truncate">{newBuyNotification.listing?.title}</p>
              <p className="text-xs font-extrabold text-terra-cotta">₹{newBuyNotification.listing?.price}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setNewBuyNotification(null);
                navigate('/swaps');
              }}
              className="flex-1 glow-btn rounded-xl py-2 text-xs font-bold text-white uppercase tracking-wider text-center"
            >
              View in Inbox & Accept
            </button>
            <button
              onClick={() => setNewBuyNotification(null)}
              className="rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Animated Art Items Background Layer */}
      <div className="animated-art-bg">
        <div className="floating-art-item art-float-1">
          <svg className="w-32 h-32 text-amber-700/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.49 2 2 6.49 2 12c0 3.69 2.47 6.86 6 8.25.5.19 1-.22 1-.75v-.65c0-.62.44-1.15 1.05-1.25 1.63-.27 2.95-1.59 3.22-3.22.1-.61.63-1.05 1.25-1.05h1.98c2.48 0 4.5-2.02 4.5-4.50C22 5.51 17.49 2 12 2zm-5.5 8c-.83 0-1.5-.67-1.5-1.5S5.67 7 6.5 7s1.5.67 1.5 1.5S7.33 10 6.5 10zm3-4C8.67 6 8 5.33 8 4.5S8.67 3 9.5 3s1.5.67 1.5 1.5S10.33 6 9.5 6zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 3 14.5 3s1.5.67 1.5 1.5S15.33 6 14.5 6zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 7 17.5 7s1.5.67 1.5 1.5S18.33 10 17.5 10z"/>
          </svg>
        </div>

        <div className="floating-art-item art-float-2">
          <svg className="w-28 h-28 text-terra-cotta/50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 0 0-1.41 0L9 12.25 11.75 15l9.96-9.96c.39-.39.39-1.02 0-1.41z"/>
          </svg>
        </div>

        <div className="floating-art-item art-float-3">
          <svg className="w-36 h-36 text-emerald-800/40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/>
          </svg>
        </div>

        <div className="floating-art-item art-float-4">
          <svg className="w-32 h-32 text-amber-600/50" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>

        <div className="floating-art-item art-float-5">
          <svg className="w-40 h-40 text-rose-700/30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>

        <div className="floating-art-item art-float-6">
          <svg className="w-24 h-24 text-amber-500/40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
          </svg>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top Floating Nav Glass Template */}
        <header className="sticky top-0 z-40 px-4 pt-3 pb-1">
          <div className="mx-auto max-w-7xl rounded-2xl glass-nav px-4 sm:px-6 py-3.5 shadow-lg shadow-amber-950/5 border border-white/70">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-terra-cotta to-amber-500 text-white font-serif font-bold text-lg sm:text-xl shadow-md group-hover:scale-105 transition">
                  🎨
                </div>
                <div>
                  <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-terra-cotta transition">
                    Art Supply Exchange
                  </span>
                  <span className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                    Pre-loved Creator Marketplace
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-semibold">
                <Link
                  to="/marketplace"
                  className={`px-3.5 py-2 rounded-xl transition ${isActive('/marketplace') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50 hover:text-terra-cotta'}`}
                >
                  Marketplace
                </Link>

                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3.5 py-2 rounded-xl transition ${isActive('/dashboard') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50 hover:text-terra-cotta'}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/chat"
                      className={`px-3.5 py-2 rounded-xl transition ${isActive('/chat') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50 hover:text-terra-cotta'}`}
                    >
                      Chat
                    </Link>
                    <Link
                      to="/swaps"
                      className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${isActive('/swaps') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50 hover:text-terra-cotta'}`}
                    >
                      <span>📥 Inbox</span>
                      {pendingRequestsCount > 0 && (
                        <span className="rounded-full bg-terra-cotta px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${isActive('/admin') ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                      >
                        Admin
                      </Link>
                    )}
                    <div className="ml-2 flex items-center gap-2 pl-2 border-l border-stone-300/60">
                      <button
                        onClick={() => setShowEditProfileModal(true)}
                        className="flex items-center gap-2 rounded-xl p-1 sm:px-2.5 sm:py-1.5 hover:bg-stone-200/60 transition group text-left"
                        title="Click to view or edit profile"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover border-2 border-terra-cotta/60 shadow-xs group-hover:scale-105 transition"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=c2593f&color=fff&bold=true`;
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-terra-cotta to-amber-500 text-white flex items-center justify-center text-xs font-bold font-serif shadow-xs group-hover:scale-105 transition">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-stone-800 group-hover:text-terra-cotta transition truncate max-w-[110px]">
                            {user.name}
                          </span>
                          <span className="text-[10px] font-semibold text-terra-cotta group-hover:underline">
                            ✏️ Edit Profile
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={logout}
                        className="rounded-xl border border-terra-cotta/30 bg-terra-cotta/10 px-3 py-1.5 text-xs font-semibold text-terra-cotta hover:bg-terra-cotta hover:text-white transition"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 pl-2">
                    <Link
                      to="/auth"
                      className="px-3.5 py-2 rounded-xl text-stone-700 hover:bg-stone-200/50 hover:text-terra-cotta transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth"
                      className="glow-btn rounded-xl px-4 py-2 font-semibold text-white transition text-xs sm:text-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </nav>

              {/* Mobile Hamburger Toggle Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white/90 text-stone-800 shadow-xs hover:bg-stone-100 transition"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <span className="text-xl font-bold">✕</span>
                ) : (
                  <span className="text-xl font-bold">☰</span>
                )}
              </button>
            </div>

            {/* Mobile Dropdown Navigation Drawer */}
            {isMobileMenuOpen && (
              <div className="md:hidden mt-3 pt-3 border-t border-stone-200/80 flex flex-col gap-2 font-semibold text-sm">
                <Link
                  to="/marketplace"
                  className={`px-4 py-2.5 rounded-xl transition ${isActive('/marketplace') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50'}`}
                >
                  🎨 Marketplace
                </Link>

                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-4 py-2.5 rounded-xl transition ${isActive('/dashboard') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50'}`}
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      to="/chat"
                      className={`px-4 py-2.5 rounded-xl transition ${isActive('/chat') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50'}`}
                    >
                      💬 Chat
                    </Link>
                    <Link
                      to="/swaps"
                      className={`px-4 py-2.5 rounded-xl transition flex items-center justify-between ${isActive('/swaps') ? 'bg-terra-cotta/15 text-terra-cotta font-bold' : 'text-stone-700 hover:bg-stone-200/50'}`}
                    >
                      <span>📥 Inbox</span>
                      {pendingRequestsCount > 0 && (
                        <span className="rounded-full bg-terra-cotta px-2 py-0.5 text-[10px] font-extrabold text-white">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${isActive('/admin') ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-900'}`}
                      >
                        ⚡ Admin Panel
                      </Link>
                    )}
                    <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between px-2">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setShowEditProfileModal(true);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-stone-800 hover:text-terra-cotta"
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover border border-terra-cotta" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-terra-cotta text-white flex items-center justify-center text-xs font-bold">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>✏️ Edit Profile ({user.name})</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="rounded-xl border border-terra-cotta/30 bg-terra-cotta/10 px-3 py-1.5 text-xs font-semibold text-terra-cotta hover:bg-terra-cotta hover:text-white transition"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-2 border-t border-stone-200">
                    <Link
                      to="/auth"
                      className="w-full text-center px-4 py-2.5 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 font-semibold"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth"
                      className="w-full text-center glow-btn rounded-xl px-4 py-2.5 font-semibold text-white shadow-md"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage api={api} />} />
            <Route path="/auth" element={<AuthPage onLogin={login} api={api} />} />
            <Route path="/dashboard" element={user ? <DashboardPage user={user} api={api} authHeader={authHeader} /> : <Navigate to="/auth" />} />
            <Route path="/marketplace" element={<MarketplacePage api={api} />} />
            <Route path="/listing/:id" element={<ListingDetailPage api={api} user={user} authHeader={authHeader} />} />
            <Route path="/chat" element={user ? <ChatPage api={api} user={user} authHeader={authHeader} /> : <Navigate to="/auth" />} />
            <Route path="/swaps" element={user ? <SwapPage api={api} user={user} authHeader={authHeader} /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminPage api={api} authHeader={authHeader} /> : <Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to={user ? '/marketplace' : '/'} />} />
          </Routes>
        </main>

        {/* Edit Profile Glass Modal */}
        {showEditProfileModal && user && (
          <EditProfileModal
            user={user}
            api={api}
            authHeader={authHeader}
            onUpdateUser={(updatedUser) => setUser(updatedUser)}
            onClose={() => setShowEditProfileModal(false)}
          />
        )}

        {/* Floating Glass Footer */}
        <footer className="mt-12 border-t border-stone-300/40 py-6 px-4">
          <div className="mx-auto max-w-7xl rounded-2xl glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-600">
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
              <span className="text-base">🎨</span>
              <span className="font-serif font-semibold text-stone-800">Art Supply Exchange</span>
              <span>— Swap, Sell, & Share Creative Tools Locally.</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span>Support Email:</span>
              <a href="mailto:artsupplyexchange2026@gmail.com" className="font-semibold text-terra-cotta hover:underline">
                artsupplyexchange2026@gmail.com
              </a>
              <span>•</span>
              <p>© {new Date().getFullYear()} Art Supply Exchange.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
