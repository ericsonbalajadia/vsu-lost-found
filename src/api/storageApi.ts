// src/api/storageApi.ts
import { supabase } from '../lib/supabase';

export const storageApi = {
  // Upload a single image (kept for backward compatibility)
  async uploadItemImage(file: File, userId: string, itemId: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${userId}/${itemId}/primary.${ext}`;
    const { error } = await supabase.storage
      .from('item-images')
      .upload(path, file, { upsert: true });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = supabase.storage.from('item-images').getPublicUrl(path);
    return data.publicUrl;
  },

  // Upload multiple images (returns array of URLs)
  async uploadMultipleItemImages(
    files: File[],
    userId: string,
    itemId: string
  ): Promise<string[]> {
    const uploads = files.map(async (file, index) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      // Use timestamp + index to avoid name collisions
      const path = `${userId}/${itemId}/img_${Date.now()}_${index}.${ext}`;
      const { error } = await supabase.storage
        .from('item-images')
        .upload(path, file, { upsert: true });
      if (error) throw new Error(`Image upload failed: ${error.message}`);
      const { data } = supabase.storage.from('item-images').getPublicUrl(path);
      return data.publicUrl;
    });
    return Promise.all(uploads);
  },

  // Helper to get a public URL for an item image
  getItemImageUrl(userId: string, itemId: string, filename = 'primary.jpg'): string {
    const { data } = supabase.storage
      .from('item-images')
      .getPublicUrl(`${userId}/${itemId}/${filename}`);
    return data.publicUrl;
  },
};