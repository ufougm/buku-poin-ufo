import { useState, useEffect, useCallback } from "react";
import { supabase, toCamel } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────
export interface LocalRegistrant {
  id: number;
  fullName: string;
  email: string;
  nim?: string;
  password?: string;
  year: string;
  major: string;
  whatsapp?: string;
  asalDaerah?: string;
  domisili?: string;
  genreFoto?: string;
  status: string;
  createdAt: string;
}

export interface LocalPemandu {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  expertise?: string;
  maxMentees: number;
  status: "active" | "inactive";
}

export interface LocalActivity {
  id: number;
  registrantId: number;
  activityTypeId: number;
  activityName: string;
  activityDate: string;
  activityDateEnd?: string;
  role?: string;
  location?: string;
  documentationImages?: string[];
  points: number;
  status: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  submittedAt: string;
}

export interface LocalPemanduAssignment {
  id: number;
  pemanduId: number;
  registrantId: number;
  assignedAt: string;
}

export interface LocalKelompok {
  id: number;
  name: string;
  pemanduIds: number[];
}

export interface LocalKelompokAssignment {
  id: number;
  kelompokId: number;
  registrantId: number;
  assignedAt: string;
}

export interface LocalMember {
  nsa: string;
  name: string;
  angkatan: number;
  divisi: string;
  role: "psdm" | "pemandu" | "psdm_pemandu" | "user";
  password: string;
  email?: string;
  isPreRegistered: boolean;
}

export interface VerifiedMember {
  serialNumber: string;
  fullName: string;
  email: string;
  role: "pemandu" | "psdm";
}

// ─── Activity Types (Updated) ────────────────────────────────────
export const ACTIVITY_TYPES = [
  { id: 1, name: "Diksar", category: "Diklat", points: 25, description: "Diklat dasar fotografi" },
  { id: 2, name: "Pameris Pameran Dikjut", category: "Pameran", points: 20, description: "Pameris dalam pameran dikjut" },
  { id: 3, name: "Panitia Pameran Dikjut", category: "Pameran", points: 20, description: "Panitia dalam pameran dikjut" },
  { id: 4, name: "Piket Sekre Akbar", category: "Sekre", points: 10, description: "Piket sekretariat akbar" },
  { id: 5, name: "Diklat Wajib & Umum", category: "Diklat", points: 10, description: "Kegiatan diklat wajib dan umum" },
  { id: 6, name: "Ketua Kelas Pameran Pra Pelantikan", category: "Pameran", points: 5, description: "Ketua kelas dalam pameran pra-pelantikan" },
  { id: 7, name: "Event Hunting", category: "Hunting", points: 10, description: "Kegiatan hunting foto event" },
  { id: 8, name: "Piket Sekre", category: "Sekre", points: 10, description: "Piket rutin sekretariat" },
  { id: 9, name: "Ikut Presentasi Karya Pameris (Pra-pel)", category: "Review", points: 3, description: "Presentasi karya pameris pra-pelantikan" },
  { id: 10, name: "Menjadi Divisi DDD di kepanitiaan", category: "Organisasi", points: 5, description: "Kontribusi sebagai divisi DDD dalam kepanitiaan" },
  { id: 11, name: "Memenangkan Lomba Fotografi/Videografi", category: "Prestasi", points: 10, description: "Juara lomba foto/video" },
  { id: 12, name: "Mengikuti Lomba Fotografi/Videografi", category: "Prestasi", points: 2, description: "Partisipasi lomba foto/video" },
  { id: 13, name: "Submit Karya untuk pameran", category: "Pameran", points: 3, description: "Pengumpulan karya untuk pameran" },
  { id: 14, name: "Membantu dokumentasi UKM / komunitas di UGM", category: "Dokumentasi", points: 3, description: "Dokumentasi untuk UKM atau komunitas UGM" },
  { id: 15, name: "Berpartisipasi Dalam Kegiatan HUT UFO", category: "Event", points: 2, description: "Partisipasi kegiatan HUT UFO" },
  { id: 16, name: "Kurasi Pameran", category: "Pameran", points: 3, description: "Proses kurasi karya pameran" },
  { id: 17, name: "Hunting individu", category: "Hunting", points: 2, description: "Kegiatan hunting foto secara individu" },
  { id: 18, name: "Hunting bareng UFO/CUFO (min. 3 orang)", category: "Hunting", points: 5, description: "Hunting bersama anggota UFO/CUFO" },
  { id: 19, name: "Main ke Sekre UFO (min. 2 jam)", category: "Sekre", points: 2, description: "Kunjungan ke sekretariat minimal 2 jam" },
  { id: 20, name: "Mengikuti Workshop/Seminar Fotografi/Videografi (selain UFO)", category: "Diklat", points: 5, description: "Workshop/seminar eksternal" },
  { id: 21, name: "Mengunjungi Pameran", category: "Pameran", points: 2, description: "Kunjungan pameran" },
  { id: 22, name: "Mengunjungi Pameran bersama UFO/ CUFO", category: "Pameran", points: 5, description: "Kunjungan pameran bersama anggota" },
  { id: 23, name: "Mengikuti One Week Challenge", category: "Challenge", points: 1, description: "Poin dihitung per hari" },
  { id: 24, name: "Kegiatan lain", category: "Lain-lain", points: 0, description: "Sesuai kebijakan/persetujuan Ketua UFO" },
];

// ─── Supabase-only CRUD Helpers ───────────────────────────────────

async function sbGetMembers(): Promise<LocalMember[]> {
  const base = PRE_REGISTERED_MEMBERS.map((m) => ({ ...m, isPreRegistered: true }));
  try {
    const { data } = await supabase.from("members").select("*");
    if (data && data.length > 0) {
      const fromDb = data.map((m: any) => ({ ...toCamel(m), isPreRegistered: true }));
      const existingNsas = new Set(base.map((m) => m.nsa.toLowerCase()));
      return [...base, ...fromDb.filter((m: LocalMember) => !existingNsas.has(m.nsa.toLowerCase()))];
    }
  } catch { /* return pre-registered only */ }
  return base;
}

async function sbGetRegistrants(): Promise<LocalRegistrant[]> {
  try {
    const { data } = await supabase.from("registrants").select("*").order("id", { ascending: true });
    return (data || []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      nim: r.nim,
      password: r.password,
      year: r.year,
      major: r.major,
      whatsapp: r.whatsapp,
      asalDaerah: r.asal_daerah,
      domisili: r.domisili,
      genreFoto: r.genre_foto,
      status: r.status,
      createdAt: r.created_at,
    }));
  } catch { return []; }
}

async function sbGetActivities(): Promise<LocalActivity[]> {
  try {
    const { data } = await supabase.from("activities").select("*").order("id", { ascending: true });
    return (data || []).map((a: any) => toCamel(a));
  } catch { return []; }
}

async function sbGetKelompoks(): Promise<LocalKelompok[]> {
  try {
    const { data } = await supabase.from("kelompoks").select("*");
    return (data || []).map((k: any) => toCamel(k));
  } catch { return []; }
}

async function sbGetKelompokAssignments(): Promise<LocalKelompokAssignment[]> {
  try {
    const { data } = await supabase.from("kelompok_assignments").select("*");
    return (data || []).map((ka: any) => toCamel(ka));
  } catch { return []; }
}

async function sbGetPemanduAssignments(): Promise<LocalPemanduAssignment[]> {
  try {
    const { data } = await supabase.from("pemandu_assignments").select("*");
    return (data || []).map((a: any) => toCamel(a));
  } catch { return []; }
}

async function sbGetLocations(): Promise<string[]> {
  try {
    const { data } = await supabase.from("locations").select("name");
    if (!data || data.length === 0) return DEFAULT_LOCATIONS;
    return data.map((d: any) => d.name);
  } catch { return DEFAULT_LOCATIONS; }
}

// ─── Write Operations ─────────────────────────────────────────────
async function sbAddRegistrant(r: Omit<LocalRegistrant, "id" | "createdAt">): Promise<LocalRegistrant> {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("registrants").insert([{ ...r, created_at: now }]).select().single();
  if (error) throw error;
  return toCamel(data);
}

async function sbAddActivity(a: Omit<LocalActivity, "id" | "submittedAt">): Promise<LocalActivity> {
  const now = new Date().toISOString();
  const payload = {
    registrant_id: a.registrantId,
    activity_type_id: a.activityTypeId,
    activity_name: a.activityName,
    activity_date: a.activityDate,
    activity_date_end: a.activityDateEnd,
    role: a.role,
    location: a.location,
    documentation_images: a.documentationImages,
    points: a.points,
    status: a.status,
    submitted_at: now,
  };
  const { data, error } = await supabase.from("activities").insert([payload]).select().single();
  if (error) throw error;
  return toCamel(data);
}

async function sbUpdateActivity(id: number, updates: Partial<LocalActivity>) {
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.verifiedBy !== undefined) payload.verified_by = updates.verifiedBy;
  if (updates.verifiedAt !== undefined) payload.verified_at = updates.verifiedAt;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  const { error } = await supabase.from("activities").update(payload).eq("id", id);
  if (error) throw error;
}

async function sbDeleteRegistrant(id: number) {
  await supabase.from("registrants").delete().eq("id", id);
  await supabase.from("activities").delete().eq("registrant_id", id);
  await supabase.from("kelompok_assignments").delete().eq("registrant_id", id);
  await supabase.from("pemandu_assignments").delete().eq("registrant_id", id);
}

async function sbAssignToKelompok(registrantId: number, kelompokId: number) {
  const now = new Date().toISOString();
  await supabase.from("kelompok_assignments").delete().eq("registrant_id", registrantId);
  await supabase.from("pemandu_assignments").delete().eq("registrant_id", registrantId);
  await supabase.from("kelompok_assignments").insert([{ kelompok_id: kelompokId, registrant_id: registrantId, assigned_at: now }]);
  const { data: kData } = await supabase.from("kelompoks").select("pemandu_ids").eq("id", kelompokId).single();
  if (kData?.pemandu_ids) {
    const newPas = kData.pemandu_ids.map((pid: number) => ({ pemandu_id: pid, registrant_id: registrantId, assigned_at: now }));
    await supabase.from("pemandu_assignments").insert(newPas);
  }
}

async function sbRemoveFromKelompok(registrantId: number) {
  await supabase.from("kelompok_assignments").delete().eq("registrant_id", registrantId);
  await supabase.from("pemandu_assignments").delete().eq("registrant_id", registrantId);
}

async function sbAddKelompok(k: Omit<LocalKelompok, "id">): Promise<LocalKelompok> {
  const { data, error } = await supabase.from("kelompoks").insert([{ name: k.name, pemandu_ids: k.pemanduIds }]).select().single();
  if (error) throw error;
  return toCamel(data);
}

async function sbUpdateKelompok(id: number, updates: Partial<LocalKelompok>) {
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.pemanduIds !== undefined) payload.pemandu_ids = updates.pemanduIds;
  const { error } = await supabase.from("kelompoks").update(payload).eq("id", id);
  if (error) throw error;
}

async function sbDeleteKelompok(id: number) {
  await supabase.from("kelompok_assignments").delete().eq("kelompok_id", id);
  await supabase.from("pemandu_assignments").delete().eq("kelompok_id", id);
  await supabase.from("kelompoks").delete().eq("id", id);
}

async function sbAddMember(m: Omit<LocalMember, "isPreRegistered">): Promise<void> {
  await supabase.from("members").insert([{ nsa: m.nsa, name: m.name, angkatan: m.angkatan, divisi: m.divisi, role: m.role, password: m.password, email: m.email }]);
}

async function sbUpdateMember(nsa: string, updates: Partial<LocalMember>) {
  const payload: any = {};
  if (updates.password !== undefined) payload.password = updates.password;
  if (updates.email !== undefined) payload.email = updates.email;
  await supabase.from("members").update(payload).eq("nsa", nsa);
}

async function sbAddLocation(name: string) {
  await supabase.from("locations").insert([{ name }]).select();
}

async function sbDeleteLocation(name: string) {
  await supabase.from("locations").delete().eq("name", name);
}

// ─── Standalone Pemandu CRUD (admin-managed pemandus not in members) ──
interface StandalonePemandu {
  id: number;
  fullName: string;
  email: string;
  expertise: string;
  maxMentees: number;
  createdAt: string;
}

export async function addPemandu(data: { userId: number; fullName: string; email: string; expertise: string; maxMentees: number }) {
  const { error } = await supabase.from("standalone_pemandus").insert([{
    full_name: data.fullName,
    email: data.email,
    expertise: data.expertise,
    max_mentees: data.maxMentees,
    created_at: new Date().toISOString(),
  }]);
  if (error) throw error;
}

export async function updatePemandu(id: number, updates: Partial<StandalonePemandu>) {
  const payload: any = {};
  if (updates.fullName !== undefined) payload.full_name = updates.fullName;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.expertise !== undefined) payload.expertise = updates.expertise;
  if (updates.maxMentees !== undefined) payload.max_mentees = updates.maxMentees;
  const { error } = await supabase.from("standalone_pemandus").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deletePemandu(id: number) {
  const { error } = await supabase.from("standalone_pemandus").delete().eq("id", id);
  if (error) throw error;
}

// ─── Verified Member CRUD ─────────────────────────────────────────
export async function addVerifiedMember(data: { serialNumber: string; fullName: string; email: string; role: "pemandu" | "psdm" }) {
  const { data: existing } = await supabase.from("members").select("nsa").eq("nsa", data.serialNumber).single();
  if (existing) throw new Error("Nomor seri sudah terdaftar");
  const { error } = await supabase.from("members").insert([{
    nsa: data.serialNumber,
    name: data.fullName,
    angkatan: 0,
    divisi: "",
    role: data.role,
    password: "123456",
    email: data.email,
  }]);
  if (error) throw error;
}

export async function updateVerifiedMember(serialNumber: string, updates: { serialNumber: string; fullName: string; email: string; role: "pemandu" | "psdm" }) {
  const { error } = await supabase.from("members").update({
    nsa: updates.serialNumber,
    name: updates.fullName,
    email: updates.email,
    role: updates.role,
  }).eq("nsa", serialNumber);
  if (error) throw error;
}

export async function deleteVerifiedMember(serialNumber: string) {
  const { error } = await supabase.from("members").delete().eq("nsa", serialNumber);
  if (error) throw error;
}

// ─── Seed Members ─────────────────────────────────────────────────
export const PRE_REGISTERED_MEMBERS: Omit<LocalMember, "isPreRegistered">[] = [
  { nsa: "NSA.3224.018.1089", name: "MUHAMMAD NAUFAL HAFIZH", angkatan: 32, divisi: "Wakil Ketua", role: "psdm", password: "1089" },
  { nsa: "NSA.3224.027.1098", name: "NAUFAL REZA AL LUTHFI", angkatan: 32, divisi: "Ketua", role: "psdm", password: "1098" },
  { nsa: "NSA.3224.004.1075", name: "AWINDYA AYUNINGTYAS RAMADHANI", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1075" },
  { nsa: "NSA.3224.020.1091", name: "NABILA PUTRI SALSABILA", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1091" },
  { nsa: "NSA.3224.024.1095", name: "NAUFAL ARIF ARDHIANSYAH", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1095" },
  { nsa: "NSA.3224.036.1107", name: "TIARDEV YAN SATRITAMA", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1107" },
  { nsa: "NSA.3325.005.1114", name: "ELIZABETH LOVELY ANTONIO", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1114" },
  { nsa: "NSA.3325.013.1122", name: "KEISANADA ALYUNA", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1122" },
  { nsa: "NSA.3325.023.1132", name: "PERMATA YAQUB AURA WIJAYA", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1132" },
  { nsa: "NSA.3325.031.1140", name: "YOHANES IMANNUEL ROSANTIANT", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1140" },
  { nsa: "NSA.3325.001.1110", name: "AISHA", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1110" },
  { nsa: "NSA.3325.002.1111", name: "AKHMARINA SIAMITA FADILAH", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1111" },
  { nsa: "NSA.3325.003.1112", name: "ALHIMNI RUSYADI PUTRI ARSINDU", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1112" },
  { nsa: "NSA.3325.004.1113", name: "ANGELINE CALLISTA", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1113" },
  { nsa: "NSA.3325.006.1115", name: "EZRA AGUNG MAWASTYA", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1115" },
  { nsa: "NSA.3325.007.1116", name: "FARRAS AL FAYYADH", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1116" },
  { nsa: "NSA.3325.008.1117", name: "FIKRI ATHAYA DIANDRA", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1117" },
  { nsa: "NSA.3325.009.1118", name: "GADANG ALAM SI RADJA", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1118" },
  { nsa: "NSA.3325.011.1120", name: "HILMI RASYID", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1120" },
  { nsa: "NSA.3325.012.1121", name: "IQBAL ARUNG SAMUDRA", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1121" },
  { nsa: "NSA.3325.014.1123", name: "KEVIN NUSYWA PUTRA", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1123" },
  { nsa: "NSA.3325.015.1124", name: "LUKMAN HAKIM", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1124" },
  { nsa: "NSA.3325.016.1125", name: "MAWLA HUMAYUN AHSAN HERMAWAN", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1125" },
  { nsa: "NSA.3325.017.1126", name: "MUHAMMAD NAUFAL LAUDZAKI", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1126" },
  { nsa: "NSA.3325.018.1127", name: "MUHAMMAD RAFIF AKIO SARWADI", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1127" },
  { nsa: "NSA.3325.019.1128", name: "MUHAMMAD RIFKY RADHIYAN PASHA", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1128" },
  { nsa: "NSA.3325.020.1129", name: "MUHAMMAD TAJU ABRAR RIZA", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1129" },
  { nsa: "NSA.3325.021.1130", name: "NAFISA RAMADANI", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1130" },
  { nsa: "NSA.3325.022.1131", name: "NAILAH ATTARAFSHAH SURYANTO", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1131" },
  { nsa: "NSA.3325.024.1133", name: "RAHMI NISRINA", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1133" },
  { nsa: "NSA.3325.025.1134", name: "REFANIA AZHARI SIREGAR", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1134" },
  { nsa: "NSA.3325.027.1136", name: "SANDY DIYO ANGGARA", angkatan: 33, divisi: "Sekretaris", role: "pemandu", password: "1136" },
  { nsa: "NSA.3325.028.1137", name: "SHAUMI NOORRAMADHANI", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1137" },
  { nsa: "NSA.3325.029.1138", name: "SITI YASMIN FAJRI RAMADHANI", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1138" },
  { nsa: "NSA.3325.030.1139", name: "SYAKIRA NAILA JAGADDHITA", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1139" },
  { nsa: "NSA.3325.032.1141", name: "YUSUF KURNIAWAN", angkatan: 33, divisi: "Bendahara", role: "pemandu", password: "1141" },
];

const DEFAULT_LOCATIONS = [
  "Sekretariat UFO UGM", "Sekretariat Bersama N58 UGM", "Auditorium FMIPA UGM",
  "Grha Sabha Pramana UGM", "Balairung UGM", "Perpustakaan Pusat UGM",
  "Museum UGM", "Taman Budaya Yogyakarta", "Jogja National Museum",
  "Galeri Nasional Indonesia Yogyakarta", "Taman Sari Yogyakarta",
  "Candi Prambanan", "Candi Borobudur", "Malioboro",
  "Taman Pelangi Jogja", "Lapangan Pancasila UGM", "Gelanggang Mahasiswa UGM",
];

const PSDM_PIN = "UFOADMIN2024";

// ─── Exported Functions ───────────────────────────────────────────
export function verifyMember(serialNumber: string, role: "pemandu" | "psdm", pin?: string): VerifiedMember | null {
  const members = PRE_REGISTERED_MEMBERS.filter((m) => m.role === role || (role === "psdm" && m.role === "psdm_pemandu"));
  const member = members.find((m) => m.nsa === serialNumber);
  if (!member) return null;
  if (role === "psdm" && pin !== PSDM_PIN) return null;
  return { serialNumber: member.nsa, fullName: member.name, email: member.email || "", role };
}

export function determineRole(angkatan: number, divisi: string): LocalMember["role"] | null {
  const d = divisi.trim().toLowerCase();
  if (angkatan === 32 && (d === "psdm" || d === "ketua" || d === "wakil ketua")) return "psdm";
  if (angkatan === 33 && d === "psdm") return "psdm_pemandu";
  if (angkatan === 33 && d !== "psdm") return "pemandu";
  return null;
}

export function getPemandusFromMembers(members: LocalMember[]): (LocalPemandu & { nsa: string })[] {
  return members
    .filter((m) => m.role === "pemandu" || m.role === "psdm_pemandu")
    .map((m) => ({
      id: parseInt(m.nsa.replace(/\D/g, "").slice(-4)) || 0,
      userId: 0,
      fullName: m.name,
      email: m.email || m.nsa,
      nsa: m.nsa,
      expertise: `${m.divisi} (Angkatan ${m.angkatan})`,
      maxMentees: 10,
      status: "active" as const,
    }));
}

export async function updateMember(nsa: string, updates: Partial<LocalMember>) {
  await sbUpdateMember(nsa, updates);
}

export function getLocations(): string[] {
  return DEFAULT_LOCATIONS;
}

export async function getMembers(): Promise<LocalMember[]> {
  // Always include pre-registered members from memory
  const base = PRE_REGISTERED_MEMBERS.map((m) => ({ ...m, isPreRegistered: true }));

  // Try to get additional members from Supabase
  try {
    const { data } = await supabase.from("members").select("*");
    if (data && data.length > 0) {
      const fromDb = data.map((m: any) => ({ ...toCamel(m), isPreRegistered: true }));
      // Merge: pre-registered + any extra from DB (avoid duplicates)
      const existingNsas = new Set(base.map((m) => m.nsa.toLowerCase()));
      return [...base, ...fromDb.filter((m: LocalMember) => !existingNsas.has(m.nsa.toLowerCase()))];
    }
  } catch { /* ignore, return pre-registered only */ }

  return base;
}

export async function getMemberByNSA(nsa: string): Promise<LocalMember | undefined> {
  // Always check in-memory pre-registered list first (never lost, works offline)
  const preReg = PRE_REGISTERED_MEMBERS.find((m) => m.nsa.toLowerCase() === nsa.toLowerCase());
  if (preReg) return { ...preReg, isPreRegistered: true };

  // Fallback: try Supabase for dynamically added members
  try {
    const { data } = await supabase.from("members").select("*").eq("nsa", nsa).single();
    if (data) return { ...toCamel(data), isPreRegistered: true };
  } catch { /* ignore */ }

  return undefined;
}

export async function seedMembers() {
  try {
    const { count } = await supabase.from("members").select("*", { count: "exact", head: true });
    if (count && count > 0) return;
    for (const m of PRE_REGISTERED_MEMBERS) {
      await sbAddMember(m);
    }
  } catch (e) {
    console.error("[seedMembers] Failed:", e);
  }
}

export function getPsdmMembers(members: LocalMember[]): LocalPemandu[] {
  return members
    .filter((m) => m.role === "psdm" || m.role === "psdm_pemandu")
    .map((m) => ({
      id: parseInt(m.nsa.replace(/\D/g, "").slice(-4)) || 0,
      userId: 0,
      fullName: m.name,
      email: m.email || m.nsa,
      expertise: `${m.divisi} (Angkatan ${m.angkatan})`,
      maxMentees: 10,
      status: "active" as const,
    }));
}

// ─── Main React Hook ──────────────────────────────────────────────
export function useLocalData() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // Data states
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [registrants, setRegistrants] = useState<LocalRegistrant[]>([]);
  const [activities, setActivities] = useState<LocalActivity[]>([]);
  const [kelompoks, setKelompoks] = useState<LocalKelompok[]>([]);
  const [kelompokAssignments, setKelompokAssignments] = useState<LocalKelompokAssignment[]>([]);
  const [pemanduAssignments, setPemanduAssignments] = useState<LocalPemanduAssignment[]>([]);
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);
  const [standalonePemandus, setStandalonePemandus] = useState<StandalonePemandu[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load all data from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setDbError(null);
        const [m, r, a, k, ka, pa, l, sp] = await Promise.all([
          sbGetMembers(),
          sbGetRegistrants(),
          sbGetActivities(),
          sbGetKelompoks(),
          sbGetKelompokAssignments(),
          sbGetPemanduAssignments(),
          sbGetLocations(),
          supabase.from("standalone_pemandus").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
        ]);
        if (cancelled) return;
        setMembers(m);
        setRegistrants(r);
        setActivities(a);
        setKelompoks(k);
        setKelompokAssignments(ka);
        setPemanduAssignments(pa);
        setLocations(l);
        setStandalonePemandus(sp);
      } catch (e: any) {
        console.error("[useLocalData] Failed to load data:", e?.message || e);
        if (!cancelled) setDbError(e?.message || "Gagal terhubung ke database");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [version]);

  // Seed members if empty
  useEffect(() => {
    if (members.length === 0 && !dbError) {
      seedMembers().catch((e) => {
        console.error("[seedMembers] Failed:", e?.message || e);
        setDbError("Gagal menyimpan data anggota");
      }).then(() => refresh());
    }
  }, [members.length, dbError]);

  // ─── CRUD Operations ────────────────────────────────────────────
  const addRegistrant = async (data: Omit<LocalRegistrant, "id" | "createdAt">) => {
    const result = await sbAddRegistrant(data);
    refresh();
    return result;
  };

  const addActivity = async (data: Omit<LocalActivity, "id" | "submittedAt">) => {
    const result = await sbAddActivity(data);
    refresh();
    return result;
  };

  const updateActivity = async (id: number, updates: Partial<LocalActivity>) => {
    await sbUpdateActivity(id, updates);
    refresh();
  };

  const deleteRegistrant = async (id: number) => {
    await sbDeleteRegistrant(id);
    refresh();
  };

  const assignRegistrantToKelompok = async (registrantId: number, kelompokId: number) => {
    await sbAssignToKelompok(registrantId, kelompokId);
    refresh();
  };

  const removeRegistrantFromKelompok = async (registrantId: number) => {
    await sbRemoveFromKelompok(registrantId);
    refresh();
  };

  const addKelompok = async (data: Omit<LocalKelompok, "id">) => {
    const result = await sbAddKelompok(data);
    refresh();
    return result;
  };

  const updateKelompok = async (id: number, updates: Partial<LocalKelompok>) => {
    await sbUpdateKelompok(id, updates);
    refresh();
  };

  const deleteKelompok = async (id: number) => {
    await sbDeleteKelompok(id);
    refresh();
  };

  const addLocation = async (name: string) => {
    await sbAddLocation(name);
    refresh();
  };

  const deleteLocation = async (name: string) => {
    await sbDeleteLocation(name);
    refresh();
  };

  // ─── Queries ────────────────────────────────────────────────────
  const memberPemandus = getPemandusFromMembers(members);
  const allPemandus = [...memberPemandus, ...standalonePemandus.map((p) => ({ ...p, status: "active" as const, userId: 0 }))];

  const getRegistrantByEmail = (email: string) => registrants.find((r) => r.email.toLowerCase() === email.toLowerCase());
  const getRegistrantById = (id: number) => registrants.find((r) => r.id === id);
  const getPemanduById = (id: number) => allPemandus.find((p) => p.id === id);
  const getKelompokForRegistrant = (registrantId: number) => kelompoks.find((k) => kelompokAssignments.some((ka) => ka.registrantId === registrantId && ka.kelompokId === k.id));
  const getPemandusForRegistrant = (registrantId: number) => {
    const k = getKelompokForRegistrant(registrantId);
    if (!k) return [];
    return allPemandus.filter((p) => k.pemanduIds.includes(p.id));
  };
  const getKelompokNameForRegistrant = (registrantId: number) => getKelompokForRegistrant(registrantId)?.name || "Belum ditugaskan";
  const getActivitiesByRegistrant = (registrantId: number) => activities.filter((a) => a.registrantId === registrantId);
  const getCUFOByPemandu = (pemanduId: number) => {
    const pemanduKelompoks = kelompoks.filter((k) => k.pemanduIds.includes(pemanduId));
    const kelompokIds = pemanduKelompoks.map((k) => k.id);
    return kelompokAssignments
      .filter((ka) => kelompokIds.includes(ka.kelompokId))
      .map((ka) => {
        const reg = registrants.find((r) => r.id === ka.registrantId);
        return reg ? { registrantId: reg.id, registrantName: reg.fullName, registrantEmail: reg.email, registrantYear: reg.year, registrantMajor: reg.major } : null;
      })
      .filter(Boolean);
  };
  const getPointSummary = (registrantId: number) => {
    const acts = getActivitiesByRegistrant(registrantId);
    return {
      total: acts.filter((a) => a.status === "verified").reduce((s, a) => s + a.points, 0),
      verified: acts.filter((a) => a.status === "verified").reduce,
      pending: acts.filter((a) => a.status === "pending").length,
      rejected: acts.filter((a) => a.status === "rejected").length,
      count: acts.reduce,
    };
  };

  return {
    version,
    refresh,
    dbError,
    // Data arrays
    registrants,
    activities,
    members,
    pemandus: allPemandus,
    kelompoks,
    kelompokAssignments,
    pemanduAssignments,
    locations,
    activityTypes: ACTIVITY_TYPES,
    verifiedMembers: members.filter((m) => m.isPreRegistered),
    // CRUD
    addRegistrant,
    addActivity,
    updateActivity,
    deleteRegistrant,
    assignRegistrantToKelompok,
    removeRegistrantFromKelompok,
    addKelompok,
    updateKelompok,
    deleteKelompok,
    addLocation,
    deleteLocation,
    // Pemandu CRUD
    addPemandu,
    updatePemandu,
    deletePemandu,
    // Verified member CRUD
    addVerifiedMember,
    updateVerifiedMember,
    deleteVerifiedMember,
    // Queries
    getRegistrantByEmail,
    getRegistrantById,
    getMemberByNSA: getMemberByNSA,
    getPemanduById,
    getKelompokForRegistrant,
    getPemandusForRegistrant,
    getKelompokNameForRegistrant,
    getCUFOByPemandu,
    getActivitiesByRegistrant,
    getPointSummary,
  };
}
