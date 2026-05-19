// src/components/modals/ItemDetailModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { claimsApi } from '../../api/claimsApi';
import { formatTime } from '../../utils/formatTime';
import ImageCarousel from '../ui/ImageCarousel';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ClaimItemModal from './ClaimItemModal';
import ContactOwnerModal from './ContactOwnerModal';
import ClaimantItemModal from './ClaimantItemModal';
import SamaritanItemModal from './SamaritanItemModal';
import LostItemFindersModal from './LostItemFindersModal';
import type { Item } from '../../types/database';

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  onRefresh?: () => void; // to refresh parent after actions
}

export default function ItemDetailModal({ isOpen, onClose, item, onRefresh }: ItemDetailModalProps) {
  const { user } = useAuth();
  const [existingClaim, setExistingClaim] = useState<any>(null);
  const [loadingClaim, setLoadingClaim] = useState(true);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showClaimantModal, setShowClaimantModal] = useState(false);
  const [showSamaritanModal, setShowSamaritanModal] = useState(false);
  const [showLostFindersModal, setShowLostFindersModal] = useState(false);

  const hasLocation = !!(item.location_lat && item.location_lng);
  const isOwner = user?.id === item.reporter_id;

  // Fetch existing claim if user is logged in
  useEffect(() => {
    if (!isOpen || !user) {
      setLoadingClaim(false);
      return;
    }
    const fetchClaim = async () => {
      setLoadingClaim(true);
      const { data } = await claimsApi.getExistingClaim(item.id, user.id);
      setExistingClaim(data);
      setLoadingClaim(false);
    };
    fetchClaim();
  }, [isOpen, user, item.id]);

  const handleClaimSuccess = () => {
    if (onRefresh) onRefresh();
    onClose(); // close this modal, parent will refresh
  };

  const renderActionArea = () => {
    if (!user) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">Sign in to claim this item or contact the owner.</p>
          <a
            href="/login"
            className="block w-full text-center bg-primary text-white py-3 rounded-xl font-bold"
          >
            Sign In
          </a>
        </div>
      );
    }

    if (loadingClaim) {
      return <div className="text-center py-8 text-outline">Loading...</div>;
    }

    if (existingClaim) {
      // User has a claim on this item (claimant)
      return (
        <div className="space-y-4">
          <div className="bg-surface-container-low p-4 rounded-xl">
            <p className="text-sm text-outline">Your claim status</p>
            <p className={`font-bold mt-1 ${
              existingClaim.status === 'pending' ? 'text-yellow-600' :
              existingClaim.status === 'accepted' ? 'text-green-600' : 'text-red-600'
            }`}>
              {existingClaim.status === 'pending' ? 'Pending Review' :
               existingClaim.status === 'accepted' ? 'Accepted' : 'Declined'}
            </p>
            <p className="text-xs text-outline mt-1">Ticket: {existingClaim.ticket_number}</p>
          </div>
          <button
            onClick={() => setShowClaimantModal(true)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
          >
            View Your Claim
          </button>
        </div>
      );
    }

    if (isOwner) {
      // Owner of the item
      if (item.type === 'found') {
        return (
          <button
            onClick={() => setShowSamaritanModal(true)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
          >
            Manage Claims
          </button>
        );
      } else {
        // lost item owner
        return (
          <button
            onClick={() => setShowLostFindersModal(true)}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
          >
            Potential Finders
          </button>
        );
      }
    }

    // Not owner, no existing claim
    if (item.type === 'found' && item.status === 'active') {
      return (
        <button
          onClick={() => setShowClaimModal(true)}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dim"
        >
          Claim This Item
        </button>
      );
    }

    if (item.type === 'lost' && item.status === 'active') {
      return (
        <button
          onClick={() => setShowContactModal(true)}
          className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary-dim"
        >
          I Found This
        </button>
      );
    }

    return (
      <p className="text-sm text-on-surface-variant">This item is no longer available for claims.</p>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base md:text-xl">close</span>
        </button>

        {/* LEFT COLUMN – Item details */}
        <div className="w-full md:w-1/2 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-5 md:p-8 space-y-5 md:space-y-6">
          <div className="space-y-6 md:space-y-8">
            {item.image_urls && item.image_urls.length > 0 ? (
              <ImageCarousel images={item.image_urls} alt={item.title} />
            ) : item.image_url ? (
              <div className="relative group">
                <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 bg-primary text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 md:px-3 md:py-1.5 rounded-lg shadow-sm ring-1 ring-white/20">
                  {item.type === 'found' ? 'Found' : 'Lost'}
                </div>
                <img src={item.image_url} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm" />
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
              {/* Date */}
              <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">calendar_today</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Date</p>
                  <p className="font-bold text-sm md:text-[15px] text-on-surface">
                    {item.incident_date ? new Date(item.incident_date).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Time */}
              {item.incident_time && (
                <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px] md:text-[22px]">schedule</span>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Time</p>
                    <p className="font-bold text-sm md:text-[15px] text-on-surface">{formatTime(item.incident_time)}</p>
                  </div>
                </div>
              )}

              {/* Location text */}
              <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">location_on</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Location</p>
                  <p className="font-bold text-sm md:text-[15px] text-on-surface">
                    {item.location_building || item.location_name || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Map */}
              {hasLocation && (
                <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="px-4 pt-3 pb-1 md:px-5 md:pt-4 md:pb-2 flex items-center gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[14px] md:text-[18px]">map</span>
                    </div>
                    <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Location Map</p>
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

              {/* Reference number */}
              <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">badge</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Reference</p>
                  <p className="font-bold text-sm md:text-[15px] text-on-surface font-mono">{item.reference_number}</p>
                </div>
              </div>

              {/* Reporter info */}
              {item.profiles && (
                <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px] md:text-[22px]">person</span>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Reported by</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-sm">{item.profiles.full_name}</span>
                      <span className="text-primary text-sm">★ {item.profiles.reputation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN – Actions */}
        <div className="flex-1 p-5 md:p-10 overflow-y-auto bg-white">
          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Actions</h3>
            {renderActionArea()}
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
  );
}