import { supabase } from '../lib/supabase';

export const lostItemFindersApi = {
  async report(lostItemId: string, message?: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    return supabase
      .from('lost_item_finders')
      .insert({
        lost_item_id: lostItemId,
        finder_id: user.user.id,
        message: message || null,
      })
      .select()
      .single();
  },

  async getByLostItem(lostItemId: string) {
    return supabase
      .from('lost_item_finders')
      .select(`*, profiles!finder_id (id, full_name, email, phone, avatar_url, reputation)`)
      .eq('lost_item_id', lostItemId)
      .order('created_at', { ascending: false });
  },

  async hasReported(lostItemId: string, finderId: string) {
    const { data } = await supabase
      .from('lost_item_finders')
      .select('id')
      .eq('lost_item_id', lostItemId)
      .eq('finder_id', finderId)
      .maybeSingle();
    return !!data;
  },
};