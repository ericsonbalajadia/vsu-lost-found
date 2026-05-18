// src/api/claimsApi.ts
import { supabase } from '../lib/supabase'
import type { SubmitClaimPayload } from '../types/api'

// Safe fields for claim queries
const CLAIM_WITH_PROFILES = `
  id, item_id, ticket_number, answer, status, reviewed_by, reviewed_at, created_at,
  profiles!claimant_id (id, full_name, email, phone, avatar_url, reputation)
`
const CLAIM_WITH_ITEM = `
  id, item_id, ticket_number, answer, status, reviewed_by, reviewed_at, created_at,
  items!item_id (id, title, reference_number, type, status, security_question,
    samaritan_notes, image_url, reporter_id, location_building, location_name)
`

export const claimsApi = {
  async submit(payload: SubmitClaimPayload) {
    return supabase.from('claims').insert(payload).select('id, ticket_number, status').single()
  },

  async getBySamaritan(samaritanItemIds: string[]) {
    if (samaritanItemIds.length === 0) return { data: [], error: null }
    return supabase
      .from('claims')
      .select(CLAIM_WITH_PROFILES)
      .in('item_id', samaritanItemIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
  },

  async getByClaimant(claimantId: string) {
    return supabase
      .from('claims')
      .select(CLAIM_WITH_ITEM)
      .eq('claimant_id', claimantId)
      .order('created_at', { ascending: false })
  },

  async getExistingClaim(itemId: string, claimantId: string) {
    return supabase
      .from('claims')
      .select('id, ticket_number, status, answer')
      .eq('item_id', itemId)
      .eq('claimant_id', claimantId)
      .maybeSingle()
  },

  async acceptBySamaritan(claimId: string, samaritanId: string) {
    return supabase.rpc('accept_claim_by_samaritan', {
      p_claim_id: claimId,
      p_samaritan_id: samaritanId,
    })
  },

  async penalize(claimId: string, samaritanId: string) {
    return supabase.rpc('penalize_false_claim', {
      p_claim_id: claimId,
      p_samaritan_id: samaritanId,
    })
  },

  async finalizeResolution(itemId: string, samaritanId: string) {
    return supabase.rpc('finalize_resolution', {
      p_item_id: itemId,
      p_samaritan_id: samaritanId,
    })
  },

  async getAcceptedClaim(itemId: string) {
    return supabase
      .from('claims')
      .select(CLAIM_WITH_PROFILES)
      .eq('item_id', itemId)
      .eq('status', 'accepted')
      .maybeSingle()
  },

  // In src/api/claimsApi.ts
  async update(claimId: string, answer: string) {
    return supabase
      .from('claims')
      .update({ answer })
      .eq('id', claimId)
      .select('id, ticket_number, answer, status, answer')
      .single()
  },
}
