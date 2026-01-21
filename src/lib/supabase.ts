import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[Supabase] checking environment variables', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl || 'NOT SET',
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('[Supabase] initializing', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
})

// Create client without strict Database typing for easier development
// The actual table schemas are validated at runtime by Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

console.log('[Supabase] client created')

export default supabase
