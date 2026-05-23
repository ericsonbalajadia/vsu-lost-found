// src/components/modals/EditItemModal.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { itemsApi } from '../../api/itemsApi';
import LocationPicker from '../forms/LocationPicker';
import type { LocationData } from '../forms/LocationPicker';
import type { ItemCategory, CreateItemPayload } from '../../types/database';
import toast from 'react-hot-toast';

const CATEGORIES: ItemCategory[] = [
  'Electronics', 'Personal Accessories', 'Books & Stationery',
  'Keys', 'Clothing', 'ID & Documents', 'Other',
];

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSuccess: () => void;
}

export default function EditItemModal({ isOpen, onClose, item, onSuccess }: EditItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [building, setBuilding] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [samaritanNotes, setSamaritanNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setCategory(item.category || 'Electronics');
      setBuilding(item.location_building || item.location_name || '');
      if (item.location_lat && item.location_lng) {
        setLocation({
          lat: item.location_lat,
          lng: item.location_lng,
          displayName: item.location_name || '',
          building: item.location_building || '',
        });
      }
      setIncidentDate(item.incident_date ? new Date(item.incident_date).toISOString().split('T')[0] : '');
      setIncidentTime(item.incident_time || '');
      setSecurityQuestion(item.security_question || '');
      setSamaritanNotes(item.samaritan_notes || '');
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<CreateItemPayload> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        location_lat: location?.lat,
        location_lng: location?.lng,
        location_name: location?.displayName,
        location_building: building || undefined,
        incident_date: incidentDate || undefined,
        incident_time: incidentTime || undefined,
        security_question: securityQuestion.trim() || undefined,
        samaritan_notes: samaritanNotes.trim() || undefined,
      };
      const { error } = await itemsApi.update(item.id, payload);
      if (error) throw error;
      toast.success('Item updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Edit Item</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium mb-1">
              Title <span className="text-error">*</span>
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="e.g., Silver Keychain"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-lg p-2"
              placeholder="Describe distinguishing features, colour, brand..."
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="w-full border rounded-lg p-2"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-date" className="block text-sm font-medium mb-1">
                Date
              </label>
              <input
                id="edit-date"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label htmlFor="edit-time" className="block text-sm font-medium mb-1">
                Time
              </label>
              <input
                id="edit-time"
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="edit-building" className="block text-sm font-medium mb-1">
              Building name
            </label>
            <input
              id="edit-building"
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full border rounded-lg p-2 mb-2"
              placeholder="e.g., Main Library"
            />
            <LocationPicker onChange={setLocation} height="200px" />
          </div>

          {/* Security Question & Notes (only for found items) */}
          {item.type === 'found' && (
            <>
              <div>
                <label htmlFor="edit-security-question" className="block text-sm font-medium mb-1">
                  Security Question
                </label>
                <input
                  id="edit-security-question"
                  type="text"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., What is the lock screen wallpaper?"
                />
              </div>
              <div>
                <label htmlFor="edit-samaritan-notes" className="block text-sm font-medium mb-1">
                  Private Notes (Samaritan)
                </label>
                <textarea
                  id="edit-samaritan-notes"
                  value={samaritanNotes}
                  onChange={(e) => setSamaritanNotes(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg p-2"
                  placeholder="Only you can see this — helps verify claimants"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}