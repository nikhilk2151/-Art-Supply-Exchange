import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function ListingDetailPage({ api, user, authHeader }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Image Upload & Edit Modal state directly on Detail Page
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageModalMessage, setImageModalMessage] = useState(null);

  const loadListing = async () => {
    try {
      const { data } = await api.get(`/listings/${id}`);
      setListing(data.listing);
      setImagePreviews(data.listing?.images || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadListing(); }, [id]);

  const handleBuy = async () => {
    if (!user) return navigate('/auth');
    try {
      const { data } = await api.post('/transactions', { listing: id }, { headers: authHeader() });
      setFeedback('🛒 Purchase request created! Opening chat with seller...');
      setTimeout(() => {
        if (data?.conversationId) {
          navigate('/chat', { state: { conversationId: data.conversationId } });
        } else {
          navigate('/swaps');
        }
      }, 1000);
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to create buy request');
    }
  };

  const handleSwap = async () => {
    if (!user) return navigate('/auth');
    try {
      await api.post('/swaps', { listing: id, message: 'Interested in swapping for this item' }, { headers: authHeader() });
      navigate('/swaps');
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to send swap request');
    }
  };

  const handleMessage = async () => {
    if (!user) return navigate('/auth');
    try {
      const { data } = await api.post('/chats', { listingId: id, otherUserId: listing.seller._id }, { headers: authHeader() });
      navigate('/chat', { state: { conversationId: data.conversation._id } });
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to open chat');
    }
  };

  // Resize and compress image file for fast loading and database storage
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

  const handleFileSelection = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsResizing(true);
    setImageModalMessage(null);
    try {
      const resized = await Promise.all(files.map((f) => resizeAndCompressImage(f)));
      const valid = resized.filter(Boolean);
      setImagePreviews((prev) => [...prev, ...valid]);
      setImageModalMessage({ type: 'success', text: 'Photo selected! Click "Save Item Image" to apply.' });
    } catch (err) {
      setImageModalMessage({ type: 'error', text: 'Could not process image file.' });
    } finally {
      setIsResizing(false);
    }
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setImagePreviews((prev) => [...prev, url]);
    setUrlInput('');
    setImageModalMessage({ type: 'success', text: 'Image URL added! Click "Save Item Image" to apply.' });
  };

  const handleRemoveImage = (indexToRemove) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSaveImages = async () => {
    if (imagePreviews.length === 0) {
      setImageModalMessage({ type: 'error', text: 'Please upload at least one image file or paste an image URL.' });
      return;
    }

    setIsSavingImage(true);
    setImageModalMessage(null);

    try {
      const { data } = await api.put(`/listings/${id}`, { images: imagePreviews }, { headers: authHeader() });
      if (data.listing) {
        setListing(data.listing);
        setImagePreviews(data.listing.images || []);
        setActiveImageIndex(0);
        setFeedback('🎉 Product photo updated and saved in database! Other users will now see your new image.');
        setShowImageModal(false);
      }
    } catch (err) {
      setImageModalMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to save item image.'
      });
    } finally {
      setIsSavingImage(false);
    }
  };

  if (!listing) return <div className="mx-auto max-w-7xl px-4 py-8">Loading...</div>;

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

  const sellerEmail = (listing?.seller?.email || '').toLowerCase().trim();
  const sellerName = (listing?.seller?.name || '').toLowerCase().trim();
  const isDemoItem = listing?.seller && (DEMO_EMAILS.includes(sellerEmail) || DEMO_NAMES.includes(sellerName));
  const isAdmin = user?.role === 'admin';
  const isOwner = user && listing.seller && (listing.seller._id === user._id || listing.seller === user._id);
  const canEdit = isOwner || isAdmin;

  const displayImages = listing.images && listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=80'];

  const currentMainImage = displayImages[activeImageIndex] || displayImages[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {isDemoItem && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs sm:text-sm text-amber-900 flex items-center gap-2.5 shadow-xs font-semibold">
          <span className="text-base">⚡</span>
          <span>Official Demo Sample Product — This item is a demo supply item managed exclusively by Admin.</span>
        </div>
      )}

      {feedback && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs sm:text-sm font-bold text-emerald-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback('')} className="text-emerald-700 hover:text-emerald-950 font-bold text-sm">✕</button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.3fr,0.7fr]">
        {/* Main Image Display & Gallery Section */}
        <div className="space-y-4">
          <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-stone-200/80 bg-stone-100">
            <img
              src={currentMainImage}
              alt={listing.title}
              className="h-[280px] sm:h-[380px] md:h-[440px] w-full object-cover group-hover:scale-102 transition duration-500"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=80';
              }}
            />

            {/* Direct Upload / Change Photo Overlay Button for Seller/Admin */}
            {canEdit && (
              <button
                onClick={() => {
                  setImagePreviews(listing.images || []);
                  setImageModalMessage(null);
                  setShowImageModal(true);
                }}
                className="absolute top-4 right-4 bg-stone-900/85 hover:bg-stone-900 text-white backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold shadow-xl border border-white/30 flex items-center gap-2 transition"
              >
                <span>📷 Upload / Change Item Image</span>
              </button>
            )}
          </div>

          {/* Thumbnail Gallery Bar */}
          {displayImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {displayImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 rounded-2xl overflow-hidden h-20 w-20 border-2 transition ${
                    activeImageIndex === idx ? 'border-terra-cotta ring-2 ring-terra-cotta/30 scale-105' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <h1 className="mt-4 font-serif text-3xl font-bold text-charcoal">{listing.title}</h1>
          <p className="mt-3 text-stone-700 leading-relaxed text-sm sm:text-base">{listing.description}</p>

          {listing.swapPreferences && (
            <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Swap Preferences</p>
              <p className="mt-1 text-sm text-amber-900">{listing.swapPreferences}</p>
            </div>
          )}
        </div>

        {/* Item Details & Action Buttons */}
        <div className="space-y-4 rounded-3xl border border-stone-300 bg-white p-6 shadow-sm h-fit">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase font-semibold text-stone-600">{listing.category}</span>
            <span className="text-2xl font-bold text-charcoal">₹{listing.price}</span>
          </div>

          <div className="space-y-2 text-sm text-stone-600 border-t border-b border-stone-100 py-3">
            <p className="flex justify-between">
              <span>Condition:</span>
              <span className="font-bold text-stone-800 uppercase text-xs">{listing.condition}</span>
            </p>
            <p className="flex justify-between">
              <span>Location:</span>
              <span className="font-bold text-stone-800">{listing.city}, {listing.state}</span>
            </p>
            <p className="flex justify-between">
              <span>Type:</span>
              <span className="font-bold text-stone-800 uppercase text-xs">{listing.listingType}</span>
            </p>
          </div>

          {canEdit ? (
            <div className="rounded-2xl bg-stone-100 p-4 text-center text-sm font-medium text-stone-600 space-y-3">
              <p className="font-bold text-stone-800">{isAdmin ? 'Admin Management Mode' : 'Your Listing Control'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setImagePreviews(listing.images || []);
                    setImageModalMessage(null);
                    setShowImageModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2.5 text-xs font-bold text-white transition shadow-sm"
                >
                  📷 Change Image
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-terra-cotta hover:opacity-90 px-3 py-2.5 text-xs font-bold text-white transition shadow-sm"
                >
                  ✏️ Full Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(listing.listingType === 'sell' || listing.listingType === 'both') && (
                <button className="glow-btn rounded-xl px-4 py-3 font-bold text-white transition text-sm uppercase tracking-wider" onClick={handleBuy}>
                  Buy item (₹{listing.price})
                </button>
              )}
              {(listing.listingType === 'swap' || listing.listingType === 'both') && (
                <button className="rounded-xl border border-stone-300 px-4 py-2.5 font-semibold text-stone-800 hover:bg-stone-50 transition text-sm" onClick={handleSwap}>
                  Propose Swap
                </button>
              )}
              <button className="rounded-xl border border-terra-cotta/30 bg-terra-cotta/10 px-4 py-2.5 font-semibold text-terra-cotta hover:bg-terra-cotta hover:text-white transition text-sm" onClick={handleMessage}>
                💬 Message Seller
              </button>
            </div>
          )}

          <div className="rounded-2xl bg-stone-50 border border-stone-200/80 p-4 space-y-1">
            <p className="font-bold text-xs uppercase tracking-wider text-stone-500">Seller Info</p>
            <p className="text-sm font-bold text-stone-900">{listing.seller?.name || 'Local Creator'}</p>
            <p className="text-xs text-stone-500">{listing.seller?.city}, {listing.seller?.state}</p>
            {listing.seller?.bio && <p className="mt-2 text-xs text-stone-600 italic">"{listing.seller.bio}"</p>}
          </div>
        </div>
      </div>

      {/* Direct Item Image Upload & Management Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl bg-white/95">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-terra-cotta/15 text-terra-cotta text-xl font-bold">
                  📷
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">Upload & Save Item Image</h3>
                  <p className="text-xs text-stone-500">Upload a photo from your device or paste an image URL.</p>
                </div>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="rounded-full p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                ✕
              </button>
            </div>

            {imageModalMessage && (
              <div
                className={`mb-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  imageModalMessage.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                <span>{imageModalMessage.type === 'error' ? '⚠️' : '✅'}</span>
                <span>{imageModalMessage.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* File upload input */}
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 p-5 text-center cursor-pointer hover:bg-stone-50 transition bg-stone-50/50">
                <svg className="h-8 w-8 text-stone-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold text-stone-700">
                  {isResizing ? 'Optimizing & preparing photo...' : '📁 Click to Select Photo from Device'}
                </span>
                <span className="text-[11px] text-stone-400 mt-1">PNG, JPG, WEBP formats</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelection}
                  disabled={isResizing}
                  className="hidden"
                />
              </label>

              {/* URL paste input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="or paste direct image URL (https://...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-terra-cotta/30"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="rounded-xl bg-stone-800 text-white px-3.5 py-2 text-xs font-bold hover:bg-stone-900 transition"
                >
                  Add URL
                </button>
              </div>

              {/* Selected image previews */}
              {imagePreviews.length > 0 ? (
                <div>
                  <p className="text-xs font-bold text-stone-700 mb-2">Item Photos ({imagePreviews.length}):</p>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((img, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-stone-200">
                        <img src={img} alt={`Item Preview ${index + 1}`} className="h-20 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 text-xs shadow-md hover:bg-rose-700 transition"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-400 text-center py-2">No photo selected yet.</p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveImages}
                  disabled={isSavingImage || isResizing}
                  className="glow-btn rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingImage ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>💾 Save Item Image</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
