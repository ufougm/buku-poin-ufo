import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const IS_LIVE = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("https://"));
export const SYNC_STATUS = IS_LIVE ? "live" as const : "local" as const;

// Create a dummy client when not configured (localStorage fallback mode)
let client: any;
try {
  client = IS_LIVE
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
    : { from: () => ({ select: () => ({ data: null }), insert: () => ({ data: null, error: null }), update: () => ({ error: null }), delete: () => ({ error: null }) }) };
} catch {
  client = { from: () => ({ select: () => ({ data: null }), insert: () => ({ data: null, error: null }), update: () => ({ error: null }), delete: () => ({ error: null }) }) };
}
export const supabase = client;

// Types for Supabase tables
export interface DbMember {
  nsa: string;
  name: string;
  angkatan: number;
  divisi: string;
  role: string;
  password: string;
  created_at?: string;
}

export interface DbRegistrant {
  id: number;
  full_name: string;
  email: string;
  year: string;
  major: string;
  status: string;
  created_by: string;
  created_at?: string;
}

export interface DbActivity {
  id: number;
  registrant_id: number;
  activity_type_id: number;
  activity_name: string;
  activity_date: string;
  activity_date_end?: string;
  role?: string;
  location?: string;
  documentation_images?: string[];
  points: number;
  status: string;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  created_at?: string;
}

export interface DbKelompok {
  id: number;
  name: string;
  pemandu_ids: number[];
  created_at?: string;
}

export interface DbKelompokAssignment {
  id: number;
  kelompok_id: number;
  registrant_id: number;
  assigned_at?: string;
}

export interface DbFreeUser {
  username: string;
  name: string;
  email?: string;
  password: string;
  role: string;
  created_at?: string;
}

// ─── Helper: convert snake_case DB rows to camelCase ──────────────
export function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj === null || typeof obj !== "object") return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = toCamel(v);
  }
  return out;
}
