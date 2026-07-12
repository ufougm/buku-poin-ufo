// ─── Google Sheets Sync Utility ───────────────────────────────────
// Fetches CUFO registration data from Google Form responses spreadsheet
// Uses the public CSV export API (no API key required)

import { supabase, toCamel } from "./supabaseClient";

const SPREADSHEET_ID = "1_72nMq9mxTpFRjV__wSmiu0DirZ4ebbeGYjYWTCqc20";
const SHEET_NAME = "Form%20responses%201"; // URL-encoded "Form responses 1"

// Column mapping: adjust these indices (0-based) based on your form
// Default assumes: Timestamp, Email, Nama Lengkap, NIM, Fakultas, Angkatan, No HP
const COLUMN_MAP = {
  email: 1,       // Column B: Email address
  fullName: 2,    // Column C: Nama Lengkap
  nim: 3,         // Column D: NIM
  faculty: 4,     // Column E: Fakultas/Departemen
  year: 5,        // Column F: Angkatan
};

export interface SheetRegistrant {
  fullName: string;
  email: string;
  nim: string;
  faculty: string;
  year: string;
}

/**
 * Fetch raw CSV data from the public Google Sheet
 */
export async function fetchSheetData(): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/**
 * Parse CSV text into registrant objects
 */
export function parseSheetData(csvText: string): SheetRegistrant[] {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Skip header row, parse data rows
  const registrants: SheetRegistrant[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 4) continue;

    const email = cols[COLUMN_MAP.email]?.trim();
    const fullName = cols[COLUMN_MAP.fullName]?.trim();
    const nim = cols[COLUMN_MAP.nim]?.trim();

    if (!email || !fullName || !nim) continue;

    registrants.push({
      fullName,
      email: email.toLowerCase(),
      nim,
      faculty: cols[COLUMN_MAP.faculty]?.trim() || "",
      year: cols[COLUMN_MAP.year]?.trim() || "",
    });
  }

  return registrants;
}

/**
 * Sync sheet data to Supabase registrants table
 * - Inserts new registrants (by email)
 * - Skips existing ones
 * - Sets password = NIM
 */
export async function syncRegistrantsFromSheet(): Promise<{
  added: number;
  skipped: number;
  errors: number;
  details: string[];
}> {
  const csvText = await fetchSheetData();
  const sheetData = parseSheetData(csvText);

  if (sheetData.length === 0) {
    return { added: 0, skipped: 0, errors: 0, details: ["Tidak ada data di spreadsheet"] };
  }

  // Get existing registrant emails from Supabase
  const { data: existing } = await supabase.from("registrants").select("email");
  const existingEmails = new Set((existing || []).map((r: any) => r.email.toLowerCase()));

  let added = 0;
  let skipped = 0;
  let errors = 0;
  const details: string[] = [];

  for (const row of sheetData) {
    if (existingEmails.has(row.email)) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("registrants").insert([{
      full_name: row.fullName,
      email: row.email,
      nim: row.nim,
      password: row.nim, // initial password = NIM
      year: row.year,
      major: row.faculty,
      status: "active",
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      errors++;
      details.push(`Error: ${row.email} - ${error.message}`);
    } else {
      added++;
      existingEmails.add(row.email);
    }
  }

  return { added, skipped, errors, details };
}

/**
 * Get all registrants from Supabase (for login verification)
 */
export async function getRegistrantByEmail(email: string) {
  try {
    const { data } = await supabase.from("registrants").select("*").eq("email", email.toLowerCase()).single();
    if (!data) return null;
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      nim: data.nim,
      password: data.password || data.nim,
      year: data.year,
      major: data.major,
      status: data.status,
    };
  } catch {
    return null;
  }
}

/**
 * Update registrant password
 */
export async function updateRegistrantPassword(email: string, newPassword: string) {
  const { error } = await supabase.from("registrants").update({ password: newPassword }).eq("email", email.toLowerCase());
  return !error;
}

// ─── CSV Parser Helper ────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
