import { useState } from 'react';

const DUMMY_ACCOUNTS = [
  {
    name: 'Platform Admin',
    email: 'admin@example.com',
    role: 'admin',
    badge: '👑 Admin Lead',
    city: 'Mumbai',
    state: 'Maharashtra',
    tagline: 'Moderation, listings deletion, user bans',
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
    tagline: 'Swaps watercolor pans & detail brushes',
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
    tagline: 'Illustrator and printmaker in Delhi NCR',
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
    tagline: 'Large canvas packs & heavy sketchbooks',
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
    tagline: 'Acrylics, palette knives & drawing lamps',
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
    tagline: 'Palette knives, markers & studio oils',
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
    tagline: 'Poster colors, studio easels & brushes',
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

export default function TestAccountSwitcherModal({ isOpen, onClose, currentUser, onSwitchUser, api }) {
  const [switchingEmail, setSwitchingEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSwitch = async (account) => {
    if (currentUser?.email === account.email) return;

    setError('');
    setSwitchingEmail(account.email);
    try {
      const { data } = await api.post('/auth/login', {
        email: account.email,
        password: 'password123'
      });
      onSwitchUser(data.token, data.user);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to switch user');
    } finally {
      setSwitchingEmail('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-xl font-bold text-amber-800">
              ⚡
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">Switch Test Account</h3>
              <p className="text-xs text-stone-500 font-medium">
                Instantly switch persona to test buyer/seller interactions, swap offers, and chat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Account List */}
        <div className="my-4 overflow-y-auto space-y-2.5 pr-1 flex-1">
          {DUMMY_ACCOUNTS.map((acc) => {
            const isCurrent = currentUser?.email === acc.email;
            const isSwitching = switchingEmail === acc.email;

            return (
              <button
                key={acc.email}
                type="button"
                disabled={isCurrent || !!switchingEmail}
                onClick={() => handleSwitch(acc)}
                className={`w-full group flex items-center justify-between p-3 rounded-2xl border text-left transition shadow-xs cursor-pointer ${
                  isCurrent
                    ? 'border-terra-cotta/60 bg-terra-cotta/10'
                    : 'border-stone-200 bg-white hover:border-terra-cotta/40 hover:bg-stone-50 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name)}&background=c2593f&color=fff`;
                    }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">{acc.name}</span>
                      <span className="rounded-md bg-stone-900/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{acc.email} • {acc.city}</p>
                    <p className="text-[10px] text-stone-400 truncate italic">{acc.tagline}</p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isCurrent ? (
                    <span className="rounded-xl bg-terra-cotta text-white px-2.5 py-1 text-[11px] font-bold shadow-xs">
                      Active
                    </span>
                  ) : isSwitching ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-terra-cotta border-t-transparent" />
                  ) : (
                    <span className="text-xs font-bold text-stone-600 group-hover:text-terra-cotta transition">
                      Switch →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer Note */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>All test accounts use password: <strong className="text-stone-800 font-mono">password123</strong></span>
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
