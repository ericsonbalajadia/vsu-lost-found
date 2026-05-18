// src/types/api.ts
export interface SignUpPayload {
  fullName: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface UpdateProfilePayload {
  full_name?: string
  phone?: string
  campus_building?: string
  bio?: string
  avatar_url?: string
}

export interface UpdateNotifPrefsPayload {
  notif_matches?: boolean
  notif_claims?: boolean
  notif_messages?: boolean
  notif_frequency?: 'realtime' | 'daily' | 'weekly'
}

export interface SubmitClaimPayload {
  item_id: string;
  claimant_id: string;
  answer: string;
}