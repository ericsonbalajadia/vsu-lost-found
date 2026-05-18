// src/pages/auth/ItemDetail.tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsApi } from '../../api/itemsApi'
import SecurityChallengeModal from '../../components/modals/SecurityChallengeModal'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import ImageCarousel from '../../components/ui/ImageCarousel'

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '<https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png>',
  iconUrl: '<https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png>',
  shadowUrl: '<https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png>',
})

export default function ItemDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    itemsApi.getById(id).then(({ data, error }) => {
      if (!error && data) {
        setItem({ ...data, profiles: (data as any).profiles?.[0] })
      }
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!item) return <div className="p-8 text-center text-error">Item not found.</div>

  const isSamaritan = user?.id === item.reporter_id
  const canClaim = item.type === 'found' && item.status === 'active' && !isSamaritan
  const hasLocation = item.location_lat && item.location_lng

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
                center={[item.location_lat, item.location_lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[item.location_lat, item.location_lng]} />
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
            onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-dim"
          >
            Claim This Item
          </button>
        ) : item.type === 'lost' ? (
          <p className="text-on-surface-variant">
            This item is lost. If you found it, please report a found match.
          </p>
        ) : item.status !== 'active' ? (
          <p className="text-on-surface-variant">This item is no longer available for claims.</p>
        ) : null}
      </div>

      <SecurityChallengeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={item}
        onSuccess={() => window.location.reload()}
      />
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
