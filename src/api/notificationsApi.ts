// src/api/notificationsApi.ts
import { supabase } from '../lib/supabase';

export const notificationsApi = {
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return 0;
    return count ?? 0;
  },

  async getRecent(userId: string) {
    return supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
  },

  async markAllRead(userId: string) {
    return supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  },
};