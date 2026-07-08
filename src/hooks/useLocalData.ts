import { useState, useEffect, useCallback } from "react";
import { supabase, IS_LIVE, toCamel } from "@/lib/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────
export interface LocalRegistrant {
  id: number;
  fullName: string;
  email: string;
  year: string;
  major: string;
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

// ─── Activity Types (static, never changes) ───────────────────────
export const ACTIVITY_TYPES = [
  { id: 1, name: "Rapat Koordinasi", category: "Rapat", points: 5, description: "Rapat koordinasi internal" },
  { id: 2, name: "Diklat Dasar Fotografi", category: "Diklat", points: 25, description: "Diklat dasar fotografi (Diksar)" },
  { id: 3, name: "Workshop Fotografi", category: "Diklat", points: 20, description: "Workshop fotografi tematik" },
  { id: 4, name: "Hunting Fotografi", category: "Hunting", points: 15, description: "Kegiatan hunting foto bersama" },
  { id: 5, name: "Pameran Fotografi", category: "Pameran", points: 20, description: "Pameran hasil karya foto" },
  { id: 6, name: "Dokumentasi Event", category: "Dokumentasi", points: 15, description: "Dokumentasi kegiatan/event" },
  { id: 7, name: "Editing Foto", category: "Editing", points: 10, description: "Kegiatan editing foto" },
  { id: 8, name: "Review Karya", category: "Review", points: 10, description: "Review dan kritik karya foto" },
  { id: 9, name: "Lomba Fotografi", category: "Lomba", points: 25, description: "Mengikuti lomba fotografi" },
  { id: 10, name: "Menjadi Juara Lomba", category: "Prestasi", points: 30, description: "Juara lomba fotografi" },
  { id: 11, name: "Pembuatan Konten", category: "Konten", points: 10, description: "Pembuatan konten media sosial" },
  { id: 12, name: "Mentoring", category: "Mentoring", points: 15, description: "Mentoring fotografi" },
  { id: 13, name: "Studi Banding", category: "Studi", points: 15, description: "Studi banding ke komunitas foto lain" },
  { id: 14, name: "Publikasi Karya", category: "Publikasi", points: 20, description: "Publikasi karya di media" },
  { id: 15, name: "Exhibition", category: "Pameran", points: 25, description: "Pameran individu/kelompok" },
  { id: 16, name: "Outdoor Activity", category: "Outdoor", points: 15, description: "Kegiatan fotografi outdoor" },
  { id: 17, name: "Indoor Activity", category: "Indoor", points: 10, description: "Kegiatan fotografi indoor" },
  { id: 18, name: "Community Service", category: "Sosial", points: 20, description: "Pengabdian masyarakat" },
  { id: 19, name: "Guest Lecture", category: "Diklat", points: 20, description: "Kuliah tamu/pembicara" },
  { id: 20, name: "Photo Walk", category: "Hunting", points: 10, description: "Photo walk keliling kota" },
  { id: 21, name: "Portfolio Review", category: "Review", points: 15, description: "Review portofolio" },
  { id: 22, name: "Technical Skill", category: "Teknis", points: 10, description: "Pelatihan skill teknis" },
  { id: 23, name: "Creative Project", category: "Kreatif", points: 20, description: "Proyek kreatif fotografi" },
  { id: 24, name: "Team Building", category: "Team", points: 10, description: "Kegiatan team building" },
];

// ─── localStorage Fallback Helpers ────────────────────────────────
const LS_PREFIX = "ukm_";
function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, val: any) {
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
}
let nextId = 100;
function genId(): number { return nextId++; }

// ─── Supabase CRUD Helpers ────────────────────────────────────────
async function sbGetMembers(): Promise<LocalMember[]> {
  if (!IS_LIVE) return lsGet<LocalMember[]>("members", []);
  const { data } = await supabase.from("members").select("*");
  return (data || []).map((m: any) => ({ ...toCamel(m), isPreRegistered: true }));
}

async function sbGetRegistrants(): Promise<LocalRegistrant[]> {
  if (!IS_LIVE) return lsGet<LocalRegistrant[]>("registrants", []);
  const { data } = await supabase.from("registrants").select("*").order("id", { ascending: true });
  return (data || []).map((r: any) => toCamel(r));
}

async function sbGetActivities(): Promise<LocalActivity[]> {
  if (!IS_LIVE) return lsGet<LocalActivity[]>("activities", []);
  const { data } = await supabase.from("activities").select("*").order("id", { ascending: true });
  return (data || []).map((a: any) => toCamel(a));
}

async function sbGetKelompoks(): Promise<LocalKelompok[]> {
  if (!IS_LIVE) return lsGet<LocalKelompok[]>("kelompoks", []);
  const { data } = await supabase.from("kelompoks").select("*");
  return (data || []).map((k: any) => toCamel(k));
}

async function sbGetKelompokAssignments(): Promise<LocalKelompokAssignment[]> {
  if (!IS_LIVE) return lsGet<LocalKelompokAssignment[]>("kelompokAssignments", []);
  const { data } = await supabase.from("kelompok_assignments").select("*");
  return (data || []).map((ka: any) => toCamel(ka));
}

async function sbGetPemanduAssignments(): Promise<LocalPemanduAssignment[]> {
  if (!IS_LIVE) return lsGet<LocalPemanduAssignment[]>("assignments", []);
  const { data } = await supabase.from("pemandu_assignments").select("*");
  return (data || []).map((a: any) => toCamel(a));
}

async function sbGetFreeUsers(): Promise<any[]> {
  if (!IS_LIVE) return lsGet<any[]>("free_users", []);
  const { data } = await supabase.from("free_users").select("*");
  return (data || []).map((u: any) => toCamel(u));
}

// ─── Write Operations ─────────────────────────────────────────────
async function sbAddRegistrant(r: Omit<LocalRegistrant, "id" | "createdAt">): Promise<LocalRegistrant> {
  const now = new Date().toISOString();
  if (!IS_LIVE) {
    const all = lsGet<LocalRegistrant[]>("registrants", []);
    const item: LocalRegistrant = { id: genId(), ...r, createdAt: now };
    lsSet("registrants", [...all, item]);
    return item;
  }
  const { data, error } = await supabase.from("registrants").insert([{ ...r, created_at: now }]).select().single();
  if (error) throw error;
  return toCamel(data);
}

async function sbAddActivity(a: Omit<LocalActivity, "id" | "submittedAt">): Promise<LocalActivity> {
  const now = new Date().toISOString();
  if (!IS_LIVE) {
    const all = lsGet<LocalActivity[]>("activities", []);
    const item: LocalActivity = { id: genId(), ...a, submittedAt: now };
    lsSet("activities", [...all, item]);
    return item;
  }
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
  if (!IS_LIVE) {
    const all = lsGet<LocalActivity[]>("activities", []);
    const updated = all.map((a) => a.id === id ? { ...a, ...updates } : a);
    lsSet("activities", updated);
    return;
  }
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.verifiedBy !== undefined) payload.verified_by = updates.verifiedBy;
  if (updates.verifiedAt !== undefined) payload.verified_at = updates.verifiedAt;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  await supabase.from("activities").update(payload).eq("id", id);
}

async function sbDeleteRegistrant(id: number) {
  if (!IS_LIVE) {
    lsSet("registrants", lsGet<LocalRegistrant[]>("registrants", []).filter((r) => r.id !== id));
    lsSet("activities", lsGet<LocalActivity[]>("activities", []).filter((a) => a.registrantId !== id));
    return;
  }
  await supabase.from("registrants").delete().eq("id", id);
  await supabase.from("activities").delete().eq("registrant_id", id);
  await supabase.from("kelompok_assignments").delete().eq("registrant_id", id);
  await supabase.from("pemandu_assignments").delete().eq("registrant_id", id);
}

async function sbAssignToKelompok(registrantId: number, kelompokId: number) {
  const now = new Date().toISOString();
  if (!IS_LIVE) {
    // Remove old
    const kas = lsGet<LocalKelompokAssignment[]>("kelompokAssignments", []).filter((a) => a.registrantId !== registrantId);
    const pas = lsGet<LocalPemanduAssignment[]>("assignments", []).filter((a) => a.registrantId !== registrantId);
    // Add new kelompok assignment
    const newKa: LocalKelompokAssignment = { id: genId(), kelompokId, registrantId, assignedAt: now };
    lsSet("kelompokAssignments", [...kas, newKa]);
    // Add pemandu assignments from kelompok
    const kelompoks = lsGet<LocalKelompok[]>("kelompoks", []);
    const k = kelompoks.find((kk) => kk.id === kelompokId);
    if (k) {
      const newPas = k.pemanduIds.map((pid) => ({ id: genId(), pemanduId: pid, registrantId, assignedAt: now }));
      lsSet("assignments", [...pas, ...newPas]);
    }
    return;
  }
  // Remove old assignments
  await supabase.from("kelompok_assignments").delete().eq("registrant_id", registrantId);
  await supabase.from("pemandu_assignments").delete().eq("registrant_id", registrantId);
  // Add new kelompok assignment
  await supabase.from("kelompok_assignments").insert([{ kelompok_id: kelompokId, registrant_id: registrantId, assigned_at: now }]);
  // Get kelompok pemandus and add assignments
  const { data: kData } = await supabase.from("kelompoks").select("pemandu_ids").eq("id", kelompokId).single();
  if (kData?.pemandu_ids) {
    const newPas = kData.pemandu_ids.map((pid: number) => ({
      pemandu_id: pid,
      registrant_id: registrantId,
      assigned_at: now,
    }));
    await supabase.from("pemandu_assignments").insert(newPas);
  }
}

async function sbRemoveFromKelompok(registrantId: number) {
  if (!IS_LIVE) {
    lsSet("kelompokAssignments", lsGet<LocalKelompokAssignment[]>("kelompokAssignments", []).filter((a) => a.registrantId !== registrantId));
    lsSet("assignments", lsGet<LocalPemanduAssignment[]>("assignments", []).filter((a) => a.registrantId !== registrantId));
    return;
  }
  await supabase.from("kelompok_assignments").delete().eq("registrant_id", registrantId);
  await supabase.from("pemandu_assignments").delete().eq("registrant_id", registrantId);
}

async function sbAddKelompok(k: Omit<LocalKelompok, "id">): Promise<LocalKelompok> {
  if (!IS_LIVE) {
    const all = lsGet<LocalKelompok[]>("kelompoks", []);
    const item: LocalKelompok = { id: genId(), ...k };
    lsSet("kelompoks", [...all, item]);
    return item;
  }
  const { data, error } = await supabase.from("kelompoks").insert([{ name: k.name, pemandu_ids: k.pemanduIds }]).select().single();
  if (error) throw error;
  return toCamel(data);
}

async function sbUpdateKelompok(id: number, updates: Partial<LocalKelompok>) {
  if (!IS_LIVE) {
    const all = lsGet<LocalKelompok[]>("kelompoks", []);
    lsSet("kelompoks", all.map((k) => k.id === id ? { ...k, ...updates } : k));
    return;
  }
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.pemanduIds !== undefined) payload.pemandu_ids = updates.pemanduIds;
  await supabase.from("kelompoks").update(payload).eq("id", id);
}

async function sbDeleteKelompok(id: number) {
  if (!IS_LIVE) {
    lsSet("kelompoks", lsGet<LocalKelompok[]>("kelompoks", []).filter((k) => k.id !== id));
    lsSet("kelompokAssignments", lsGet<LocalKelompokAssignment[]>("kelompokAssignments", []).filter((a) => a.kelompokId !== id));
    return;
  }
  await supabase.from("kelompok_assignments").delete().eq("kelompok_id", id);
  await supabase.from("pemandu_assignments").delete().eq("kelompok_id", id);
  await supabase.from("kelompoks").delete().eq("id", id);
}

// ─── Standalone Pemandu CRUD (admin-managed, separate from members) ──
interface StandalonePemandu {
  id: number;
  fullName: string;
  email: string;
  expertise: string;
  maxMentees: number;
  createdAt: string;
}
function getStandalonePemandus(): StandalonePemandu[] {
  return lsGet<StandalonePemandu[]>("standalone_pemandus", []);
}
function setStandalonePemandus(list: StandalonePemandu[]) {
  lsSet("standalone_pemandus", list);
}
export async function addPemandu(data: { userId: number; fullName: string; email: string; expertise: string; maxMentees: number }) {
  const item: StandalonePemandu = { id: genId(), fullName: data.fullName, email: data.email, expertise: data.expertise, maxMentees: data.maxMentees, createdAt: new Date().toISOString() };
  setStandalonePemandus([...getStandalonePemandus(), item]);
}
export async function updatePemandu(id: number, updates: Partial<StandalonePemandu>) {
  setStandalonePemandus(getStandalonePemandus().map((p) => p.id === id ? { ...p, ...updates } : p));
}
export async function deletePemandu(id: number) {
  setStandalonePemandus(getStandalonePemandus().filter((p) => p.id !== id));
}

// ─── Verified Member CRUD (admin-managed overrides to PRE_REGISTERED) ──
function getVerifiedMemberOverrides(): { added: LocalMember[]; removed: string[] } {
  return lsGet("verified_overrides", { added: [], removed: [] });
}
function setVerifiedMemberOverrides(o: { added: LocalMember[]; removed: string[] }) {
  lsSet("verified_overrides", o);
}
export function getVerifiedMembers(): LocalMember[] {
  const overrides = getVerifiedMemberOverrides();
  const base = getMembers();
  const withRemoved = base.filter((m) => !overrides.removed.includes(m.nsa));
  return [...withRemoved, ...overrides.added];
}
export async function addVerifiedMember(data: { serialNumber: string; fullName: string; email: string; role: "pemandu" | "psdm" }) {
  const all = getMembers();
  if (all.some((m) => m.nsa === data.serialNumber)) throw new Error("Nomor seri sudah terdaftar");
  const overrides = getVerifiedMemberOverrides();
  const newMember: LocalMember = { nsa: data.serialNumber, name: data.fullName, angkatan: 0, divisi: "", role: data.role, password: "123456", email: data.email, isPreRegistered: true };
  overrides.added.push(newMember);
  setVerifiedMemberOverrides(overrides);
  // Also add to members list
  lsSet("members", [...all, newMember]);
}
export async function updateVerifiedMember(serialNumber: string, updates: { serialNumber: string; fullName: string; email: string; role: "pemandu" | "psdm" }) {
  // Update in members list
  const all = getMembers();
  const updated = all.map((m) => m.nsa === serialNumber ? { ...m, nsa: updates.serialNumber, name: updates.fullName, email: updates.email, role: updates.role } : m);
  lsSet("members", updated);
  // Update in overrides if it's an added member
  const overrides = getVerifiedMemberOverrides();
  overrides.added = overrides.added.map((m) => m.nsa === serialNumber ? { ...m, nsa: updates.serialNumber, name: updates.fullName, email: updates.email, role: updates.role } : m);
  setVerifiedMemberOverrides(overrides);
}
export async function deleteVerifiedMember(serialNumber: string) {
  const overrides = getVerifiedMemberOverrides();
  overrides.removed.push(serialNumber);
  overrides.added = overrides.added.filter((m) => m.nsa !== serialNumber);
  setVerifiedMemberOverrides(overrides);
  // Also remove from members list
  const all = getMembers();
  lsSet("members", all.filter((m) => m.nsa !== serialNumber));
}

async function sbAddMember(m: Omit<LocalMember, "isPreRegistered">): Promise<void> {
  if (!IS_LIVE) {
    const all = lsGet<LocalMember[]>("members", []);
    lsSet("members", [...all, { ...m, isPreRegistered: true }]);
    return;
  }
  await supabase.from("members").insert([{ nsa: m.nsa, name: m.name, angkatan: m.angkatan, divisi: m.divisi, role: m.role, password: m.password, email: m.email }]);
}

async function sbUpdateMember(nsa: string, updates: Partial<LocalMember>) {
  if (!IS_LIVE) {
    const all = lsGet<LocalMember[]>("members", []);
    lsSet("members", all.map((m) => m.nsa === nsa ? { ...m, ...updates } : m));
    return;
  }
  const payload: any = {};
  if (updates.password !== undefined) payload.password = updates.password;
  if (updates.email !== undefined) payload.email = updates.email;
  await supabase.from("members").update(payload).eq("nsa", nsa);
}

async function sbAddLocation(name: string) {
  if (!IS_LIVE) {
    const all = lsGet<string[]>("locations", DEFAULT_LOCATIONS);
    if (!all.includes(name)) lsSet("locations", [...all, name]);
    return;
  }
  await supabase.from("locations").insert([{ name }]).select();
}

async function sbDeleteLocation(name: string) {
  if (!IS_LIVE) {
    lsSet("locations", lsGet<string[]>("locations", DEFAULT_LOCATIONS).filter((l) => l !== name));
    return;
  }
  await supabase.from("locations").delete().eq("name", name);
}

async function sbGetLocations(): Promise<string[]> {
  if (!IS_LIVE) return lsGet<string[]>("locations", DEFAULT_LOCATIONS);
  const { data } = await supabase.from("locations").select("name");
  if (!data || data.length === 0) return DEFAULT_LOCATIONS;
  return data.map((d: any) => d.name);
}

// ─── Seed Members ─────────────────────────────────────────────────
const PSDM_PIN = "UFOADMIN2024";

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
  "Sekretariat UFO UGM","Sekretariat Bersama N58 UGM","Auditorium FMIPA UGM",
  "Grha Sabha Pramana UGM","Balairung UGM","Perpustakaan Pusat UGM",
  "Museum UGM","Taman Budaya Yogyakarta","Jogja National Museum",
  "Galeri Nasional Indonesia Yogyakarta","Taman Sari Yogyakarta",
  "Candi Prambanan","Candi Borobudur","Malioboro",
  "Taman Pelangi Jogja","Lapangan Pancasila UGM","Gelanggang Mahasiswa UGM",
];

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
      id: parseInt(m.nsa.replace(/\D/g, "").slice(-4)) || genId(),
      userId: 0,
      fullName: m.name,
      email: m.email || m.nsa,
      nsa: m.nsa,
      expertise: `${m.divisi} (Angkatan ${m.angkatan})`,
      maxMentees: 10,
      status: "active" as const,
    }));
}

export function updateMember(nsa: string, updates: Partial<LocalMember>) {
  const all = getMembers();
  lsSet("members", all.map((m) => m.nsa === nsa ? { ...m, ...updates } : m));
}

export function getLocations(): string[] {
  return lsGet<string[]>("locations", DEFAULT_LOCATIONS);
}

export function getMembers(): LocalMember[] {
  return lsGet<LocalMember[]>("members", []);
}

export function getMemberByNSA(nsa: string): LocalMember | undefined {
  return getMembers().find((m) => m.nsa.toLowerCase() === nsa.toLowerCase());
}

export function seedMembers() {
  const existing = getMembers();
  if (existing.length > 0) return;
  const members: LocalMember[] = PRE_REGISTERED_MEMBERS.map((m) => ({ ...m, isPreRegistered: true }));
  lsSet("members", members);
}

export function getPsdmMembers(members: LocalMember[]): LocalPemandu[] {
  return members
    .filter((m) => m.role === "psdm" || m.role === "psdm_pemandu")
    .map((m) => ({
      id: parseInt(m.nsa.replace(/\D/g, "").slice(-4)) || genId(),
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

  // Load all data from Supabase (or localStorage fallback)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [m, r, a, k, ka, pa, l] = await Promise.all([
        sbGetMembers(),
        sbGetRegistrants(),
        sbGetActivities(),
        sbGetKelompoks(),
        sbGetKelompokAssignments(),
        sbGetPemanduAssignments(),
        sbGetLocations(),
      ]);
      if (cancelled) return;
      setMembers(m);
      setRegistrants(r);
      setActivities(a);
      setKelompoks(k);
      setKelompokAssignments(ka);
      setPemanduAssignments(pa);
      setLocations(l);
    }
    load();
    return () => { cancelled = true; };
  }, [version]);

  // Seed members if empty
  useEffect(() => {
    if (members.length === 0) {
      (async () => {
        // Try to seed from pre-registered list
        for (const member of PRE_REGISTERED_MEMBERS) {
          await sbAddMember(member);
        }
        refresh();
      })();
    }
  }, [members.length]);

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

  const updateMember = async (nsa: string, updates: Partial<LocalMember>) => {
    await sbUpdateMember(nsa, updates);
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
  const getRegistrantByEmail = (email: string) => registrants.find((r) => r.email.toLowerCase() === email.toLowerCase());
  const getRegistrantById = (id: number) => registrants.find((r) => r.id === id);
  const getMemberByNSA = (nsa: string) => members.find((m) => m.nsa.toLowerCase() === nsa.toLowerCase());
  const allPemandus = [...getPemandusFromMembers(members), ...getStandalonePemandus().map((p) => ({ ...p, status: "active" as const, userId: 0 }))];
  const getPemanduById = (id: number) => allPemandus.find((p) => p.id === id);
  const getKelompokForRegistrant = (registrantId: number) => kelompoks.find((k) => kelompokAssignments.some((ka) => ka.registrantId === registrantId && ka.kelompokId === k.id));
  const getPemandusForRegistrant = (registrantId: number) => {
    const k = getKelompokForRegistrant(registrantId);
    if (!k) return [];
    return allPemandus.filter((p) => k.pemanduIds.includes(p.id));
  };
  const getKelompokNameForRegistrant = (registrantId: number) => getKelompokForRegistrant(registrantId)?.name || "Belum ditugaskan";
  const getCUFOByPemandu = (pemanduId: number) => {
    // Find kelompoks where this pemandu is assigned
    const pemanduKelompoks = kelompoks.filter((k) => k.pemanduIds.includes(pemanduId));
    const kelompokIds = pemanduKelompoks.map((k) => k.id);
    // Find all registrants in those kelompoks
    return kelompokAssignments
      .filter((ka) => kelompokIds.includes(ka.kelompokId))
      .map((ka) => {
        const reg = registrants.find((r) => r.id === ka.registrantId);
        return reg ? { registrantId: reg.id, registrantName: reg.fullName, registrantEmail: reg.email, registrantYear: reg.year, registrantMajor: reg.major } : null;
      })
      .filter(Boolean);
  };
  const getActivitiesByRegistrant = (registrantId: number) => activities.filter((a) => a.registrantId === registrantId);
  const getPointSummary = (registrantId: number) => {
    const acts = getActivitiesByRegistrant(registrantId);
    return {
      total: acts.filter((a) => a.status === "verified").reduce((s, a) => s + a.points, 0),
      verified: acts.filter((a) => a.status === "verified").length,
      pending: acts.filter((a) => a.status === "pending").length,
      rejected: acts.filter((a) => a.status === "rejected").length,
      count: acts.length,
    };
  };

  return {
    version,
    refresh,
    // Data arrays
    registrants,
    activities,
    members,
    pemandus: [...getPemandusFromMembers(members), ...getStandalonePemandus().map((p) => ({ ...p, status: "active" as const, userId: 0 }))],
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
    updateMember,
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
    getMemberByNSA,
    getPemanduById,
    getKelompokForRegistrant,
    getPemandusForRegistrant,
    getKelompokNameForRegistrant,
    getCUFOByPemandu,
    getActivitiesByRegistrant,
    getPointSummary,
  };
}
