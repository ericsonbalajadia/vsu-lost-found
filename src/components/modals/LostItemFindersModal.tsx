// src/components/modals/LostItemFindersModal.tsx
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { lostItemFindersApi } from '../../api/lostItemFindersApi'
import { formatTime } from '../../utils/formatTime'
import ImageCarousel from '../ui/ImageCarousel'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Item } from '../../types/database'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LostItemFindersModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item
}

export default function LostItemFindersModal({ isOpen, onClose, item }: LostItemFindersModalProps) {
  const [finders, setFinders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const hasLocation = !!(item.location_lat && item.location_lng)

  useEffect(() => {
    if (!isOpen) return
    const fetchFinders = async () => {
      setLoading(true)
      const { data } = await lostItemFindersApi.getByLostItem(item.id)
      setFinders(data || [])
      setLoading(false)
    }
    fetchFinders()
  }, [isOpen, item.id])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base md:text-xl">close</span>
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col md:flex-row">
            {/* Left column */}
            <div className="w-full md:w-1/2 shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-5 md:p-8 space-y-5 md:space-y-6">
              <div className="space-y-6 md:space-y-8">
                {item.image_urls && item.image_urls.length > 0 ? (
                  <ImageCarousel images={item.image_urls} alt={item.title} />
                ) : item.image_url ? (
                  <div className="relative">
                    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10 bg-primary text-white text-[9px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-1 md:px-4 md:py-2 rounded-xl shadow-md ring-1 ring-white/20">
                      Lost
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
                  <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                        calendar_today
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                        Date
                      </p>
                      <p className="font-bold text-sm md:text-[15px] text-on-surface">
                        {item.incident_date
                          ? new Date(item.incident_date).toLocaleDateString()
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {item.incident_time && (
                    <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                          schedule
                        </span>
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                          Time
                        </p>
                        <p className="font-bold text-sm md:text-[15px] text-on-surface">
                          {formatTime(item.incident_time)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                        location_on
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                        Location
                      </p>
                      <p className="font-bold text-sm md:text-[15px] text-on-surface">
                        {item.location_building || item.location_name || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {hasLocation && (
                    <div className="bg-white rounded-2xl overflow-hidden ring-1 ring-outline-variant/10 shadow-sm">
                      <div className="px-4 pt-3 pb-1 md:px-5 md:pt-4 md:pb-2 flex items-center gap-2">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[14px] md:text-[18px]">
                            map
                          </span>
                        </div>
                        <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                          Location Map
                        </p>
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

                  <div className="bg-white px-4 py-3 md:px-5 md:py-4 rounded-2xl flex items-center gap-4 md:gap-5 ring-1 ring-outline-variant/10 shadow-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px] md:text-[22px]">
                        badge
                      </span>
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[11px] uppercase font-bold text-outline tracking-wider">
                        Reference
                      </p>
                      <p className="font-bold text-sm md:text-[15px] text-on-surface font-mono">
                        {item.reference_number}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile divider */}
            <div className="flex items-center gap-2 my-4 md:hidden">
              <div className="flex-1 border-t-2 border-dashed border-outline-variant/40"></div>
              <span className="material-symbols-outlined text-outline text-sm">drag_handle</span>
              <div className="flex-1 border-t-2 border-dashed border-outline-variant/40"></div>
            </div>

            {/* Right column */}
            <div className="flex-1 p-5 md:p-10 overflow-y-auto bg-white">
              <div className="space-y-4 md:space-y-6">
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                  Potential Finders
                </h1>
                <p className="text-sm md:text-base text-on-surface-variant">
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
                      <div
                        key={finder.id}
                        className="bg-surface-container-low rounded-xl p-3 md:p-4 border border-outline-variant/10"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm md:text-base truncate">
                              {finder.profiles?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-[10px] md:text-xs text-outline mt-0.5">
                              Reported: {new Date(finder.created_at).toLocaleString()}
                            </p>
                            {finder.message && (
                              <p className="text-xs md:text-sm mt-2 italic text-on-surface-variant break-words">
                                "{finder.message}"
                              </p>
                            )}
                          </div>
                          <a
                            href={`mailto:${finder.profiles?.email}?subject=Regarding your report for ${item.title}&body=Hi, you reported finding my lost item "${item.title}". Let's coordinate.`}
                            className="bg-primary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-primary-dim transition shrink-0 whitespace-nowrap"
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
        </div>
      </div>
    </div>,
    document.body
  )
}
