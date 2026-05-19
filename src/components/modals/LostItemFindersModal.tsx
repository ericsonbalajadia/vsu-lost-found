// src/components/modals/LostItemFindersModal.tsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { lostItemFindersApi } from '../../api/lostItemFindersApi';
import { formatTime } from '../../utils/formatTime';
import ImageCarousel from '../ui/ImageCarousel';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Item } from '../../types/database';

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LostItemFindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
}

export default function LostItemFindersModal({ isOpen, onClose, item }: LostItemFindersModalProps) {
  const [finders, setFinders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLocation = !!(item.location_lat && item.location_lng);

  useEffect(() => {
    if (!isOpen) return;
    const fetchFinders = async () => {
      setLoading(true);
      const { data } = await lostItemFindersApi.getByLostItem(item.id);
      setFinders(data || []);
      setLoading(false);
    };
    fetchFinders();
  }, [isOpen, item.id]);

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
            {item.image_urls && item.image_urls.length > 0 ? (
              <ImageCarousel images={item.image_urls} alt={item.title} />
            ) : item.image_url ? (
              <div className="relative">
                <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-md ring-1 ring-white/20">
                  Lost
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
                {/* Date */}
                <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-outline tracking-wider">Date</p>
                    <p className="font-bold text-[15px] text-on-surface">
                      {item.incident_date ? new Date(item.incident_date).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Time */}
                {item.incident_time && (
                  <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[22px]">schedule</span>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-outline tracking-wider">Time</p>
                      <p className="font-bold text-[15px] text-on-surface">
                        {formatTime(item.incident_time)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">location_on</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-outline tracking-wider">Location</p>
                    <p className="font-bold text-[15px] text-on-surface">
                      {item.location_building || item.location_name || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Map */}
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

                {/* Reference */}
                <div className="bg-white px-5 py-4 rounded-2xl flex items-center gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">badge</span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase font-bold text-outline tracking-wider">Reference</p>
                    <p className="font-bold text-[15px] text-on-surface font-mono">
                      {item.reference_number}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: list of potential finders */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white">
          <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
              Potential Finders
            </h1>
            <p className="text-sm text-on-surface-variant">
              People who have reported finding this item:
            </p>

            {loading ? (
              <div className="text-center py-8 text-outline">Loading...</div>
            ) : finders.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                No one has reported finding this item yet.
              </div>
            ) : (
              <div className="space-y-4">
                {finders.map((finder) => (
                  <div key={finder.id} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/10">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div>
                        <p className="font-semibold">{finder.profiles?.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-outline mt-0.5">
                          Reported: {new Date(finder.created_at).toLocaleString()}
                        </p>
                        {finder.message && (
                          <p className="text-sm mt-2 italic text-on-surface-variant">
                            "{finder.message}"
                          </p>
                        )}
                      </div>
                      <a
                        href={`mailto:${finder.profiles?.email}?subject=Regarding your report for ${item.title}&body=Hi, you reported finding my lost item "${item.title}". Let's coordinate.`}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dim transition shrink-0"
                      >
                        Contact Finder
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}