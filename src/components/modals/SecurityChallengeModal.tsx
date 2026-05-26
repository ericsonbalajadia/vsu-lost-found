/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// src/components/modals/SecurityChallengeModal.tsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { claimsApi } from '../../api/claimsApi'
import { formatTime } from '../../utils/formatTime'
import ImageCarousel from '../ui/ImageCarousel'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from 'react-hot-toast'
import type { Item } from '../../types/database'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface SecurityChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item
  userId: string
  onSuccess: () => void
}

export default function SecurityChallengeModal({
  isOpen,
  onClose,
  item,
  userId,
  onSuccess,
}: SecurityChallengeModalProps) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const hasLocation = !!(item.location_lat && item.location_lng)

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
    if (!isOpen) setAnswer('')
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) {
      toast.error('Please provide an answer')
      return
    }
    setSubmitting(true)
    try {
      await claimsApi.submit({
        item_id: item.id,
        claimant_id: userId,
        answer: answer.trim(),
      })
      toast.success('Claim submitted! The Samaritan will review your answer.')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit claim')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        <button
          aria-label="Close security challenge modal"
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
                  <div className="relative group">
                    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 bg-primary text-white text-[9px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-1 md:px-4 md:py-2 rounded-xl shadow-md ring-1 ring-white/20">
                      {item.type === 'found' ? 'Found' : 'Lost'}
                    </div>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10"
                    />
                  </div>
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
                  Security Challenge
                </h1>
                <p className="text-on-surface-variant text-sm md:text-[15px] leading-relaxed mb-6 md:mb-8">
                  This item is currently secured. To initiate a claim, please provide the unique
                  identifier requested by the finder.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  <div className="relative pl-4 md:pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-full"></div>
                    <label className="block text-[10px] md:text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-2 md:mb-3">
                      Verification Question
                    </label>
                    <p className="text-base md:text-lg font-medium text-on-surface leading-relaxed italic">
                      "{item.security_question || 'No question provided. Please contact support.'}"
                    </p>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label
                      htmlFor="answer"
                      className="block text-sm font-bold text-on-surface ml-1"
                    >
                      Your Detailed Description
                    </label>
                    <textarea
                      id="answer"
                      rows={4}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl p-4 md:p-5 text-on-surface focus:ring-4 focus:ring-primary/5 focus:border-primary/40 focus:bg-white transition-all placeholder:text-outline/60 resize-none leading-relaxed text-sm md:text-base"
                      placeholder="Example: The lock screen is a photo of a golden retriever..."
                      required
                    />
                  </div>

                  <div className="pt-2 space-y-4 md:space-y-6">
                    <button
                    aria-label="Submit your answer to verify ownership and start the claim process"
                      type="submit"
                      disabled={submitting}
                      className="group relative w-full py-3 md:py-4 bg-primary hover:bg-primary-dim text-on-primary rounded-2xl font-bold text-sm md:text-base shadow-[0_20px_40px_-12px_rgba(44,91,182,0.3)] hover:shadow-[0_20px_40px_-8px_rgba(44,91,182,0.4)] active:scale-[0.99] transition-all duration-300 overflow-hidden disabled:opacity-60"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {submitting ? 'Submitting...' : 'Verify & Start Claim'}
                        {!submitting && (
                          <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                            verified
                          </span>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>

                    <div className="flex items-start gap-3 px-3 py-3 md:px-4 md:py-4 bg-surface-container-low rounded-2xl border border-surface-container-high/50">
                      <span className="material-symbols-outlined text-outline text-[14px] md:text-[18px] mt-0.5">
                        info
                      </span>
                      <p className="text-[10px] md:text-[12px] text-on-surface-variant leading-relaxed">
                        <span className="font-bold text-on-surface">Verification Review:</span> Your
                        submission will be manually reviewed by the founder within 24 hours. Once
                        verified, you will receive an email to coordinate the return of your item.
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
