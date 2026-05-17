// src/types/database.ts

export type UserRole = 'student' | 'staff' | 'admin'
export type NotifFrequency = 'realtime' | 'daily' | 'weekly'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  student_id: string | null
  campus_building: string
  bio: string | null
  avatar_url: string | null
  role: UserRole
  reputation: number
  is_verified: boolean
  is_suspended: boolean
  notif_matches: boolean
  notif_claims: boolean
  notif_messages: boolean
  notif_frequency: NotifFrequency
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  reporter_id: string
  reference_number: string
  title: string
  description: string | null
  category: ItemCategory
  type: ItemType
  status: ItemStatus
  location_lat: number | null
  location_lng: number | null
  location_name: string | null
  location_building: string | null
  incident_date: string | null
  incident_time: string | null
  security_question: string | null
  // samaritan_notes intentionally omitted – never selected in public queries
  image_url: string | null
  image_urls: string[] | null
  matched_item_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  profiles?: Pick<Profile, 'full_name' | 'reputation' | 'avatar_url' | 'campus_building'>
}

export interface CreateItemPayload {
  reporter_id: string
  title: string
  description?: string
  category: ItemCategory
  type: ItemType
  location_lat?: number
  location_lng?: number
  location_name?: string
  location_building?: string
  incident_date?: string
  incident_time?: string
  security_question?: string
  samaritan_notes?: string
  image_url?: string
}

export type ItemCategory =
  | 'Electronics'
  | 'Personal Accessories'
  | 'Books & Stationery'
  | 'Keys'
  | 'Clothing'
  | 'ID & Documents'
  | 'Other'

export type ItemType = 'lost' | 'found'
export type ItemStatus = 'active' | 'negotiation' | 'resolved' | 'expired'
export type ClaimStatus = 'pending' | 'accepted' | 'declined'
export type NotifType =
  | 'match_found'
  | 'claim_submitted'
  | 'claim_accepted'
  | 'claim_declined'
  | 'item_resolved'
  | 'message'
  | 'system'

export interface RawItemWithProfileArray extends Omit<Item, 'profiles'> {
  profiles: Profile[] | null;
}