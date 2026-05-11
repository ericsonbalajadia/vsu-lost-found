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