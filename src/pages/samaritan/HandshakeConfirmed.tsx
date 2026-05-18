// src/pages/samaritan/HandshakeConfirmed.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { claimsApi } from '../../api/claimsApi';
import { openEmailThread } from '../../lib/mailto';
import toast from 'react-hot-toast';

interface HandshakeData {
  ticket_number: string;
  item_id: string;
  item_ref: string;
  item_title: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string | null;
}

export default function HandshakeConfirmed() {
  const { id: claimId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<HandshakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!claimId) return;

    const fetchData = async () => {
      const { data: claim, error } = await supabase
        .from('claims')
        .select(`
          ticket_number,
          item_id,
          items!inner (
            reference_number,
            title,
            reporter_id
          ),
          profiles!claimant_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('id', claimId)
        .single();

      if (error || !claim) {
        toast.error('Claim not found');
        navigate('/user/claims');
        return;
      }

      // Extract first element from arrays (Supabase returns nested as arrays)
      const itemsArray = claim.items as any[];
      const profilesArray = claim.profiles as any[];

      const item = itemsArray?.[0] || { reference_number: '', title: '', reporter_id: '' };
      const claimant = profilesArray?.[0] || { full_name: '', email: '', phone: null };

      // Verify the current user is the Samaritan (reporter of the item)
      if (item.reporter_id !== user?.id) {
        toast.error('Unauthorized');
        navigate('/user/claims');
        return;
      }

      setData({
        ticket_number: claim.ticket_number,
        item_id: claim.item_id,
        item_ref: item.reference_number,
        item_title: item.title,
        claimant_name: claimant.full_name,
        claimant_email: claimant.email,
        claimant_phone: claimant.phone,
      });
      setLoading(false);
    };

    fetchData();
  }, [claimId, user, navigate]);

  const handleMarkResolved = async () => {
    if (!user || !data) return;
    setResolving(true);
    try {
      await claimsApi.finalizeResolution(data.item_id, user.id);
      toast.success('Item marked as resolved. Other claims have been declined.');
      navigate('/inventory');
    } catch {
      toast.error('Failed to mark as resolved');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading handshake details...</div>;
  if (!data) return null;

  const mailto = () =>
    openEmailThread({
      toEmail: data.claimant_email,
      itemTitle: data.item_title,
      itemRef: data.item_ref,
      claimTicket: data.ticket_number,
    });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Handshake Confirmation</h1>
        <div className="flex gap-2">
          <span className="text-sm font-mono bg-surface-container-high px-3 py-1 rounded-full">
            {data.item_ref}
          </span>
          <span className="text-sm font-mono bg-surface-container-high px-3 py-1 rounded-full">
            {data.ticket_number}
          </span>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border p-6 space-y-4 mb-6">
        <h2 className="text-xl font-semibold">Claimant Contact</h2>
        <p>
          <span className="font-medium">Name:</span> {data.claimant_name}
        </p>
        <p>
          <span className="font-medium">Email:</span> {data.claimant_email}
        </p>
        {data.claimant_phone && (
          <p>
            <span className="font-medium">Phone:</span> {data.claimant_phone}
          </p>
        )}
      </div>

      <div className="bg-primary-container/10 p-4 rounded-xl mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          Safety Guidelines
        </h3>
        <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
          <li>Meet in a well‑lit, public campus location (e.g., library, student union).</li>
          <li>Ask for student ID verification.</li>
          <li>Do not share sensitive financial information.</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <button
          onClick={mailto}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-dim"
        >
          <span className="material-symbols-outlined">mail</span>
          Create Email Thread
        </button>
        <button
          onClick={handleMarkResolved}
          disabled={resolving}
          className="bg-secondary text-on-secondary px-6 py-3 rounded-xl font-bold hover:bg-secondary-dim disabled:opacity-50"
        >
          {resolving ? 'Processing...' : 'Mark as Resolved'}
        </button>
      </div>
    </div>
  );
}