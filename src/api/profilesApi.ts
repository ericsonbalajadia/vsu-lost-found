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
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Notification preferences not found or update failed')
    return { data, error: null }
  },

  async updatePassword(newPassword: string) {
    return supabase.auth.updateUser({ password: newPassword })
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    // Delete old avatar if exists (optional but keeps storage clean)
    await supabase.storage.from('avatars').remove([path]);

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) throw new Error(`Avatar upload failed: ${error.message}`);

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    return data.publicUrl
  },

  async removeAvatar(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (profile?.avatar_url) {
      // Extract path from URL (e.g., .../avatars/user-id/avatar.jpg)
      const url = new URL(profile.avatar_url);
      const path = url.pathname.split('/avatars/')[1];
      if (path) {
        await supabase.storage.from('avatars').remove([path]);
      }
    }

    return supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId);
  },



  
}