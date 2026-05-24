// src/components/ui/ItemCard.tsx
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { formatTime } from '../../utils/formatTime'
import { claimsApi } from '../../api/claimsApi'
import toast from 'react-hot-toast'
import type { Item } from '../../types/database'
import StatusRibbon from './StatusRibbon'
import ClaimItemModal from '../modals/ClaimItemModal'
import ContactOwnerModal from '../modals/ContactOwnerModal'
import ClaimantItemModal from '../modals/ClaimantItemModal'
import SamaritanItemModal from '../modals/SamaritanItemModal'
import LostItemFindersModal from '../modals/LostItemFindersModal'
import ItemDetailModal from '../modals/ItemDetailModal'

interface ItemCardProps {
  item: Item
  onRefresh?: () => void
  onDelete?: (itemId: string) => Promise<void>
  onEdit?: (item: Item) => void       
}

interface ExistingClaim {
  id: string;
  status: string;
  ticket_number: string;
  answer: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ItemCard({ item, onRefresh, onDelete, onEdit }: ItemCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [checkingClaim, setCheckingClaim] = useState(false)
  const [hasPendingClaim, setHasPendingClaim] = useState(false)

  const isOwner = user?.id === item.reporter_id
  const canClaim = item.type === 'found' && item.status === 'active' && !isOwner && !hasPendingClaim
  const canContact = item.type === 'lost' && item.status === 'active' && !isOwner

  const [existingClaim, setExistingClaim] = useState<ExistingClaim | null>(null)
  const [claimantModalOpen, setClaimantModalOpen] = useState(false)
  const [samaritanModalOpen, setSamaritanModalOpen] = useState(false)
  const [lostFindersModalOpen, setLostFindersModalOpen] = useState(false)
  const [itemDetailModalOpen, setItemDetailModalOpen] = useState(false)

  // Kebab menu state
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user && item.type === 'found' && item.status === 'active') {
      claimsApi.getExistingClaim(item.id, user.id).then(({ data }) => {
        setExistingClaim(data)
        if (data) setHasPendingClaim(true)
      })
    }
  }, [user, item.id, item.type, item.status])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
        setShowDeleteConfirm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClaimClick = async () => {
    if (!user) return
    setCheckingClaim(true)
    try {
      const { data: existingClaim } = await claimsApi.getExistingClaim(item.id, user.id)
      if (existingClaim) {
        toast.error('You already have a claim for this item. Please wait for the Samaritan to review it.')
        return
      }
      setShowClaimModal(true)
    } catch {
      toast.error('Unable to verify claim status.')
    } finally {
      setCheckingClaim(false)
    }
  }

  const handleClaimSuccess = () => {
    if (onRefresh) onRefresh()
    else window.location.reload()
  }

  const handleViewDetails = () => {
    if (existingClaim) {
      setClaimantModalOpen(true)
    } else {
      navigate(`/items/${item.id}`)
    }
  }

  const handleEdit = () => {
    if (onEdit) onEdit(item)
    setMenuOpen(false)
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete(item.id)
      setMenuOpen(false)
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <article className="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col border border-outline-variant/20 relative z-0 min-h-[400px]">
        {/* Kebab menu (top‑right corner) – only for owner and active items */}
        {isOwner && item.status === 'active' && onDelete && (
          <div ref={menuRef} className="absolute top-3 right-3 z-20">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
              aria-label="Item actions"
            >
              <span className="material-symbols-outlined text-on-surface text-xl">more_vert</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-outline-variant/20 overflow-hidden z-30">
                <div className="py-1">
                  {/* Edit button */}
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container/50 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Edit
                    </button>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error/5 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete confirmation overlay (inside card, replacing the menu options) */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl">
            <div className="bg-white rounded-xl p-4 max-w-[90%] w-64 text-center shadow-xl">
              <p className="text-sm font-medium mb-3">Delete "{item.title}"?</p>
              <p className="text-xs text-outline mb-4">This action cannot be undone.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={cancelDelete}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-container-high"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg text-on-error hover:opacity-90"
                  style={{ background: 'var(--color-error)' }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image */}
        <div className="relative h-48 bg-surface-variant overflow-hidden">
          <img
            src={item.image_url ?? '/placeholder-image.svg'}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/placeholder-image.svg'
            }}
          />
          <StatusRibbon type={item.type} status={item.status} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex flex-col flex-grow">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">
                {item.category}
              </span>
              {item.reference_number && (
                <span className="text-[10px] text-outline font-mono">{item.reference_number}</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-on-surface leading-tight line-clamp-1">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed min-h-[2.5rem] flex-1">
                {item.description}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-outline">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="font-medium">
                {item.location_building ?? item.location_name ?? 'VSU Campus'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-outline flex-wrap">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="font-medium">
                {formatDate(item.incident_date ?? item.created_at)}
              </span>
              {item.incident_time && (
                <>
                  <span className="material-symbols-outlined text-sm ml-1">schedule</span>
                  <span className="font-medium">{formatTime(item.incident_time)}</span>
                </>
              )}
            </div>
          </div>

          {item.profiles && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <div className="w-5 h-5 rounded-full bg-primary-container overflow-hidden flex-shrink-0">
                {item.profiles.avatar_url ? (
                  <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[10px] text-primary flex items-center justify-center h-full">
                    person
                  </span>
                )}
              </div>
              <span>{item.profiles.full_name}</span>
              <span className="text-primary font-bold">★ {item.profiles.reputation}</span>
            </div>
          )}

          {/* Action buttons area (unchanged) */}
          <div className="mt-auto pt-2">
            {user ? (
              existingClaim ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        existingClaim.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : existingClaim.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {existingClaim.status === 'pending' && 'Claim Pending'}
                      {existingClaim.status === 'accepted' && 'Claim Accepted'}
                      {existingClaim.status === 'declined' && 'Claim Declined'}
                    </span>
                    <button
                      onClick={handleViewDetails}
                      className="text-primary text-sm font-bold hover:underline"
                    >
                      View Claim
                    </button>
                  </div>
                </div>
              ) : canClaim ? (
                <button
                  onClick={handleClaimClick}
                  disabled={checkingClaim}
                  className="block w-full py-3 bg-primary hover:bg-primary-dim text-white font-bold rounded-xl text-center text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {checkingClaim ? 'Checking...' : 'Claim Item'}
                </button>
              ) : canContact ? (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="block w-full py-3 bg-secondary hover:bg-secondary-dim text-on-secondary font-bold rounded-xl text-center text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">contact_mail</span>
                  Contact Owner
                </button>
              ) : isOwner ? (
                <div className="space-y-2">
                  <button
                    onClick={() => (item.type === 'lost' ? setLostFindersModalOpen(true) : setSamaritanModalOpen(true))}
                    className="block w-full py-3 bg-primary hover:bg-primary-dim text-white font-bold rounded-xl text-center text-sm transition-all"
                  >
                    {item.type === 'lost' ? 'Potential Finders' : 'Manage Claims'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setItemDetailModalOpen(true)}
                  className="group relative w-full py-2.5 px-4 rounded-full border-2 border-primary/30 text-primary font-semibold text-sm transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:shadow-md flex items-center justify-center gap-2"
                >
                  <span>View Details</span>
                  <span className="material-symbols-outlined text-base transition-transform duration-200 group-hover:translate-x-1">
                    chevron_right
                  </span>
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="block w-full py-3 border-2 border-dashed border-outline-variant/50 text-on-surface-variant text-center text-sm rounded-xl hover:border-primary/30 transition-colors"
              >
                Sign in to claim
              </Link>
            )}
          </div>
        </div>
      </article>

      {/* Modals (unchanged) */}
      <ClaimItemModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        item={item}
        userId={user?.id || ''}
        onSuccess={handleClaimSuccess}
      />
      <ContactOwnerModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        item={item}
      />
      {existingClaim && (
        <ClaimantItemModal
          isOpen={claimantModalOpen}
          onClose={() => setClaimantModalOpen(false)}
          item={item}
          claim={existingClaim}
          onRefresh={onRefresh}
        />
      )}
      <SamaritanItemModal
        isOpen={samaritanModalOpen}
        onClose={() => setSamaritanModalOpen(false)}
        item={item}
        onRefresh={onRefresh}
      />
      <LostItemFindersModal
        isOpen={lostFindersModalOpen}
        onClose={() => setLostFindersModalOpen(false)}
        item={item}
      />
      <ItemDetailModal
        isOpen={itemDetailModalOpen}
        onClose={() => setItemDetailModalOpen(false)}
        item={item}
        onRefresh={onRefresh}
      />
    </>
  )
}