// src/components/modals/ClaimantItemModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { claimsApi } from '../../api/claimsApi';
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

interface ClaimantItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  claim: {
    id: string;
    ticket_number: string;
    answer: string;
    status: string;
  };
  onRefresh?: () => void;
}

export default function ClaimantItemModal({
  isOpen,
  onClose,
  item,
  claim,
  onRefresh,
}: ClaimantItemModalProps) {
  const [answer, setAnswer] = useState(claim.answer);
  const [saving, setSaving] = useState(false);
  const [reporterEmail, setReporterEmail] = useState('');
  const hasLocation = !!(item.location_lat && item.location_lng);
  const isPending = claim.status === 'pending';
  const isAccepted = claim.status === 'accepted';
  const isDeclined = claim.status === 'declined';

  useEffect(() => {
    if (isOpen) setAnswer(claim.answer);
  }, [isOpen, claim.answer]);

  // Fetch reporter email for declined claims (to dispute)
  useEffect(() => {
    if (isDeclined && item.reporter_id) {
      const fetchReporterEmail = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', item.reporter_id)
            .single();

          if (data) setReporterEmail(data.email);
        } catch {
          console.error('Failed to fetch reporter email');
        }
      };

      fetchReporterEmail();
    }
  }, [isDeclined, item.reporter_id]);

  const handleSave = async () => {
    if (!answer.trim()) {
      toast.error('Answer cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await claimsApi.update(claim.id, answer);
      toast.success('Answer updated');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Left column: item summary */}
        <div className="w-full md:w-1/2 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-6 md:p-8 space-y-6">
          <div className="space-y-8">
            {/* Image carousel */}
            {item.image_urls && item.image_urls.length > 0 ? (
              <ImageCarousel images={item.image_urls} alt={item.title} />
            ) : item.image_url ? (
              <div className="relative group">
                <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-md ring-1 ring-white/20">
                  {item.type === 'found' ? 'Found' : 'Lost'}
                </div>
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10"
                />
              </div>
            ) : null}

            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
                  {item.title}
                </h2>
                <p className="text-on-surface-variant leading-relaxed text-[15px] mt-2">
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Date chip */}
                <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-0.5">Date</p>
                    <p className="font-bold text-[15px] text-on-surface">
                      {item.incident_date ? new Date(item.incident_date).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Time chip */}
                {item.incident_time && (
                  <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">schedule</span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-0.5">Time</p>
                      <p className="font-bold text-[15px] text-on-surface">
                        {formatTime(item.incident_time)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location chip */}
                <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">location_on</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-0.5">Location</p>
                    <p className="font-bold text-[15px] text-on-surface">
                      {item.location_building || item.location_name || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Map card */}
                {hasLocation && (
                  <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">map</span>
                      </div>
                      <p className="text-[11px] uppercase font-bold text-outline tracking-wider">Location Map</p>
                    </div>
                    <div className="h-48 w-full">
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

                {/* Reference chip */}
                <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">badge</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-0.5">Reference</p>
                    <p className="font-bold text-[15px] text-on-surface font-mono">
                      {item.reference_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: claim management */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white">
          <div className="">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">
              Your Claim
            </h1>
            <p className="text-on-surface-variant text-[15px] leading-relaxed mb-6">
              Claim ticket: <span className="font-mono font-bold">{claim.ticket_number}</span>
            </p>

            <div className="space-y-8">
              {/* Status chip */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-outline">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isPending ? 'bg-yellow-100 text-yellow-800' :
                  isAccepted ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {isPending ? 'Pending Review' : isAccepted ? 'Accepted' : 'Declined'}
                </span>
              </div>

              {/* Answer section with proper label */}
              <div>
                <label htmlFor="claimant-answer" className="block text-sm font-bold text-on-surface mb-2">
                  Your Answer
                </label>
                {isPending ? (
                  <>
                    <textarea
                      id="claimant-answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={5}
                      placeholder="Provide details about the item..."
                      className="w-full bg-surface-container-low border border-surface-container-high rounded-2xl p-4 text-on-surface focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all resize-none"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="mt-4 w-full bg-primary hover:bg-primary-dim text-on-primary py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                    <p className="whitespace-pre-wrap">{claim.answer}</p>
                  </div>
                )}
              </div>

              {/* Actions for accepted / declined */}
              {isAccepted && (
                <Link
                  to={`/claims/${claim.id}/handshake`}
                  onClick={onClose}
                  className="block w-full text-center bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary-dim transition"
                >
                  View Samaritan Contact →
                </Link>
              )}

              {isDeclined && (
                <a
                  href={`mailto:${reporterEmail}?subject=Claim Dispute – ${item.reference_number}&body=I would like to dispute the rejection of my claim for ${item.title} (${item.reference_number}). My claim ticket is ${claim.ticket_number}.`}
                  className="block w-full text-center bg-error text-on-error py-3 rounded-xl font-bold hover:bg-error/80 transition"
                >
                  Report Issue (Email)
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}