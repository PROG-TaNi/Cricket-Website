// @ts-check
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mock-cricket.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "mock-anon-key";

/**
 * Public Supabase client (Anon Key ONLY)
 * Privileged operations occur exclusively via serverless /api endpoints.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
