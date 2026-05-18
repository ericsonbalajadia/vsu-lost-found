// src/components/modals/SecurityChallengeModal.tsx
import React from 'react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { claimsApi } from '../../api/claimsApi';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  itemReference: string;
  securityQuestion: string;
  onSuccess: () => void;
}

export default function SecurityChallengeModal({
  isOpen, onClose, itemId, itemTitle, itemReference,
  securityQuestion, onSuccess,
}: Props) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) setAnswer('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }
    setSubmitting(true);
    try {
      await claimsApi.submit({ item_id: itemId, claimant_id: '', answer }); // claimant_id will be set by RLS
      toast.success('Claim submitted! The Samaritan will review your answer.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm z-20">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        {/* Left: item summary */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-surface-container-low/30 border-r border-outline-variant/10">
          <h2 className="text-2xl font-extrabold font-headline">{itemTitle}</h2>
          <p className="text-sm text-outline font-mono mt-1">{itemReference}</p>
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined">verified</span>
              <span>Security question required</span>
            </div>
          </div>
        </div>
        {/* Right: form */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <h3 className="text-2xl font-extrabold mb-2 font-headline">Security Challenge</h3>
          <p className="text-on-surface-variant mb-6">Answer the question below to claim this item.</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="text-sm font-semibold text-primary mb-1">Question</p>
              <p className="text-on-surface">{securityQuestion}</p>
            </div>
            <div>
              <label htmlFor="answer" className="block text-sm font-bold mb-2">Your answer</label>
              <textarea
                id="answer"
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary-dim disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Verify & Start Claim'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}