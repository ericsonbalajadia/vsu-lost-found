/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// src/components/modals/ItemDetailModal.tsx
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../contexts/AuthContext'
import { claimsApi } from '../../api/claimsApi'
import { formatTime } from '../../utils/formatTime'
import ImageCarousel from '../ui/ImageCarousel'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ClaimItemModal from './ClaimItemModal'
import ContactOwnerModal from './ContactOwnerModal'
import ClaimantItemModal from './ClaimantItemModal'
import SamaritanItemModal from './SamaritanItemModal'
import LostItemFindersModal from './LostItemFindersModal'
import type { Item } from '../../types/database'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface ItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item
  onRefresh?: () => void
}

export default function ItemDetailModal({
  isOpen,
  onClose,
  item,
  onRefresh,
}: ItemDetailModalProps) {
  const { user } = useAuth()
  const [existingClaim, setExistingClaim] = useState<any>(null)
  const [loadingClaim, setLoadingClaim] = useState(true)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showClaimantModal, setShowClaimantModal] = useState(false)
  const [showSamaritanModal, setShowSamaritanModal] = useState(false)
  const [showLostFindersModal, setShowLostFindersModal] = useState(false)

  const hasLocation = !!(item.location_lat && item.location_lng)
  const isOwner = user?.id === item.reporter_id

  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Small delay ensures the modal is rendered in the DOM before focusing
      const timer = setTimeout(() => {
        modalRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !user) {
      setLoadingClaim(false)
      return
    }
    const fetchClaim = async () => {
      setLoadingClaim(true)
      const { data } = await claimsApi.getExistingClaim(item.id, user.id)
      setExistingClaim(data)
      setLoadingClaim(false)
    }
    fetchClaim()
  }, [isOpen, user, item.id])

  const handleClaimSuccess = () => {
    if (onRefresh) onRefresh()
    onClose()
  }

  const renderActionArea = () => {
    if (!user) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Sign in to claim this item or contact the owner.
          </p>
          <a
            href="/login"
            className="block w-full text-center bg-primary text-white py-3 rounded-xl font-bold"
          >
            Sign In
          </a>
        </div>
      )
    }

    if (loadingClaim) {
      return <div className="text-center py-8 text-outline">Loading...</div>
    }

    if (existingClaim) {
      return (
        <div ref={modalRef} tabIndex={-1} className="space-y-4">
          <div className="bg-surface-container-low p-4 rounded-xl">
            <p className="text-sm text-outline">Your claim status</p>
            <p
              className={`font-bold mt-1 ${
                existingClaim.status === 'pending'
                  ? 'text-yellow-600'
                  : existingClaim.status === 'accepted'
                    ? 'text-green-600'
                    : 'text-red-600'
              }`}
            >
              {existingClaim.status === 'pending'
                ? 'Pending Review'
                : existingClaim.status === 'accepted'
                  ? 'Accepted'
                  : 'Declined'}
            </p>
            <p className="text-xs text-outline mt-1">Ticket: {existingClaim.ticket_number}</p>
          </div>
          <button
            aria-label="View details of your claim"
            onClick={() => setShowClaimantModal(true)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
          >
            View Your Claim
          </button>
        </div>
      )
    }

    if (isOwner) {
      if (item.type === 'found') {
        return (
          <button
            onClick={() => setShowSamaritanModal(true)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
            aria-label="Manage claims"
          >
            Manage Claims
          </button>
        )
      } else {
        return (
          <button
            onClick={() => setShowLostFindersModal(true)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
            aria-label="View potential finders"
          >
            Potential Finders
          </button>
        )
      }
    }

    if (item.type === 'found' && item.status === 'active') {
      return (
        <button
          aria-label="Claim this found item"
          onClick={() => setShowClaimModal(true)}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
        >
          Claim This Item
        </button>
      )
    }

    if (item.type === 'lost' && item.status === 'active') {
      return (
        <button
          aria-label="Report found item"
          onClick={() => setShowContactModal(true)}
          className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary-dim"
        >
          I Found This
        </button>
      )
    }

    return <p className="text-sm text-on-surface-variant">This item is no longer available.</p>
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        <button
          aria-label="Close item details modal"
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base md:text-xl">close</span>
        </button>

        {/* LEFT COLUMN – lighter: image + title + description */}
        <div className="w-full md:w-2/5 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-5 md:p-8 space-y-4 md:space-y-6">
          <div className="space-y-4">
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

            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface font-headline">
                {item.title}
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-sm md:text-[15px] mt-2">
                {item.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN – info grid + actions */}
        <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-white">
          <div className="space-y-6">
            {/* Compact info grid (2 columns) */}
            <div className="grid grid-cols-2 gap-4 text-sm">
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
              <div className="col-span-2">
                <p className="text-[10px] uppercase text-outline font-bold">Location</p>
                <p className="font-medium">
                  {item.location_building || item.location_name || 'Not specified'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase text-outline font-bold">Reference</p>
                <p className="font-mono text-xs">{item.reference_number}</p>
              </div>
              {item.profiles && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase text-outline font-bold">Reported by</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-medium">{item.profiles.full_name}</span>
                    <span className="text-primary text-xs font-bold">
                      ★ {item.profiles.reputation}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mini map (if available) */}
            {hasLocation && (
              <div className="rounded-xl overflow-hidden ring-1 ring-outline-variant/10">
                <div className="px-3 pt-2 pb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">map</span>
                  <p className="text-[9px] uppercase font-bold text-outline tracking-wider">
                    Location Map
                  </p>
                </div>
                <div className="h-32 w-full">
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

            {/* Action area */}
            <div className="pt-2">
              <h3 className="text-lg font-bold text-on-surface mb-3">Actions</h3>
              {renderActionArea()}
            </div>
          </div>
        </div>
      </div>

      {/* Nested modals */}
      {showClaimModal && (
        <ClaimItemModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          item={item}
          userId={user?.id || ''}
          onSuccess={handleClaimSuccess}
        />
      )}
      {showContactModal && (
        <ContactOwnerModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          item={item}
        />
      )}
      {showClaimantModal && existingClaim && (
        <ClaimantItemModal
          isOpen={showClaimantModal}
          onClose={() => setShowClaimantModal(false)}
          item={item}
          claim={existingClaim}
          onRefresh={onRefresh}
        />
      )}
      {showSamaritanModal && (
        <SamaritanItemModal
          isOpen={showSamaritanModal}
          onClose={() => setShowSamaritanModal(false)}
          item={item}
          onRefresh={onRefresh}
        />
      )}
      {showLostFindersModal && (
        <LostItemFindersModal
          isOpen={showLostFindersModal}
          onClose={() => setShowLostFindersModal(false)}
          item={item}
        />
      )}
    </div>,
    document.body
  )
}
