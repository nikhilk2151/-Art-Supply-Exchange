import { useState } from 'react';

export default function EditProfileModal({ user, api, authHeader, onUpdateUser, onClose }) {
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text: '' }

  const email = user?.email || '';

  // Handle local image file upload
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
      setMessage({ type: 'success', text: 'Custom image selected! Click Save Profile to apply.' });
    };
    reader.readAsDataURL(file);
  };

  // Avatar presets
  const applyPresetAvatar = (seed) => {
    const presetUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
    setAvatar(presetUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name cannot be empty.' });
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
        bio: bio.trim()
      };

      const { data } = await api.put('/auth/profile', payload, { headers: authHeader() });
      if (data.user) {
        onUpdateUser(data.user);
        setMessage({ type: 'success', text: '🎉 Profile updated and saved to database!' });
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save profile changes. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl bg-white/95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-terra-cotta/15 text-terra-cotta text-xl font-bold shadow-xs">
              ✏️
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">Edit Your Profile</h3>
              <p className="text-xs text-stone-500">Update your photo, name, and details saved in your database account.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
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
          {/* Avatar / Photo Section */}
          <div className="rounded-2xl bg-stone-50/80 border border-stone-200/70 p-5 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Profile Photo & Avatar
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Photo Preview */}
              <div className="relative group">
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

              {/* Photo Action Buttons */}
              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 px-4 py-2 text-xs font-semibold shadow-2xs transition">
                    📁 Upload Photo File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[11px] text-stone-400 font-medium">or paste image URL below</span>
                </div>
              </div>
            </div>

            {/* Direct Image URL input */}
            <div>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/my-photo.jpg"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition"
              />
            </div>

            {/* Quick Preset Avatars */}
            <div>
              <p className="text-[11px] font-semibold text-stone-500 mb-2">Or choose an artist avatar preset:</p>
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

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition font-medium"
              />
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Email Address <span className="text-stone-400 font-normal">(Account ID)</span>
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full rounded-xl border border-stone-200 bg-stone-100 px-3.5 py-2.5 text-sm text-stone-500 cursor-not-allowed font-medium"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition"
              />
            </div>

            {/* Location (City & State) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Bio / Tagline */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Artist Bio / Tagline
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other artists about your favorite art mediums, location, or creative studio..."
              className="w-full rounded-xl border border-stone-300 bg-white p-3.5 text-xs text-stone-800 focus:border-terra-cotta focus:ring-2 focus:ring-terra-cotta/20 outline-none transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="glow-btn rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <span>💾 Save Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
