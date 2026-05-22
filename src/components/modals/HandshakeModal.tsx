/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/modals/HandshakeModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { openEmailThread } from '../../lib/mailto';
import { formatTime } from '../../utils/formatTime';
import ImageCarousel from '../ui/ImageCarousel';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import type { Item } from '../../types/database';

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface HandshakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  item: Item;
  onComplete?: () => void;
}

export default function HandshakeModal({ isOpen, onClose, claimId, item, onComplete }: HandshakeModalProps) {
  const [claimant, setClaimant] = useState<{ full_name: string; email: string; phone: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const hasLocation = !!(item.location_lat && item.location_lng);

  useEffect(() => {
    if (!isOpen || !claimId) return;

    const fetchClaimant = async () => {
      setLoading(true);
      try {
        // 1. Get claimant_id from claim
        const { data: claimData, error: claimError } = await supabase
          .from('claims')
          .select('claimant_id')
          .eq('id', claimId)
          .single();

        if (claimError || !claimData) {
          console.error('Failed to fetch claim:', claimError);
          setLoading(false);
          return;
        }

        // 2. Fetch profile using claimant_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', claimData.claimant_id)
          .single();

        if (profileError || !profileData) {
          console.error('Failed to fetch claimant profile:', profileError);
          setLoading(false);
          return;
        }

        setClaimant(profileData);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimant();
  }, [isOpen, claimId]);

  const handleEmail = () => {
    if (!claimant) return;
    openEmailThread({
      toEmail: claimant.email,
      itemTitle: item.title,
      itemRef: item.reference_number,
      claimTicket: '',
    });
  };

  const handleCompleteHandover = async () => {
    if (resolving) return;
    setResolving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('finalize_resolution', {
        p_item_id: item.id,
        p_samaritan_id: user.user.id,
      });
      if (error) throw error;
      toast.success('Item marked as resolved. Other claimants have been notified. You earned +10 reputation!');
      if (onComplete) onComplete();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete handover');
    } finally {
      setResolving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base md:text-xl">close</span>
        </button>

        {/* LEFT COLUMN – Item Details (unchanged from your version) */}
        <div className="w-full md:w-1/2 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-5 md:p-8 space-y-5 md:space-y-6">
          <div className="space-y-6 md:space-y-8">
            {item.image_urls && item.image_urls.length > 0 ? (
              <ImageCarousel images={item.image_urls} alt={item.title} />
            ) : item.image_url ? (
              <div className="relative group">
                <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 bg-primary text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-2 py-1 md:px-3 md:py-1.5 rounded-lg shadow-sm ring-1 ring-white/20">
                  {item.type === 'found' ? 'Found' : 'Lost'}
                </div>
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10"
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

            <div className="space-y-3 md:space-y-4">
              {/* Date */}
              <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">calendar_today</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Date Found</p>
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
                    <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Time Found</p>
                    <p className="font-bold text-sm md:text-[15px] text-on-surface">{formatTime(item.incident_time)}</p>
                  </div>
                </div>
              )}

              {/* Location */}
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

              {/* Reference */}
              <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px] md:text-[22px]">badge</span>
                </div>
                <div>
                  <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Reference</p>
                  <p className="font-bold text-sm md:text-[15px] text-on-surface font-mono">
                    {item.reference_number}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN – Claimant Info & Actions */}
        <div className="flex-1 p-5 md:p-10 overflow-y-auto bg-white">
          <div className="space-y-6 md:space-y-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Confirmed Claimant</h3>
              <p className="text-sm md:text-base text-on-surface-variant mt-1">Review and manage the verified claimant's contact information and coordination thread.</p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-outline">Loading claimant details...</div>
            ) : claimant ? (
              <div className="bg-surface-container-low/50 rounded-3xl p-5 md:p-6 border border-outline-variant/10 space-y-4">
                <div className="flex items-center gap-3 md:gap-4 p-2 md:p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px] md:text-[22px]">person</span>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Full Name</p>
                    <p className="font-bold text-sm md:text-[15px] text-on-surface">{claimant.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 p-2 md:p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px] md:text-[22px]">mail</span>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Email Address</p>
                    <p className="font-bold text-sm md:text-[15px] text-on-surface">{claimant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 p-2 md:p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px] md:text-[22px]">call</span>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">Contact Number</p>
                    <p className="font-bold text-sm md:text-[15px] text-on-surface">{claimant.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-error">Unable to load claimant contact.</div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleEmail}
                disabled={!claimant}
                className="w-full bg-primary hover:bg-primary-dim text-white py-3 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                <span className="material-symbols-outlined">mail</span>
                Create Email Thread
              </button>
              <button
                onClick={handleCompleteHandover}
                disabled={resolving || !claimant}
                className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white py-3 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                <span className="material-symbols-outlined">check_circle</span>
                {resolving ? 'Completing...' : 'Complete Handover'}
              </button>
            </div>

            <div className="bg-secondary-container/20 p-4 md:p-6 rounded-2xl border border-secondary/10">
              <div className="flex gap-3 md:gap-4">
                <span className="material-symbols-outlined text-secondary shrink-0">verified</span>
                <div className="space-y-1 md:space-y-2">
                  <h5 className="text-sm font-bold text-on-secondary-container">Proof Verified</h5>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Ownership was confirmed via the claimant's answer to the security question.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}