// src/api/storageApi.ts
import { supabase } from '../lib/supabase'

export const storageApi = {
  async uploadItemImage(file: File, userId: string, itemId: string): Promise<string> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${itemId}/primary.${ext}`

    const { error } = await supabase.storage
      .from('item-images')
      .upload(path, file, { upsert: true })

    if (error) throw new Error(`Image upload failed: ${error.message}`)

    const { data } = supabase.storage
      .from('item-images')
      .getPublicUrl(path)

    return data.publicUrl
  },

  getItemImageUrl(userId: string, itemId: string, filename = 'primary.jpg'): string {
    const { data } = supabase.storage
      .from('item-images')
      .getPublicUrl(`${userId}/${itemId}/${filename}`)
    return data.publicUrl
  },
}