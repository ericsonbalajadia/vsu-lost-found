/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// src/components/modals/SamaritanItemModal.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { claimsApi } from '../../api/claimsApi'
import { formatTime } from '../../utils/formatTime'
import ImageCarousel from '../ui/ImageCarousel'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import HandshakeModal from './HandshakeModal'
import toast from 'react-hot-toast'
import type { Item } from '../../types/database'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Claim {
  id: string
  ticket_number: string
  answer: string
  status: string
  created_at: string
  profiles: {
    full_name: string
    email: string
    avatar_url: string | null
    reputation: number
  }[]
}

interface SamaritanItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item
  onRefresh?: () => void
}

export default function SamaritanItemModal({
  isOpen,
  onClose,
  item,
  onRefresh,
}: SamaritanItemModalProps) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null)
  const [handshakeClaimId, setHandshakeClaimId] = useState<string | null>(null)
  const [privateNotes, setPrivateNotes] = useState<string | null>(null)
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

const fetchClaims = useCallback(async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('claims')
    .select(`
      id,
      ticket_number,
      answer,
      status,
      created_at,
      profiles!claimant_id (
        full_name,
        email,
        avatar_url,
        reputation
      )
    `)
    .eq('item_id', item.id)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false });
  if (!error && data) setClaims(data as Claim[]);
  setLoading(false);
}, [item.id]);

  useEffect(() => {
    if (!isOpen || !item.id) return
    fetchClaims()
  }, [isOpen, item.id, fetchClaims])

  // Fetch samaritan_notes separately (not included in public item data)
  useEffect(() => {
    if (!isOpen || !item.id) return
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('samaritan_notes')
        .eq('id', item.id)
        .single()
      if (!error && data) {
        setPrivateNotes(data.samaritan_notes)
      }
    }
    fetchNotes()
  }, [isOpen, item.id])

  const handleAccept = async (claimId: string) => {
    setProcessingId(claimId)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')
      await claimsApi.acceptBySamaritan(claimId, user.user.id)
      toast.success('Claim accepted. Handshake modal opened.')
      await fetchClaims() // refresh to show the accepted claim with "View Handshake" button
      setHandshakeClaimId(claimId)
    } catch {
      toast.error('Failed to accept claim')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (claimId: string) => {
    setProcessingId(claimId)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')
      await claimsApi.penalize(claimId, user.user.id)
      toast.success('Claim rejected and claimant penalized (-10 reputation).')
      await fetchClaims()
      if (onRefresh) onRefresh()
    } catch {
      toast.error('Failed to reject claim')
    } finally {
      setProcessingId(null)
      setShowRejectConfirm(null)
    }
  }

  const handleHandshakeClose = () => {
    setHandshakeClaimId(null)
    fetchClaims() // refresh after complete handover if needed
  }

  if (!isOpen) return null

  return createPortal(
    <div ref={modalRef} tabIndex={-1} className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        {/* Close button */}
        <button
          aria-label="Close item details modal"
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base md:text-xl">close</span>
        </button>

        {/* Mobile: whole modal scrollable */}
        <div className="block md:hidden overflow-y-auto p-4 space-y-6">
          {/* Left column content (mobile) */}
          <div className="space-y-6">
            <div className="relative">
              {item.image_urls && item.image_urls.length > 0 ? (
                <ImageCarousel images={item.image_urls} alt={item.title} />
              ) : item.image_url ? (
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10 bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg shadow-sm">
                    {item.type === 'found' ? 'Found' : 'Lost'}
                  </div>
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm"
                  />
                </div>
              ) : null}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface font-headline">
                {item.title}
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-sm mt-2">
                {item.description || 'No description provided.'}
              </p>
            </div>
            <div className="space-y-3">
              <div className="bg-white px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                <div>
                  <p className="text-[9px] uppercase font-bold text-outline">Date Found</p>
                  <p className="font-bold text-sm">
                    {item.incident_date
                      ? new Date(item.incident_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </div>
              {item.incident_time && (
                <div className="bg-white px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-outline">Time Found</p>
                    <p className="font-bold text-sm">{formatTime(item.incident_time)}</p>
                  </div>
                </div>
              )}
              <div className="bg-white px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <p className="text-[9px] uppercase font-bold text-outline">Location</p>
                  <p className="font-bold text-sm">
                    {item.location_building || item.location_name || 'General Campus'}
                  </p>
                </div>
              </div>
              {hasLocation && (
                <div className="rounded-xl overflow-hidden">
                  <MapContainer
                    center={[item.location_lat!, item.location_lng!]}
                    zoom={15}
                    style={{ height: '150px', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[item.location_lat!, item.location_lng!]} />
                  </MapContainer>
                </div>
              )}
              <div className="bg-white px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <span className="material-symbols-outlined text-primary">badge</span>
                <div>
                  <p className="text-[9px] uppercase font-bold text-outline">Reference</p>
                  <p className="font-mono text-sm">{item.reference_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column content (mobile) */}
          <div className="space-y-4">
            <div className="bg-surface-container-low rounded-xl p-4">
              <h3 className="text-lg font-extrabold">Confirmed Claimant</h3>
              <p className="text-xs text-on-surface-variant">
                Review and manage verified claimant information.
              </p>
              <div className="flex justify-between items-center mt-2">
                <div className="bg-surface-container-lowest px-3 py-1 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span className="text-xs font-bold">{claims.length} Total</span>
                </div>
              </div>
              {privateNotes && (
                <div className="mt-3 bg-primary-container/10 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-primary uppercase">Your Private Notes</p>
                  <p className="text-sm italic">“{privateNotes}”</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-on-surface-variant">Loading claims...</div>
              ) : claims.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  No claims for this item.
                </div>
              ) : (
                claims.map((claim) => {
                  const isAccepted = claim.status === 'accepted'
                  return (
                    <div
                      key={claim.id}
                      className="bg-white rounded-2xl p-4 border border-outline-variant/10 shadow-sm"
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          {claim.profiles[0]?.avatar_url ? (
                            <img
                              src={claim.profiles[0].avatar_url}
                              alt={claim.profiles[0].full_name}
                              className="w-10 h-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                              <span className="material-symbols-outlined">person</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <h4 className="text-base font-extrabold">
                                {claim.profiles[0]?.full_name || 'Unknown'}
                              </h4>
                              <div className="flex items-center gap-1 text-[10px] text-outline mt-0.5">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                Submitted {new Date(claim.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isAccepted ? (
                                <button
                                aria-label="View handshake details for this claim"
                                  onClick={() => setHandshakeClaimId(claim.id)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary text-white shadow-sm"
                                >
                                  View Handshake
                                </button>
                              ) : (
                                <>
                                  <button
                                    aria-label="Decline this claim"
                                    onClick={() => setShowRejectConfirm(claim.id)}
                                    disabled={processingId === claim.id}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold border border-error/30 text-error"
                                  >
                                    Decline
                                  </button>
                                  <button
                                    aria-label="Accept this claim"
                                    onClick={() => handleAccept(claim.id)}
                                    disabled={processingId === claim.id}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary text-white shadow-sm"
                                  >
                                    Accept
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="bg-surface-container-low/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-primary mb-1">
                              <span className="material-symbols-outlined text-sm">chat</span>
                              <span className="text-[8px] uppercase font-black">
                                Claimant’s Answer
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg text-xs">{claim.answer}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Desktop: two‑column with fixed header and scrollable claims list */}
        <div className="hidden md:flex flex-1 min-h-0">
          {/* LEFT COLUMN – scrollable independently */}
          <div className="w-[420px] shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-5 md:p-8 space-y-6 md:space-y-8">
            <div className="relative group">
              {item.image_urls && item.image_urls.length > 0 ? (
                <ImageCarousel images={item.image_urls} alt={item.title} />
              ) : item.image_url ? (
                <div className="relative">
                  <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 bg-primary text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 md:px-3 md:py-1.5 rounded-lg shadow-sm ring-1 ring-white/20">
                    {item.type === 'found' ? 'Found' : 'Lost'}
                  </div>
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface font-headline">
                  {item.title}
                </h2>
                <p className="text-on-surface-variant leading-relaxed text-sm md:text-base mt-2">
                  {item.description || 'Recovered item – no description provided.'}
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* Date chip */}
                <div className="bg-surface-container-lowest px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-3 md:gap-4 ring-1 ring-outline-variant/10">
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px] md:text-[20px]">
                      calendar_today
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] uppercase font-bold text-outline tracking-wider">
                      Date Found
                    </p>
                    <p className="font-bold text-xs md:text-sm text-on-surface">
                      {item.incident_date
                        ? new Date(item.incident_date).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Time chip */}
                {item.incident_time && (
                  <div className="bg-surface-container-lowest px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-3 md:gap-4 ring-1 ring-outline-variant/10">
                    <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[16px] md:text-[20px]">
                        schedule
                      </span>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] uppercase font-bold text-outline tracking-wider">
                        Time Found
                      </p>
                      <p className="font-bold text-xs md:text-sm text-on-surface">
                        {formatTime(item.incident_time)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location chip */}
                <div className="bg-surface-container-lowest px-3 py-2 md:px-4 md:py-3 rounded-xl flex items-center gap-3 md:gap-4 ring-1 ring-outline-variant/10">
                  <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px] md:text-[20px]">
                      location_on
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] uppercase font-bold text-outline tracking-wider">
                      Location
                    </p>
                    <p className="font-bold text-xs md:text-sm text-on-surface">
                      {item.location_building || item.location_name || 'General Campus'}
                    </p>
                  </div>
                </div>

                {/* Map */}
                {hasLocation && (
                  <div className="rounded-xl overflow-hidden ring-1 ring-outline-variant/10">
                    <MapContainer
                      center={[item.location_lat!, item.location_lng!]}
                      zoom={15}
                      style={{ height: '150px', width: '100%' }}
                      zoomControl={false}
                      attributionControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[item.location_lat!, item.location_lng!]} />
                    </MapContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN – fixed header + scrollable claims list */}
          <div className="flex-1 bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-hidden min-h-0">
            {/* Fixed header */}
            <div className="px-5 pt-16 pb-4 md:px-8 md:pt-20 md:pb-6 border-b border-outline-variant/10 shrink-0 bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-on-surface font-headline tracking-tight">
                    Confirmed Claimant
                  </h3>
                  <p className="text-xs md:text-sm text-on-surface-variant mt-1 leading-relaxed">
                    Review and manage verified claimant information and coordinate the return
                    thread.
                  </p>
                </div>
                <div className="bg-surface-container-lowest px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center gap-2 md:gap-3 ring-1 ring-outline-variant/10 shrink-0">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[14px] md:text-[18px]">
                      check_circle
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] uppercase font-bold text-outline tracking-wider">
                      Active Claims
                    </p>
                    <p className="font-bold text-xs md:text-sm text-on-surface">
                      {claims.length} Total
                    </p>
                  </div>
                </div>
              </div>

              {privateNotes && (
                <div className="mt-3 md:mt-4 bg-primary-container/10 p-3 md:p-4 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                      Your Private Notes
                    </p>
                  </div>
                  <p className="text-xs md:text-sm italic text-on-surface">“{privateNotes}”</p>
                </div>
              )}
            </div>

            {/* Scrollable claims list */}
            <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 p-4 md:p-6">
              {loading ? (
                <div className="text-center py-12 text-on-surface-variant">Loading claims...</div>
              ) : claims.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  No claims for this item.
                </div>
              ) : (
                claims.map((claim) => {
                  const isAccepted = claim.status === 'accepted'
                  return (
                    <div
                      key={claim.id}
                      className="bg-white rounded-2xl p-4 md:p-6 border border-outline-variant/10 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                    >
                      <div className="flex gap-3 md:gap-5">
                        <div className="shrink-0">
                          {claim.profiles[0]?.avatar_url ? (
                            <img
                              src={claim.profiles[0].avatar_url}
                              alt={claim.profiles[0].full_name}
                              className="w-10 h-10 md:w-14 md:h-14 rounded-xl object-cover ring-1 ring-outline-variant/10 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg md:text-xl">
                              <span className="material-symbols-outlined text-base md:text-2xl">
                                person
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-3 md:space-y-5">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <h4 className="text-base md:text-lg font-extrabold text-on-surface font-headline leading-tight">
                                {claim.profiles[0]?.full_name || 'Unknown'}
                              </h4>
                              <div className="flex items-center gap-1 text-on-surface-variant/70 text-[9px] md:text-[11px] font-medium mt-0.5">
                                <span className="material-symbols-outlined text-[10px] md:text-[14px]">
                                  schedule
                                </span>
                                Submitted {new Date(claim.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isAccepted ? (
                                <button
                                  aria-label="View handshake details for this claim"
                                  onClick={() => setHandshakeClaimId(claim.id)}
                                  className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold bg-primary text-white shadow-sm hover:bg-primary-dim transition-all flex items-center gap-1 md:gap-2"
                                >
                                  <span className="material-symbols-outlined text-[12px] md:text-[16px]">
                                    visibility
                                  </span>
                                  View Handshake
                                </button>
                              ) : (
                                <>
                                  <button
                                    aria-label="Decline this claim"
                                    onClick={() => setShowRejectConfirm(claim.id)}
                                    disabled={processingId === claim.id}
                                    className="px-2 py-1 md:px-3 md:py-2 rounded-lg text-[10px] md:text-xs font-bold border border-outline-variant/30 text-on-surface hover:bg-error/5 hover:text-error hover:border-error/20 transition-all flex items-center gap-1 md:gap-2"
                                  >
                                    <span className="material-symbols-outlined text-[12px] md:text-[16px]">
                                      close
                                    </span>
                                    Decline
                                  </button>
                                  <button
                                    aria-label="Accept this claim"
                                    onClick={() => handleAccept(claim.id)}
                                    disabled={processingId === claim.id}
                                    className="px-2 py-1 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-bold bg-primary text-white shadow-sm hover:bg-primary-dim transition-all flex items-center gap-1 md:gap-2"
                                  >
                                    <span className="material-symbols-outlined text-[12px] md:text-[16px]">
                                      verified_user
                                    </span>
                                    Accept
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="bg-surface-container-low/50 rounded-xl p-3 md:p-4 border border-outline-variant/5">
                            <div className="flex items-center gap-2 text-primary mb-1 md:mb-2">
                              <span className="material-symbols-outlined text-[12px] md:text-[16px]">
                                chat
                              </span>
                              <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest">
                                Claimant’s Answer
                              </span>
                            </div>
                            <div className="bg-white p-2 md:p-3 rounded-lg text-on-surface-variant leading-relaxed text-xs md:text-sm border border-outline-variant/10">
                              {claim.answer}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decline Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[80]">
          <div className="bg-white rounded-xl p-5 md:p-6 max-w-[90%] sm:max-w-sm w-full">
            <h3 className="text-lg md:text-xl font-bold mb-2">Confirm Penalty</h3>
            <p className="text-sm md:text-base mb-4">
              This will deduct 10 reputation points from the claimant. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
              aria-label="Cancel rejecting this claim and close confirmation dialog"
                onClick={() => setShowRejectConfirm(null)}
                className="px-3 py-1.5 md:px-4 md:py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                aria-label="Confirm rejecting this claim"
                onClick={() => handleReject(showRejectConfirm)}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-error text-white rounded-lg text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handshake Modal */}
      {handshakeClaimId && (
        <HandshakeModal
          isOpen={true}
          onClose={handleHandshakeClose}
          claimId={handshakeClaimId}
          item={item}
          onComplete={handleHandshakeClose}
        />
      )}
    </div>,
    document.body
  )
}
