import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 space-y-12">
      {/* Main Glass Hero Card Template */}
      <section className="relative overflow-hidden glass-card p-8 sm:p-14 shadow-2xl border border-white/80">
        {/* Glow Accent Blob */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-amber-400/20 to-terra-cotta/20 blur-3xl pointer-events-none" />

        <div className="grid gap-8 lg:grid-cols-[1.3fr,0.7fr] items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <span>✨</span>
              <span>Local Creator Exchange Network</span>
            </div>

            <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-[1.15]">
              Trade spare supplies, <span className="text-transparent bg-clip-text bg-gradient-to-r from-terra-cotta via-amber-600 to-rose-600">save money</span>, and keep art alive.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl">
              Swap paints, brushes, canvases, sketchbooks, and tools with nearby artists, students, and studio creators in your city.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/auth" className="glow-btn rounded-2xl px-7 py-3.5 font-bold text-white shadow-lg text-base">
                Get Started
              </Link>
              <Link to="/auth" className="rounded-2xl border border-stone-300/80 bg-white/70 backdrop-blur-md px-6 py-3.5 font-semibold text-stone-800 hover:bg-white transition shadow-sm text-base">
                Login
              </Link>
              <Link to="/marketplace" className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-3.5 font-semibold text-amber-900 hover:bg-amber-100 transition shadow-sm text-base flex items-center gap-2">
                <span>🎨 Browse Listings</span>
              </Link>
            </div>
          </div>

          {/* Right Card Highlight Box */}
          <div className="space-y-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-terra-cotta/5 to-rose-500/10 p-6 sm:p-8 border border-white/60 shadow-inner">
            <h3 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
              <span>🌟</span> Why Artists Love Exchange
            </h3>
            <ul className="space-y-3.5 text-sm text-stone-700 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span><strong>Real Local Swaps:</strong> Trade directly with creators in your city.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span><strong>Zero Waste:</strong> Pass unused paint sets, brushes & canvases to fellow artists.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span><strong>Instant Messaging:</strong> Chat directly with sellers to coordinate pickup.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <span><strong>Creator Friendly:</strong> Perfect for home studios, students & hobbyists.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Popular Categories Card Template Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Explore Art Categories</h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">Find high-quality pre-loved art supplies by category.</p>
          </div>
          <Link to="/marketplace" className="text-xs sm:text-sm font-bold text-terra-cotta hover:underline flex items-center gap-1">
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '🖌️', title: 'Paints & Oils', desc: 'Watercolors, acrylics, oil tubes, gouache sets.' },
            { icon: '🎨', title: 'Brushes & Tools', desc: 'Round, flat, fan brushes, palette knives & rollers.' },
            { icon: '🖼️', title: 'Canvas & Paper', desc: 'Stretched canvases, watercolor pads, sketchbooks.' },
            { icon: '📦', title: 'Studio Gear', desc: 'Easels, drawing boards, lighting & storage boxes.' }
          ].map((cat, idx) => (
            <Link key={idx} to={`/marketplace?category=${encodeURIComponent(cat.title.split(' ')[0].toLowerCase())}`} className="glass-card glass-card-hover p-6 block">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-4">
                {cat.icon}
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900">{cat.title}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 Step Workflow Card Template */}
      <section className="glass-card p-8 sm:p-12 border border-white/80 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-terra-cotta">Simple Workflow</span>
          <h2 className="font-serif text-3xl font-bold text-stone-900">How Art Exchange Works</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: '01', title: 'Browse & Discover', desc: 'Find pre-loved art supplies listed by creators in your area.' },
            { step: '02', title: 'Connect & Propose', desc: 'Message the owner or send a swap proposal with your items.' },
            { step: '03', title: 'Exchange & Create', desc: 'Meet up locally or arrange shipping to start creating!' }
          ].map((item) => (
            <div key={item.step} className="rounded-3xl bg-white/60 p-6 border border-stone-200/70 space-y-3">
              <span className="font-serif text-3xl font-extrabold text-terra-cotta/40">{item.step}</span>
              <h3 className="font-serif font-bold text-lg text-stone-900">{item.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Support Section */}
      <section id="contact" className="glass-card p-8 sm:p-12 border border-white/80 space-y-6 shadow-xl">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-terra-cotta">Need Help or Have Questions?</span>
            <h2 className="mt-2 font-serif text-3xl font-bold text-stone-900">Get in Touch with Support</h2>
            <p className="mt-3 text-sm text-stone-600 leading-relaxed">
              Have questions about swapping, platform safety, or listing art materials? Contact our official administrator & support team anytime.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-terra-cotta/10 to-rose-500/10 p-6 border border-stone-200/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-2xl flex-shrink-0">
                ✉️
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Official Support & Admin Email</p>
                <a
                  href="mailto:artsupplyexchange2026@gmail.com"
                  className="font-serif text-base sm:text-lg font-bold text-terra-cotta hover:underline break-all"
                >
                  artsupplyexchange2026@gmail.com
                </a>
              </div>
            </div>
            <p className="text-xs text-stone-600">
              ⚡ Support responses are typically sent within 24 hours. Sign in with this email to access administrator privileges.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
