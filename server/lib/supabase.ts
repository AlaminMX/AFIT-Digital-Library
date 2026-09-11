import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// --- SERVER-SIDE SUPABASE CLIENT (SERVICE ROLE OR ANONYMOUS KEY) ---
// This client is initialized if valid Supabase credentials exist.
// If not configured or using placeholders, the server falls back seamlessly
// to local persistent storage so startup and functionality never fail.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const isRealSupabaseUrl = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes("your-project.supabase.co") &&
  supabaseUrl.startsWith("http")
);

export let supabaseAdmin: SupabaseClient | null = null;

if (isRealSupabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl as string, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    console.log("Supabase client initialized with server-side credentials.");
  } catch (err) {
    console.warn("Could not initialize Supabase client; falling back to local storage:", err);
  }
} else {
  console.log("Operating with integrated local storage (Supabase credentials not configured or using placeholder).");
}
