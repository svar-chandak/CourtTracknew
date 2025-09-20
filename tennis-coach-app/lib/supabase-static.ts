import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client for static export
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Browser client for client components
export const createClientComponentClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
