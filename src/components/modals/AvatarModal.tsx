// src/components/modals/AvatarModal.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { profilesApi } from '../../api/profilesApi';
import toast from 'react-hot-toast';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AvatarModal({ isOpen, onClose, onSuccess }: AvatarModalProps) {
  const { user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      const avatarUrl = await profilesApi.uploadAvatar(user.id, file);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Avatar updated');
      await refreshProfile();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setRemoving(true);
    try {
      await profilesApi.removeAvatar(user.id);
      toast.success('Avatar removed');
      await refreshProfile();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove avatar');
    } finally {
      setRemoving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Profile Picture</h2>
        <div className="space-y-4">
          {/* Hidden file input with accessible label */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="avatar-upload-input"
            aria-label="Upload new profile picture"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dim disabled:opacity-50"
            aria-label="Choose image file"
          >
            {uploading ? 'Uploading...' : 'Upload New Picture'}
          </button>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="w-full py-3 border border-error text-error rounded-lg font-bold hover:bg-error/5 disabled:opacity-50"
            aria-label="Remove current profile picture"
          >
            {removing ? 'Removing...' : 'Remove Current Picture'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition"
            aria-label="Cancel and close modal"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}