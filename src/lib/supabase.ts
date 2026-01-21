import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

console.log('[Supabase] client created')

export default supabase
