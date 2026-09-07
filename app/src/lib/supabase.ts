import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Check if we have valid Supabase credentials
export const IS_LIVE = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("https://"));

// Create Supabase client only if credentials are valid
// Otherwise create a dummy client that won't crash
export const supabase = IS_LIVE
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key");

// Database types matching our schema
export interface DbRegistrant {
  id: number;
  full_name: string;
  email: string;
  year: string;
  major: string;
  faculty?: string;
  phone?: string;
  status: string;
  created_at: string;
}

export interface DbMentor {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  expertise?: string;
  max_mentees: number;
  status: string;
}

export interface DbActivity {
  id: number;
  registrant_id: number;
  activity_type_id: number;
  activity_name: string;
  activity_date: string;
  activity_date_end?: string;
  role?: string;
  location: string;
  documentation_images?: string[];
  points: number;
  status: "pending" | "verified" | "rejected";
  notes?: string;
  submitted_at: string;
  verified_at?: string;
  verified_by?: number;
  activity_type_name?: string;
  registrant_name?: string;
}

export interface DbMentorAssignment {
  id: number;
  mentor_id: number;
  registrant_id: number;
  assigned_at: string;
  mentor_name?: string;
  registrant_name?: string;
  registrant_email?: string;
  registrant_year?: string;
  registrant_major?: string;
}

export interface DbActivityType {
  id: number;
  number: number;
  name: string;
  points: number;
  requires_role: "yes" | "no";
  description?: string;
}

export interface DbUserProfile {
  id: number;
  email: string;
  full_name: string;
  role: "user" | "mentor" | "psdm";
  created_at: string;
}
