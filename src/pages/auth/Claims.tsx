// src/pages/auth/Claims.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { claimsApi } from '../../api/claimsApi';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import EditClaimModal from '../../components/modals/EditClaimModal';
import SamaritanItemModal from '../../components/modals/SamaritanItemModal';
import toast from 'react-hot-toast';
import type { Item } from '../../types/database';

interface ClaimantClaim {
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

interface SamaritanClaim {
  id: string;
  ticket_number: string;
  answer: string;
  created_at: string;
  claimant: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    reputation: number;
  };
  item: {
    id: string;
    title: string;
    reference_number: string;
    image_url: string | null;
    security_question: string;
    samaritan_notes: string;
    location_building: string;
    location_name: string;
    incident_date: string;
    incident_time: string;
    location_lat: number | null;
    location_lng: number | null;
    image_urls: string[] | null;
    type: string;
    status: string;
  };
}

export default function Claims() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'claimant' | 'samaritan'>('claimant');
  const [claimantClaims, setClaimantClaims] = useState<ClaimantClaim[]>([]);
  const [samaritanClaims, setSamaritanClaims] = useState<SamaritanClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClaim, setEditingClaim] = useState<{ id: string; answer: string } | null>(null);
  const [selectedSamaritanItem, setSelectedSamaritanItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchClaims = async () => {
      setLoading(true);
      // 1. Claims as claimant (user claimed others' items)
      const { data: claimantData, error: claimantErr } = await supabase
        .from('claims')
        .select(`
          id, ticket_number, answer, status, created_at,
          items!inner (id, title, reference_number, image_url, type)
        `)
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false });

      if (!claimantErr && claimantData) {
        const transformed = (claimantData as any[]).map(c => ({
          ...c,
          items: c.items?.[0] || { id: '', title: '', reference_number: '', image_url: null, type: '' }
        }));
        setClaimantClaims(transformed);
      }

      // 2. Claims on Samaritan's items (others claimed user's found items, only pending)
      const { data: samaritanData, error: samaritanErr } = await supabase
        .from('claims')
        .select(`
          id, ticket_number, answer, created_at,
          profiles!claimant_id (full_name, email, avatar_url, reputation),
          items!inner (
            id, title, reference_number, image_url, security_question, samaritan_notes,
            location_building, location_name, incident_date, incident_time,
            location_lat, location_lng, image_urls, type, status
          )
        `)
        .eq('items.reporter_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!samaritanErr && samaritanData) {
        const transformed = (samaritanData as any[]).map(c => ({
          ...c,
          claimant: c.profiles?.[0] || { full_name: 'Unknown', email: '', avatar_url: null, reputation: 0 },
          item: c.items?.[0] || {}
        }));
        setSamaritanClaims(transformed);
      }
      setLoading(false);
    };
    fetchClaims();
  }, [user]);

  const handleEditSuccess = () => {
    // Refresh claimant claims
    window.location.reload();
  };

  const handleSamaritanItemClose = () => {
    setSelectedSamaritanItem(null);
    // Optionally refresh samaritan claims list
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case 'accepted': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Accepted</span>;
      case 'declined': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Declined</span>;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading your claims...</div>;

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Claims</h1>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/20 mb-6">
          <button
            onClick={() => setActiveTab('claimant')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'claimant'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Claims I Made ({claimantClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('samaritan')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'samaritan'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Claims on My Items ({samaritanClaims.length})
          </button>
        </div>

        {/* Claimant Tab */}
        {activeTab === 'claimant' && (
          <div className="space-y-4">
            {claimantClaims.length === 0 ? (
              <p className="text-on-surface-variant">You haven't made any claims yet.</p>
            ) : (
              claimantClaims.map((claim) => (
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
                      {claim.status === 'accepted' && (
                        <Link
                          to={`/claims/${claim.id}/handshake`}
                          className="text-sm text-primary hover:underline"
                        >
                          View Samaritan Contact →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Samaritan Tab */}
        {activeTab === 'samaritan' && (
          <div className="space-y-4">
            {samaritanClaims.length === 0 ? (
              <p className="text-on-surface-variant">No pending claims on your items.</p>
            ) : (
              samaritanClaims.map((claim) => (
                <div key={claim.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-bold">{claim.item.title}</p>
                      <p className="text-sm text-outline">Claimant: {claim.claimant.full_name}</p>
                      <p className="text-sm text-outline">Ticket: {claim.ticket_number}</p>
                      <p className="text-sm mt-1">Claimant's answer: {claim.answer.substring(0, 100)}...</p>
                      <p className="text-xs text-outline mt-1">
                        Submitted: {new Date(claim.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => setSelectedSamaritanItem(claim.item as Item)}
                        className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dim"
                      >
                        Review Claims
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Claim Modal (for claimant) */}
      <EditClaimModal
        isOpen={!!editingClaim}
        onClose={() => setEditingClaim(null)}
        claimId={editingClaim?.id || ''}
        currentAnswer={editingClaim?.answer || ''}
        onSuccess={handleEditSuccess}
      />

      {/* Samaritan Item Modal (for reviewing all pending claims on an item) */}
      {selectedSamaritanItem && (
        <SamaritanItemModal
          isOpen={!!selectedSamaritanItem}
          onClose={handleSamaritanItemClose}
          item={selectedSamaritanItem}
          onRefresh={handleSamaritanItemClose}
        />
      )}
    </AuthenticatedLayout>
  );
}