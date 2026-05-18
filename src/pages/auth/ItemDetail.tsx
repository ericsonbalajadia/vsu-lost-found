// src/pages/auth/ItemDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itemsApi } from '../../api/itemsApi';
import { claimsApi } from '../../api/claimsApi';
import SecurityChallengeModal from '../../components/modals/SecurityChallengeModal';
import EditClaimModal from '../../components/modals/EditClaimModal';
import ImageCarousel from '../../components/ui/ImageCarousel';
import { formatTime } from '../../utils/formatTime';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [existingClaim, setExistingClaim] = useState<any>(null);
  const [claimLoading, setClaimLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch item details
  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      const { data, error } = await itemsApi.getById(id!);
      if (!error && data) {
        setItem({ ...data, profiles: (data as any).profiles?.[0] });
      }
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  // Fetch existing claim for this user on this item
  useEffect(() => {
    if (!user || !id) return;
    const fetchClaim = async () => {
      const { data } = await claimsApi.getExistingClaim(id, user.id);
      setExistingClaim(data);
      setClaimLoading(false);
    };
    fetchClaim();
  }, [user, id, modalOpen, editModalOpen]);

  if (loading || claimLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!item) return <div className="p-8 text-center text-error">Item not found.</div>;

  const isSamaritan = user?.id === item.reporter_id;
  const canClaim = item.type === 'found' && item.status === 'active' && !isSamaritan && !existingClaim;
  const hasClaim = existingClaim;
  const hasLocation = !!(item.location_lat && item.location_lng);

  const handleEditSuccess = () => {
    window.location.reload();
  };

  const renderClaimStatus = () => {
    if (!hasClaim) return null;
    switch (hasClaim.status) {
      case 'pending':
        return (
          <div className="space-y-3">
            <p className="text-yellow-600">You have a pending claim for this item. Please wait for the Samaritan to review.</p>
            <button
              onClick={() => setEditModalOpen(true)}
              className="text-primary underline text-sm font-medium"
            >
              Edit Your Claim Answer
            </button>
          </div>
        );
      case 'accepted':
        return (
          <div>
            <p className="text-green-600">Your claim has been accepted!</p>
            <Link to={`/claims/${hasClaim.id}/handshake`} className="text-primary underline text-sm">
              View Samaritan Contact →
            </Link>
          </div>
        );
      case 'declined':
        return <p className="text-red-600">Your claim was declined. You cannot submit another claim for this item.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header with reference number */}
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-extrabold font-headline">{item.title}</h1>
        <span className="text-sm font-mono text-outline bg-surface-container-high px-3 py-1 rounded-full">
          {item.reference_number}
        </span>
      </div>

      {/* Image carousel or single image */}
      {item.image_urls && item.image_urls.length > 0 ? (
        <ImageCarousel images={item.image_urls} alt={item.title} />
      ) : item.image_url ? (
        <img src={item.image_url} alt={item.title} className="rounded-xl w-full max-h-96 object-cover mb-6" />
      ) : null}

      {/* Two‑column layout */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <DetailRow label="Category" value={item.category} />
          <DetailRow label="Status" value={<span className="capitalize">{item.status}</span>} />
          <DetailRow label="Location" value={item.location_building || item.location_name || 'Not specified'} />
          <DetailRow label="Reported by" value={
            <div className="flex items-center gap-2">
              <span>{item.profiles?.full_name}</span>
              <span className="text-primary">★ {item.profiles?.reputation ?? 100}</span>
            </div>
          } />
          {item.incident_date && (
            <DetailRow label="Date" value={new Date(item.incident_date).toLocaleDateString()} />
          )}
          {item.incident_time && (
            <DetailRow label="Time" value={formatTime(item.incident_time)} />
          )}
          {item.description && (
            <div>
              <p className="text-sm text-on-surface-variant">Description</p>
              <p className="mt-1">{item.description}</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div>
          {hasLocation ? (
            <div className="h-64 rounded-xl overflow-hidden shadow-sm">
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
          ) : (
            <div className="h-64 bg-surface-container-high rounded-xl flex items-center justify-center text-outline">
              No location provided
            </div>
          )}
        </div>
      </div>

      {/* Action area */}
      <div className="mt-8">
        {isSamaritan ? (
          <Link to={`/user/items/${item.id}`} className="inline-block bg-primary text-on-primary px-6 py-3 rounded-xl font-bold">
            Manage Claims
          </Link>
        ) : canClaim ? (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-dim"
          >
            Claim This Item
          </button>
        ) : (
          renderClaimStatus()
        )}
      </div>

      {/* Modals */}
      <SecurityChallengeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={item}
        userId={user?.id || ''}
        onSuccess={() => {
          setModalOpen(false);
          window.location.reload();
        }}
      />

      <EditClaimModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        claimId={hasClaim?.id || ''}
        currentAnswer={hasClaim?.answer || ''}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-on-surface-variant">{label}</p>
      <div className="font-semibold">{value}</div>
    </div>
  );
}