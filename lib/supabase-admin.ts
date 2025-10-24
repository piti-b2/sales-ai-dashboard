import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Admin client with service role key (bypasses RLS)
// If service key is not available, fall back to anon key
export const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
