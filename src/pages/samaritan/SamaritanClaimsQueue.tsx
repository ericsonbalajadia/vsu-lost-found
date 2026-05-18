// src/pages/samaritan/SamaritanClaimsQueue.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { claimsApi } from '../../api/claimsApi';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ClaimItem {
  id: string;
  ticket_number: string;
  answer: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    reputation: number;
  };
  items: {
    id: string;
    title: string;
    reference_number: string;
    samaritan_notes: string;
  };
}

export default function SamaritanClaimsQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null);

  const fetchClaims = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('claims')
      .select(`
        id,
        ticket_number,
        answer,
        created_at,
        profiles!claimant_id (
          full_name,
          email,
          phone,
          avatar_url,
          reputation
        ),
        items!inner (
          id,
          title,
          reference_number,
          samaritan_notes
        )
      `)
      .eq('status', 'pending')
      .eq('items.reporter_id', user.id);

    if (!error && data) {
      // Transform: Supabase returns profiles and items as arrays, extract first element
      const transformed = (data as any[]).map((item) => ({
        id: item.id,
        ticket_number: item.ticket_number,
        answer: item.answer,
        created_at: item.created_at,
        profiles: item.profiles?.[0] ?? {
          full_name: 'Unknown',
          email: '',
          phone: null,
          avatar_url: null,
          reputation: 0,
        },
        items: item.items?.[0] ?? {
          id: '',
          title: '',
          reference_number: '',
          samaritan_notes: '',
        },
      }));
      setClaims(transformed);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, [user]);

  const handleAccept = async (claimId: string) => {
    if (!user) return;
    setProcessingId(claimId);
    try {
      await claimsApi.acceptBySamaritan(claimId, user.id);
      toast.success('Claim accepted. Item status updated to negotiation.');
      navigate(`/user/claims/${claimId}/resolved`);
    } catch {
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
      await fetchClaims();
    } catch {
      toast.error('Failed to reject claim');
    } finally {
      setProcessingId(null);
      setShowRejectConfirm(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading pending claims...</div>;

  // Group notes by item for display at top
  const notesMap = new Map<string, { title: string; ref: string; notes: string }>();
  claims.forEach((claim) => {
    if (!notesMap.has(claim.items.id)) {
      notesMap.set(claim.items.id, {
        title: claim.items.title,
        ref: claim.items.reference_number,
        notes: claim.items.samaritan_notes,
      });
    }
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pending Claims</h1>

      {/* Private notes section (per item) */}
      {notesMap.size > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-xl font-semibold">Your Private Notes (for reference)</h2>
          {Array.from(notesMap.entries()).map(([itemId, { title, ref, notes }]) => (
            <div key={itemId} className="bg-surface-container-low p-4 rounded-xl border-l-4 border-primary">
              <p className="font-bold">
                {title} <span className="text-sm text-outline font-mono">({ref})</span>
              </p>
              <p className="text-on-surface-variant mt-1 italic">"{notes || 'No notes provided'}"</p>
            </div>
          ))}
        </div>
      )}

      {claims.length === 0 ? (
        <p className="text-on-surface-variant">No pending claims at the moment.</p>
      ) : (
        <div className="space-y-6">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border">
              <div className="flex flex-wrap justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    {claim.profiles.avatar_url ? (
                      <img
                        src={claim.profiles.avatar_url}
                        className="w-10 h-10 rounded-full"
                        alt=""
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{claim.profiles.full_name}</p>
                      <p className="text-xs text-outline">
                        Reputation: {claim.profiles.reputation}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-outline">Claim ticket: {claim.ticket_number}</p>
                  <div className="bg-surface-container-high p-3 rounded-lg">
                    <p className="text-xs font-semibold text-primary">Claimant's answer:</p>
                    <p className="text-sm">{claim.answer}</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <button
                    onClick={() => handleAccept(claim.id)}
                    disabled={processingId === claim.id}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-dim disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setShowRejectConfirm(claim.id)}
                    disabled={processingId === claim.id}
                    className="px-4 py-2 bg-error text-on-error rounded-lg font-bold hover:bg-error/80 disabled:opacity-50"
                  >
                    Reject & Penalize
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject confirmation dialog */}
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