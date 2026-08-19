/**
 * Trade Ledger, Recut: browser-safe Supabase bootstrap. Only the public URL
 * and anon key are read here; elevated credentials are never shipped to users.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
