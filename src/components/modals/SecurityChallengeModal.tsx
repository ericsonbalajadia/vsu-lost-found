// src/components/modals/SecurityChallengeModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { claimsApi } from '../../api/claimsApi';
import toast from 'react-hot-toast';
import type { Item } from '../../types/database';

interface SecurityChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  userId: string;          // ← added
  onSuccess: () => void;
}

export default function SecurityChallengeModal({
  isOpen,
  onClose,
  item,
  userId,
  onSuccess,
}: SecurityChallengeModalProps) {
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
      await claimsApi.submit({
        item_id: item.id,
        claimant_id: userId,      // ← use the passed userId
        answer: answer.trim(),
      });
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 backdrop-blur-sm">
      {/* ... rest of the modal JSX (same as before, but we can keep it compact) ... */}
    </div>,
    document.body
  );
}