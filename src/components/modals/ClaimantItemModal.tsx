// src/components/modals/ClaimantItemModal.tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { claimsApi } from '../../api/claimsApi'
import { formatTime } from '../../utils/formatTime'
import ImageCarousel from '../ui/ImageCarousel'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from 'react-hot-toast'
import type { Item } from '../../types/database'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ClaimantItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item
  claim: {
    id: string
    ticket_number: string
    answer: string
    status: string
  }
  onRefresh?: () => void
}

export default function ClaimantItemModal({
  isOpen,
  onClose,
  item,
  claim,
  onRefresh,
}: ClaimantItemModalProps) {
  const [answer, setAnswer] = useState(claim.answer)
  const [saving, setSaving] = useState(false)
  const [reporterEmail, setReporterEmail] = useState('')
  const hasLocation = !!(item.location_lat && item.location_lng)
  const isPending = claim.status === 'pending'
  const isAccepted = claim.status === 'accepted'
  const isDeclined = claim.status === 'declined'

  useEffect(() => {
    if (isOpen) setAnswer(claim.answer)
  }, [isOpen, claim.answer])

  // Fetch reporter email for declined claims
  useEffect(() => {
    if (isDeclined && item.reporter_id) {
      const fetchReporterEmail = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', item.reporter_id)
            .single()

          if (data) setReporterEmail(data.email)
        } catch {
          console.error('Failed to fetch reporter email')
        }
      }

      fetchReporterEmail()
    }
  }, [isDeclined, item.reporter_id])

  const handleSave = async () => {
    if (!answer.trim()) {
      toast.error('Answer cannot be empty')
      return
    }
    setSaving(true)
    try {
      await claimsApi.update(claim.id, answer)
      toast.success('Answer updated')
      if (onRefresh) onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* LEFT COLUMN – compact item details (40% width) */}
        <div className="w-full md:w-2/5 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-5 md:p-6 space-y-5">
          {/* Item type badge */}
          <div className="inline-block bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            {item.type === 'found' ? 'Found Item' : 'Lost Item'}
          </div>

          {/* Image carousel */}
          {item.image_urls && item.image_urls.length > 0 ? (
            <div className="max-h-56 overflow-hidden rounded-xl">
              <ImageCarousel images={item.image_urls} alt={item.title} />
            </div>
          ) : item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full max-h-56 object-cover rounded-xl"
            />
          ) : null}

          {/* Title & description */}
          <div>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface">{item.title}</h2>
            <p className="text-sm text-on-surface-variant mt-1 line-clamp-3">
              {item.description || 'No description provided.'}
            </p>
          </div>

          {/* Compact info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase text-outline font-bold">Category</p>
              <p className="font-medium">{item.category}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-outline font-bold">Status</p>
              <p className="font-medium capitalize">{item.status}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-outline font-bold">Date</p>
              <p className="font-medium">
                {item.incident_date ? new Date(item.incident_date).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-outline font-bold">Time</p>
              <p className="font-medium">
                {item.incident_time ? formatTime(item.incident_time) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-outline font-bold">Location</p>
              <p className="font-medium truncate">
                {item.location_building || item.location_name || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-outline font-bold">Reference</p>
              <p className="font-mono text-xs">{item.reference_number}</p>
            </div>
          </div>

          {/* Mini map */}
          {hasLocation && (
            <div className="h-36 rounded-lg overflow-hidden shadow-sm">
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
          )}
        </div>

        {/* RIGHT COLUMN – claim management (60% width) */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Your Claim</h1>
              <p className="text-sm text-on-surface-variant">
                Ticket: <span className="font-mono font-medium">{claim.ticket_number}</span>
              </p>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline">Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  isPending
                    ? 'bg-yellow-100 text-yellow-800'
                    : isAccepted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {isPending ? 'Pending Review' : isAccepted ? 'Accepted' : 'Declined'}
              </span>
            </div>

            {/* SECURITY QUESTION (reference for the claimant) */}
            <div className="bg-primary-container/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">help</span>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Security Question (Reference)
                </h3>
              </div>
              <p className="text-sm italic text-on-surface">
                "{item.security_question || 'No question provided by the Samaritan.'}"
              </p>
            </div>

            {/* Answer section */}
            <div>
              <label
                htmlFor="claimant-answer"
                className="block text-sm font-bold text-on-surface mb-1"
              >
                Your Answer
              </label>
              {isPending ? (
                <>
                  <textarea
                    id="claimant-answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={5}
                    placeholder="Describe the details that prove ownership..."
                    className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition resize-none"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-3 w-full bg-primary hover:bg-primary-dim text-white py-2 rounded-xl font-bold text-sm transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <div className="bg-surface-container-low p-3 rounded-xl text-sm whitespace-pre-wrap">
                  {claim.answer}
                </div>
              )}
            </div>

            {/* Filler notes / helpful tips */}
            <div className="bg-surface-container-low rounded-xl p-4 text-xs text-on-surface-variant space-y-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                <p>
                  <span className="font-semibold text-primary">Note:</span> The Samaritan will
                  review your answer manually. Be as specific as possible.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                <p>If your claim is accepted, you will see the Samaritan's contact details here.</p>
              </div>
              {isPending && (
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-warning">
                    warning
                  </span>
                  <p>You can edit your answer until the Samaritan reviews it.</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {isAccepted && (
              <Link
                to={`/claims/${claim.id}/handshake`}
                onClick={onClose}
                className="block w-full text-center bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dim transition"
              >
                View Samaritan Contact →
              </Link>
            )}

            {isDeclined && (
              <a
                href={`mailto:${reporterEmail}?subject=Claim Dispute – ${item.reference_number}&body=I would like to dispute the rejection of my claim for ${item.title} (${item.reference_number}). My claim ticket is ${claim.ticket_number}.`}
                className="block w-full text-center bg-error text-white py-2.5 rounded-xl font-bold text-sm hover:bg-error/80 transition"
              >
                Report Issue (Email)
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
