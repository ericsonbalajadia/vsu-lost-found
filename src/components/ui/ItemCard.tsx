// src/components/ui/ItemCard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatTime } from '../../utils/formatTime';
import type { Item } from '../../types/database';
import StatusRibbon from './StatusRibbon';
import ClaimItemModal from '../modals/ClaimItemModal';
import ContactOwnerModal from '../modals/ContactOwnerModal';

interface ItemCardProps {
  item: Item;
  onRefresh?: () => void; // optional: refetch items after claim submission
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ItemCard({ item, onRefresh }: ItemCardProps) {
  const { user } = useAuth();
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const isOwner = user?.id === item.reporter_id;
  const canClaim = item.type === 'found' && item.status === 'active' && !isOwner;
  const canContact = item.type === 'lost' && item.status === 'active' && !isOwner;

  const handleClaimSuccess = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <article className="group bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col border border-outline-variant/20">
        {/* Image */}
        <div className="relative h-48 bg-surface-variant overflow-hidden">
          <img
            src={item.image_url ?? '/placeholder-image.svg'}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.svg';
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
                <span className="text-[10px] text-outline font-mono">
                  {item.reference_number}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-on-surface leading-tight line-clamp-1">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
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

          <div className="mt-auto pt-2">
            {user ? (
              canClaim ? (
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="block w-full py-3 bg-primary hover:bg-primary-dim text-white font-bold rounded-xl text-center text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Claim Item
                </button>
              ) : canContact ? (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="block w-full py-3 bg-secondary hover:bg-secondary-dim text-on-secondary font-bold rounded-xl text-center text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">contact_mail</span>
                  Contact Owner
                </button>
              ) : (
                <Link
                  to={`/items/${item.id}`}
                  className="block w-full py-3 bg-surface-container text-on-surface font-bold rounded-xl text-center text-sm transition-all hover:bg-surface-container-high"
                >
                  View Details
                </Link>
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

      {/* Modals */}
      <ClaimItemModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        item={item}
        onSuccess={handleClaimSuccess}
      />
      <ContactOwnerModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        item={item}
      />
    </>
  );
}