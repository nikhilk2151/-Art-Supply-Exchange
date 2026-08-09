import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

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

const CATEGORIES = [
  { id: '', label: 'All Supplies', icon: '🎨' },
  { id: 'paint', label: 'Paints & Colors', icon: '🖌️' },
  { id: 'brush', label: 'Brushes & Knives', icon: '🎨' },
  { id: 'canvas', label: 'Canvas & Paper', icon: '🖼️' },
  { id: 'sketchbook', label: 'Sketchbooks', icon: '📓' },
  { id: 'tool', label: 'Studio Tools', icon: '📦' },
  { id: 'other', label: 'Other', icon: '✨' }
];

const isDemoListing = (item) => {
  if (!item || !item.seller) return false;
  const sellerEmail = (typeof item.seller === 'string' ? '' : item.seller.email || '').toLowerCase().trim();
  const sellerName = (typeof item.seller === 'string' ? '' : item.seller.name || '').toLowerCase().trim();
  return DEMO_EMAILS.includes(sellerEmail) || DEMO_NAMES.includes(sellerName);
};

export default function MarketplacePage({ api }) {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: initialCategory,
    condition: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    listingType: '',
    sort: 'newest'
  });

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const { data } = await api.get(`/listings?${params.toString()}`);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadListings(); }, [filters.category, filters.sort]);

  const activeFilterCount = [
    filters.condition,
    filters.city,
    filters.minPrice,
    filters.maxPrice,
    filters.listingType
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      condition: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      listingType: '',
      sort: 'newest'
    });
    setIsMobileFilterOpen(false);
    loadListings();
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header Glass Card Banner */}
      <div className="glass-card p-4 sm:p-8 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 sm:mb-2">
            <span>🎨</span> Creator Marketplace
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900">Discover Pre-Loved Art Supplies</h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">Explore authentic paints, brushes, canvases, and studio tools.</p>
        </div>

        {/* Search & Mobile Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] sm:w-64">
            <input
              className="w-full rounded-2xl border border-stone-300 bg-white/90 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
              placeholder="Search title or item..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && loadListings()}
            />
          </div>

          <select
            className="rounded-2xl border border-stone-300 bg-white/90 px-3 py-2 text-xs sm:text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 rounded-2xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-50"
          >
            <span>⚙️ Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-terra-cotta text-[10px] text-white font-extrabold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            className="glow-btn rounded-2xl px-4 sm:px-5 py-2 text-xs font-bold text-white uppercase tracking-wider shadow-sm hidden sm:inline-block"
            onClick={loadListings}
          >
            Search
          </button>
        </div>
      </div>

      {/* Flipkart-Style Horizontal Category Scroll Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilters({ ...filters, category: cat.id })}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
              filters.category === cat.id
                ? 'bg-terra-cotta text-white border-terra-cotta shadow-md scale-102'
                : 'bg-white/80 text-stone-700 border-stone-200/80 hover:bg-stone-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        {/* Desktop Sidebar Filters Glass Panel */}
        <aside className="hidden lg:block glass-card p-6 h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <span>⚙️</span> Refine Search
            </h3>
            {(filters.category || filters.condition || filters.city || filters.search || filters.minPrice || filters.maxPrice || filters.listingType) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-terra-cotta hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">Category</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="paint">Paint & Colors</option>
                <option value="brush">Brushes & Knives</option>
                <option value="canvas">Canvas & Pads</option>
                <option value="sketchbook">Sketchbooks</option>
                <option value="tool">Studio Tools</option>
                <option value="other">Other Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">Condition</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
              >
                <option value="">Any Condition</option>
                <option value="new">Brand New</option>
                <option value="like-new">Like New (Barely used)</option>
                <option value="used">Gently Used</option>
                <option value="worn">Well Loved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">City / Location</label>
              <input
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                placeholder="e.g. Mumbai, Delhi"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">Price Range (₹)</label>
              <div className="grid gap-2 grid-cols-2">
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                  placeholder="Min ₹"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs"
                  placeholder="Max ₹"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">Listing Type</label>
              <select
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
                value={filters.listingType}
                onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}
              >
                <option value="">All Types (Sell & Swap)</option>
                <option value="sell">For Sale</option>
                <option value="swap">For Swap</option>
                <option value="both">Both Sale & Swap</option>
              </select>
            </div>

            <button
              onClick={loadListings}
              className="w-full glow-btn rounded-xl py-2.5 text-xs font-bold text-white uppercase tracking-wider"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Mobile Filter Drawer / Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
            <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                  <span>⚙️</span> Refine Search
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="rounded-full bg-stone-100 p-1.5 text-stone-500 hover:bg-stone-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Condition</label>
                  <select
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
                    value={filters.condition}
                    onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                  >
                    <option value="">Any Condition</option>
                    <option value="new">Brand New</option>
                    <option value="like-new">Like New</option>
                    <option value="used">Gently Used</option>
                    <option value="worn">Well Loved</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City / Location</label>
                  <input
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                    placeholder="e.g. Mumbai, Delhi"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Price Range (₹)</label>
                  <div className="grid gap-2 grid-cols-2">
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                      placeholder="Min ₹"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    />
                    <input
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                      placeholder="Max ₹"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Listing Type</label>
                  <select
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                    value={filters.listingType}
                    onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}
                  >
                    <option value="">All Types (Sell & Swap)</option>
                    <option value="sell">For Sale</option>
                    <option value="swap">For Swap</option>
                    <option value="both">Both Sale & Swap</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={handleResetFilters}
                  className="w-1/3 rounded-xl border border-stone-300 bg-stone-100 py-2.5 text-xs font-bold text-stone-700"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    loadListings();
                    setIsMobileFilterOpen(false);
                  }}
                  className="w-2/3 glow-btn rounded-xl py-2.5 text-xs font-bold text-white uppercase tracking-wider"
                >
                  Show Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listings 2-Column Flipkart Style Card Grid */}
        <div>
          {loading ? (
            <div className="glass-card p-12 text-center text-stone-600 font-serif text-base sm:text-lg">
              Loading art listings...
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card p-8 sm:p-12 text-center space-y-3">
              <span className="text-3xl sm:text-4xl">🖌️</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">No Art Listings Found</h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                No items match your search filters right now. Try adjusting your category or city filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <Link
                  key={item._id}
                  to={`/listing/${item._id}`}
                  className="flipkart-card overflow-hidden flex flex-col group relative"
                >
                  {/* Image Container with Fixed Aspect Ratio */}
                  <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Overlaid Badges */}
                    <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start max-w-[85%]">
                      <span className="rounded-md bg-stone-900/80 backdrop-blur-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xs truncate max-w-full">
                        {item.category}
                      </span>
                      {isDemoListing(item) && (
                        <span className="rounded-md bg-amber-500/90 backdrop-blur-md px-1.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-stone-900 shadow-xs flex items-center gap-0.5 border border-amber-300">
                          <span>⚡</span>
                          <span>Demo</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="rounded-md bg-white/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-amber-900 shadow-xs border border-amber-200 uppercase tracking-wider">
                        {item.listingType}
                      </span>
                    </div>
                  </div>

                  {/* Compact Product Details */}
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-stone-900 group-hover:text-terra-cotta transition line-clamp-2 leading-snug min-h-[2.1rem] sm:min-h-[2.4rem]">
                        {item.title}
                      </h3>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-stone-100">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-extrabold text-sm sm:text-base text-terra-cotta">
                          ₹{item.price}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-medium text-stone-600 capitalize bg-stone-100 px-1.5 py-0.5 rounded">
                          {item.condition}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-stone-500 truncate">
                        <span className="truncate flex items-center gap-0.5">
                          <span>📍</span>
                          <span className="truncate">{item.city || 'Local'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
