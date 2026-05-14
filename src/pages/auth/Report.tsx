// src/pages/auth/Report.tsx
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itemsApi } from '../../api/itemsApi';
import { storageApi } from '../../api/storageApi';
import { supabase } from '../../lib/supabase';
import LocationPicker from '../../components/forms/LocationPicker';
import type { LocationData } from '../../components/forms/LocationPicker';
import type { ItemCategory, ItemType, CreateItemPayload } from '../../types/database';


const CATEGORIES: ItemCategory[] = [
  'Electronics', 'Personal Accessories', 'Books & Stationery',
  'Keys', 'Clothing', 'ID & Documents', 'Other',
];

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Electronics');
  const [type, setType] = useState<ItemType>('found');
  const [building, setBuilding] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [securityQ, setSecurityQ] = useState('');
  const [samaritanNotes, setSamaritanNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);

  // Revoke object URL on unmount or preview change
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // When location changes, auto-fill building input (optional)
  useEffect(() => {
    if (location?.building && location.building !== building) {
      setBuilding(location.building);
      handleBuildingChange(location.building);
    }
  }, [location]);

  // Predictive insights on building change
  const handleBuildingChange = useCallback(async (b: string) => {
    setBuilding(b);
    if (b && b.trim() !== '') {
      const { data } = await itemsApi.getInsights(b);
      if (data) setInsight((data as { message: string }).message);
    } else {
      setInsight(null);
    }
  }, []);

  // Image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateItemPayload = {
        reporter_id: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        type,
        location_lat: location?.lat,
        location_lng: location?.lng,
        location_name: location?.displayName,
        location_building: building || undefined,
        incident_date: incidentDate || undefined,
        incident_time: incidentTime || undefined,
        security_question: type === 'found' ? securityQ.trim() || undefined : undefined,
        samaritan_notes: type === 'found' ? samaritanNotes.trim() || undefined : undefined,
      };

      const { data: newItem, error: insertError } = await itemsApi.create(payload);
      if (insertError || !newItem) throw new Error(insertError?.message ?? 'Failed to create item');

      if (imageFile) {
        const imageUrl = await storageApi.uploadItemImage(imageFile, user.id, newItem.id);
        await supabase.from('items').update({ image_url: imageUrl }).eq('id', newItem.id);
      }

      navigate(`/items/${newItem.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-hidden h-screen flex">
      <div className="flex-grow flex flex-col relative">
        {/* TopAppBar */}
        <header className="h-20 flex-shrink-0 flex justify-between items-center px-8 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/10 z-30">
          <div className="flex items-center space-x-8">
            <span className="font-headline font-extrabold text-primary tracking-tighter text-xl">FoundPath</span>
            <nav className="hidden md:flex space-x-6">
              <a className="font-headline tracking-tighter text-sm text-on-surface-variant opacity-70 hover:opacity-100" href="#">Dashboard</a>
              <a className="font-headline tracking-tighter text-sm text-primary font-bold border-b-2 border-primary pb-1" href="#">Reports</a>
              <a className="font-headline tracking-tighter text-sm text-on-surface-variant opacity-70 hover:opacity-100" href="#">Settings</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <img
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-surface-container"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUhgX4wMuDz8_STfKGqc_v18wPvwh0yT1P7E9XLOn9qXQzHi71CzcOhgtlHu_nSvSJ8FaVEyPfwRVQSL9BOJ1xSV-zwzHqqyo8lF2zPNiy1VbH9l0ylrNo4tFXmrSpainyPOcrwoGT2S8-j6OPc2aXXO2ffjwZIyOu9snZlrQYlKY4ermAzBzD6dQUNDDb5VY60JtwyUFMaR6bB5EnieByWEB5akuk2bWoCBT90cj5XxJWQ6-GkpjLfzW_QORaDH2OH1FPY_pV7p8"
            />
          </div>
        </header>

        <main className="flex-grow overflow-hidden flex flex-col">
          <div className="p-8 flex-shrink-0">
            <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tighter mb-2">File New Report</h2>
            <p className="text-on-surface-variant max-w-2xl text-base leading-relaxed">
              Submit details of a lost or found item. Your precision helps reunite belongings with their owners.
            </p>
          </div>

          <form className="flex-grow flex overflow-hidden border-t border-outline-variant/10" onSubmit={handleSubmit}>
            {/* Scrollable left column */}
            <div className="flex-grow overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
              {/* Section 1: Item Identity */}
              <section className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden border border-outline-variant/10">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-center space-x-3 mb-6">
                  <span className="material-symbols-outlined text-primary">inventory_2</span>
                  <h3 className="font-headline text-xl font-bold tracking-tight">Item Identity</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label htmlFor="title" className="block text-sm font-medium text-on-surface-variant mb-2">
                      Item Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Silver Keychain"
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label htmlFor="category" className="block text-sm font-medium text-on-surface-variant mb-2">Category <span className="text-error">*</span></label>
                    <select
                      id="category"
                      value={category}
                      onChange={e => setCategory(e.target.value as ItemCategory)}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all appearance-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-variant mb-2">Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe distinguishing features, colour, brand..."
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Date & Time */}
              <section className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden border border-outline-variant/10">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-center space-x-3 mb-6">
                  <span className="material-symbols-outlined text-primary">event</span>
                  <h3 className="font-headline text-xl font-bold tracking-tight">Date &amp; Time</h3>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="incidentDate" className="block text-sm font-medium text-on-surface-variant mb-2">Date</label>
                    <input
                      id="incidentDate"
                      type="date"
                      value={incidentDate}
                      onChange={e => setIncidentDate(e.target.value)}
                      max={today}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="incidentTime" className="block text-sm font-medium text-on-surface-variant mb-2">Time</label>
                    <input
                      id="incidentTime"
                      type="time"
                      value={incidentTime}
                      onChange={e => setIncidentTime(e.target.value)}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Location */}
              <section className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden border border-outline-variant/10">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-center space-x-3 mb-6">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <h3 className="font-headline text-xl font-bold tracking-tight">Location</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="building" className="block text-sm font-medium text-on-surface-variant mb-2">
                      Campus Building (type manually or use detected name)
                    </label>
                    <input
                      id="building"
                      type="text"
                      value={building}
                      onChange={e => handleBuildingChange(e.target.value)}
                      placeholder="e.g. Main Library, Science Building, etc."
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                    />
                  </div>
                  {insight && (
                    <div className="p-4 bg-primary-container/10 border border-primary/20 rounded-xl flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                      <p className="text-sm text-primary font-medium">{insight}</p>
                    </div>
                  )}
                  <LocationPicker onChange={setLocation} height="300px" className="mt-2" />
                </div>
              </section>

              {/* Section 4: Report Categorization */}
              <section className="bg-surface-container-low p-8 rounded-xl relative overflow-hidden border border-outline-variant/10">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-center space-x-3 mb-6">
                  <span className="material-symbols-outlined text-primary">category</span>
                  <h3 className="font-headline text-xl font-bold tracking-tight">Report Categorization</h3>
                </div>
                <div className="space-y-8">
                  <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-on-surface-variant mb-2">Report Type <span className="text-error">*</span></label>
                    <select
                      id="reportType"
                      value={type}
                      onChange={e => setType(e.target.value as ItemType)}
                      className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all appearance-none"
                    >
                      <option value="found">Found Item</option>
                      <option value="lost">Lost Item</option>
                    </select>
                  </div>

                  {type === 'found' && (
                    <div className="bg-primary-container/10 p-6 rounded-xl border border-primary/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="material-symbols-outlined text-primary">verified_user</span>
                          <h4 className="font-headline text-lg font-bold tracking-tight">Ownership Verification</h4>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">Security Crucial</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                        To protect privacy, potential owners must answer a specific question before we release the item's location. Choose something only the owner would know.
                      </p>
                      <div className="mb-4">
                        <label htmlFor="securityQ" className="block text-sm font-medium text-on-surface-variant mb-2">Security Question</label>
                        <input
                          id="securityQ"
                          type="text"
                          value={securityQ}
                          onChange={e => setSecurityQ(e.target.value)}
                          placeholder="e.g. What is the lock screen wallpaper?"
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="samaritanNotes" className="block text-sm font-medium text-on-surface-variant mb-2">Your Private Notes (Samaritan Notes)</label>
                        <textarea
                          id="samaritanNotes"
                          rows={3}
                          value={samaritanNotes}
                          onChange={e => setSamaritanNotes(e.target.value)}
                          placeholder="Write the correct answer or any details that help you verify claimants (only you can see this)"
                          className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
              <div className="h-8" />
            </div>

            {/* Sticky right column – unchanged */}
            <div className="w-[420px] flex-shrink-0 bg-surface-container-low border-l border-outline-variant/20 p-8 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
              {/* Report Summary */}
              <section className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden border border-outline-variant/10 shadow-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <h3 className="font-headline text-lg font-bold tracking-tight">Report Summary</h3>
                  </div>
                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest border border-primary/20 px-2 py-0.5 rounded">Preview</span>
                </div>
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">Item</p>
                    <p className="text-xs font-semibold text-on-surface leading-snug">{title || '—'}</p>
                    <p className="text-[10px] text-on-surface-variant/70">{category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">Date &amp; Time</p>
                    <p className="text-xs font-semibold text-on-surface leading-snug">{incidentDate || '—'}</p>
                    <p className="text-[10px] text-on-surface-variant/70">{incidentTime || ''}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">Location</p>
                    <p className="text-xs font-semibold text-on-surface leading-snug">{building || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">Type</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${type === 'found' ? 'bg-primary' : 'bg-error'}`} />
                      <p className="text-xs font-semibold text-on-surface leading-snug capitalize">{type} Item</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Image Upload */}
              <section className="bg-surface-container-lowest p-6 rounded-xl relative overflow-hidden border border-outline-variant/10 shadow-sm flex-grow flex flex-col">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                <div className="flex items-center space-x-3 mb-4">
                  <span className="material-symbols-outlined text-primary">add_a_photo</span>
                  <h3 className="font-headline text-lg font-bold tracking-tight">Visuals</h3>
                </div>
                <label
                  htmlFor="image-upload"
                  className="group relative flex-grow min-h-[160px] rounded-xl bg-surface-container-highest flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden mb-4"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Item preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="z-10 flex flex-col items-center group-hover:scale-105 transition-transform p-4 text-center">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">upload_file</span>
                      <p className="text-xs font-medium text-on-surface-variant">Drop image or click to upload</p>
                      <p className="text-[10px] text-on-surface-variant/60 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                  aria-label="Upload item image"
                />
                {imagePreview && (
                  <div className="flex space-x-2">
                    <div className="w-12 h-12 rounded-md bg-surface-variant/30 flex-shrink-0 flex items-center justify-center border border-outline-variant/20 overflow-hidden">
                      <img src={imagePreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </section>

              {/* Submit Button */}
              <div className="pt-4 mt-auto">
                {error && <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">{error}</div>}
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="w-full bg-primary-gradient text-on-primary py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
                </button>
                <p className="text-[10px] text-center text-on-surface-variant/50 mt-3 font-medium uppercase tracking-widest">Ensuring Community Trust</p>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}