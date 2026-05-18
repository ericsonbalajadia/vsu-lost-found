// src/components/modals/ContactOwnerModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import { openEmailThread } from '../../lib/mailto';
import { formatTime } from '../../utils/formatTime';
import type { Item } from '../../types/database';
import ImageCarousel from '../ui/ImageCarousel';

// Fix Leaflet icon paths (Vite specific)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ContactOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
}

interface ReporterDetails {
  full_name: string;
  email: string;
  phone: string | null;
}

export default function ContactOwnerModal({ isOpen, onClose, item }: ContactOwnerModalProps) {
  const [reporter, setReporter] = useState<ReporterDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const hasLocation = item.location_lat && item.location_lng;

  useEffect(() => {
    if (!isOpen || !item.reporter_id) return;

    const fetchReporter = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', item.reporter_id)
        .single();

      if (!error && data) {
        setReporter(data);
      } else {
        console.error('Failed to fetch reporter details:', error);
      }
      setLoading(false);
    };

    fetchReporter();
  }, [isOpen, item.reporter_id]);

const handleEmail = () => {
  if (!reporter) return;
  openEmailThread({
    toEmail: reporter.email,
    itemTitle: item.title,
    itemRef: item.reference_number,
    // claimTicket is omitted for lost items
  });
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

        {/* Left column: item summary with map */}
        <div className="w-full md:w-1/2 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-6 md:p-8 space-y-6">
          <div className="space-y-8">
{item.image_urls && item.image_urls.length > 0 ? (
  <ImageCarousel images={item.image_urls} alt={item.title} />
) : item.image_url ? (
  <img src={item.image_url} alt={item.title} className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10" />
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
                {/* Date card */}
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

                {/* Time card (if available) */}
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

                {/* Location card */}
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

                {/* Map card (if coordinates exist) */}
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

                {/* Reference number card */}
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

        {/* Right column: owner contact (unchanged) */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white">
          <div className="">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-4">
              Owner Verified
            </h1>
            <p className="text-on-surface-variant text-[15px] leading-relaxed">
              Great news! You can now contact the owner directly to coordinate the return of their item.
            </p>

            <div className="space-y-10 mt-8">
              {loading ? (
                <div className="text-center py-8 text-outline">Loading contact details...</div>
              ) : reporter ? (
                <div className="bg-surface-container-low/50 rounded-3xl p-6 border border-outline-variant/10 space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">person</span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-0.5">Full Name</p>
                      <p className="font-bold text-[15px] text-on-surface">{reporter.full_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">mail</span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-0.5">Email Address</p>
                      <p className="font-bold text-[15px] text-on-surface">{reporter.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-white rounded-2xl ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">call</span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-0.5">Contact Number</p>
                      <p className="font-bold text-[15px] text-on-surface">
                        {reporter.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-error">Unable to load owner contact.</div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleEmail}
                  disabled={!reporter}
                  className="group relative w-full py-4 bg-primary hover:bg-primary-dim text-on-primary rounded-2xl font-bold text-base shadow-[0_20px_40px_-12px_rgba(44,91,182,0.3)] hover:shadow-[0_20px_40px_-8px_rgba(44,91,182,0.4)] active:scale-[0.99] transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Create Email Thread
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}