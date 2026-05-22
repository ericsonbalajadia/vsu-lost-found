/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/modals/EditClaimModal.tsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { claimsApi } from '../../api/claimsApi';
import toast from 'react-hot-toast';

interface EditClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string;
  currentAnswer: string;
  onSuccess: () => void;
}

export default function EditClaimModal({
  isOpen,
  onClose,
  claimId,
  currentAnswer,
  onSuccess,
}: EditClaimModalProps) {
  const [answer, setAnswer] = useState(currentAnswer);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error('Answer cannot be empty');
      return;
    }
    setSubmitting(true);
    try {
      await claimsApi.update(claimId, answer.trim());
      toast.success('Claim updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-[90%] sm:max-w-md w-full p-5 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Edit Your Claim Answer</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="edit-answer" className="block text-sm font-medium text-on-surface-variant mb-2">
            Your answer
          </label>
          <textarea
            id="edit-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
            placeholder="Describe the details only the owner would know..."
            required
          />
          <div className="flex justify-end gap-2 md:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 md:px-4 md:py-2 border rounded-lg hover:bg-gray-100 transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white rounded-lg hover:bg-primary-dim disabled:opacity-50 text-sm"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}