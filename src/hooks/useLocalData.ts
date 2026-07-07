import { useState, useCallback, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────
export interface LocalRegistrant {
  id: number;
  fullName: string;
  email: string;
  year: string;
  major: string;
  faculty?: string;
  phone?: string;
  status: "active" | "inactive" | "graduated";
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
/** @deprecated Use LocalPemandu */
export type LocalMentor = LocalPemandu;

export interface LocalActivity {
  id: number;
  registrantId: number;
  activityTypeId: number;
  activityName: string;
  activityDate: string;
  activityDateEnd?: string;
  role?: string;
  location: string;
  documentationUrl?: string;
  documentationImages?: string[]; // base64 images
  points: number;
  status: "pending" | "verified" | "rejected";
  notes?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: number;
}

export interface LocalPemanduAssignment {
  id: number;
  pemanduId: number;
  registrantId: number;
  assignedAt: string;
}
/** @deprecated Use LocalPemanduAssignment */
export type LocalMentorAssignment = LocalPemanduAssignment;

// ─── Kelompok (Group) Model ──────────────────────────────────────
export interface LocalKelompok {
  id: number;
  name: string; // e.g. "Kelompok 1"
  pemanduIds: number[]; // exactly 2 pemandus
}

export interface LocalKelompokAssignment {
  id: number;
  kelompokId: number;
  registrantId: number;
  assignedAt: string;
}

// ─── Member (Anggota) Model ──────────────────────────────────────
export interface LocalMember {
  nsa: string;          // Nomor Seri Anggota = username
  name: string;
  angkatan: number;
  divisi: string;
  role: "psdm" | "pemandu" | "psdm_pemandu" | "user";
  password: string;
  email?: string;       // optional, for free signup
  isPreRegistered: boolean;
}

// ─── Keys ─────────────────────────────────────────────────────────
const KEYS = {
  registrants: "ukm_registrants",
  mentors: "ukm_mentors",
  activities: "ukm_activities",
  assignments: "ukm_assignments",
  activityTypes: "ukm_activity_types",
  verifiedMembers: "ukm_verified_members",
  locations: "ukm_locations",
  kelompoks: "ukm_kelompoks",
  kelompokAssignments: "ukm_kelompok_assignments",
  members: "ukm_members",
};

// ─── Helpers ──────────────────────────────────────────────────────
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

let nextId = (() => {
  const existing = [
    ...getItem<LocalRegistrant[]>(KEYS.registrants, []),
    ...getItem<LocalMentor[]>(KEYS.mentors, []),
    ...getItem<LocalActivity[]>(KEYS.activities, []),
    ...getItem<LocalMentorAssignment[]>(KEYS.assignments, []),
    ...getItem<LocalKelompok[]>(KEYS.kelompoks, []),
    ...getItem<LocalKelompokAssignment[]>(KEYS.kelompokAssignments, []),
  ];
  return existing.length > 0 ? Math.max(...existing.map((e) => e.id)) + 1 : 100;
})();

function genId() {
  return nextId++;
}

// ─── Activity Type Seed Data ─────────────────────────────────────
export const ACTIVITY_TYPES = [
  { id: 1, number: 1, name: "Diksar", points: 25, requiresRole: "no" },
  { id: 2, number: 2, name: "Pameris Pameran Dikjut", points: 20, requiresRole: "no" },
  { id: 3, number: 3, name: "Panitia Pameran Dikjut", points: 20, requiresRole: "yes" },
  { id: 4, number: 4, name: "Piket Sekre Akbar", points: 10, requiresRole: "no" },
  { id: 5, number: 5, name: "Diklat Wajib & Umum", points: 10, requiresRole: "no" },
  { id: 6, number: 6, name: "Ketua Kelas Pameran Pra Pelantikan", points: 5, requiresRole: "yes" },
  { id: 7, number: 7, name: "Event Hunting", points: 10, requiresRole: "no" },
  { id: 8, number: 8, name: "Piket Sekre", points: 10, requiresRole: "no" },
  { id: 9, number: 9, name: "Ikut Presentasi Karya Pameris (Pra-pel)", points: 3, requiresRole: "no" },
  { id: 10, number: 10, name: "Menjadi Divisi DDD di kepanitiaan", points: 5, requiresRole: "yes" },
  { id: 11, number: 11, name: "Memenangkan Lomba Fotografi/Videografi", points: 10, requiresRole: "no" },
  { id: 12, number: 12, name: "Mengikuti Lomba Fotografi/Videografi", points: 2, requiresRole: "no" },
  { id: 13, number: 13, name: "Submit Karya untuk pameran", points: 3, requiresRole: "no" },
  { id: 14, number: 14, name: "Membantu dokumentasi UKM/komunitas di UGM", points: 3, requiresRole: "no" },
  { id: 15, number: 15, name: "Berpartisipasi Dalam Kegiatan HUT UFO", points: 2, requiresRole: "no" },
  { id: 16, number: 16, name: "Kurasi Pameran", points: 3, requiresRole: "no" },
  { id: 17, number: 17, name: "Hunting individu", points: 2, requiresRole: "no" },
  { id: 18, number: 18, name: "Hunting bareng UFO/CUFO (min. 3 orang)", points: 5, requiresRole: "no" },
  { id: 19, number: 19, name: "Main ke Sekre UFO (min. 2 jam)", points: 2, requiresRole: "no" },
  { id: 20, number: 20, name: "Mengikuti Workshop/Seminar Fotografi/Videografi", points: 5, requiresRole: "no" },
  { id: 21, number: 21, name: "Mengunjungi Pameran", points: 2, requiresRole: "no" },
  { id: 22, number: 22, name: "Mengunjungi Pameran bersama UFO/CUFO", points: 5, requiresRole: "no" },
  { id: 23, number: 23, name: "Mengikuti One Week Challenge (poin per hari)", points: 1, requiresRole: "no" },
  { id: 24, number: 24, name: "Kegiatan lain sesuai kebijakan Ketua UFO", points: 0, requiresRole: "no" },
];

// ─── Demo Data Seeder ────────────────────────────────────────────
export function seedDemoData() {
  if (localStorage.getItem("ukm_seeded") === "1") return;

  // Registrants (10 calon anggota)
  const registrants: LocalRegistrant[] = [
    { id: genId(), fullName: "Ahmad Rizky Pratama", email: "ahmad.rizky@mail.ugm.ac.id", year: "2024", major: "Teknik Informatika", faculty: "FT", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Siti Nurhaliza Putri", email: "siti.nurhaliza@mail.ugm.ac.id", year: "2024", major: "Ilmu Komunikasi", faculty: "FISIPOL", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Bima Sakti Wijaya", email: "bima.sakti@mail.ugm.ac.id", year: "2024", major: "Desain Komunikasi Visual", faculty: "FIB", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Dewi Kusuma Wardani", email: "dewi.kusuma@mail.ugm.ac.id", year: "2024", major: "Arsitektur", faculty: "FT", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Fajar Adi Nugroho", email: "fajar.adi@mail.ugm.ac.id", year: "2024", major: "Teknik Mesin", faculty: "FT", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Gita Maharani Sari", email: "gita.maharani@mail.ugm.ac.id", year: "2024", major: "Manajemen", faculty: "FEB", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Hendra Wijaya Kusuma", email: "hendra.wijaya@mail.ugm.ac.id", year: "2024", major: "Hukum", faculty: "FH", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Intan Permata Hati", email: "intan.permata@mail.ugm.ac.id", year: "2024", major: "Psikologi", faculty: "FIP", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Joko Santoso", email: "joko.santoso@mail.ugm.ac.id", year: "2024", major: "Teknik Elektro", faculty: "FT", status: "active", createdAt: new Date().toISOString() },
    { id: genId(), fullName: "Kartika Sari Dewi", email: "kartika.sari@mail.ugm.ac.id", year: "2024", major: "Farmasi", faculty: "FAPET", status: "active", createdAt: new Date().toISOString() },
  ];
  setItem(KEYS.registrants, registrants);

  // Pemandu (2 pemandu)
  const pemandus: LocalPemandu[] = [
    { id: genId(), userId: 9001, fullName: "Dr. Budi Santoso, M.Sn.", email: "budi.santoso@ugm.ac.id", expertise: "Fotografi Jurnalistik", maxMentees: 10, status: "active" },
    { id: genId(), userId: 9002, fullName: "Rina Amelia, M.Ds.", email: "rina.amelia@ugm.ac.id", expertise: "Fotografi Komersial", maxMentees: 10, status: "active" },
  ];
  setItem(KEYS.mentors, pemandus);

  // Kelompok (1 kelompok with both pemandus)
  const kelompoks: LocalKelompok[] = [
    { id: genId(), name: "Kelompok 1", pemanduIds: [pemandus[0].id, pemandus[1].id] },
  ];
  setItem(KEYS.kelompoks, kelompoks);

  // Kelompok assignments (all 10 registrants to kelompok 1)
  const kelompokAssignments: LocalKelompokAssignment[] = [
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[0].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[1].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[2].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[3].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[4].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[5].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[6].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[7].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[8].id, assignedAt: new Date().toISOString() },
    { id: genId(), kelompokId: kelompoks[0].id, registrantId: registrants[9].id, assignedAt: new Date().toISOString() },
  ];
  setItem(KEYS.kelompokAssignments, kelompokAssignments);

  // Pemandu assignments (each registrant gets both pemandus via kelompok)
  const assignments: LocalPemanduAssignment[] = [];
  registrants.forEach((reg) => {
    pemandus.forEach((p) => {
      assignments.push({
        id: genId(),
        pemanduId: p.id,
        registrantId: reg.id,
        assignedAt: new Date().toISOString(),
      });
    });
  });
  setItem(KEYS.assignments, assignments);

  // Activities (mix of verified and pending for each registrant)
  const activities: LocalActivity[] = [
    // Ahmad Rizky (reg 1)
    { id: genId(), registrantId: registrants[0].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T08:00:00Z", verifiedAt: "2024-08-17T10:00:00Z" },
    { id: genId(), registrantId: registrants[0].id, activityTypeId: 7, activityName: "Event Hunting Bulan Agustus", activityDate: "2024-09-05", location: "Taman Sari", points: 10, status: "verified", submittedAt: "2024-09-06T09:00:00Z", verifiedAt: "2024-09-07T11:00:00Z" },
    { id: genId(), registrantId: registrants[0].id, activityTypeId: 8, activityName: "Piket Sekre Minggu 1", activityDate: "2024-09-10", location: "Sekretariat UFO", points: 10, status: "pending", submittedAt: "2024-09-11T07:30:00Z" },
    { id: genId(), registrantId: registrants[0].id, activityTypeId: 17, activityName: "Hunting Individu - Malioboro", activityDate: "2024-09-12", location: "Jalan Malioboro", points: 2, status: "verified", submittedAt: "2024-09-13T14:00:00Z", verifiedAt: "2024-09-14T09:00:00Z" },
    { id: genId(), registrantId: registrants[0].id, activityTypeId: 20, activityName: "Workshop Fotografi Dasar FKH", activityDate: "2024-09-20", location: "Auditorium FKH", points: 5, status: "pending", submittedAt: "2024-09-21T10:00:00Z" },
    { id: genId(), registrantId: registrants[0].id, activityTypeId: 11, activityName: "Juara 1 Lomba Fotografi UGM Fair", activityDate: "2024-10-01", location: "Grha Sabha Pramana", points: 10, status: "verified", submittedAt: "2024-10-02T08:00:00Z", verifiedAt: "2024-10-03T12:00:00Z" },

    // Siti Nurhaliza (reg 2)
    { id: genId(), registrantId: registrants[1].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T08:30:00Z", verifiedAt: "2024-08-17T10:30:00Z" },
    { id: genId(), registrantId: registrants[1].id, activityTypeId: 21, activityName: "Mengunjungi Pameran Fotografi Jakarta", activityDate: "2024-09-08", location: "Galeri Nasional Jakarta", points: 2, status: "verified", submittedAt: "2024-09-09T15:00:00Z", verifiedAt: "2024-09-10T08:00:00Z" },
    { id: genId(), registrantId: registrants[1].id, activityTypeId: 3, activityName: "Panitia Pameran Dikjut 2024", activityDate: "2024-09-25", location: "Taman Budaya Yogyakarta", role: "Ketua Panitia", points: 20, status: "pending", submittedAt: "2024-09-26T09:00:00Z" },

    // Bima Sakti (reg 3)
    { id: genId(), registrantId: registrants[2].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T09:00:00Z", verifiedAt: "2024-08-17T11:00:00Z" },
    { id: genId(), registrantId: registrants[2].id, activityTypeId: 18, activityName: "Hunting Bareng UFO - Prambanan", activityDate: "2024-09-14", location: "Candi Prambanan", points: 5, status: "verified", submittedAt: "2024-09-15T10:00:00Z", verifiedAt: "2024-09-16T08:00:00Z" },
    { id: genId(), registrantId: registrants[2].id, activityTypeId: 13, activityName: "Submit Karya untuk Pameran Semester Ganjil", activityDate: "2024-10-05", location: "Sekretariat UFO", points: 3, status: "pending", submittedAt: "2024-10-06T14:00:00Z" },

    // Dewi Kusuma (reg 4) - no activities yet
    // Fajar Adi (reg 5)
    { id: genId(), registrantId: registrants[4].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T07:00:00Z", verifiedAt: "2024-08-17T09:00:00Z" },
    { id: genId(), registrantId: registrants[4].id, activityTypeId: 19, activityName: "Main ke Sekre UFO - Belajar Editing", activityDate: "2024-09-18", location: "Sekretariat UFO", points: 2, status: "pending", submittedAt: "2024-09-19T16:00:00Z" },

    // Gita Maharani (reg 6) - mentor 2
    { id: genId(), registrantId: registrants[5].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T08:00:00Z", verifiedAt: "2024-08-17T10:00:00Z" },
    { id: genId(), registrantId: registrants[5].id, activityTypeId: 5, activityName: "Diklat Wajib Fotografi", activityDate: "2024-09-02", location: "Ruang Kelas FIB", points: 10, status: "verified", submittedAt: "2024-09-03T09:00:00Z", verifiedAt: "2024-09-04T11:00:00Z" },
    { id: genId(), registrantId: registrants[5].id, activityTypeId: 14, activityName: "Dokumentasi Open Recruitment BEM", activityDate: "2024-09-28", location: "BEM FEB UGM", points: 3, status: "pending", submittedAt: "2024-09-29T08:00:00Z" },

    // Hendra Wijaya (reg 7)
    { id: genId(), registrantId: registrants[6].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T10:00:00Z", verifiedAt: "2024-08-17T12:00:00Z" },
    { id: genId(), registrantId: registrants[6].id, activityTypeId: 4, activityName: "Piket Sekre Akbar", activityDate: "2024-09-15", location: "Sekretariat UFO", points: 10, status: "verified", submittedAt: "2024-09-16T08:00:00Z", verifiedAt: "2024-09-17T10:00:00Z" },

    // Intan Permata (reg 8)
    { id: genId(), registrantId: registrants[7].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T09:30:00Z", verifiedAt: "2024-08-17T11:30:00Z" },
    { id: genId(), registrantId: registrants[7].id, activityTypeId: 22, activityName: "Mengunjungi Pameran Bersama CUFO", activityDate: "2024-10-10", location: "Jogja National Museum", points: 5, status: "pending", submittedAt: "2024-10-11T13:00:00Z" },

    // Joko Santoso (reg 9)
    { id: genId(), registrantId: registrants[8].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T08:00:00Z", verifiedAt: "2024-08-17T10:00:00Z" },

    // Kartika Sari (reg 10)
    { id: genId(), registrantId: registrants[9].id, activityTypeId: 1, activityName: "Diksar UFO 2024", activityDate: "2024-08-15", location: "Kampus UGM", points: 25, status: "verified", submittedAt: "2024-08-16T07:30:00Z", verifiedAt: "2024-08-17T09:30:00Z" },
    { id: genId(), registrantId: registrants[9].id, activityTypeId: 15, activityName: "HUT UFO 2024", activityDate: "2024-10-20", location: "Pendopo Agung UGM", points: 2, status: "pending", submittedAt: "2024-10-21T10:00:00Z" },
  ];
  setItem(KEYS.activities, activities);

  localStorage.setItem("ukm_seeded", "1");
}

// ─── CRUD Operations ──────────────────────────────────────────────
export function getRegistrants(): LocalRegistrant[] {
  return getItem<LocalRegistrant[]>(KEYS.registrants, []);
}

export function addRegistrant(data: Omit<LocalRegistrant, "id" | "createdAt">): LocalRegistrant {
  const all = getRegistrants();
  const item: LocalRegistrant = { ...data, id: genId(), createdAt: new Date().toISOString() };
  setItem(KEYS.registrants, [...all, item]);
  return item;
}

export function getRegistrantByEmail(email: string): LocalRegistrant | undefined {
  return getRegistrants().find((r) => r.email.toLowerCase() === email.toLowerCase());
}

export function getRegistrantById(id: number): LocalRegistrant | undefined {
  return getRegistrants().find((r) => r.id === id);
}

export function getPemandus(): LocalPemandu[] {
  return getItem<LocalPemandu[]>(KEYS.mentors, []);
}
/** @deprecated Use getPemandus */
export const getMentors = getPemandus;

export function getActivities(): LocalActivity[] {
  return getItem<LocalActivity[]>(KEYS.activities, []);
}

export function addActivity(data: Omit<LocalActivity, "id" | "submittedAt">): LocalActivity {
  const all = getActivities();
  const item: LocalActivity = { ...data, id: genId(), submittedAt: new Date().toISOString() };
  setItem(KEYS.activities, [...all, item]);
  return item;
}

export function updateActivity(id: number, updates: Partial<LocalActivity>) {
  const all = getActivities();
  const updated = all.map((a) => (a.id === id ? { ...a, ...updates } : a));
  setItem(KEYS.activities, updated);
}

export function getActivitiesByRegistrant(registrantId: number): LocalActivity[] {
  return getActivities()
    .filter((a) => a.registrantId === registrantId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export function getAssignments(): LocalPemanduAssignment[] {
  return getItem<LocalPemanduAssignment[]>(KEYS.assignments, []);
}

export function addAssignment(pemanduId: number, registrantId: number): LocalPemanduAssignment {
  const all = getAssignments();
  // Remove existing assignment for this registrant
  const filtered = all.filter((a) => a.registrantId !== registrantId);
  const item: LocalPemanduAssignment = { id: genId(), pemanduId, registrantId, assignedAt: new Date().toISOString() };
  setItem(KEYS.assignments, [...filtered, item]);
  return item;
}

export function removeAssignment(assignmentId: number) {
  const all = getAssignments().filter((a) => a.id !== assignmentId);
  setItem(KEYS.assignments, all);
}

export function getCUFOByPemandu(pemanduId: number) {
  const assignments = getAssignments().filter((a) => a.pemanduId === pemanduId);
  const registrants = getRegistrants();
  return assignments
    .map((a) => {
      const reg = registrants.find((r) => r.id === a.registrantId);
      return reg ? { assignmentId: a.id, registrantId: reg.id, registrantName: reg.fullName, registrantEmail: reg.email, registrantYear: reg.year, registrantMajor: reg.major } : null;
    })
    .filter(Boolean);
}
/** @deprecated Use getCUFOByPemandu */
export const getMenteesByMentor = getCUFOByPemandu;

export function getAssignmentForRegistrant(registrantId: number) {
  return getAssignments().find((a) => a.registrantId === registrantId);
}

export function getPemanduById(id: number): LocalPemandu | undefined {
  return getPemandus().find((m) => m.id === id);
}
/** @deprecated Use getPemanduById */
export const getMentorById = getPemanduById;

export function getPointSummary(registrantId: number) {
  const acts = getActivitiesByRegistrant(registrantId);
  return {
    total: acts.reduce((sum, a) => sum + a.points, 0),
    verified: acts.filter((a) => a.status === "verified").reduce((sum, a) => sum + a.points, 0),
    pending: acts.filter((a) => a.status === "pending").reduce((sum, a) => sum + a.points, 0),
    rejected: acts.filter((a) => a.status === "rejected").reduce((sum, a) => sum + a.points, 0),
    count: acts.length,
  };
}

// ─── Verified Members (for Pemandu/PSDM registration) ─────────────
export interface VerifiedMember {
  serialNumber: string; // Nomor Seri Anggota
  fullName: string;
  email: string;
  role: "pemandu" | "psdm";
}

const PSDM_PIN = "UFOADMIN2024"; // Special PIN for PSDM registration

export const VERIFIED_MEMBERS: VerifiedMember[] = [
  { serialNumber: "UFO-2024-001", fullName: "Dr. Budi Santoso, M.Sn.", email: "budi.santoso@ugm.ac.id", role: "pemandu" },
  { serialNumber: "UFO-2024-002", fullName: "Rina Amelia, M.Ds.", email: "rina.amelia@ugm.ac.id", role: "pemandu" },
  { serialNumber: "UFO-ADMIN-001", fullName: "Admin PSDM", email: "psdm@ufo.ugm.ac.id", role: "psdm" },
];

export function verifyMember(serialNumber: string, role: "pemandu" | "psdm", pin?: string): VerifiedMember | null {
  const members = getVerifiedMembers();
  const member = members.find(
    (m) => m.serialNumber === serialNumber && m.role === role
  );
  if (!member) return null;
  if (role === "psdm" && pin !== PSDM_PIN) return null;
  return member;
}

export function autoCreateRegistrant(userName: string, userEmail: string): LocalRegistrant {
  // Check if registrant already exists
  const existing = getRegistrants().find((r) => r.email.toLowerCase() === userEmail.toLowerCase());
  if (existing) return existing;

  const newReg: LocalRegistrant = {
    id: genId(),
    fullName: userName,
    email: userEmail,
    year: new Date().getFullYear().toString(),
    major: "Belum diisi",
    status: "active",
    createdAt: new Date().toISOString(),
  };
  const all = getRegistrants();
  setItem(KEYS.registrants, [...all, newReg]);
  return newReg;
}

// ─── Pemandu CRUD ─────────────────────────────────────────────────
export function addPemandu(data: Omit<LocalPemandu, "id" | "status">): LocalPemandu {
  const all = getPemandus();
  const item: LocalPemandu = { ...data, id: genId(), status: "active" };
  setItem(KEYS.mentors, [...all, item]);
  return item;
}

export function updatePemandu(id: number, updates: Partial<LocalPemandu>) {
  const all = getPemandus();
  const updated = all.map((m) => (m.id === id ? { ...m, ...updates } : m));
  setItem(KEYS.mentors, updated);
}

export function deletePemandu(id: number) {
  const all = getPemandus().filter((m) => m.id !== id);
  setItem(KEYS.mentors, all);
  // Also remove assignments for this pemandu
  const assignments = getAssignments().filter((a) => a.pemanduId !== id);
  setItem(KEYS.assignments, assignments);
}

// ─── Kelompok CRUD ────────────────────────────────────────────────
export function getKelompoks(): LocalKelompok[] {
  return getItem<LocalKelompok[]>(KEYS.kelompoks, []);
}

export function getKelompokAssignments(): LocalKelompokAssignment[] {
  return getItem<LocalKelompokAssignment[]>(KEYS.kelompokAssignments, []);
}

export function addKelompok(data: Omit<LocalKelompok, "id">): LocalKelompok {
  if (data.pemanduIds.length !== 2) {
    throw new Error("Kelompok harus terdiri dari tepat 2 pemandu");
  }
  const all = getKelompoks();
  const item: LocalKelompok = { ...data, id: genId() };
  setItem(KEYS.kelompoks, [...all, item]);
  return item;
}

export function updateKelompok(id: number, updates: Partial<LocalKelompok>) {
  const all = getKelompoks();
  const updated = all.map((k) => (k.id === id ? { ...k, ...updates } : k));
  setItem(KEYS.kelompoks, updated);
}

export function deleteKelompok(id: number) {
  const all = getKelompoks().filter((k) => k.id !== id);
  setItem(KEYS.kelompoks, all);
  // Remove kelompok assignments
  const assignments = getKelompokAssignments().filter((a) => a.kelompokId !== id);
  setItem(KEYS.kelompokAssignments, assignments);
}

// Get kelompok for a registrant
export function getKelompokForRegistrant(registrantId: number): LocalKelompok | undefined {
  const ka = getKelompokAssignments().find((a) => a.registrantId === registrantId);
  if (!ka) return undefined;
  return getKelompoks().find((k) => k.id === ka.kelompokId);
}

// Get pemandus for a registrant (via kelompok)
export function getPemandusForRegistrant(registrantId: number): LocalPemandu[] {
  const kelompok = getKelompokForRegistrant(registrantId);
  if (!kelompok) return [];
  return getPemandus().filter((p) => kelompok.pemanduIds.includes(p.id));
}

// Get kelompok name for a registrant
export function getKelompokNameForRegistrant(registrantId: number): string {
  const kelompok = getKelompokForRegistrant(registrantId);
  return kelompok?.name || "Belum ditugaskan";
}

// Assign registrant to kelompok (auto-creates 2 pemandu assignments)
export function assignRegistrantToKelompok(registrantId: number, kelompokId: number): LocalKelompokAssignment {
  // Remove existing kelompok assignment for this registrant
  const existingKa = getKelompokAssignments().filter((a) => a.registrantId !== registrantId);
  setItem(KEYS.kelompokAssignments, existingKa);

  // Also remove old pemandu assignments for this registrant
  const existingPa = getAssignments().filter((a) => a.registrantId !== registrantId);
  setItem(KEYS.assignments, existingPa);

  // Create new kelompok assignment
  const ka: LocalKelompokAssignment = {
    id: genId(),
    kelompokId,
    registrantId,
    assignedAt: new Date().toISOString(),
  };
  setItem(KEYS.kelompokAssignments, [...getKelompokAssignments(), ka]);

  // Create pemandu assignments for each pemandu in the kelompok
  const kelompok = getKelompoks().find((k) => k.id === kelompokId);
  if (kelompok) {
    const currentAssignments = getAssignments();
    const newAssignments = kelompok.pemanduIds.map((pid) => ({
      id: genId(),
      pemanduId: pid,
      registrantId,
      assignedAt: new Date().toISOString(),
    }));
    setItem(KEYS.assignments, [...currentAssignments, ...newAssignments]);
  }

  return ka;
}

// Remove registrant from kelompok
export function removeRegistrantFromKelompok(registrantId: number) {
  const ka = getKelompokAssignments().filter((a) => a.registrantId !== registrantId);
  setItem(KEYS.kelompokAssignments, ka);
  const pa = getAssignments().filter((a) => a.registrantId !== registrantId);
  setItem(KEYS.assignments, pa);
}

// ─── Member CRUD ─────────────────────────────────────────────────
export function getMembers(): LocalMember[] {
  return getItem<LocalMember[]>(KEYS.members, []);
}

export function getMemberByNSA(nsa: string): LocalMember | undefined {
  return getMembers().find((m) => m.nsa.toLowerCase() === nsa.toLowerCase());
}

export function addMember(data: Omit<LocalMember, "isPreRegistered">): LocalMember {
  const all = getMembers();
  if (all.some((m) => m.nsa.toLowerCase() === data.nsa.toLowerCase())) {
    throw new Error("NSA sudah terdaftar");
  }
  const member: LocalMember = { ...data, isPreRegistered: true };
  setItem(KEYS.members, [...all, member]);
  return member;
}

export function updateMember(nsa: string, updates: Partial<LocalMember>) {
  const all = getMembers();
  const updated = all.map((m) => (m.nsa === nsa ? { ...m, ...updates } : m));
  setItem(KEYS.members, updated);
}

export function deleteMember(nsa: string) {
  const all = getMembers().filter((m) => m.nsa !== nsa);
  setItem(KEYS.members, all);
}

// Determine role based on angkatan and divisi rules
export function determineRole(angkatan: number, divisi: string): LocalMember["role"] | null {
  const d = divisi.trim().toLowerCase();
  // Rule 1: Angkatan 32 + PSDM/Ketua/Wakil Ketua → PSDM
  if (angkatan === 32 && (d === "psdm" || d === "ketua" || d === "wakil ketua")) {
    return "psdm";
  }
  // Rule 2: Angkatan 33 + PSDM → PSDM + Pemandu
  if (angkatan === 33 && d === "psdm") {
    return "psdm_pemandu";
  }
  // Rule 3: Angkatan 33 + Non-PSDM → Pemandu
  if (angkatan === 33 && d !== "psdm") {
    return "pemandu";
  }
  // Rule 4: Others → Not registered
  return null;
}

// Pre-registered members from Excel database
export const PRE_REGISTERED_MEMBERS: Omit<LocalMember, "isPreRegistered">[] = [
  // Angkatan 32 - PSDM / Ketua / Wakil Ketua → PSDM
  { nsa: "NSA.3224.018.1089", name: "MUHAMMAD NAUFAL HAFIZH", angkatan: 32, divisi: "Wakil Ketua", role: "psdm", password: "1089" },
  { nsa: "NSA.3224.027.1098", name: "NAUFAL REZA AL LUTHFI", angkatan: 32, divisi: "Ketua", role: "psdm", password: "1098" },
  { nsa: "NSA.3224.004.1075", name: "AWINDYA AYUNINGTYAS RAMADHANI", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1075" },
  { nsa: "NSA.3224.020.1091", name: "NABILA PUTRI SALSABILA", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1091" },
  { nsa: "NSA.3224.024.1095", name: "NAUFAL ARIF ARDHIANSYAH", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1095" },
  { nsa: "NSA.3224.036.1107", name: "TIARDEV YAN SATRITAMA", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1107" },
  // Angkatan 33 - PSDM → PSDM + Pemandu
  { nsa: "NSA.3325.005.1114", name: "ELIZABETH LOVELY ANTONIO", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1114" },
  { nsa: "NSA.3325.013.1122", name: "KEISANADA ALYUNA", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1122" },
  { nsa: "NSA.3325.023.1132", name: "PERMATA YAQUB AURA WIJAYA", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1132" },
  { nsa: "NSA.3325.031.1140", name: "YOHANES IMANNUEL ROSANTIANT", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1140" },
  // Angkatan 33 - Non-PSDM → Pemandu
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

// Seed pre-registered members into localStorage
export function seedMembers() {
  const existing = getMembers();
  if (existing.length > 0) return; // Already seeded
  const members: LocalMember[] = PRE_REGISTERED_MEMBERS.map((m) => ({ ...m, isPreRegistered: true }));
  setItem(KEYS.members, members);
}

// ─── Registrant CRUD ──────────────────────────────────────────────
export function updateRegistrant(id: number, updates: Partial<LocalRegistrant>) {
  const all = getRegistrants();
  const updated = all.map((r) => (r.id === id ? { ...r, ...updates } : r));
  setItem(KEYS.registrants, updated);
}

export function deleteRegistrant(id: number) {
  const all = getRegistrants().filter((r) => r.id !== id);
  setItem(KEYS.registrants, all);
  // Also remove activities and assignments for this registrant
  const activities = getActivities().filter((a) => a.registrantId !== id);
  setItem(KEYS.activities, activities);
  const assignments = getAssignments().filter((a) => a.registrantId !== id);
  setItem(KEYS.assignments, assignments);
}

// ─── Verified Members CRUD (localStorage-backed) ──────────────────
export function getVerifiedMembers(): VerifiedMember[] {
  return getItem<VerifiedMember[]>(KEYS.verifiedMembers, VERIFIED_MEMBERS);
}

export function addVerifiedMember(data: VerifiedMember) {
  const all = getVerifiedMembers();
  // Prevent duplicates by serialNumber
  if (all.some((m) => m.serialNumber === data.serialNumber)) {
    throw new Error("Nomor Seri Anggota sudah terdaftar");
  }
  setItem(KEYS.verifiedMembers, [...all, data]);
}

export function updateVerifiedMember(serialNumber: string, updates: Partial<VerifiedMember>) {
  const all = getVerifiedMembers();
  const updated = all.map((m) => (m.serialNumber === serialNumber ? { ...m, ...updates } : m));
  setItem(KEYS.verifiedMembers, updated);
}

export function deleteVerifiedMember(serialNumber: string) {
  const all = getVerifiedMembers().filter((m) => m.serialNumber !== serialNumber);
  setItem(KEYS.verifiedMembers, all);
}

// ─── Locations CRUD (localStorage-backed) ─────────────────────────
const DEFAULT_LOCATIONS = [
  "Sekretariat UFO UGM",
  "Sekretariat Bersama N58 UGM",
  "Auditorium FMIPA UGM",
  "Grha Sabha Pramana UGM",
  "Balairung UGM",
  "Perpustakaan Pusat UGM",
  "Museum UGM",
  "Taman Budaya Yogyakarta",
  "Jogja National Museum",
  "Galeri Nasional Indonesia Yogyakarta",
  "Taman Sari Yogyakarta",
  "Candi Prambanan",
  "Candi Borobudur",
  "Malioboro",
  "Taman Pelangi Jogja",
  "Lapangan Pancasila UGM",
  "Gelanggang Mahasiswa UGM",
  "Fakultas Ilmu Budaya UGM",
  "Fakultas Teknik UGM",
  "Fakultas Ekonomi dan Bisnis UGM",
  "Fakultas Filsafat UGM",
  "Fakultas Hukum UGM",
  "Fakultas Psikologi UGM",
  "Fakultas Farmasi UGM",
  "Fakultas Kedokteran Hewan UGM",
  "Fakultas Kehutanan UGM",
  "Fakultas Pertanian UGM",
  "Fakultas Peternakan UGM",
  "Fakultas MIPA UGM",
  "Fakultas Seni Rupa dan Desain ISI Yogyakarta",
  "Pendopo Agung UGM",
  "Ruang Multimedia UGM",
  "Auditorium Fakultas Teknik UGM",
  "Alun-Alun Selatan Yogyakarta",
  "Kampung Wisata Taman Sari",
  "Kotagede",
  "Benteng Vredeburg",
  "Keraton Yogyakarta",
  "Stasiun Tugu Yogyakarta",
  "Stasiun Lempuyangan",
  "Bandara Adisutjipto",
];

export function getLocations(): string[] {
  return getItem<string[]>(KEYS.locations, DEFAULT_LOCATIONS);
}

export function addLocation(name: string) {
  const all = getLocations();
  if (all.includes(name)) return;
  setItem(KEYS.locations, [...all, name]);
}

export function deleteLocation(name: string) {
  const all = getLocations().filter((l) => l !== name);
  setItem(KEYS.locations, all);
}

// ─── React Hook ──────────────────────────────────────────────────
export function useLocalData() {
  const [version, setVersion] = useState(0);

  // Auto-seed on first mount
  useEffect(() => {
    seedDemoData();
    setVersion((v) => v + 1);
  }, []);

  const seed = useCallback(() => {
    seedDemoData();
    setVersion((v) => v + 1);
  }, []);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return {
    version,
    seed,
    refresh,
    // Expose all CRUD
    registrants: getRegistrants(),
    mentors: getPemandus(),
    pemandus: getPemandus(),
    activities: getActivities(),
    assignments: getAssignments(),
    activityTypes: ACTIVITY_TYPES,
    // Pemandu
    addPemandu,
    updatePemandu,
    deletePemandu,
    getCUFOByPemandu,
    getMenteesByMentor: getCUFOByPemandu, // backward compat
    getPemanduById,
    getMentorById: getPemanduById, // backward compat
    // Registrant
    addRegistrant,
    updateRegistrant,
    deleteRegistrant,
    getRegistrantByEmail,
    getRegistrantById,
    autoCreateRegistrant,
    // Activity
    addActivity,
    updateActivity,
    getActivitiesByRegistrant,
    getPointSummary,
    // Assignment
    addAssignment,
    removeAssignment,
    getAssignmentForRegistrant,
    // Verified Members
    verifiedMembers: getVerifiedMembers(),
    addVerifiedMember,
    updateVerifiedMember,
    deleteVerifiedMember,
    // Locations
    locations: getLocations(),
    addLocation,
    deleteLocation,
    // Members
    members: getMembers(),
    getMemberByNSA,
    addMember,
    updateMember,
    deleteMember,
    seedMembers,
    determineRole,
    // Kelompok
    kelompoks: getKelompoks(),
    kelompokAssignments: getKelompokAssignments(),
    addKelompok,
    updateKelompok,
    deleteKelompok,
    assignRegistrantToKelompok,
    removeRegistrantFromKelompok,
    getKelompokForRegistrant,
    getPemandusForRegistrant,
    getKelompokNameForRegistrant,
  };
}
