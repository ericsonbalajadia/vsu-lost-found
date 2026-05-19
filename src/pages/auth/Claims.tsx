// src/pages/auth/Claims.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';
import ClaimantItemModal from '../../components/modals/ClaimantItemModal';
import SamaritanItemModal from '../../components/modals/SamaritanItemModal';
import type { Item } from '../../types/database';

interface ClaimantItem extends Item {
  claim_id: string;
  claim_ticket: string;
  claim_status: string;
  claim_answer: string;
  claim_created_at: string;
}

interface SamaritanItem extends Item {
  pending_claims_count: number;
}

export default function Claims() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'claimant' | 'samaritan'>('claimant');
  const [claimantItems, setClaimantItems] = useState<ClaimantItem[]>([]);
  const [samaritanItems, setSamaritanItems] = useState<SamaritanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      // 1. Items the user has claimed (claimant side)
      const { data: claimed, error: err1 } = await supabase
        .from('claims')
        .select(`
          id,
          ticket_number,
          answer,
          status,
          created_at,
          items!inner (
            id, reference_number, title, description, category, type, status,
            location_lat, location_lng, location_name, location_building,
            incident_date, incident_time, security_question, image_url, image_urls,
            reporter_id, created_at, updated_at,
            profiles!reporter_id ( full_name, reputation, avatar_url, campus_building )
          )
        `)
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false });

      if (!err1 && claimed) {
        const transformed = (claimed as any[]).map((c) => ({
          ...c.items[0],
          claim_id: c.id,
          claim_ticket: c.ticket_number,
          claim_status: c.status,
          claim_answer: c.answer,
          claim_created_at: c.created_at,
          profiles: c.items[0]?.profiles?.[0] || null,
        }));
        setClaimantItems(transformed);
      }

      // 2. Items the user reported that have pending claims (Samaritan side)
      const { data: reported, error: err2 } = await supabase
        .from('items')
        .select(`
          *,
          profiles!reporter_id ( full_name, reputation, avatar_url, campus_building ),
          claims!item_id ( id, status )
        `)
        .eq('reporter_id', user.id)
        .eq('type', 'found')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!err2 && reported) {
        const itemsWithPending = (reported as any[])
          .filter((item) => (item.claims || []).some((c: any) => c.status === 'pending'))
          .map((item) => ({
            ...item,
            pending_claims_count: (item.claims || []).filter((c: any) => c.status === 'pending').length,
            profiles: item.profiles?.[0] || null,
          }));
        setSamaritanItems(itemsWithPending);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const openClaimantModal = (item: ClaimantItem) => {
    setSelectedItem(item);
    setSelectedClaim({
      id: item.claim_id,
      ticket_number: item.claim_ticket,
      answer: item.claim_answer,
      status: item.claim_status,
    });
  };

  const closeModals = () => {
    setSelectedItem(null);
    setSelectedClaim(null);
  };

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
            Items I Claimed ({claimantItems.length})
          </button>
          <button
            onClick={() => setActiveTab('samaritan')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'samaritan'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Items with Pending Claims ({samaritanItems.length})
          </button>
        </div>

        {/* Claimant Tab – items user claimed */}
        {activeTab === 'claimant' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {claimantItems.length === 0 ? (
              <p className="col-span-full text-on-surface-variant">You haven't claimed any items yet.</p>
            ) : (
              claimantItems.map((item) => (
                <div key={item.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border flex gap-4">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-20 h-20 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-outline">Ticket: {item.claim_ticket}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(item.claim_status)}
                      <button
                        onClick={() => openClaimantModal(item)}
                        className="text-primary text-sm font-bold hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Samaritan Tab – items with pending claims */}
        {activeTab === 'samaritan' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {samaritanItems.length === 0 ? (
              <p className="col-span-full text-on-surface-variant">No pending claims on your items.</p>
            ) : (
              samaritanItems.map((item) => (
                <div key={item.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border flex gap-4">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-20 h-20 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-outline">{item.pending_claims_count} pending claim(s)</p>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="mt-2 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-primary-dim"
                    >
                      Review Claims
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Claimant Modal (for claimed items) */}
      {selectedItem && selectedClaim && (
        <ClaimantItemModal
          isOpen={true}
          onClose={closeModals}
          item={selectedItem}
          claim={selectedClaim}
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* Samaritan Modal (for items with pending claims) */}
      {selectedItem && !selectedClaim && (
        <SamaritanItemModal
          isOpen={true}
          onClose={closeModals}
          item={selectedItem}
          onRefresh={() => window.location.reload()}
        />
      )}
    </AuthenticatedLayout>
  );
}