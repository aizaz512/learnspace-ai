
import { createClient } from "@supabase/supabase-js";

// ============================================
// SUPABASE ENVIRONMENT VARIABLES
// ============================================

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim();

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();


// ============================================
// VALIDATE CONFIGURATION
// ============================================

if (!supabaseUrl) {
  throw new Error(
    "Missing VITE_SUPABASE_URL. Check frontend/.env.local."
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_PUBLISHABLE_KEY. Check frontend/.env.local."
  );
}

if (supabasePublishableKey.startsWith("sb_secret_")) {
  throw new Error(
    "A Supabase secret key cannot be used in frontend code. Use the publishable key."
  );
}


// ============================================
// CREATE SUPABASE CLIENT
// ============================================

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
