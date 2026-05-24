// src/pages/public/Landing.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { itemsApi } from '../../api/itemsApi'
import type { Item } from '../../types/database'
import ItemCard from '../../components/ui/ItemCard'
import { getSkeletonCards } from '../../components/ui/SkeletonLoader'
import DidYouKnow from '../../components/ui/DidYouKnow'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

export default function Landing() {
  const [previewItems, setPreviewItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const discoveriesRef = useRef<HTMLElement>(null)

  // Embla carousel setup with autoplay and loop
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true, // infinite circular movement
      align: 'start', // align items to start
      slidesToScroll: 1, // scroll one item at a time
      breakpoints: {
        '(min-width: 768px)': { slidesToScroll: 2 },
        '(min-width: 1024px)': { slidesToScroll: 3 },
      },
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })] // auto-slide every 3s
  )

  useEffect(() => {
    const fetchPreview = async () => {
      const { data } = await itemsApi.getAll({ limit: 12 })
      const typedItems =
        (data as any[])?.map((item) => ({
          ...item,
          profiles: item.profiles?.[0],
        })) ?? []
      setPreviewItems(typedItems as Item[])
      setLoading(false)
    }
    fetchPreview()
  }, [])

  const scrollToDiscoveries = () => {
    discoveriesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div id="main-content" className="bg-surface">
      {/* TopAppBar – simplified (no sidebar) */}
      <nav className="bg-surface/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="font-headline font-bold text-primary tracking-tighter text-headline-sm">
            FoundPath
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/login"
              className="text-on-surface-variant hover:text-primary transition-colors font-body text-label-md"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-primary text-on-primary px-6 py-2 rounded-xl font-headline font-bold text-label-md hover:scale-95 transition-transform"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section – full screen */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-surface-container">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover blur-[0.75px]"
              src="./project_site.png"
              alt="Campus Hall"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/5 via-surface/90 to-surface 50% to-100%"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-tight mb-6">
                Restoring Peace of Mind, <span className="text-primary">One Item at a Time</span>
              </h1>
              <p className="font-body text-lg md:text-xl text-on-surface-variant mb-10 leading-relaxed">
                A secure, community‑driven recovery ecosystem designed to transform the stress of
                lost belongings into a seamless, professional experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/inventory"
                  className="bg-primary text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-lg hover:scale-95 transition-all shadow-xl"
                >
                  Browse Inventory
                </Link>
                <Link
                  to="/report"
                  className="bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-headline font-bold text-lg hover:bg-surface-container-high transition-all"
                >
                  Report Found Item
                </Link>
              </div>
            </div>
          </div>

          {/* Scroll Down Arrow Indicator */}
          <div
            className="absolute bottom-50 left-1/2 transform -translate-x-1/2 cursor-pointer z-20 animate-bounce"
            onClick={scrollToDiscoveries}
            role="button"
            aria-label="Scroll to next section"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && scrollToDiscoveries()}
          >
            <span className="material-symbols-outlined text-primary text-9xl">
              keyboard_double_arrow_down
            </span>
          </div>
        </section>

        {/* Latest Discoveries – full screen */}
        <section
          ref={discoveriesRef}
          className="min-h-[90vh] bg-surface py-40" // removed flex centering
        >
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
                  Latest Discoveries
                </h2>
                <p className="font-body text-on-surface-variant mt-2">
                  Recently archived items awaiting their owners.
                </p>
              </div>
              <Link
                to="/inventory"
                className="hidden md:flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
              >
                View Archive <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>

            {loading ? (
              <>{getSkeletonCards(6)}</>
            ) : previewItems.length === 0 ? (
              <p className="text-center text-on-surface-variant">
                No items found. Check back later.
              </p>
            ) : (
              <div className="embla overflow-hidden" ref={emblaRef}>
                <div className="embla__container flex">
                  {previewItems.map((item) => (
                    <div
                      className="embla__slide min-w-0 flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-3"
                      key={item.id}
                    >
                      <ItemCard item={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DidYouKnow />
        </section>

        {/* Core Features – moves up into the padding */}
        <section className="min-h-screen bg-surface-container-low flex flex-col justify-center py-16 -mt-32 rounded-t-3xl relative z-10 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-4">
                The Archive Standards
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary via-primary/70 to-transparent mx-auto rounded-full"></div>
              <p className="font-body text-on-surface-variant mt-4 max-w-2xl mx-auto">
                FoundPath combines smart technology with community trust to restore belongings
                efficiently.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* 1. Smart Matching System */}
              <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 border border-primary/10 hover:border-primary/30">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary text-3xl">sync_alt</span>
                </div>
                <h3 className="font-headline text-xl font-bold mb-3">Smart Matching System</h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                  Automatic location‑based matching of lost and found items (same category, within
                  500m). Both parties receive an instant notification.
                </p>
              </div>

              {/* 2. Reputation / Trust System */}
              <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 border border-primary/10 hover:border-primary/30">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary text-3xl">verified</span>
                </div>
                <h3 className="font-headline text-xl font-bold mb-3">Reputation / Trust System</h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                  Earn +10 reputation for each successful return, lose −10 for false claims. Your
                  trust score is visible on every item card.
                </p>
              </div>

              {/* 3. Predictive Insights */}
              <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 border border-primary/10 hover:border-primary/30">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary text-3xl">insights</span>
                </div>
                <h3 className="font-headline text-xl font-bold mb-3">Predictive Insights</h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                  Real‑time filter by type (all/found/lost), category, and search by
                  title/description. Find exactly what you’re looking for.
                </p>
              </div>

              {/* 4. Community + Notification Intelligence */}
              <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 border border-primary/10 hover:border-primary/30">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    notifications_active
                  </span>
                </div>
                <h3 className="font-headline text-xl font-bold mb-3">Community + Notifications</h3>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed">
                  In‑app notifications for claim updates, smart matches, and “Found this” reports.
                  Stay informed without refreshing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works – diagonal layout on desktop */}
        <section className="py-60 mb-60 bg-surface relative overflow-hidden">
          {/* Decorative wave at top */}
          <div className="absolute top-0 left-0 w-full overflow-hidden leading-0">
            <svg
              className="relative block w-full h-12"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
                fill="var(--color-surface-container-low)"
                opacity="0.3"
              />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-4">
                How It Works
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-primary via-primary/70 to-transparent mx-auto rounded-full" />
              <p className="font-body text-on-surface-variant mt-4 max-w-2xl mx-auto">
                From reporting to recovery – a seamless process designed for the campus community.
              </p>
            </div>

            {/* Diagonal steps container */}
            <div className="relative">
              {/* Diagonal connecting line (desktop only)
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <line
            x1="8%"
            y1="30"
            x2="92%"
            y2="370"
            stroke="url(#diagonalGradient)"
            strokeWidth="3"
            strokeDasharray="8 8"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="diagonalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div> */}

              {/* Steps grid – diagonal positioning via margin-top and margin-left */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-0 relative">
                {/* Step 1 */}
                <div className="relative text-center lg:text-left lg:translate-x-0 lg:translate-y-0 lg:mt-4">
                  <div className="relative z-10 mx-auto lg:mx-0 w-20 h-20 mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-3xl">
                        add_circle
                      </span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                      1
                    </div>
                  </div>
                  <h3 className="font-headline text-xl font-bold mb-2">Report Item</h3>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                    Lost or found something? Submit a report with location, photo, and a security
                    question (for found items).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative text-center lg:text-left lg:translate-x-8 lg:translate-y-12">
                  <div className="relative z-10 mx-auto lg:mx-0 w-20 h-20 mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-3xl">
                        search
                      </span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                      2
                    </div>
                  </div>
                  <h3 className="font-headline text-xl font-bold mb-2">Smart Matching</h3>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                    Our system automatically notifies both parties when a lost and found item match
                    by category and location.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative text-center lg:text-left lg:translate-x-16 lg:translate-y-24">
                  <div className="relative z-10 mx-auto lg:mx-0 w-20 h-20 mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-3xl">
                        verified_user
                      </span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                      3
                    </div>
                  </div>
                  <h3 className="font-headline text-xl font-bold mb-2">Claim & Verify</h3>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                    Claimants answer the security question. The finder (Samaritan) reviews and
                    accepts or rejects the claim.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative text-center lg:text-left lg:translate-x-24 lg:translate-y-36">
                  <div className="relative z-10 mx-auto lg:mx-0 w-20 h-20 mb-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 border border-primary/20">
                      <span className="material-symbols-outlined text-primary text-3xl">
                        handshake
                      </span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                      4
                    </div>
                  </div>
                  <h3 className="font-headline text-xl font-bold mb-2">Handshake & Return</h3>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                    Communicate via email, arrange a safe meetup, and mark the item as resolved.
                    Earn +10 reputation!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA – bold, gradient background */}
        <section className="py-20  bg-gradient-to-br from-primary/90 via-primary to-primary-dim text-on-primary overflow-hidden relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
          </div>
          <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
            <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to restore peace of mind?
            </h2>
            <p className="text-lg md:text-xl opacity-95 mb-10 max-w-2xl mx-auto">
              Join the VSU community in making lost items find their way home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">person_add</span>
                Create Free Account
              </Link>
              <Link
                to="/report"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-dim text-white font-bold rounded-xl border border-white/20 hover:bg-primary hover:scale-105 transition-all"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Report an Item
              </Link>
            </div>
            <p className="text-sm opacity-80 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="underline font-bold hover:text-white/90">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* Footer – not full screen */}
      <footer className="bg-surface-container border-t border-outline-variant/15 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-8 md:mb-0">
            <div className="font-headline font-bold text-on-surface text-xl mb-2">FoundPath</div>
            <p className="text-on-surface-variant text-sm max-w-xs">
              © 2025 FoundPath. Community Recovery Network.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <a
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm"
              href="#"
            >
              Campus Safety
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="text-on-surface-variant hover:text-on-surface transition-colors text-sm"
              href="#"
            >
              Help Center
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
