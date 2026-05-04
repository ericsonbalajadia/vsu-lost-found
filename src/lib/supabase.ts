import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
  throw new Error('Invalid or missing VITE_SUPABASE_URL. Please set the correct Supabase project URL in .env.local');
}
if (!supabaseAnonKey || supabaseAnonKey.includes('your_anon_key')) {
  throw new Error('Invalid or missing VITE_SUPABASE_ANON_KEY. Please set the correct anon key in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
