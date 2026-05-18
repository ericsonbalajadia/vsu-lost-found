// src/pages/auth/ItemDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsApi } from '../../api/itemsApi'
import { claimsApi } from '../../api/claimsApi'
import ImageCarousel from '../../components/ui/ImageCarousel'
import { formatTime } from '../../utils/formatTime'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from 'react-hot-toast'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function ItemDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [existingClaim, setExistingClaim] = useState<any>(null)
  const [claimLoading, setClaimLoading] = useState(true)
  const [editingAnswer, setEditingAnswer] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch item
  useEffect(() => {
    if (!id) return
    const fetchItem = async () => {
      const { data, error } = await itemsApi.getById(id!)
      if (!error && data) {
        setItem({ ...data, profiles: (data as any).profiles?.[0] })
      }
      setLoading(false)
    }
    fetchItem()
  }, [id])

  // Fetch existing claim
  useEffect(() => {
    if (!user || !id) return
    const fetchClaim = async () => {
      const { data } = await claimsApi.getExistingClaim(id, user.id)
      setExistingClaim(data)
      if (data) setEditingAnswer(data.answer)
      setClaimLoading(false)
    }
    fetchClaim()
  }, [user, id])

  const handleSaveAnswer = async () => {
    if (!existingClaim) return
    setSaving(true)
    try {
      await claimsApi.update(existingClaim.id, editingAnswer)
      toast.success('Answer updated successfully')
      // Refresh claim data
      const { data } = await claimsApi.getExistingClaim(id!, user!.id)
      setExistingClaim(data)
      setEditingAnswer(data?.answer || '')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update answer')
    } finally {
      setSaving(false)
    }
  }

  if (loading || claimLoading) return <div className="p-8 text-center">Loading...</div>
  if (!item) return <div className="p-8 text-center text-error">Item not found.</div>

  const isSamaritan = user?.id === item.reporter_id
  const hasClaim = existingClaim

  // Claimant layout (two columns) – only when user has a claim on this item
  if (hasClaim && !isSamaritan) {
    const hasLocation = !!(item.location_lat && item.location_lng)
    const isPending = hasClaim.status === 'pending'
    const isAccepted = hasClaim.status === 'accepted'
    const isDeclined = hasClaim.status === 'declined'

    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-extrabold font-headline">{item.title}</h1>
          <span className="text-sm font-mono text-outline bg-surface-container-high px-3 py-1 rounded-full">
            {item.reference_number}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column: item details (same as before) */}
          <div className="space-y-6">
            {item.image_urls && item.image_urls.length > 0 ? (
              <ImageCarousel images={item.image_urls} alt={item.title} />
            ) : item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full rounded-xl" />
            ) : null}

            <div className="space-y-4">
              <p className="text-on-surface-variant">
                {item.description || 'No description provided.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-outline">Category</p>
                  <p className="font-semibold">{item.category}</p>
                </div>
                <div>
                  <p className="text-sm text-outline">Status</p>
                  <p className="font-semibold capitalize">{item.status}</p>
                </div>
                <div>
                  <p className="text-sm text-outline">Location</p>
                  <p className="font-semibold">
                    {item.location_building || item.location_name || 'Not specified'}
                  </p>
                </div>
                {item.incident_date && (
                  <div>
                    <p className="text-sm text-outline">Date</p>
                    <p className="font-semibold">
                      {new Date(item.incident_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.incident_time && (
                  <div>
                    <p className="text-sm text-outline">Time</p>
                    <p className="font-semibold">{formatTime(item.incident_time)}</p>
                  </div>
                )}
              </div>
              {hasLocation && (
                <div className="h-48 rounded-xl overflow-hidden">
                  <MapContainer
                    center={[item.location_lat!, item.location_lng!]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[item.location_lat!, item.location_lng!]} />
                  </MapContainer>
                </div>
              )}
            </div>
          </div>

          {/* Right column: claim management */}
          <div className="bg-surface-container-low rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold">Your Claim</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-outline">Ticket Number</p>
                <p className="font-mono">{hasClaim.ticket_number}</p>
              </div>
              <div>
                <p className="text-sm text-outline">Status</p>
                <p
                  className={`font-semibold ${
                    isPending ? 'text-yellow-600' : isAccepted ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isPending ? 'Pending Review' : isAccepted ? 'Accepted' : 'Declined'}
                </p>
              </div>
              <div>
                <label htmlFor="claim-answer" className="text-sm text-outline block mb-1">
                  Your Answer
                </label>
                {isPending ? (
                  <>
                    <textarea
                      id="claim-answer"
                      value={editingAnswer}
                      onChange={(e) => setEditingAnswer(e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg p-3 mb-2"
                      placeholder="Describe the details only the owner would know..."
                    />
                    <button
                      onClick={handleSaveAnswer}
                      disabled={saving}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dim disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <p className="bg-white p-3 rounded-lg border">{hasClaim.answer}</p>
                )}
              </div>

              {isAccepted && (
                <Link
                  to={`/claims/${hasClaim.id}/handshake`}
                  className="block text-center bg-primary text-white px-4 py-2 rounded-lg font-bold"
                >
                  View Samaritan Contact
                </Link>
              )}

              {isDeclined && (
                <a
                  href={`mailto:${item.profiles?.email}?subject=Claim Dispute – ${item.reference_number}&body=I would like to dispute the rejection of my claim for ${item.title} (${item.reference_number}). My claim ticket is ${hasClaim.ticket_number}.`}
                  className="block text-center bg-error text-white px-4 py-2 rounded-lg font-bold"
                >
                  Report Issue
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Original layout for users without a claim (or Samaritan)
  const canClaim = item.type === 'found' && item.status === 'active' && !isSamaritan
  const hasLocation = !!(item.location_lat && item.location_lng)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-extrabold font-headline">{item.title}</h1>
        <span className="text-sm font-mono text-outline bg-surface-container-high px-3 py-1 rounded-full">
          {item.reference_number}
        </span>
      </div>

      {item.image_urls && item.image_urls.length > 0 ? (
        <ImageCarousel images={item.image_urls} alt={item.title} />
      ) : item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="rounded-xl w-full max-h-96 object-cover mb-6"
        />
      ) : null}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <DetailRow label="Category" value={item.category} />
          <DetailRow label="Status" value={<span className="capitalize">{item.status}</span>} />
          <DetailRow
            label="Location"
            value={item.location_building || item.location_name || 'Not specified'}
          />
          <DetailRow
            label="Reported by"
            value={
              <div className="flex items-center gap-2">
                <span>{item.profiles?.full_name}</span>
                <span className="text-primary">★ {item.profiles?.reputation ?? 100}</span>
              </div>
            }
          />
          {item.incident_date && (
            <DetailRow label="Date" value={new Date(item.incident_date).toLocaleDateString()} />
          )}
          {item.incident_time && <DetailRow label="Time" value={formatTime(item.incident_time)} />}
          {item.description && (
            <div>
              <p className="text-sm text-on-surface-variant">Description</p>
              <p className="mt-1">{item.description}</p>
            </div>
          )}
        </div>
        <div>
          {hasLocation ? (
            <div className="h-64 rounded-xl overflow-hidden shadow-sm">
              <MapContainer
                center={[item.location_lat!, item.location_lng!]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[item.location_lat!, item.location_lng!]} />
              </MapContainer>
            </div>
          ) : (
            <div className="h-64 bg-surface-container-high rounded-xl flex items-center justify-center text-outline">
              No location provided
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        {isSamaritan ? (
          <Link
            to={`/user/items/${item.id}`}
            className="inline-block bg-primary text-on-primary px-6 py-3 rounded-xl font-bold"
          >
            Manage Claims
          </Link>
        ) : canClaim ? (
          <button
            onClick={() => {
              /* open claim modal */
            }}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-dim"
          >
            Claim This Item
          </button>
        ) : null}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-on-surface-variant">{label}</p>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
