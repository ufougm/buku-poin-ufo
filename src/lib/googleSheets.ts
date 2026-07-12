// ─── Google Sheets Sync Utility ───────────────────────────────────
// Fetches CUFO registration data from Google Form responses spreadsheet
// Uses the public CSV export API (no API key required)

import { supabase } from "./supabaseClient";

const SPREADSHEET_ID = "1_72nMq9mxTpFRjV__wSmiu0DirZ4ebbeGYjYWTCqc20";
const SHEET_GID = "564462737";

// Column mapping (0-based indices) — matched to the actual form:
// A: Timestamp | B: Email | C: Nama Lengkap | D: NIM | E: Fakultas/Sekolah | F: Prodi
// G: Nomor WhatsApp | H: Asal daerah | I: Domisili saat ini | J: Genre Foto yang Disukai
const COLUMN_MAP = {
  email: 1,        // B: Email address
  fullName: 2,     // C: Nama Lengkap
  nim: 3,          // D: NIM
  faculty: 4,      // E: Fakultas/Sekolah
  prodi: 5,        // F: Prodi
  whatsapp: 6,     // G: Nomor WhatsApp
  asalDaerah: 7,   // H: Asal daerah
  domisili: 8,     // I: Domisili saat ini
  genreFoto: 9,    // J: Genre Foto yang Disukai
};

export interface SheetRegistrant {
  fullName: string;
  email: string;
  nim: string;
  faculty: string;
  prodi: string;
  whatsapp: string;
  asalDaerah: string;
  domisili: string;
  genreFoto: string;
  angkatan: string; // Derived from first 2 digits of NIM
}

export interface SyncResult {
  added: number;
  skipped: number;
  errors: number;
  details: string[];
  fetchedCount: number;
}

/**
 * Derive angkatan from NIM's first 2 digits
 * e.g., "24/537646/EK/25038" → "24" → "2024"
 */
export function deriveAngkatanFromNIM(nim: string): string {
  const cleanNIM = nim.replace(/\//g, "").replace(/-/g, "");
  const firstTwo = cleanNIM.substring(0, 2);
  if (firstTwo === "22") return "2022";
  if (firstTwo === "23") return "2023";
  if (firstTwo === "24") return "2024";
  if (firstTwo === "25") return "2025";
  if (firstTwo === "26") return "2026";
  return "20" + firstTwo;
}

/**
 * Fetch raw CSV data from the public Google Sheet
 */
export async function fetchSheetData(): Promise<string> {
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

  throw new Error(`Gagal mengambil data dari Google Spreadsheet (${lastError}). Pastikan spreadsheet diatur ke "Siapa saja yang memiliki link dapat melihat".`);
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

  const headerCols = parseCSVLine(lines[0]);
  parseLog.push(`Header (${headerCols.length} kolom): ${headerCols.slice(0, 10).join(" | ")}${headerCols.length > 10 ? "..." : ""}`);

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

      if (!email) { parseLog.push(`Baris ${i + 1}: dilewati (email kosong)`); continue; }
      if (!fullName) { parseLog.push(`Baris ${i + 1}: dilewati (nama kosong)`); continue; }
      if (!nim) { parseLog.push(`Baris ${i + 1}: dilewati (NIM kosong)`); continue; }

      const angkatan = deriveAngkatanFromNIM(nim);

      registrants.push({
        fullName,
        email: email.toLowerCase(),
        nim,
        faculty: cols[COLUMN_MAP.faculty]?.trim() || "",
        prodi: cols[COLUMN_MAP.prodi]?.trim() || "",
        whatsapp: cols[COLUMN_MAP.whatsapp]?.trim() || "",
        asalDaerah: cols[COLUMN_MAP.asalDaerah]?.trim() || "",
        domisili: cols[COLUMN_MAP.domisili]?.trim() || "",
        genreFoto: cols[COLUMN_MAP.genreFoto]?.trim() || "",
        angkatan,
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

  // Step 3: Get existing registrants (email -> id)
  let existingRecords: Map<string, number>;
  try {
    const { data: existing, error: existingError } = await supabase.from("registrants").select("id,email");
    if (existingError) {
      details.push(`Error mengambil data existing: ${existingError.message}`);
      return { added: 0, skipped: 0, errors: 1, details, fetchedCount: sheetData.length };
    }
    existingRecords = new Map((existing || []).map((r: any) => [(r.email || "").toLowerCase(), r.id]));
    details.push(`Email sudah terdaftar di database: ${existingRecords.size}`);
  } catch (e: any) {
    details.push(`Error cek existing: ${e.message}`);
    return { added: 0, skipped: 0, errors: 1, details, fetchedCount: sheetData.length };
  }

  // Step 4: Insert new + update existing
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of sheetData) {
    const existingId = existingRecords.get(row.email);

    if (existingId) {
      // Update existing registrant with fresh spreadsheet data
      try {
        const { error } = await supabase.from("registrants").update({
          full_name: row.fullName,
          nim: row.nim,
          year: row.angkatan,
          major: `${row.faculty}${row.prodi ? " - " + row.prodi : ""}`,
          whatsapp: row.whatsapp,
          asal_daerah: row.asalDaerah,
          domisili: row.domisili,
          genre_foto: row.genreFoto,
        }).eq("id", existingId);

        if (error) {
          errors++;
          details.push(`Update error ${row.email}: ${error.message}`);
        } else {
          updated++;
        }
      } catch (e: any) {
        errors++;
        details.push(`Update exception ${row.email}: ${e.message}`);
      }
    } else {
      // Insert new registrant
      try {
        const { error } = await supabase.from("registrants").insert([{
          full_name: row.fullName,
          email: row.email,
          nim: row.nim,
          password: row.nim,
          year: row.angkatan,
          major: `${row.faculty}${row.prodi ? " - " + row.prodi : ""}`,
          whatsapp: row.whatsapp,
          asal_daerah: row.asalDaerah,
          domisili: row.domisili,
          genre_foto: row.genreFoto,
          status: "active",
          created_at: new Date().toISOString(),
        }]);

        if (error) {
          errors++;
          details.push(`Insert error ${row.email}: ${error.message}`);
        } else {
          added++;
          existingRecords.set(row.email, 0);
        }
      } catch (e: any) {
        errors++;
        details.push(`Insert exception ${row.email}: ${e.message}`);
      }
    }
  }

  details.push(`Selesai: ${added} ditambahkan, ${updated} diperbarui, ${skipped} dilewati, ${errors} error`);
  return { added, skipped: Math.max(0, skipped), errors, details, fetchedCount: sheetData.length };
}

/**
 * Get registrant from Supabase for login verification
 * Login accepts either NIM (first time) or changed password
 */
export async function getRegistrantByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from("registrants")
      .select("*")
      .ilike("email", email) // case-insensitive match
      .maybeSingle(); // returns null instead of error if no match
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
      whatsapp: data.whatsapp,
      asalDaerah: data.asal_daerah,
      domisili: data.domisili,
      genreFoto: data.genre_foto,
    };
  } catch {
    return null;
  }
}

/**
 * Verify login: accepts either NIM (first time) or changed password
 */
export async function verifyRegistrantLogin(email: string, inputPassword: string) {
  const registrant = await getRegistrantByEmail(email);
  if (!registrant) return null;
  if (registrant.status !== "active") return null;

  // Accept either NIM or the changed password
  const isNIM = inputPassword === registrant.nim;
  const isPassword = inputPassword === registrant.password;

  if (!isNIM && !isPassword) return null;

  return registrant;
}

/**
 * Update registrant password
 */
export async function updateRegistrantPassword(email: string, newPassword: string) {
  try {
    const { error } = await supabase
      .from("registrants")
      .update({ password: newPassword })
      .ilike("email", email); // case-insensitive match
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
