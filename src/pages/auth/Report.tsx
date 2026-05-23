/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/auth/Report.tsx
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsApi } from '../../api/itemsApi'
import { storageApi } from '../../api/storageApi'
import { supabase } from '../../lib/supabase'
import LocationPicker from '../../components/forms/LocationPicker'
import type { LocationData } from '../../components/forms/LocationPicker'
import type { ItemCategory, ItemType, CreateItemPayload, Item } from '../../types/database'
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout'
import CustomSelect from '../../components/ui/CustomSelect'
import Breadcrumbs from '../../components/ui/Breadcrumbs'
import ItemDetailModal from '../../components/modals/ItemDetailModal'

const CATEGORIES: ItemCategory[] = [
  'Electronics',
  'Personal Accessories',
  'Books & Stationery',
  'Keys',
  'Clothing',
  'ID & Documents',
  'Other',
]

const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: c }))
const typeOptions = [
  { value: 'found', label: 'Found Item' },
  { value: 'lost', label: 'Lost Item' },
]

const MAX_IMAGES = 5
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export default function Report() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ItemCategory>('Electronics')
  const [type, setType] = useState<ItemType>('found')
  const [building, setBuilding] = useState('')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [incidentDate, setIncidentDate] = useState('')
  const [incidentTime, setIncidentTime] = useState('')
  const [securityQ, setSecurityQ] = useState('')
  const [samaritanNotes, setSamaritanNotes] = useState('')

  // Multi‑image state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState<string | null>(null)

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insight, setInsight] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Modal for newly created item
  const [showItemDetailModal, setShowItemDetailModal] = useState(false)
  const [createdItem, setCreatedItem] = useState<Item | null>(null)

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
    }
  }, [imagePreviews])

  const handleBuildingChange = useCallback(async (b: string) => {
    setBuilding(b)
    if (b && b.trim() !== '') {
      const { data } = await itemsApi.getInsights(b)
      if (data) setInsight((data as { message: string }).message)
    } else {
      setInsight(null)
    }
  }, [])

  // useEffect(() => {
  //   if (location?.building && location.building !== building) {
  //     // eslint-disable-next-line react-hooks/set-state-in-effect
  //     handleBuildingChange(location.building)
  //   }
  // }, [location, building, handleBuildingChange])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = MAX_IMAGES - imageFiles.length
    const newFiles: File[] = []
    const oversizedFiles: string[] = []

    for (const file of files.slice(0, remainingSlots)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversizedFiles.push(file.name)
      } else {
        newFiles.push(file)
      }
    }

    if (oversizedFiles.length > 0) {
      setImageError(`File(s) too large (max ${MAX_FILE_SIZE_MB}MB): ${oversizedFiles.join(', ')}`)
      return
    }
    setImageError(null)

    if (newFiles.length === 0) return

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setImageFiles((prev) => [...prev, ...newFiles])
    setImagePreviews((prev) => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    setImageError(null)
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Item name is required.')
      return false
    }
    if (type === 'found' && !securityQ.trim()) {
      setValidationError('Security question is required for found items.')
      return false
    }
    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return
    if (!validateForm()) return

    setSubmitting(true)
    setError(null)

    try {
      // 1. Insert item record
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
      }

      const { data: newItem, error: insertError } = await itemsApi.create(payload)
      if (insertError || !newItem) throw new Error(insertError?.message ?? 'Failed to create item')

      // 2. Upload all images if any
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        imageUrls = await storageApi.uploadMultipleItemImages(imageFiles, user.id, newItem.id)
        await supabase
          .from('items')
          .update({
            image_urls: imageUrls,
            image_url: imageUrls[0] || null,
          })
          .eq('id', newItem.id)
      }

      // Fetch the complete item (including joined profile) to pass to modal
      const { data: fullItem, error: fetchError } = await itemsApi.getById(newItem.id)
      if (fetchError || !fullItem) throw new Error('Failed to fetch created item details')

      // Transform profiles array to object
      const typedItem = { ...fullItem, profiles: (fullItem as any).profiles?.[0] } as Item
      setCreatedItem(typedItem)
      setShowItemDetailModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setShowItemDetailModal(false)
    navigate('/inventory')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <AuthenticatedLayout>
      <div id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Breadcrumbs />

        <div className="mb-4 sm:mb-6">
          <h2 className="font-headline text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tighter mb-2">
            File New Report
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Submit details of a lost or found item. Your precision helps reunite belongings with
            their owners.
          </p>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
            {validationError}
          </div>
        )}

        <form className="flex flex-col lg:flex-row gap-6 lg:gap-8" onSubmit={handleSubmit}>
          {/* Left column – scrollable form sections */}
          <div className="flex-1 space-y-6 lg:space-y-8 overflow-y-auto max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-180px)] pr-1">
            {/* Section 1: Item Identity */}
            <section className="bg-surface-container-low p-5 md:p-8 rounded-xl relative border border-outline-variant/10 transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">
                  Item Identity
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-on-surface-variant mb-2"
                  >
                    Item Name <span className="text-error text-sm font-bold ml-0.5">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Silver Keychain"
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                  />
                </div>
                <div>
                  <CustomSelect
                    id="category"
                    value={category}
                    onChange={(val) => setCategory(val as ItemCategory)}
                    options={categoryOptions}
                    label="Category"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-on-surface-variant mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe distinguishing features, colour, brand..."
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Date & Time */}
            <section className="bg-surface-container-low p-5 md:p-8 rounded-xl relative border border-outline-variant/10 transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <span className="material-symbols-outlined text-primary">event</span>
                <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">
                  Date &amp; Time
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label
                    htmlFor="incidentDate"
                    className="block text-sm font-medium text-on-surface-variant mb-2"
                  >
                    Date
                  </label>
                  <input
                    id="incidentDate"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    max={today}
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="incidentTime"
                    className="block text-sm font-medium text-on-surface-variant mb-2"
                  >
                    Time
                  </label>
                  <input
                    id="incidentTime"
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Location */}
            <section className="bg-surface-container-low p-5 md:p-8 rounded-xl relative border border-outline-variant/10 transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">
                  Location
                </h3>
              </div>
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label
                    htmlFor="building"
                    className="block text-sm font-medium text-on-surface-variant mb-2"
                  >
                    Campus Building (type manually or use detected name)
                  </label>
                  <input
                    id="building"
                    type="text"
                    value={building}
                    onChange={(e) => handleBuildingChange(e.target.value)}
                    placeholder="e.g. Main Library, Science Building, etc."
                    className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
                  />
                </div>
                {insight && (
                  <div className="p-3 md:p-4 bg-primary-container/10 border border-primary/20 rounded-xl flex items-start gap-3 transition-all hover:bg-primary-container/20">
                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                      info
                    </span>
                    <p className="text-sm text-primary font-medium">{insight}</p>
                  </div>
                )}
                <LocationPicker
                  onChange={setLocation}
                  height="300px"
                  className="mt-2 rounded-xl overflow-hidden"
                />
              </div>
            </section>

            {/* Section 4: Report Categorization */}
            <section className="bg-surface-container-low p-5 md:p-8 rounded-xl relative border border-outline-variant/10 transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <span className="material-symbols-outlined text-primary">category</span>
                <h3 className="font-headline text-lg md:text-xl font-bold tracking-tight">
                  Report Categorization
                </h3>
              </div>
              <div className="space-y-6 md:space-y-8">
                <div>
                  <CustomSelect
                    id="reportType"
                    value={type}
                    onChange={(val) => setType(val as ItemType)}
                    options={typeOptions}
                    label="Report Type"
                    required
                  />
                </div>

                {type === 'found' && (
                  <div className="bg-primary-container/10 p-4 md:p-6 rounded-xl border border-primary/10 transition-all hover:bg-primary-container/20">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="material-symbols-outlined text-primary">
                          verified_user
                        </span>
                        <h4 className="font-headline text-base md:text-lg font-bold tracking-tight">
                          Ownership Verification
                        </h4>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
                        Security Crucial
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                      To protect privacy, potential owners must answer a specific question before we
                      release the item's location. Choose something only the owner would know.
                    </p>
                    <div className="mb-4">
                      <label
                        htmlFor="securityQ"
                        className="block text-sm font-medium text-on-surface-variant mb-2"
                      >
                        Security Question{' '}
                        <span className="text-error text-sm font-bold ml-0.5">*</span>
                      </label>
                      <input
                        id="securityQ"
                        type="text"
                        value={securityQ}
                        onChange={(e) => setSecurityQ(e.target.value)}
                        placeholder="e.g. What is the lock screen wallpaper?"
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="samaritanNotes"
                        className="block text-sm font-medium text-on-surface-variant mb-2"
                      >
                        Your Private Notes (Samaritan Notes)
                      </label>
                      <textarea
                        id="samaritanNotes"
                        rows={3}
                        value={samaritanNotes}
                        onChange={(e) => setSamaritanNotes(e.target.value)}
                        placeholder="Write the correct answer or any details that help you verify claimants (only you can see this)"
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-container transition-all resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column – sticky summary + image + submit */}
          <div className="w-full lg:w-[420px] flex-shrink-0 space-y-6">
            {/* Report Summary Card */}
            <section className="bg-surface-container-lowest/90 backdrop-blur-sm p-5 md:p-6 rounded-xl relative overflow-hidden border border-outline-variant/10 shadow-sm transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <h3 className="font-headline text-base md:text-lg font-bold tracking-tight">
                    Report Summary
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest border border-primary/20 px-2 py-0.5 rounded">
                  Preview
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3 md:gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">
                    Item
                  </p>
                  <p className="text-xs font-semibold text-on-surface leading-snug">
                    {title || '—'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/70">{category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">
                    Date &amp; Time
                  </p>
                  <p className="text-xs font-semibold text-on-surface leading-snug">
                    {incidentDate || '—'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/70">{incidentTime || ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">
                    Location
                  </p>
                  <p className="text-xs font-semibold text-on-surface leading-snug">
                    {building || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter mb-1">
                    Type
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${type === 'found' ? 'bg-primary' : 'bg-error'}`}
                    />
                    <p className="text-xs font-semibold text-on-surface leading-snug capitalize">
                      {type} Item
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Image Upload */}
            <section className="bg-surface-container-lowest/90 backdrop-blur-sm p-5 md:p-6 rounded-xl relative overflow-hidden border border-outline-variant/10 shadow-sm transition-all hover:shadow-md">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              <div className="flex items-center space-x-3 mb-4">
                <span className="material-symbols-outlined text-primary">add_a_photo</span>
                <h3 className="font-headline text-base md:text-lg font-bold tracking-tight">
                  Visuals
                </h3>
              </div>

              {imageError && (
                <div className="mb-3 text-xs text-error bg-error-container/20 p-2 rounded-lg">
                  {imageError}
                </div>
              )}

              {imageFiles.length < MAX_IMAGES && (
                <label
                  htmlFor="image-upload"
                  className="group relative flex-grow min-h-[140px] md:min-h-[160px] rounded-xl bg-surface-container-highest flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 hover:border-primary/50 transition-all cursor-pointer overflow-hidden mb-4"
                >
                  <div className="z-10 flex flex-col items-center group-hover:scale-105 transition-transform p-4 text-center">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">
                      upload_file
                    </span>
                    <p className="text-xs font-medium text-on-surface-variant">
                      Drop images or click to upload
                    </p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">
                      Up to {MAX_IMAGES} images, max {MAX_FILE_SIZE_MB}MB each
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </label>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleImageChange}
                aria-label="Upload item images"
              />

              {/* Thumbnail gallery */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {imagePreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-md bg-surface-variant/30 border border-outline-variant/20 overflow-hidden group"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 w-5 h-5 bg-error/80 text-white rounded-full flex items-center justify-center hover:bg-error transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100"
                        aria-label="Remove image"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Submit Button */}
            <div className="pt-2">
              {error && (
                <div className="mb-4 p-3 bg-error-container/20 border border-error/20 rounded-xl text-sm text-error">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-on-primary py-3 md:py-4 rounded-xl font-bold text-sm md:text-base shadow-lg hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  send
                </span>
                <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
              <p className="text-[10px] text-center text-on-surface-variant/50 mt-3 font-medium uppercase tracking-widest">
                Ensuring Community Trust
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Item Detail Modal for the newly created item */}
      {createdItem && (
        <ItemDetailModal
          isOpen={showItemDetailModal}
          onClose={handleModalClose}
          item={createdItem}
          onRefresh={handleModalClose}
        />
      )}
    </AuthenticatedLayout>
  )
}
