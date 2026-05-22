/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
// src/pages/auth/MyClaims.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import EditClaimModal from '../../components/modals/EditClaimModal';
import toast from 'react-hot-toast';

interface ClaimWithItem {
  id: string;
  ticket_number: string;
  answer: string;
  status: string;
  created_at: string;
  items: {
    id: string;
    title: string;
    reference_number: string;
    image_url: string | null;
    type: string;
  };
}

export default function MyClaims() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClaim, setEditingClaim] = useState<{ id: string; answer: string } | null>(null);

  const fetchClaims = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('claims')
      .select(`
        id,
        ticket_number,
        answer,
        status,
        created_at,
        items!inner (
          id,
          title,
          reference_number,
          image_url,
          type
        )
      `)
      .eq('claimant_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const transformed = (data as any[]).map((claim) => ({
        ...claim,
        items: claim.items?.[0] ?? {
          id: '',
          title: '',
          reference_number: '',
          image_url: null,
          type: '',
        },
      }));
      setClaims(transformed as ClaimWithItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case 'accepted':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Accepted</span>;
      case 'declined':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Declined</span>;
      default:
        return null;
    }
  };

  const handleEditSuccess = () => {
    toast.success('Claim updated!');
    fetchClaims(); // refresh the list
  };

  if (loading) return <div className="p-8 text-center">Loading your claims...</div>;

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">My Claims</h1>
        {claims.length === 0 ? (
          <p className="text-on-surface-variant">You haven't submitted any claims yet.</p>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link to={`/items/${claim.items.id}`} className="font-bold hover:underline">
                      {claim.items.title}
                    </Link>
                    <p className="text-sm text-outline">Ticket: {claim.ticket_number}</p>
                    <p className="text-sm mt-1">Your answer: {claim.answer.substring(0, 100)}...</p>
                    <p className="text-xs text-outline mt-1">
                      Submitted: {new Date(claim.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(claim.status)}
                    {claim.status === 'pending' && (
                      <button
                        onClick={() => setEditingClaim({ id: claim.id, answer: claim.answer })}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                {claim.status === 'accepted' && (
                  <div className="mt-3">
                    <Link
                      to={`/claims/${claim.id}/handshake`}
                      className="text-primary text-sm font-bold hover:underline"
                    >
                      View Samaritan Contact →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Claim Modal */}
      <EditClaimModal
        isOpen={!!editingClaim}
        onClose={() => setEditingClaim(null)}
        claimId={editingClaim?.id || ''}
        currentAnswer={editingClaim?.answer || ''}
        onSuccess={handleEditSuccess}
      />
    </AuthenticatedLayout>
  );
}