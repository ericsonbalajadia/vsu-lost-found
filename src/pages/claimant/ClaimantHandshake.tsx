/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/claimant/ClaimantHandshake.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { openEmailThread } from '../../lib/mailto';
import toast from 'react-hot-toast';

export default function ClaimantHandshake() {
  const { id: claimId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claimId) return;
    const fetch = async () => {
      const { data: claim, error } = await supabase
        .from('claims')
        .select('ticket_number, items!inner(reference_number, title, reporter_id, reporter:profiles!reporter_id(full_name, email, phone))')
        .eq('id', claimId)
        .single();
      if (error || !claim) {
        toast.error('Claim not found');
      } else {
        setData(claim);
      }
      setLoading(false);
    };
    fetch();
  }, [claimId]);

  if (loading) return <div className="p-8 text-center">Loading handshake details...</div>;
  if (!data) return <div className="p-8 text-center text-error">Information not available.</div>;

  const { ticket_number, items } = data;
  const samaritan = items.reporter;
  const mailto = () => openEmailThread({
    toEmail: samaritan.email,
    itemTitle: items.title,
    itemRef: items.reference_number,
    claimTicket: ticket_number,
  });

  return (
    <div id="main-content" className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold">Claim Verified ✅</h1>
        <div className="flex gap-2">
          <span className="text-sm font-mono bg-surface-container-high px-3 py-1 rounded-full">{items.reference_number}</span>
          <span className="text-sm font-mono bg-surface-container-high px-3 py-1 rounded-full">{ticket_number}</span>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border p-6 space-y-4 mb-6">
        <h2 className="text-xl font-semibold">Samaritan (Finder) Contact</h2>
        <p><span className="font-medium">Name:</span> {samaritan.full_name}</p>
        <p><span className="font-medium">Email:</span> {samaritan.email}</p>
        {samaritan.phone && <p><span className="font-medium">Phone:</span> {samaritan.phone}</p>}
      </div>
      <div className="bg-primary-container/10 p-4 rounded-xl mb-6">
        <h3 className="font-bold flex items-center gap-2">Safety Guidelines</h3>
        <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
          <li>Meet in a well‑lit, public campus location.</li>
          <li>Bring your student ID and any proof of ownership.</li>
          <li>Do not share sensitive financial information.</li>
        </ul>
      </div>
      <button onClick={mailto} className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-dim">
        <span className="material-symbols-outlined">mail</span>
        Create Email Thread
      </button>
    </div>
  );
}