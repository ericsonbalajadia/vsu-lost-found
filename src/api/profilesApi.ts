// src/api/profilesApi.ts
import { supabase } from '../lib/supabase'
import type { UpdateProfilePayload, UpdateNotifPrefsPayload } from '../types/api'

export const profilesApi = {
  async getOwnProfile(userId: string) {
    return supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  },

  // Only select safe public fields — never samaritan_notes or other private data
  async getPublicProfile(userId: string) {
    return supabase
      .from('profiles')
      .select('id, full_name, avatar_url, reputation, campus_building, created_at')
      .eq('id', userId)
      .single()
  },

async updateProfile(userId: string, payload: UpdateProfilePayload) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Profile not found or update failed');
  return { data, error: null };
},

  async updateNotifPrefs(userId: string, prefs: UpdateNotifPrefsPayload) {
    return supabase
      .from('profiles')
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq('id', userId)
  },

  async updatePassword(newPassword: string) {
    return supabase.auth.updateUser({ password: newPassword })
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    return data.publicUrl
  },
}