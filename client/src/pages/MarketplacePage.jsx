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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header Glass Card Banner */}
      <div className="glass-card p-6 sm:p-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <span>🎨</span> Creator Marketplace
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-900">Discover Pre-Loved Art Supplies</h1>
          <p className="text-sm text-stone-600 mt-1">Explore authentic paints, brushes, canvases, and tools shared by local artists.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <input
              className="w-full rounded-2xl border border-stone-300 bg-white/90 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
              placeholder="Search by title or tool..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && loadListings()}
            />
          </div>
          <select
            className="rounded-2xl border border-stone-300 bg-white/90 px-3.5 py-2.5 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-terra-cotta/40"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <button
            className="glow-btn rounded-2xl px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow-sm"
            onClick={loadListings}
          >
            Filter
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        {/* Sidebar Filters Glass Panel */}
        <aside className="glass-card p-6 h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <span>⚙️</span> Refine Search
            </h3>
            {(filters.category || filters.condition || filters.city || filters.search || filters.minPrice || filters.maxPrice || filters.listingType) && (
              <button
                onClick={() => {
                  setFilters({ search: '', category: '', condition: '', city: '', minPrice: '', maxPrice: '', listingType: '', sort: 'newest' });
                  loadListings();
                }}
                className="text-xs font-semibold text-terra-cotta hover:underline"
              >
                Reset
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

        {/* Listings Card Grid Template */}
        <div>
          {loading ? (
            <div className="glass-card p-12 text-center text-stone-600 font-serif text-lg">
              Loading art listings...
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card p-12 text-center space-y-3">
              <span className="text-4xl">🖌️</span>
              <h3 className="font-serif text-2xl font-bold text-stone-900">No Art Listings Found</h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                No items match your search filters right now. Try adjusting your category or city filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item._id}
                  to={`/listing/${item._id}`}
                  className="glass-card glass-card-hover overflow-hidden flex flex-col group"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80'}
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                        {item.category}
                      </span>
                      {isDemoListing(item) && (
                        <span className="rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-stone-900 shadow-md flex items-center gap-1 border border-amber-300">
                          <span>⚡</span>
                          <span>Demo Product</span>
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className="rounded-full bg-terra-cotta px-3 py-1 text-xs font-extrabold text-white shadow-md">
                        ₹{item.price}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-terra-cotta transition line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-500 font-medium">
                      <span className="flex items-center gap-1">
                        <span>📍</span>
                        <span>{item.city}, {item.state}</span>
                      </span>
                      <span className="uppercase tracking-wider font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {item.listingType}
                      </span>
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
