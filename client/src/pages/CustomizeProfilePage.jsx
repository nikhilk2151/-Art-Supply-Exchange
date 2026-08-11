import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomizeProfilePage({ user, api, authHeader, onUpdateUser }) {
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city && user?.city !== 'Unknown' ? user.city : '');
  const [state, setState] = useState(user?.state && user?.state !== 'Unknown' ? user.state : '');
  const [bio, setBio] = useState(user?.bio || '');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Handle local image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      setMessage({ type: 'success', text: 'Custom profile picture selected!' });
    };
    reader.readAsDataURL(file);
  };

  // Avatar presets
  const applyPresetAvatar = (seed) => {
    const presetUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setAvatar(presetUrl);
    setMessage({ type: 'success', text: `Selected "${seed}" avatar preset!` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your full name.' });
      return;
    }
    if (!city.trim() || !state.trim()) {
      setMessage({ type: 'error', text: 'Please enter your City and State to help local artists find your listings.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        name: name.trim(),
        avatar: avatar.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        bio: bio.trim(),
        isProfileCompleted: true
      };

      const { data } = await api.put('/auth/profile', payload, { headers: authHeader() });
      if (data.user) {
        onUpdateUser(data.user);
        setMessage({ type: 'success', text: '🎉 Profile setup complete! Welcome to Art Supply Exchange.' });
        setTimeout(() => {
          navigate('/marketplace');
        }, 1000);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-3xl items-center justify-center px-4 py-8">
      <div className="w-full overflow-hidden glass-card rounded-3xl p-6 sm:p-10 border border-white/80 shadow-2xl bg-white/95 text-stone-800 space-y-6">
        {/* Onboarding Header Banner */}
        <div className="text-center space-y-2 border-b border-stone-200/80 pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-terra-cotta to-amber-500 text-white text-3xl font-bold shadow-md">
            🎨
          </div>
          <span className="inline-block rounded-full bg-terra-cotta/15 text-terra-cotta font-extrabold text-[11px] px-3.5 py-1 uppercase tracking-wider">
            Step 1 of 1 — Welcome Onboarding
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Customize Your Artist Profile</h1>
          <p className="text-sm text-stone-600 max-w-lg mx-auto">
            Welcome to <strong>Art Supply Exchange</strong>! Please complete your details below so nearby creators can connect with you to trade, buy, or share art supplies.
          </p>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'error'
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="rounded-2xl bg-stone-50/80 border border-stone-200/70 p-5 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Profile Photo & Avatar
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group flex-shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile Preview"
                    className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md bg-stone-200"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=c2593f&color=fff&bold=true`;
                    }}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-terra-cotta to-amber-500 flex items-center justify-center text-white text-3xl font-serif font-bold shadow-md border-4 border-white">
                    {(name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full h-6 w-6 text-xs flex items-center justify-center shadow-md hover:bg-rose-600 transition"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left w-full">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 px-4 py-2 text-xs font-semibold shadow-2xs transition">
                    📁 Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-stone-400 font-medium">or paste photo URL:</span>
                </div>

                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-stone-500 mb-2">Or choose an avatar preset:</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['artist', 'painter', 'sculptor', 'sketcher', 'designer', 'creator'].map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => applyPresetAvatar(seed)}
                    className="flex-shrink-0 rounded-full border-2 border-stone-200 hover:border-terra-cotta p-0.5 transition bg-white shadow-2xs"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      alt={seed}
                      className="h-8 w-8 rounded-full"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Phone Number <span className="text-stone-400 font-normal">(Optional for swap contacts)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Artist Bio / Favorite Mediums
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Oil painter & ceramic artist looking to swap unused brushes and canvases with local artists..."
              className="w-full rounded-xl border border-stone-300 bg-white p-3.5 text-xs text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-stone-200">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full glow-btn rounded-2xl py-3.5 text-sm font-bold text-white shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Save Profile & Start Using Website</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
