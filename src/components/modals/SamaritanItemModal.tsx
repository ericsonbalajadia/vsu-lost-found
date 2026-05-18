// src/components/modals/SamaritanItemModal.tsx
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { claimsApi } from '../../api/claimsApi'
import { formatTime } from '../../utils/formatTime'
import ImageCarousel from '../ui/ImageCarousel'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from 'react-hot-toast'
import type { Item } from '../../types/database'

// Fix Leaflet icon for Vite
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
  const navigate = useNavigate()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null)
  const hasLocation = !!(item.location_lat && item.location_lng)

  useEffect(() => {
    if (!isOpen || !item.id) return
    const fetchClaims = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('claims')
        .select(
          `
          id,
          ticket_number,
          answer,
          created_at,
          profiles!claimant_id (
            full_name,
            email,
            avatar_url,
            reputation
          )
        `
        )
        .eq('item_id', item.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!error && data) setClaims(data as Claim[])
      setLoading(false)
    }
    fetchClaims()
  }, [isOpen, item.id])

  const handleAccept = async (claimId: string) => {
    setProcessingId(claimId)
    try {
      await claimsApi.acceptBySamaritan(claimId, item.reporter_id)
      toast.success('Claim accepted. Redirecting to handshake...')
      onClose()
      navigate(`/user/claims/${claimId}/resolved`)
    } catch {
      toast.error('Failed to accept claim')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (claimId: string) => {
    setProcessingId(claimId)
    try {
      await claimsApi.penalize(claimId, item.reporter_id)
      toast.success('Claim rejected and claimant penalized (-10 reputation).')
      setClaims((prev) => prev.filter((c) => c.id !== claimId))
      if (onRefresh) onRefresh()
    } catch {
      toast.error('Failed to reject claim')
    } finally {
      setProcessingId(null)
      setShowRejectConfirm(null)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        {/* Close button (absolute, top‑right) */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* ========== LEFT COLUMN – ITEM DETAILS (420px) ========== */}
        <div className="w-[420px] shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-8 space-y-8">
          <div className="relative group">
            {item.image_urls && item.image_urls.length > 0 ? (
              <ImageCarousel images={item.image_urls} alt={item.title} />
            ) : item.image_url ? (
              <div className="relative">
                <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm ring-1 ring-white/20">
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

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
                {item.title}
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-sm mt-2">
                {item.description || 'Recovered item – no description provided.'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Date chip */}
              <div className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider">
                    Date Found
                  </p>
                  <p className="font-bold text-sm text-on-surface">
                    {item.incident_date
                      ? new Date(item.incident_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Time chip (if provided) */}
              {item.incident_time && (
                <div className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                  <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider">
                      Time Found
                    </p>
                    <p className="font-bold text-sm text-on-surface">
                      {formatTime(item.incident_time)}
                    </p>
                  </div>
                </div>
              )}

              {/* Location chip (text) */}
              <div className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider">
                    Location
                  </p>
                  <p className="font-bold text-sm text-on-surface">
                    {item.location_building || item.location_name || 'General Campus'}
                  </p>
                </div>
              </div>

              {/* Mini Map */}
              {hasLocation && (
                <div className="rounded-xl overflow-hidden ring-1 ring-outline-variant/10">
                  <MapContainer
                    center={[item.location_lat!, item.location_lng!]}
                    zoom={15}
                    style={{ height: '200px', width: '100%' }}
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

        {/* ========== RIGHT COLUMN – CLAIMS QUEUE (480px) ========== */}
        {/* Added top padding to avoid conflict with absolute close button */}
        <div className="w-[480px] bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-hidden">
          {/* Sticky header – now includes Active Claims chip */}
          {/* Right Column Header – Title + Count side‑by‑side */}
          <div className="px-8 pt-16 pb-6 border-b border-outline-variant/10 shrink-0 bg-background/80 backdrop-blur-sm z-10 md:pt-20">
            {/* Flex row: title on left, count chip on right */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-2xl font-extrabold text-on-surface font-headline tracking-tight">
                  Confirmed Claimant
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed font-body">
                  Review and manage verified claimant information and coordinate the return thread.
                </p>
              </div>
              {/* Active Claims Count – now on the same row as the title */}
              <div className="bg-surface-container-lowest px-4 py-2 rounded-xl flex items-center gap-3 ring-1 ring-outline-variant/10 shrink-0">
                <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined active-icon text-[18px]">
                    check_circle
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider">
                    Active Claims
                  </p>
                  <p className="font-bold text-sm text-on-surface">{claims.length} Pending</p>
                </div>
              </div>
            </div>

            {/* Private Notes (if any) – unchanged, placed below */}
            {item.samaritan_notes && (
              <div className="mt-4 bg-primary-container/10 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Your Private Notes
                  </p>
                </div>
                <p className="text-sm italic text-on-surface">“{item.samaritan_notes}”</p>
              </div>
            )}
          </div>

          {/* Scrollable list of claims – security question removed from cards */}
          <div className="flex-1 overflow-y-auto space-y-6 p-6">
            {loading ? (
              <div className="text-center py-12 text-on-surface-variant">Loading claims...</div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                No pending claims for this item.
              </div>
            ) : (
              claims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                >
                  <div className="flex gap-5">
                    {/* Claimant avatar */}
                    <div className="shrink-0">
                      {claim.profiles[0]?.avatar_url ? (
                        <img
                          src={claim.profiles[0].avatar_url}
                          alt={claim.profiles[0].full_name}
                          className="w-14 h-14 rounded-xl object-cover ring-1 ring-outline-variant/10 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl ring-1 ring-primary/20">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-5">
                      {/* Claimant name + timestamp + buttons */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-extrabold text-on-surface font-headline leading-tight">
                            {claim.profiles[0]?.full_name || 'Unknown'}
                          </h4>
                          <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[11px] font-medium mt-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            Submitted {new Date(claim.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowRejectConfirm(claim.id)}
                            disabled={processingId === claim.id}
                            className="px-3 py-2 rounded-lg text-xs font-bold border border-outline-variant/30 text-on-surface hover:bg-error/5 hover:text-error hover:border-error/20 transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            Decline
                          </button>
                          <button
                            onClick={() => handleAccept(claim.id)}
                            disabled={processingId === claim.id}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white shadow-sm hover:bg-primary-dim transition-all flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              verified_user
                            </span>
                            Accept
                          </button>
                        </div>
                      </div>

                      {/* Only the claimant’s answer – security question removed */}
                      <div className="bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/5">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          <span className="text-[10px] uppercase font-black tracking-widest">
                            Claimant’s Answer
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-on-surface-variant leading-relaxed text-xs border border-outline-variant/10 shadow-sm">
                          {claim.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Decline Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[80]">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Confirm Penalty</h3>
            <p className="mb-4">
              This will deduct 10 reputation points from the claimant. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectConfirm(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectConfirm)}
                className="px-4 py-2 bg-error text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
