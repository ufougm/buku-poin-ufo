// ─── Google Sheets Sync Utility ───────────────────────────────────
// Fetches CUFO registration data from Google Form responses spreadsheet
// Uses the public CSV export API (no API key required)

import { supabase } from "./supabaseClient";

const SPREADSHEET_ID = "1_72nMq9mxTpFRjV__wSmiu0DirZ4ebbeGYjYWTCqc20";
const SHEET_GID = "564462737"; // More reliable than sheet name

// Column mapping (0-based indices) — matched to the actual form:
// A: Timestamp | B: Email address | C: Nama Lengkap | D: NIM | E: Fakultas/Sekolah | F: Prodi
const COLUMN_MAP = {
  email: 1,       // Column B: Email address
  fullName: 2,    // Column C: Nama Lengkap
  nim: 3,         // Column D: NIM
  faculty: 4,     // Column E: Fakultas/Sekolah
  prodi: 5,       // Column F: Prodi
};

export interface SheetRegistrant {
  fullName: string;
  email: string;
  nim: string;
  faculty: string;
  prodi: string;
}

export interface SyncResult {
  added: number;
  skipped: number;
  errors: number;
  details: string[];
  fetchedCount: number;
}

/**
 * Fetch raw CSV data from the public Google Sheet via the gviz CSV endpoint
 */
export async function fetchSheetData(): Promise<string> {
  // Try gid-based URL first (most reliable)
  const urls = [
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`,
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Form%20responses%201`,
    `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`,
  ];

  let lastError = "";
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 0 && !text.includes("<!DOCTYPE") && !text.includes("<html")) {
          return text;
        }
      }
      lastError = `HTTP ${response.status}`;
    } catch (e: any) {
      lastError = e?.message || "Network error";
    }
  }

  throw new Error(`Gagal mengambil data dari Google Spreadsheet (${lastError}). Pastikan spreadsheet diatur ke "Siapa saja yang memiliki link dapat melihat". \n\nLink: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);
}

/**
 * Parse CSV text into registrant objects
 */
export function parseSheetData(csvText: string): { registrants: SheetRegistrant[]; parseLog: string[] } {
  const parseLog: string[] = [];
  const lines = csvText.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    parseLog.push("CSV kosong");
    return { registrants: [], parseLog };
  }

  parseLog.push(`Total baris di CSV: ${lines.length} (termasuk header)`);

  // Log header for debugging
  const headerCols = parseCSVLine(lines[0]);
  parseLog.push(`Header: ${headerCols.join(" | ")}`);

  if (lines.length < 2) {
    parseLog.push("Tidak ada baris data (hanya header)");
    return { registrants: [], parseLog };
  }

  const registrants: SheetRegistrant[] = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 4) {
        parseLog.push(`Baris ${i + 1}: dilewati (kolom kurang: ${cols.length})`);
        continue;
      }

      const email = cols[COLUMN_MAP.email]?.trim();
      const fullName = cols[COLUMN_MAP.fullName]?.trim();
      const nim = cols[COLUMN_MAP.nim]?.trim();

      if (!email) {
        parseLog.push(`Baris ${i + 1}: dilewati (email kosong)`);
        continue;
      }
      if (!fullName) {
        parseLog.push(`Baris ${i + 1}: dilewati (nama kosong)`);
        continue;
      }
      if (!nim) {
        parseLog.push(`Baris ${i + 1}: dilewati (NIM kosong)`);
        continue;
      }

      registrants.push({
        fullName,
        email: email.toLowerCase(),
        nim,
        faculty: cols[COLUMN_MAP.faculty]?.trim() || "",
        prodi: cols[COLUMN_MAP.prodi]?.trim() || "",
      });
    } catch (e: any) {
      parseLog.push(`Baris ${i + 1}: error parsing - ${e.message}`);
    }
  }

  parseLog.push(`Berhasil diparse: ${registrants.length} registrant`);
  return { registrants, parseLog };
}

/**
 * Sync sheet data to Supabase registrants table
 */
export async function syncRegistrantsFromSheet(): Promise<SyncResult> {
  const details: string[] = [];

  // Step 1: Fetch CSV
  let csvText: string;
  try {
    csvText = await fetchSheetData();
    details.push("Berhasil mengambil data dari Google Spreadsheet");
  } catch (e: any) {
    details.push(`Fetch error: ${e.message}`);
    return { added: 0, skipped: 0, errors: 1, details, fetchedCount: 0 };
  }

  // Step 2: Parse CSV
  const { registrants: sheetData, parseLog } = parseSheetData(csvText);
  details.push(...parseLog);

  if (sheetData.length === 0) {
    details.push("Tidak ada data valid yang bisa disimpan");
    return { added: 0, skipped: 0, errors: 0, details, fetchedCount: 0 };
  }

  // Step 3: Get existing registrants from Supabase
  let existingEmails: Set<string>;
  try {
    const { data: existing, error: existingError } = await supabase.from("registrants").select("email");
    if (existingError) {
      details.push(`Error mengambil data existing: ${existingError.message}`);
      return { added: 0, skipped: 0, errors: 1, details, fetchedCount: sheetData.length };
    }
    existingEmails = new Set((existing || []).map((r: any) => (r.email || "").toLowerCase()));
    details.push(`Email sudah terdaftar di database: ${existingEmails.size}`);
  } catch (e: any) {
    details.push(`Error cek existing: ${e.message}`);
    return { added: 0, skipped: 0, errors: 1, details, fetchedCount: sheetData.length };
  }

  // Step 4: Insert new registrants
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of sheetData) {
    if (existingEmails.has(row.email)) {
      skipped++;
      continue;
    }

    try {
      const { error } = await supabase.from("registrants").insert([{
        full_name: row.fullName,
        email: row.email,
        nim: row.nim,
        password: row.nim, // initial password = NIM
        year: "", // Will be filled from form if available
        major: `${row.faculty} - ${row.prodi}`.replace(/ - $/, "").replace(/^ - /, ""),
        status: "active",
        created_at: new Date().toISOString(),
      }]);

      if (error) {
        errors++;
        details.push(`Insert error ${row.email}: ${error.message}`);
      } else {
        added++;
        existingEmails.add(row.email);
      }
    } catch (e: any) {
      errors++;
      details.push(`Insert exception ${row.email}: ${e.message}`);
    }
  }

  details.push(`Selesai: ${added} ditambahkan, ${skipped} dilewati, ${errors} error`);
  return { added, skipped, errors, details, fetchedCount: sheetData.length };
}

/**
 * Get registrant from Supabase for login verification
 */
export async function getRegistrantByEmail(email: string) {
  try {
    const { data, error } = await supabase.from("registrants").select("*").eq("email", email.toLowerCase()).single();
    if (error || !data) return null;
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
  try {
    const { error } = await supabase.from("registrants").update({ password: newPassword }).eq("email", email.toLowerCase());
    return !error;
  } catch {
    return false;
  }
}

// ─── CSV Parser Helper ────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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
