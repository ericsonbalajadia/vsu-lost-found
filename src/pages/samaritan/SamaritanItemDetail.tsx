// src/pages/samaritan/SamaritanItemDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { itemsApi } from '../../api/itemsApi';
import { claimsApi } from '../../api/claimsApi';
import { formatTime } from '../../utils/formatTime';
import ImageCarousel from '../../components/ui/ImageCarousel';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

// Fix Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Claim {
  id: string;
  ticket_number: string;
  answer: string;
  status: string;
  created_at: string;
  claimant: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    reputation: number;
  };
}

export default function SamaritanItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null);

  // Fetch item and its pending claims
  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      // 1. Get item (use itemsApi.getById which includes reporter_id)
      const { data: itemData, error: itemErr } = await itemsApi.getById(id);
      if (itemErr || !itemData) {
        toast.error('Item not found');
        navigate('/inventory');
        return;
      }
      // Transform profiles array to object
      const typedItem = { ...itemData, profiles: (itemData as any).profiles?.[0] };
      setItem(typedItem);

      // 2. Verify current user is the reporter (Samaritan)
      if (typedItem.reporter_id !== user.id) {
        toast.error('You are not authorized to view this page');
        navigate('/inventory');
        return;
      }

      // 3. Fetch pending claims for this item
      const { data: claimsData, error: claimsErr } = await supabase
        .from('claims')
        .select(`
          id,
          ticket_number,
          answer,
          status,
          created_at,
          profiles!claimant_id (
            full_name,
            email,
            avatar_url,
            reputation
          )
        `)
        .eq('item_id', id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!claimsErr && claimsData) {
        const transformed = (claimsData as any[]).map((c) => ({
          ...c,
          claimant: c.profiles?.[0] || {
            full_name: 'Unknown',
            email: '',
            avatar_url: null,
            reputation: 0,
          },
        }));
        setClaims(transformed);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user, navigate]);

  const handleAccept = async (claimId: string) => {
    if (!user) return;
    setProcessingId(claimId);
    try {
      await claimsApi.acceptBySamaritan(claimId, user.id);
      toast.success('Claim accepted. Redirecting to handshake...');
      navigate(`/user/claims/${claimId}/resolved`);
    } catch (err) {
      toast.error('Failed to accept claim');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claimId: string) => {
    if (!user) return;
    setProcessingId(claimId);
    try {
      await claimsApi.penalize(claimId, user.id);
      toast.success('Claim rejected and claimant penalized (-10 reputation).');
      // Refresh claims list
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } catch (err) {
      toast.error('Failed to reject claim');
    } finally {
      setProcessingId(null);
      setShowRejectConfirm(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!item) return null;

  const hasLocation = !!(item.location_lat && item.location_lng);
  const activeClaimsCount = claims.length;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Column: Item Details (width: 420px) */}
      <div className="w-[420px] shrink-0 border-r border-outline-variant/10 overflow-y-auto bg-surface-container-low/30 p-8 space-y-8">
        <div className="space-y-6">
          {/* Image Carousel / Single Image */}
          <div className="relative group">
            {item.image_urls && item.image_urls.length > 0 ? (
              <ImageCarousel images={item.image_urls} alt={item.title} />
            ) : item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full aspect-[4/3] object-cover rounded-2xl shadow-sm ring-1 ring-outline-variant/10"
              />
            ) : null}
            <div className="absolute top-4 left-4 z-10 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm ring-1 ring-white/20">
              {item.type === 'found' ? 'Found' : 'Lost'}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
                {item.title}
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-sm mt-2">
                {item.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Date */}
              <div className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Date</p>
                  <p className="font-bold text-sm text-on-surface">
                    {item.incident_date
                      ? new Date(item.incident_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Time */}
              {item.incident_time && (
                <div className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                  <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Time</p>
                    <p className="font-bold text-sm text-on-surface">
                      {formatTime(item.incident_time)}
                    </p>
                  </div>
                </div>
              )}

              {/* Location (text) */}
              <div className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Location</p>
                  <p className="font-bold text-sm text-on-surface">
                    {item.location_building || item.location_name || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Map (if coordinates exist) */}
              {hasLocation && (
                <div className="rounded-xl overflow-hidden ring-1 ring-outline-variant/10">
                  <MapContainer
                    center={[item.location_lat!, item.location_lng!]}
                    zoom={15}
                    style={{ height: '200px', width: '100%' }}
                    zoomControl={true}
                    attributionControl={true}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[item.location_lat!, item.location_lng!]} />
                  </MapContainer>
                </div>
              )}

              {/* Active Claims Count */}
              <div className="bg-surface-container-lowest px-4 py-3 rounded-xl flex items-center gap-4 ring-1 ring-outline-variant/10">
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Active Claims</p>
                  <p className="font-bold text-sm text-on-surface">
                    {activeClaimsCount} Pending
                  </p>
                </div>
              </div>

              {/* Private Samaritan Notes (if any) */}
              {item.samaritan_notes && (
                <div className="bg-primary-container/10 p-4 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-sm">lock</span>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Your Private Notes
                    </p>
                  </div>
                  <p className="text-xs text-on-surface italic">
                    “{item.samaritan_notes}”
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Claims Queue (width: 480px) */}
      <div className="w-[480px] bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-hidden">
        <div className="px-8 py-6 border-b border-outline-variant/10 shrink-0 bg-background/80 backdrop-blur-sm z-10">
          <h3 className="text-2xl font-extrabold text-on-surface font-headline tracking-tight">
            Confirmed Claimant
          </h3>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed font-body">
            Review and manage verified claimant information and coordinate the return thread.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 p-6">
          {claims.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              No pending claims for this item.
            </div>
          ) : (
            claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-2xl p-6 border border-outline-variant/10 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
              >
                <div className="flex gap-5">
                  {/* Claimant Avatar */}
                  <div className="shrink-0">
                    {claim.claimant.avatar_url ? (
                      <img
                        src={claim.claimant.avatar_url}
                        alt={claim.claimant.full_name}
                        className="w-14 h-14 rounded-xl object-cover ring-1 ring-outline-variant/10 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold ring-1 ring-primary/20">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-extrabold text-on-surface font-headline leading-tight">
                          {claim.claimant.full_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[11px] font-medium mt-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Submitted {new Date(claim.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRejectConfirm(claim.id)}
                          disabled={processingId === claim.id}
                          className="px-3 py-2 rounded-lg text-xs font-bold border border-outline-variant/30 text-on-surface hover:bg-error/5 hover:text-error hover:border-error/20 transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(claim.id)}
                          disabled={processingId === claim.id}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white shadow-sm hover:bg-primary-dim transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">verified_user</span>
                          Accept
                        </button>
                      </div>
                    </div>

                    {/* Ownership Challenge (Security Question and Answer) */}
                    <div className="bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/5">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <span className="material-symbols-outlined text-[16px]">shield_question</span>
                        <span className="text-[10px] uppercase font-black tracking-widest">Ownership Challenge</span>
                      </div>
                      <p className="text-[13px] font-semibold text-on-surface leading-snug mb-3 italic">
                        "{item.security_question || 'No question provided'}"
                      </p>
                      <div className="bg-white p-3 rounded-lg text-on-surface-variant leading-relaxed text-xs border border-outline-variant/10 shadow-sm">
                        {claim.answer}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Confirm Penalty</h3>
            <p className="mb-4">
              This will deduct 10 reputation points from the claimant. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectConfirm(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectConfirm)}
                className="px-4 py-2 bg-error text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}