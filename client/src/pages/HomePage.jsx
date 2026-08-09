import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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

export default function HomePage({ api }) {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    if (!api) return;
    api.get('/listings')
      .then(({ data }) => {
        setFeaturedItems((data.items || []).slice(0, 8));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingItems(false));
  }, [api]);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8 space-y-8 sm:space-y-12">
      {/* Main Glass Hero Card Template */}
      <section className="relative overflow-hidden glass-card p-5 sm:p-12 shadow-xl border border-white/80">
        {/* Glow Accent Blob */}
        <div className="absolute -top-24 -right-24 h-72 sm:h-96 w-72 sm:w-96 rounded-full bg-gradient-to-br from-amber-400/20 to-terra-cotta/20 blur-3xl pointer-events-none" />

        <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr] items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
              <span>✨</span>
              <span>Local Creator Exchange Network</span>
            </div>

            <h1 className="mt-3 sm:mt-4 font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-[1.18]">
              Trade spare supplies, <span className="text-transparent bg-clip-text bg-gradient-to-r from-terra-cotta via-amber-600 to-rose-600">save money</span>, and keep art alive.
            </h1>

            <p className="mt-3 sm:mt-5 text-sm sm:text-lg text-stone-700 leading-relaxed max-w-2xl">
              Swap paints, brushes, canvases, sketchbooks, and studio tools with nearby artists and creators in your city.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link to="/auth" className="glow-btn rounded-xl sm:rounded-2xl px-5 sm:px-7 py-2.5 sm:py-3.5 font-bold text-white shadow-md text-xs sm:text-base">
                Get Started
              </Link>
              <Link to="/marketplace" className="rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-300 px-5 sm:px-6 py-2.5 sm:py-3.5 font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs text-xs sm:text-base flex items-center gap-1.5">
                <span>🎨 Browse Marketplace</span>
              </Link>
            </div>
          </div>

          {/* Right Card Highlight Box */}
          <div className="space-y-3 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-terra-cotta/5 to-rose-500/10 p-4 sm:p-7 border border-white/60 shadow-inner">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <span>🌟</span> Why Artists Love Exchange
            </h3>
            <ul className="space-y-2.5 sm:space-y-3.5 text-xs sm:text-sm text-stone-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-sm sm:text-base">✓</span>
                <span><strong>Real Local Swaps:</strong> Trade directly with creators in your city.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-sm sm:text-base">✓</span>
                <span><strong>Zero Waste:</strong> Pass unused paint sets, brushes & canvases to fellow artists.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-sm sm:text-base">✓</span>
                <span><strong>Instant Messaging:</strong> Chat directly with sellers to coordinate pickup.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-sm sm:text-base">✓</span>
                <span><strong>Creator Friendly:</strong> Perfect for home studios, students & hobbyists.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Products Grid (Flipkart Mobile Style) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-terra-cotta">
              <span>🔥</span> Hot Trending
            </div>
            <h2 className="font-serif text-xl sm:text-3xl font-bold text-stone-900">Featured Art Supplies</h2>
          </div>
          <Link to="/marketplace" className="text-xs sm:text-sm font-bold text-terra-cotta hover:underline flex items-center gap-1">
            <span>View All ({featuredItems.length})</span>
            <span>→</span>
          </Link>
        </div>

        {loadingItems ? (
          <div className="glass-card p-8 text-center text-stone-600 text-sm font-serif">
            Loading trending supplies...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
            {featuredItems.map((item) => (
              <Link
                key={item._id}
                to={`/listing/${item._id}`}
                className="flipkart-card overflow-hidden flex flex-col group relative"
              >
                {/* Fixed Aspect Ratio Image */}
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
      </section>

      {/* Popular Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-3xl font-bold text-stone-900">Explore Categories</h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">Find pre-loved art supplies by category.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {[
            { icon: '🖌️', title: 'Paints & Colors', cat: 'paint', desc: 'Watercolors, acrylics, oils, gouache.' },
            { icon: '🎨', title: 'Brushes & Tools', cat: 'brush', desc: 'Round, flat, fan brushes & palette knives.' },
            { icon: '🖼️', title: 'Canvas & Paper', cat: 'canvas', desc: 'Stretched canvases & watercolor pads.' },
            { icon: '📦', title: 'Studio Gear', cat: 'tool', desc: 'Easels, drawing boards & storage boxes.' }
          ].map((cat, idx) => (
            <Link key={idx} to={`/marketplace?category=${cat.cat}`} className="glass-card glass-card-hover p-4 sm:p-6 block">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl sm:text-2xl mb-3">
                {cat.icon}
              </div>
              <h3 className="font-serif font-bold text-sm sm:text-lg text-stone-900">{cat.title}</h3>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-1 leading-relaxed">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 Step Workflow Card Template */}
      <section className="glass-card p-5 sm:p-10 border border-white/80 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-terra-cotta">Simple Workflow</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">How Art Exchange Works</h2>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {[
            { step: '01', title: 'Browse & Discover', desc: 'Find pre-loved art supplies listed by creators in your area.' },
            { step: '02', title: 'Connect & Propose', desc: 'Message the owner or send a swap proposal with your items.' },
            { step: '03', title: 'Exchange & Create', desc: 'Meet up locally or arrange shipping to start creating!' }
          ].map((item) => (
            <div key={item.step} className="rounded-2xl sm:rounded-3xl bg-white/60 p-4 sm:p-6 border border-stone-200/70 space-y-2">
              <span className="font-serif text-2xl sm:text-3xl font-extrabold text-terra-cotta/40">{item.step}</span>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">{item.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Support Section */}
      <section id="contact" className="glass-card p-5 sm:p-10 border border-white/80 space-y-6 shadow-lg">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-terra-cotta">Need Help?</span>
            <h2 className="mt-1 sm:mt-2 font-serif text-2xl sm:text-3xl font-bold text-stone-900">Get in Touch with Support</h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
              Have questions about swapping, platform safety, or listing art materials? Contact our official support team anytime.
            </p>
          </div>
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-terra-cotta/10 to-rose-500/10 p-4 sm:p-6 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-xl sm:text-2xl flex-shrink-0">
                ✉️
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900">Official Support Email</p>
                <a
                  href="mailto:artsupplyexchange2026@gmail.com"
                  className="font-serif text-sm sm:text-lg font-bold text-terra-cotta hover:underline break-all"
                >
                  artsupplyexchange2026@gmail.com
                </a>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-600">
              ⚡ Support responses are typically sent within 24 hours. Sign in with this email for admin access.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
