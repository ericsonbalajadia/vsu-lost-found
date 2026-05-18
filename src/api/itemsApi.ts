// src/api/itemsApi.ts
import { supabase } from '../lib/supabase'
import type { CreateItemPayload, ItemCategory, ItemType } from '../types/database'

// SAFE FIELDS — never select samaritan_notes in public queries
const PUBLIC_ITEM_FIELDS = `
  id, reference_number, title, description, category, type, status,
  reporter_id, 
  location_lat, location_lng, location_name, location_building,
  incident_date, incident_time, security_question, image_url, image_urls,
  created_at, updated_at,
  profiles!reporter_id ( id, full_name, reputation, avatar_url, campus_building )
`;

export interface ItemFilters {
  type?: ItemType
  category?: ItemCategory
  search?: string
  limit?: number
}

export const itemsApi = {
  // Public gallery + authenticated inventory
  async getAll(filters?: ItemFilters) {
    let query = supabase
      .from('items')
      .select(PUBLIC_ITEM_FIELDS)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (filters?.type)     query = query.eq('type', filters.type)
    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters?.limit)    query = query.limit(filters.limit)

    return query
  },

  // Single item detail — uses maybeSingle() to avoid hanging
  async getById(id: string) {
    return supabase
      .from('items')
      .select(PUBLIC_ITEM_FIELDS)
      .eq('id', id)
      .maybeSingle()
  },

  // Reporter's own items — includes samaritan_notes for Samaritan view
  async getMyItems(userId: string) {
    return supabase
      .from('items')
      .select(`
        ${PUBLIC_ITEM_FIELDS},
        samaritan_notes
      `)
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })
  },

  async create(payload: CreateItemPayload) {
    return supabase
      .from('items')
      .insert(payload)
      .select('id, reference_number, title, type')
      .single()
  },

  async getInsights(building: string) {
    return supabase.rpc('get_location_insights', { p_building: building })
  },
}