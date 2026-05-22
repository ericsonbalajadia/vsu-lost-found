// src/pages/NotFound.tsx
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function NotFound() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[--color-surface] flex items-center
                    justify-center px-6">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
           aria-hidden="true">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%]
                        bg-[--color-primary]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%]
                        rounded-full blur-[100px]"
             style={{ background: 'color-mix(in srgb, var(--color-secondary-container) 10%, transparent)' }} />
      </div>

      <div className="text-center max-w-sm w-full">
        {/* Large ghosted 404 behind icon */}
        <div className="relative mb-8 select-none" aria-hidden="true">
          <span className="text-[9rem] font-black leading-none font-headline
                           block text-[--color-primary]/8">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
                 style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}>
              <span
                className="material-symbols-outlined text-[--color-primary] text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                search_off
              </span>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-[--color-on-surface]
                       font-headline tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-[--color-on-surface-variant] leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={user ? '/inventory' : '/'}
            className="flex items-center justify-center gap-2 px-8 py-3.5
                       rounded-xl font-bold text-[--color-on-primary]
                       hover:opacity-90 active:scale-[0.98] transition-all"
            style={{
              background:
                'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
            }}
          >
            <span className="material-symbols-outlined text-lg"
                  aria-hidden="true">
              home
            </span>
            {user ? 'Back to Inventory' : 'Go to Home'}
          </Link>

          {!user && (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-8 py-3.5
                         rounded-xl font-bold border border-[--color-outline-variant]/30
                         text-[--color-on-surface]
                         hover:bg-[--color-surface-container] transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

        <p className="mt-10 text-[10px] text-[--color-outline] uppercase tracking-widest">
          FoundPath · VSU Lost & Found
        </p>
      </div>
    </div>
  )
}