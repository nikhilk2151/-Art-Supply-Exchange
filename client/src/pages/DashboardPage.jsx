import { useEffect, useState } from 'react';

const emptyForm = {
  title: '',
  description: '',
  category: 'paint',
  condition: 'used',
  price: 0,
  listingType: 'sell',
  swapPreferences: '',
  city: '',
  state: '',
  images: []
};

export default function DashboardPage({ user, api, authHeader }) {
  const [listings, setListings] = useState([]);
  const [pendingSwapsCount, setPendingSwapsCount] = useState(0);
  const [chatsCount, setChatsCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, city: user?.city || '', state: user?.state || '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    try {
      const [listingsRes, swapsRes, buysRes, chatsRes] = await Promise.all([
        api.get('/listings/mine', { headers: authHeader() }),
        api.get('/swaps/received', { headers: authHeader() }),
        api.get('/transactions/received', { headers: authHeader() }),
        api.get('/chats', { headers: authHeader() })
      ]);
      setListings(listingsRes.data.items || []);
      const pendingSwaps = (swapsRes.data.swaps || []).filter((s) => s.status === 'pending');
      const pendingBuys = (buysRes.data.transactions || []).filter((b) => b.status === 'pending');
      setPendingSwapsCount(pendingSwaps.length + pendingBuys.length);
      setChatsCount((chatsRes.data.conversations || []).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ ...emptyForm, city: user?.city || '', state: user?.state || '' });
    setEditingListing(null);
    setImageFiles([]);
    setImagePreviews([]);
    setUrlInput('');
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), url]
    }));
    setImagePreviews((prev) => [...prev, url]);
    setUrlInput('');
  };

  const DEMO_EMAILS = [
    'asha@example.com',
    'rohan@example.com',
    'meera@example.com',
    'karan@example.com',
    'nisha@example.com',
    'vikram@example.com',
    'admin@example.com'
  ];

  const DEMO_NAMES = [
    'asha menon',
    'rohan sharma',
    'meera iyer',
    'karan patel',
    'nisha rao',
    'vikram sood',
    'nikhil (admin)'
  ];

  const isDemoAccount = user && (DEMO_EMAILS.includes((user.email || '').toLowerCase().trim()) || DEMO_NAMES.includes((user.name || '').toLowerCase().trim()));
  const isAdmin = user?.role === 'admin';

  const handleOpenCreateModal = () => {
    if (isDemoAccount && !isAdmin) {
      alert('Demo Persona Notice: This is a read-only sample account. Please sign in with your Google account to create and publish your own listings!');
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const handleEditClick = (listing) => {
    const sellerEmail = (listing.seller?.email || '').toLowerCase().trim();
    const isListingDemo = sellerEmail && DEMO_EMAILS.includes(sellerEmail);

    if ((isDemoAccount || isListingDemo) && !isAdmin) {
      alert('Demo Persona Notice: Demo sample listings are protected and can only be managed by the Admin account (artsupplyexchange2026@gmail.com). Sign in with your Google account to create & edit your own items!');
      return;
    }

    setEditingListing(listing);
    setForm({
      title: listing.title || '',
      description: listing.description || '',
      category: listing.category || 'paint',
      condition: listing.condition || 'used',
      price: listing.price || 0,
      listingType: listing.listingType || 'sell',
      swapPreferences: listing.swapPreferences || '',
      city: listing.city || user?.city || '',
      state: listing.state || user?.state || '',
      images: listing.images || []
    });
    setImageFiles([]);
    setImagePreviews(listing.images || []);
    setShowModal(true);
  };

  const [isResizing, setIsResizing] = useState(false);

  const resizeAndCompressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.75) => {
    return new Promise((resolve) => {
      if (typeof file === 'string') return resolve(file);

      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img = new Image();
        img.onerror = () => resolve(dataUrl);
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);

          const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(resizedDataUrl || dataUrl);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsResizing(true);
    try {
      const resizedImages = await Promise.all(files.map((file) => resizeAndCompressImage(file)));
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...resizedImages]
      }));
      setImagePreviews((prev) => [...prev, ...resizedImages]);
    } catch (err) {
      console.error('Image auto-resize failed:', err);
      alert('Failed to auto-resize selected image.');
    } finally {
      setIsResizing(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, index) => index !== indexToRemove)
    }));
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isDemoAccount && !isAdmin) {
      alert('Demo Persona Notice: Please sign in with your Google account to save listings.');
      return;
    }
    setIsUploading(true);

    try {
      const images = (imagePreviews && imagePreviews.length > 0)
        ? imagePreviews
        : (form.images && form.images.length > 0 ? form.images : []);

      const payload = {
        ...form,
        price: Number(form.price) || 0,
        city: form.city || user?.city || 'Unknown',
        state: form.state || user?.state || 'Unknown',
        images
      };

      if (editingListing) {
        await api.put(`/listings/${editingListing._id}`, payload, { headers: authHeader() });
      } else {
        await api.post('/listings', payload, { headers: authHeader() });
      }

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Unable to save listing right now.';
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStatus = async (id, status) => {
    const targetListing = listings.find((item) => item._id === id);
    const sellerEmail = (targetListing?.seller?.email || '').toLowerCase().trim();
    const isListingDemo = sellerEmail && DEMO_EMAILS.includes(sellerEmail);

    if ((isDemoAccount || isListingDemo) && !isAdmin) {
      alert('Demo Persona Notice: Demo sample listings can only be managed by the Admin account (artsupplyexchange2026@gmail.com).');
      return;
    }

    try {
      await api.patch(`/listings/${id}/status`, { status }, { headers: authHeader() });
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    const targetListing = listings.find((item) => item._id === id);
    const sellerEmail = (targetListing?.seller?.email || '').toLowerCase().trim();
    const isListingDemo = sellerEmail && DEMO_EMAILS.includes(sellerEmail);

    if ((isDemoAccount || isListingDemo) && !isAdmin) {
      alert('Demo Persona Notice: Demo sample listings can only be deleted by the Admin account (artsupplyexchange2026@gmail.com).');
      return;
    }

    try {
      await api.delete(`/listings/${id}`, { headers: authHeader() });
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete listing');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {isDemoAccount && !isAdmin && (
        <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs sm:text-sm text-amber-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base">ℹ️</span>
            <span>
              <strong>Demo Persona Mode ({user?.name}):</strong> You are exploring a sample demo persona. Demo sample listings are protected and can only be managed by the <strong>Admin account</strong> (artsupplyexchange2026@gmail.com). Log in with your personal Google account to create & manage your own listings!
            </span>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-serif text-3xl">Welcome back, {user?.name}</p>
          <p className="text-sm text-stone-600">
            {isAdmin ? 'Platform Admin Collection & Management.' : 'Manage your listings and keep track of activity.'}
          </p>
        </div>
        <button
          className="glow-btn rounded-2xl px-5 py-2.5 font-bold text-white shadow-lg shadow-terra-cotta/20 flex items-center gap-2 hover:scale-105 transition cursor-pointer text-sm"
          onClick={handleOpenCreateModal}
        >
          <span>✨</span>
          <span>Create Listing</span>
        </button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-300 bg-white p-4 shadow-sm"><p className="text-sm text-stone-500 font-medium">Active listings</p><p className="mt-2 text-2xl font-semibold text-charcoal">{listings.filter((item) => item.status === 'available').length}</p></div>
        <div className="rounded-2xl border border-stone-300 bg-white p-4 shadow-sm"><p className="text-sm text-stone-500 font-medium">Pending swap requests</p><p className="mt-2 text-2xl font-semibold text-charcoal">{pendingSwapsCount}</p></div>
        <div className="rounded-2xl border border-stone-300 bg-white p-4 shadow-sm"><p className="text-sm text-stone-500 font-medium">Active conversations</p><p className="mt-2 text-2xl font-semibold text-charcoal">{chatsCount}</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <div key={listing._id} className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm">
            {listing.images?.length > 0 ? (
              <img src={listing.images[0]} alt={listing.title} className="mb-3 h-40 w-full rounded-2xl object-cover" />
            ) : (
              <div className="mb-3 flex h-40 items-center justify-center rounded-2xl bg-stone-100 text-sm text-stone-500">No image</div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase font-semibold text-stone-700">{listing.category}</span>
                {(isDemoAccount || (listing.seller && (DEMO_EMAILS.includes((listing.seller.email || '').toLowerCase().trim()) || DEMO_NAMES.includes((listing.seller.name || '').toLowerCase().trim())))) && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900 shadow-2xs flex items-center gap-1">
                    <span>⚡</span>
                    <span>Demo Product</span>
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-charcoal">₹{listing.price}</span>
            </div>
            <h3 className="mt-3 font-semibold text-charcoal">{listing.title}</h3>
            {isAdmin && listing.seller?.name && (
              <p className="mt-1 text-xs font-semibold text-amber-700">Listed by: {listing.seller.name}</p>
            )}
            <p className="mt-2 text-sm text-stone-600 line-clamp-2">{listing.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                className="rounded-full border border-stone-300 bg-stone-50 px-3.5 py-1 text-xs font-semibold text-charcoal hover:bg-stone-100 transition flex items-center gap-1"
                onClick={() => handleEditClick(listing)}
              >
                <svg className="h-3.5 w-3.5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
              <button className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium hover:bg-stone-50 transition" onClick={() => handleStatus(listing._id, 'sold')}>
                {listing.status === 'sold' ? 'Sold' : 'Mark sold'}
              </button>
              <button className="rounded-full border border-red-200 bg-red-50 text-red-700 px-3 py-1 text-xs font-medium hover:bg-red-100 transition" onClick={() => handleDelete(listing._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-charcoal">
                  {editingListing ? 'Edit Listing' : 'Create a New Listing'}
                </h2>
                <p className="text-xs text-stone-500 mt-1">
                  {editingListing ? 'Update the details for your art supply item.' : 'Fill in the details below to publish your art supplies.'}
                </p>
              </div>
              <button
                className="rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200 transition"
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Listing Title <span className="text-terra-cotta">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                  placeholder="e.g. Winsor & Newton Cotman Watercolor Set"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Item Description <span className="text-terra-cotta">*</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                  rows="3"
                  placeholder="Describe the condition, usage, colors, or specifications..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Category <span className="text-terra-cotta">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40 bg-white"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="paint">Paint</option>
                    <option value="brush">Brush</option>
                    <option value="canvas">Canvas</option>
                    <option value="sketchbook">Sketchbook</option>
                    <option value="tool">Tool / Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Condition <span className="text-terra-cotta">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40 bg-white"
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  >
                    <option value="new">Brand New</option>
                    <option value="like-new">Like New</option>
                    <option value="used">Used</option>
                    <option value="worn">Worn / Partially Used</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Price (₹) <span className="text-terra-cotta">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-stone-500 font-semibold text-sm">₹</span>
                    <input
                      className="w-full rounded-xl border border-stone-300 pl-8 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                      type="number"
                      min="0"
                      placeholder="0 (Enter price in INR)"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    Listing Type <span className="text-terra-cotta">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40 bg-white"
                    value={form.listingType}
                    onChange={(e) => setForm({ ...form, listingType: e.target.value })}
                  >
                    <option value="sell">Sell Only</option>
                    <option value="swap">Swap Only</option>
                    <option value="both">Open for Sell or Swap</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Swap Preferences <span className="text-xs font-normal text-stone-400">(Optional)</span>
                </label>
                <input
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                  placeholder="e.g. Interested in acrylic brushes or sketchbook"
                  value={form.swapPreferences}
                  onChange={(e) => setForm({ ...form, swapPreferences: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    City <span className="text-terra-cotta">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                    State <span className="text-terra-cotta">*</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                    placeholder="e.g. Maharashtra"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Product Images <span className="text-xs font-normal text-stone-400">(Upload file or paste URL)</span>
                  </label>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ⚡ Instant High-Quality Photos
                  </span>
                </div>
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 p-4 text-center cursor-pointer hover:bg-stone-50 transition">
                  <svg className="h-8 w-8 text-stone-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-stone-600">
                    {isResizing ? 'Auto-resizing & optimizing photos...' : '📁 Click to select photo files from device'}
                  </span>
                  <span className="text-[11px] text-stone-400 mt-0.5">Supports PNG, JPG, WEBP formats</span>
                  <input className="hidden" type="file" accept="image/*" multiple onChange={handleImageSelection} disabled={isResizing} />
                </label>

                <div className="mt-2.5 flex gap-2">
                  <input
                    type="url"
                    placeholder="or paste direct image URL (https://...)"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    className="rounded-xl bg-stone-800 text-white px-3.5 py-2 text-xs font-semibold hover:bg-stone-900 transition"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid gap-2 sm:grid-cols-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-stone-200">
                      <img src={preview} alt={`Preview ${index + 1}`} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-90 hover:bg-red-600 transition"
                        title="Remove photo"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  className="w-full rounded-xl bg-terra-cotta py-3 font-semibold text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
                  type="submit"
                  disabled={isUploading}
                >
                  {isUploading ? (editingListing ? 'Saving Changes...' : 'Uploading & Publishing...') : (editingListing ? 'Save Changes' : 'Publish Listing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
