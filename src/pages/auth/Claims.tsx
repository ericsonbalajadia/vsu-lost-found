/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// src/pages/auth/Claims.tsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatTime } from '../../utils/formatTime'
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout'
import ClaimantItemModal from '../../components/modals/ClaimantItemModal'
import SamaritanItemModal from '../../components/modals/SamaritanItemModal'
import type { Item } from '../../types/database'

interface ClaimantItem extends Item {
  claim_id: string
  claim_ticket: string
  claim_status: string
  claim_answer: string
  claim_created_at: string
}

interface SamaritanItem extends Item {
  pending_claims_count: number
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Reusable card component for both tabs
function ClaimCard({
  item,
  badge,
  buttonText,
  buttonAction,
}: {
  item: Item
  badge: React.ReactNode
  buttonText: string
  buttonAction: () => void
}) {
  const hasLocation = !!(item.location_lat && item.location_lng)
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md">
      {/* Image */}
      <div className="relative h-48 bg-surface-variant overflow-hidden">
        <img
          src={item.image_url ?? '/placeholder-image.svg'}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/placeholder-image.svg'
          }}
        />
        <div className="absolute top-4 left-4 z-10 bg-primary/80 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
          {item.type === 'found' ? 'Found' : 'Lost'}
        </div>
        {/* Badge (status or pending count) */}
        <div className="absolute top-4 right-4 z-10">{badge}</div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3 flex flex-col flex-grow">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">
              {item.category}
            </span>
            {item.reference_number && (
              <span className="text-[10px] text-outline font-mono">{item.reference_number}</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-on-surface leading-tight line-clamp-1 mt-1">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed mt-1">
              {item.description}
            </p>
          )}
        </div>

        <div className="space-y-1 text-xs text-outline">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span className="truncate">
              {item.location_building ?? item.location_name ?? 'VSU Campus'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>{formatDate(item.incident_date ?? item.created_at)}</span>
            {item.incident_time && (
              <>
                <span className="material-symbols-outlined text-sm ml-1">schedule</span>
                <span>{formatTime(item.incident_time)}</span>
              </>
            )}
          </div>
          {hasLocation && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">map</span>
              <span>Map available</span>
            </div>
          )}
        </div>

        {item.profiles && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-2">
            <div className="w-5 h-5 rounded-full bg-primary-container overflow-hidden flex-shrink-0">
              {item.profiles.avatar_url ? (
                <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[10px] text-primary flex items-center justify-center h-full">
                  person
                </span>
              )}
            </div>
            <span className="truncate">{item.profiles.full_name}</span>
            <span className="text-primary font-bold shrink-0">★ {item.profiles.reputation}</span>
          </div>
        )}

        <button
          onClick={buttonAction}
          className="mt-3 w-full bg-gradient-to-r from-primary to-primary-dim hover:from-primary-dim hover:to-primary 
             text-white font-bold py-2.5 rounded-full shadow-md hover:shadow-lg 
             transition-all duration-200 active:scale-[0.98] 
             flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-base">visibility</span>
          {buttonText}
        </button>
      </div>
    </div>
  )
}

// Skeleton loader component for cards
function ClaimCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/20 flex flex-col animate-pulse">
      <div className="h-48 bg-surface-container-high" />
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-surface-container-high rounded w-1/4" />
          <div className="h-3 bg-surface-container-high rounded w-1/6" />
        </div>
        <div className="h-6 bg-surface-container-high rounded w-3/4" />
        <div className="h-4 bg-surface-container-high rounded w-full" />
        <div className="h-4 bg-surface-container-high rounded w-2/3" />
        <div className="flex items-center gap-2 mt-2">
          <div className="w-5 h-5 rounded-full bg-surface-container-high" />
          <div className="h-3 bg-surface-container-high rounded w-1/3" />
        </div>
        {/* Skeleton button – matches real button style */}
        <div className="h-10 bg-gradient-to-r from-primary/50 to-primary-dim/50 rounded-full mt-2" />
      </div>
    </div>
  )
}

export default function Claims() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'claimant' | 'samaritan'>('claimant')
  const [claimantItems, setClaimantItems] = useState<ClaimantItem[]>([])
  const [samaritanItems, setSamaritanItems] = useState<SamaritanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Items the user has claimed (claimant side)
        const { data: claimed, error: err1 } = await supabase
          .from('claims')
          .select(
            `
            id,
            ticket_number,
            answer,
            status,
            created_at,
            items!inner (
              id, reference_number, title, description, category, type, status,
              location_lat, location_lng, location_name, location_building,
              incident_date, incident_time, security_question, image_url, image_urls,
              reporter_id, created_at, updated_at,
              profiles!reporter_id ( full_name, reputation, avatar_url, campus_building )
            )
          `
          )
          .eq('claimant_id', user.id)
          .order('created_at', { ascending: false })

        if (err1) throw err1

        if (claimed) {
          const transformed = (claimed as any[]).map((c) => {
            const item = c.items || {}
            let reporterProfile = null
            const profilesData = item.profiles
            if (profilesData) {
              reporterProfile = Array.isArray(profilesData) ? profilesData[0] : profilesData
            }
            return {
              id: item.id || '',
              reference_number: item.reference_number || '',
              title: item.title || 'Untitled Item',
              description: item.description || '',
              category: item.category || 'Other',
              type: item.type || 'found',
              status: item.status || 'unknown',
              location_lat: item.location_lat ?? null,
              location_lng: item.location_lng ?? null,
              location_name: item.location_name || '',
              location_building: item.location_building || '',
              incident_date: item.incident_date || null,
              incident_time: item.incident_time || null,
              security_question: item.security_question || '',
              samaritan_notes: item.samaritan_notes || null,
              image_url: item.image_url || null,
              image_urls: item.image_urls || null,
              matched_item_id: item.matched_item_id || null,
              reporter_id: item.reporter_id || '',
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
              profiles: reporterProfile,
              claim_id: c.id,
              claim_ticket: c.ticket_number,
              claim_status: c.status,
              claim_answer: c.answer,
              claim_created_at: c.created_at,
            }
          })
          setClaimantItems(transformed)
        }

        // 2. Items the user reported that have pending claims (Samaritan side)
        const { data: reported, error: err2 } = await supabase
          .from('items')
          .select(
            `
            *,
            profiles!reporter_id ( full_name, reputation, avatar_url, campus_building ),
            claims!item_id ( id, status )
          `
          )
          .eq('reporter_id', user.id)
          .eq('type', 'found')
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (err2) throw err2

        if (reported) {
          const itemsWithPending = (reported as any[])
            .filter((item) => (item.claims || []).some((c: any) => c.status === 'pending'))
            .map((item) => {
              let reporterProfile = null
              const profilesData = item.profiles
              if (profilesData) {
                reporterProfile = Array.isArray(profilesData) ? profilesData[0] : profilesData
              }
              return {
                id: item.id,
                reference_number: item.reference_number || '',
                title: item.title || 'Untitled Item',
                description: item.description || '',
                category: item.category || 'Other',
                type: item.type || 'found',
                status: item.status || 'active',
                location_lat: item.location_lat ?? null,
                location_lng: item.location_lng ?? null,
                location_name: item.location_name || '',
                location_building: item.location_building || '',
                incident_date: item.incident_date || null,
                incident_time: item.incident_time || null,
                security_question: item.security_question || '',
                samaritan_notes: item.samaritan_notes || null,
                image_url: item.image_url || null,
                image_urls: item.image_urls || null,
                matched_item_id: item.matched_item_id || null,
                reporter_id: item.reporter_id,
                created_at: item.created_at,
                updated_at: item.updated_at,
                profiles: reporterProfile,
                pending_claims_count: (item.claims || []).filter((c: any) => c.status === 'pending')
                  .length,
              }
            })
          setSamaritanItems(itemsWithPending)
        }
      } catch (error) {
        console.error('Error fetching claims data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const openClaimantModal = (item: ClaimantItem) => {
    setSelectedItem(item)
    setSelectedClaim({
      id: item.claim_id,
      ticket_number: item.claim_ticket,
      answer: item.claim_answer,
      status: item.claim_status,
    })
  }

  const closeModals = () => {
    setSelectedItem(null)
    setSelectedClaim(null)
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
    }
    const text = {
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}
      >
        {text[status as keyof typeof text] || status}
      </span>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header (always visible) */}
        <div className="px-4 sm:px-6 md:px-12 py-6 md:py-10 bg-surface shrink-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-on-surface tracking-tight mb-2 md:mb-4 font-headline">
            Claims Center
          </h1>
          <p className="text-base sm:text-lg text-on-surface-variant font-medium opacity-80 max-w-3xl">
            Track and manage all your claim activity. Here you can review items you've claimed,
            respond to claims on your found items, and coordinate returns.
          </p>
        </div>
      </div>

        {/* Sticky tabs (solid background) – always visible */}
        <div className="sticky top-0 z-10 bg-surface-container-lowest border-b border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('claimant')}
                className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 
                  ${
                    activeTab === 'claimant'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }
                  rounded-lg md:rounded-full`}
              >
                <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                <span className="whitespace-nowrap">Items I Claimed ({claimantItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('samaritan')}
                className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 
                  ${
                    activeTab === 'samaritan'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }
                  rounded-lg md:rounded-full`}
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="whitespace-nowrap">
                  Items with Pending Claims ({samaritanItems.length})
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content – skeletons only inside the card grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-surface-container-low/50 rounded-[2.5rem] border border-outline-variant/10 shadow-soft p-6 md:p-10">
              {/* Helpful note (always visible) */}
              <div className="mb-6 p-4 bg-primary-container/10 rounded-xl border border-primary/20 flex flex-col sm:flex-row items-start gap-3">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">
                  info
                </span>
                <div className="text-sm text-on-surface-variant space-y-1">
                  <p className="font-semibold text-on-surface">Need help?</p>
                  <p className="text-xs sm:text-sm">
                    • For items you've claimed: you can edit your answer while the claim is pending.
                    <br />
                    • For claims on your items: review claimant answers and decide to accept or
                    reject.
                    <br />• Once accepted, exchange contact details via email and mark the item as
                    resolved.
                  </p>
                </div>
              </div>

              {/* Claimant Tab */}
              {activeTab === 'claimant' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {loading ? (
                    // Show skeletons while loading
                    Array.from({ length: 6 }).map((_, i) => <ClaimCardSkeleton key={i} />)
                  ) : claimantItems.length === 0 ? (
                    <p className="col-span-full text-on-surface-variant text-center py-8">
                      You haven't claimed any items yet.
                    </p>
                  ) : (
                    claimantItems.map((item, idx) => (
                      <ClaimCard
                        key={item.id || `claimant-${idx}`}
                        item={item}
                        badge={getStatusBadge(item.claim_status)}
                        buttonText="View Claim"
                        buttonAction={() => openClaimantModal(item)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Samaritan Tab */}
              {activeTab === 'samaritan' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <ClaimCardSkeleton key={i} />)
                  ) : samaritanItems.length === 0 ? (
                    <p className="col-span-full text-on-surface-variant text-center py-8">
                      No pending claims on your items.
                    </p>
                  ) : (
                    samaritanItems.map((item, idx) => (
                      <ClaimCard
                        key={item.id || `samaritan-${idx}`}
                        item={item}
                        badge={
                          <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                            {item.pending_claims_count} pending
                          </span>
                        }
                        buttonText="Review Claims"
                        buttonAction={() => setSelectedItem(item)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals (unchanged) */}
      {selectedItem && selectedClaim && (
        <ClaimantItemModal
          isOpen={true}
          onClose={closeModals}
          item={selectedItem}
          claim={selectedClaim}
          onRefresh={() => window.location.reload()}
        />
      )}
      {selectedItem && !selectedClaim && (
        <SamaritanItemModal
          isOpen={true}
          onClose={closeModals}
          item={selectedItem}
          onRefresh={() => window.location.reload()}
        />
      )}
    </AuthenticatedLayout>
  )
}
