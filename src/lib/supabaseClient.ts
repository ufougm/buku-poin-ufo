import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Buku Poin UFO] Supabase not configured. " +
    "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

// ─── Types for Supabase tables ────────────────────────────────────
export interface DbMember {
  nsa: string;
  name: string;
  angkatan: number;
  divisi: string;
  role: string;
  password: string;
  email?: string;
  created_at?: string;
}

export interface DbRegistrant {
  id: number;
  full_name: string;
  email: string;
  year: string;
  major: string;
  status: string;
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
  submitted_at?: string;
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

export interface DbPemanduAssignment {
  id: number;
  pemandu_id: number;
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
