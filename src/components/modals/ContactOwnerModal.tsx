/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/modals/ContactOwnerModal.tsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../../lib/supabase'
import { openEmailThread } from '../../lib/mailto'
import { formatTime } from '../../utils/formatTime'
import type { Item } from '../../types/database'
import ImageCarousel from '../ui/ImageCarousel'
import { lostItemFindersApi } from '../../api/lostItemFindersApi'
import toast from 'react-hot-toast'

// Fix Leaflet icon paths (Vite specific)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ContactOwnerModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item
  onReportSuccess?: () => void
}

interface ReporterDetails {
  full_name: string
  email: string
  phone: string | null
}

export default function ContactOwnerModal({
  isOpen,
  onClose,
  item,
  onReportSuccess,
}: ContactOwnerModalProps) {
  const [reporter, setReporter] = useState<ReporterDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const hasLocation = item.location_lat && item.location_lng

  const [reporting, setReporting] = useState(false)
  const [hasReported, setHasReported] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay ensures the modal is rendered in the DOM before focusing
      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !item.reporter_id) return

    const fetchReporter = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', item.reporter_id)
        .single()

      if (!error && data) {
        setReporter(data)
      } else {
        console.error('Failed to fetch reporter details:', error)
      }
      setLoading(false)
    }

    fetchReporter()
  }, [isOpen, item.reporter_id])

  useEffect(() => {
    if (!isOpen) return
    const checkReported = async () => {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const reported = await lostItemFindersApi.hasReported(item.id, user.user.id)
        setHasReported(reported)
      }
    }
    checkReported()
  }, [isOpen, item.id])

  const handleFoundThis = async () => {
    if (hasReported) {
      toast.error('You have already reported this item.')
      return
    }
    setReporting(true)
    try {
      await lostItemFindersApi.report(item.id)
      toast.success('Owner has been notified! They may contact you.')
      setHasReported(true)
      if (onReportSuccess) onReportSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to report. You may have already reported.')
    } finally {
      setReporting(false)
    }
  }

  const handleEmail = () => {
    if (!reporter) return
    openEmailThread({
      toEmail: reporter.email,
      itemTitle: item.title,
      itemRef: item.reference_number,
      // claimTicket is omitted for lost items
    })
  }

  if (!isOpen) return null

  return createPortal(
    <div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-[1050] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        <button
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base md:text-xl">close</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row">
            {/* Left column */}
            <div className="w-full md:w-1/2 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-5 md:p-8 space-y-5 md:space-y-6">
              <div className="space-y-6 md:space-y-8">
                {item.image_urls && item.image_urls.length > 0 ? (
                  <ImageCarousel images={item.image_urls} alt={item.title} />
                ) : item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10"
                  />
                ) : null}

                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface font-headline">
                    {item.title}
                  </h2>
                  <p className="text-on-surface-variant leading-relaxed text-sm md:text-[15px] mt-2">
                    {item.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                        calendar_today
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                        Date
                      </p>
                      <p className="font-bold text-sm md:text-[15px] text-on-surface">
                        {item.incident_date
                          ? new Date(item.incident_date).toLocaleDateString()
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {item.incident_time && (
                    <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                          schedule
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                          Time
                        </p>
                        <p className="font-bold text-sm md:text-[15px] text-on-surface">
                          {formatTime(item.incident_time)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                        location_on
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                        Location
                      </p>
                      <p className="font-bold text-sm md:text-[15px] text-on-surface">
                        {item.location_building || item.location_name || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {hasLocation && (
                    <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-outline-variant/10 shadow-sm">
                      <div className="px-4 pt-3 pb-1 md:px-5 md:pt-4 md:pb-2 flex items-center gap-2">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[14px] md:text-[18px]">
                            map
                          </span>
                        </div>
                        <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                          Location Map
                        </p>
                      </div>
                      <div className="h-36 md:h-48 w-full">
                        <MapContainer
                          center={[item.location_lat!, item.location_lng!]}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                          zoomControl={false}
                          attributionControl={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[item.location_lat!, item.location_lng!]} />
                        </MapContainer>
                      </div>
                    </div>
                  )}

                  <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                        badge
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                        Reference
                      </p>
                      <p className="font-bold text-sm md:text-[15px] text-on-surface font-mono">
                        {item.reference_number}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile divider */}
            <div className="flex items-center gap-2 my-4 md:hidden">
              <div className="flex-1 border-t-2 border-dashed border-outline-variant/40"></div>
              <span className="material-symbols-outlined text-outline text-sm">drag_handle</span>
              <div className="flex-1 border-t-2 border-dashed border-outline-variant/40"></div>
            </div>

            {/* Right column */}
            <div className="flex-1 p-5 md:p-10 overflow-y-auto bg-white">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mb-3 md:mb-4">
                  Owner Verified
                </h1>
                <p className="text-on-surface-variant text-sm md:text-[15px] leading-relaxed mb-6 md:mb-8">
                  Great news! If you have found this item, you can notify the owner below. You can
                  now contact the owner directly to coordinate the return of their item.
                </p>

                <div className="space-y-6 md:space-y-10 mt-6 md:mt-8">
                  {loading ? (
                    <div className="text-center py-8 text-outline">Loading contact details...</div>
                  ) : reporter ? (
                    <div className="bg-surface-container-low/50 rounded-3xl p-4 md:p-6 border border-outline-variant/10 space-y-4">
                      <div className="flex items-center gap-3 md:gap-4 p-2 md:p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                            person
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                            Full Name
                          </p>
                          <p className="font-bold text-sm md:text-[15px] text-on-surface">
                            {reporter.full_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:gap-4 p-2 md:p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                            mail
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                            Email Address
                          </p>
                          <p className="font-bold text-sm md:text-[15px] text-on-surface">
                            {reporter.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 md:gap-4 p-2 md:p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                            call
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                            Contact Number
                          </p>
                          <p className="font-bold text-sm md:text-[15px] text-on-surface">
                            {reporter.phone || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-error">Unable to load owner contact.</div>
                  )}

                  <div className="pt-2 space-y-4">
                    <button
                    aria-label="Report found item to owner"
                      onClick={handleFoundThis}
                      disabled={hasReported || reporting}
                      className="group relative w-full py-3 md:py-4 bg-primary hover:bg-primary-dim text-on-primary rounded-2xl font-bold text-sm md:text-base shadow-[0_20px_40px_-12px_rgba(44,91,182,0.3)] hover:shadow-[0_20px_40px_-8px_rgba(44,91,182,0.4)] active:scale-[0.99] transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {hasReported
                          ? 'Already reported'
                          : reporting
                            ? 'Reporting...'
                            : 'Found this'}
                        {!hasReported && !reporting && (
                          <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                            check_circle
                          </span>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>

                    <button
                      onClick={handleEmail}
                      disabled={!reporter}
                      aria-label="Create email thread"
                      className="group relative w-full py-3 md:py-4 bg-primary hover:bg-primary-dim text-on-primary rounded-2xl font-bold text-sm md:text-base shadow-[0_20px_40px_-12px_rgba(44,91,182,0.3)] hover:shadow-[0_20px_40px_-8px_rgba(44,91,182,0.4)] active:scale-[0.99] transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Create Email Thread
                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                          mail
                        </span>
                      </span>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>

                  <div className="flex items-start gap-3 px-3 py-3 md:px-4 md:py-4 bg-surface-container-low rounded-2xl border border-surface-container-high/50">
                    <span className="material-symbols-outlined text-outline text-[14px] md:text-[18px] mt-0.5">
                      info
                    </span>
                    <p className="text-[10px] md:text-[12px] text-on-surface-variant leading-relaxed">
                      <span className="font-bold text-on-surface">What happens next?</span> After
                      clicking “Found this”, the owner will be notified. You may initiate the first
                      contact by clicking "Create Email Thread".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
