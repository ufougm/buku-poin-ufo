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
  phone?: string;
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
  phone?: string;
  isPreRegistered: boolean;
}

export interface VerifiedMember {
  serialNumber: string;
  fullName: string;
  email: string;
  role: "pemandu" | "psdm";
}

// ─── Activity Types ────────────────────────────────────────────
export const ACTIVITY_TYPES = [
  { id: 1, name: "Diksar", category: "Diklat", points: 15, description: "Diklat dasar fotografi" },
  { id: 2, name: "Pameris Pameran Prapel", category: "Pameran", points: 10, description: "Pameris dalam pameran prapel" },
  { id: 3, name: "Panitia Pameran Prapel", category: "Pameran", points: 10, description: "Panitia dalam pameran prapel" },
  { id: 4, name: "Memenangkan Lomba Fotografi/Videografi di luar UGM (S&K Berlaku)", category: "Prestasi", points: 8, description: "Juara lomba di luar UGM" },
  { id: 5, name: "Memenangkan Lomba Fotografi/Videografi Internasional", category: "Prestasi", points: 40, description: "Juara lomba tingkat internasional" },
  { id: 6, name: "Memenangkan Lomba Fotografi/Videografi Nasional", category: "Prestasi", points: 25, description: "Juara lomba tingkat nasional" },
  { id: 7, name: "Diklat Wajib & Umum", category: "Diklat", points: 8, description: "Kegiatan diklat wajib dan umum" },
  { id: 8, name: "Event Hunting UFO", category: "Hunting", points: 8, description: "Kegiatan event hunting UFO" },
  { id: 9, name: "Kunjungan Pameran FOSERA", category: "Pameran", points: 8, description: "Kunjungan ke pameran FOSERA" },
  { id: 10, name: "Berpartisipasi Dalam Kegiatan HUT UFO", category: "Event", points: 5, description: "Partisipasi kegiatan HUT UFO" },
  { id: 11, name: "Hunting Bareng UFO/CUFO di luar Event Hunting (Min. 3 Orang)", category: "Hunting", points: 5, description: "Hunting bersama anggota minimal 3 orang" },
  { id: 12, name: "Ketua Kelompok Pameran Pra Pelantikan", category: "Pameran", points: 5, description: "Ketua kelompok pameran" },
  { id: 13, name: "Mengunjungi Pameran bersama UFO/CUFO", category: "Pameran", points: 5, description: "Kunjungan pameran bersama anggota" },
  { id: 14, name: "Memenangkan Lomba Fotografi/Videografi di UGM", category: "Prestasi", points: 5, description: "Juara lomba internal UGM" },
  { id: 15, name: "Piket Sekre Akbar", category: "Sekre", points: 8, description: "Piket sekretariat akbar" },
  { id: 16, name: "Piket Sekre", category: "Sekre", points: 5, description: "Piket rutin sekretariat" },
  { id: 17, name: "Berpartisipasi Photo of The Month / Stock Photo", category: "Challenge", points: 3, description: "Partisipasi POTM atau Stock Photo" },
  { id: 18, name: "Submit Penugasan Diklat", category: "Diklat", points: 5, description: "Pengumpulan penugasan diklat" },
  { id: 19, name: "UFOlunteer", category: "Event", points: 5, description: "Menjadi volunteer dalam kegiatan UFO" },
  { id: 20, name: "Ikut Presentasi Karya Pameris (Pra-pel)", category: "Review", points: 3, description: "Presentasi karya pameris" },
  { id: 21, name: "Menjadi Divisi DDD di kepanitiaan", category: "Organisasi", points: 3, description: "Kontribusi divisi DDD" },
  { id: 22, name: "Mengikuti Workshop/Seminar Fotografi/Videografi (selain UFO)", category: "Diklat", points: 3, description: "Workshop/seminar eksternal" },
  { id: 23, name: "Hunting Individu", category: "Hunting", points: 2, description: "Kegiatan hunting foto individu" },
  { id: 24, name: "Kurasi Pameran", category: "Pameran", points: 2, description: "Proses kurasi karya pameran" },
  { id: 25, name: "Mengikuti Lomba Fotografi/Videografi", category: "Prestasi", points: 2, description: "Partisipasi lomba foto/video" },
  { id: 26, name: "Membantu Dokumentasi UKM / Komunitas di UGM", category: "Dokumentasi", points: 2, description: "Dokumentasi UKM/komunitas" },
  { id: 27, name: "First Gathering CUFO", category: "Event", points: 1, description: "Kehadiran first gathering" },
  { id: 28, name: "Main ke Sekre UFO (min. 2 jam)", category: "Sekre", points: 1, description: "Kunjungan ke sekretariat minimal 2 jam" },
  { id: 29, name: "Mengunjungi Pameran Mandiri", category: "Pameran", points: 1, description: "Kunjungan pameran secara individu" },
  { id: 30, name: "Kegiatan lain Sesuai Kebijakan/Persetujuan Ketua UFO", category: "Lain-lain", points: 0, description: "Sesuai kebijakan/persetujuan Ketua UFO" },
];

export const PRE_REGISTERED_MEMBERS: Omit<LocalMember, "isPreRegistered">[] = [
  { nsa: "NSA.3224.018.1089", name: "MUHAMMAD NAUFAL HAFIZH", angkatan: 32, divisi: "Wakil Ketua", role: "psdm", password: "1089" },
  { nsa: "NSA.3224.027.1098", name: "NAUFAL REZA AL LUTHFI", angkatan: 32, divisi: "Ketua", role: "psdm", password: "1098" },
  { nsa: "NSA.3224.004.1075", name: "AWINDYA AYUNINGTYAS RAMADHANI", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1075" },
  { nsa: "NSA.3224.020.1091", name: "NABILA PUTRI SALSABILA", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1091" },
  { nsa: "NSA.3224.024.1095", name: "NAUFAL ARIF ARDHIANSYAH", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1095" },
  { nsa: "NSA.3224.036.1107", name: "TIARDEV YAN SATRITAMA", angkatan: 32, divisi: "PSDM", role: "psdm", password: "1107" },
  { nsa: "NSA.3325.005.1114", name: "ELIZABETH LOVELY ANTONIO", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1114", phone: "081298032007" },
  { nsa: "NSA.3325.013.1122", name: "KEISANADA ALYUNA", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1122", phone: "085647000133" },
  { nsa: "NSA.3325.023.1132", name: "PERMATA YAQUB AURA WIJAYA", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1132", phone: "089518562996" },
  { nsa: "NSA.3325.031.1140", name: "YOHANES IMANNUEL ROSANTIANT", angkatan: 33, divisi: "PSDM", role: "psdm_pemandu", password: "1140", phone: "085876075018" },
  { nsa: "NSA.3325.001.1110", name: "AISHA", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1110", phone: "0889636657272" },
  { nsa: "NSA.3325.002.1111", name: "AKHMARINA SIAMITA FADILAH", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1111", phone: "085643261582" },
  { nsa: "NSA.3325.003.1112", name: "ALHIMNI RUSYADI PUTRI ARSINDU", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1112", phone: "082326424573" },
  { nsa: "NSA.3325.004.1113", name: "ANGELINE CALLISTA", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1113", phone: "082184789572" },
  { nsa: "NSA.3325.006.1115", name: "EZRA AGUNG MAWASTYA", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1115", phone: "081326158621" },
  { nsa: "NSA.3325.007.1116", name: "FARRAS AL FAYYADH", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1116", phone: "081329098653" },
  { nsa: "NSA.3325.008.1117", name: "FIKRI ATHAYA DIANDRA", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1117", phone: "081385952849" },
  { nsa: "NSA.3325.009.1118", name: "GADANG ALAM SI RADJA", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1118", phone: "088238081218" },
  { nsa: "NSA.3325.011.1120", name: "HILMI RASYID", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1120", phone: "081328494525" },
  { nsa: "NSA.3325.012.1121", name: "IQBAL ARUNG SAMUDRA", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1121", phone: "085250957408" },
  { nsa: "NSA.3325.014.1123", name: "KEVIN NUSYWA PUTRA", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1123", phone: "081386260922" },
  { nsa: "NSA.3325.015.1124", name: "LUKMAN HAKIM", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1124", phone: "0895640183100" },
  { nsa: "NSA.3325.016.1125", name: "MAWLA HUMAYUN AHSAN HERMAWAN", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1125", phone: "082172367603" },
  { nsa: "NSA.3325.017.1126", name: "MUHAMMAD NAUFAL LAUDZAKI", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1126", phone: "088232247103" },
  { nsa: "NSA.3325.018.1127", name: "MUHAMMAD RAFIF AKIO SARWADI", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1127", phone: "089649904209" },
  { nsa: "NSA.3325.019.1128", name: "MUHAMMAD RIFKY RADHIYAN PASHA", angkatan: 33, divisi: "MAK", role: "pemandu", password: "1128", phone: "081324649473" },
  { nsa: "NSA.3325.020.1129", name: "MUHAMMAD TAJU ABRAR RIZA", angkatan: 33, divisi: "Hunting", role: "pemandu", password: "1129", phone: "0882005817736" },
  { nsa: "NSA.3325.021.1130", name: "NAFISA RAMADANI", angkatan: 33, divisi: "Diklat", role: "pemandu", password: "1130", phone: "081510435360" },
  { nsa: "NSA.3325.022.1131", name: "NAILAH ATTARAFSHAH SURYANTO", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1131", phone: "081336826547" },
  { nsa: "NSA.3325.024.1133", name: "RAHMI NISRINA", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1133", phone: "082227031963" },
  { nsa: "NSA.3325.025.1134", name: "REFANIA AZHARI SIREGAR", angkatan: 33, divisi: "Pameran", role: "pemandu", password: "1134", phone: "089518530464" },
  { nsa: "NSA.3325.027.1136", name: "SANDY DIYO ANGGARA", angkatan: 33, divisi: "Sekretaris", role: "pemandu", password: "1136", phone: "082281469078" },
  { nsa: "NSA.3325.028.1137", name: "SHAUMI NOORRAMADHANI", angkatan: 33, divisi: "Medinfo", role: "pemandu", password: "1137", phone: "085180917752" },
  { nsa: "NSA.3325.029.1138", name: "SITI YASMIN FAJRI RAMADHANI", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1138", phone: "082210376152" },
  { nsa: "NSA.3325.030.1139", name: "SYAKIRA NAILA JAGADDHITA", angkatan: 33, divisi: "Humas", role: "pemandu", password: "1139", phone: "087718884788" },
  { nsa: "NSA.3325.032.1141", name: "YUSUF KURNIAWAN", angkatan: 33, divisi: "Bendahara", role: "pemandu", password: "1141", phone: "08883912392" },
];

const DEFAULT_LOCATIONS = [
  "Sekretariat UFO UGM", "Sekretariat Bersama N58 UGM", "Auditorium FMIPA UGM",
  "Grha Sabha Pramana UGM", "Balairung UGM", "Perpustakaan Pusat UGM",
  "Museum UGM", "Taman Budaya Yogyakarta", "Jogja National Museum",
  "Galeri Nasional Indonesia Yogyakarta", "Taman Sari Yogyakarta",
  "Candi Prambanan", "Candi Borobudur", "Malioboro",
  "Taman Pelangi Jogja", "Lapangan Pancasila UGM", "Gelanggang Mahasiswa UGM",
];

export async function verifyMemberLogin(nsa: string, pass: string): Promise<LocalMember | null> {
  const nsaClean = (nsa || "").trim().toLowerCase();
  const local = PRE_REGISTERED_MEMBERS.find((m) => m.nsa.toLowerCase() === nsaClean);
  if (local) {
    if (local.password === pass) {
      return { ...local, isPreRegistered: true };
    }
    return null;
  }

  try {
    const { data } = await supabase.from("members").select("*").eq("nsa", (nsa || "").trim()).single();
    if (data && data.password === pass) {
      return { ...toCamel(data), isPreRegistered: true };
    }
  } catch {
    /* ignore error */
  }

  return null;
}

export function getPemandusFromMembers(members: LocalMember[]): (LocalPemandu & { nsa: string })[] {
  const safeMembers = Array.isArray(members) ? members : [];
  return safeMembers
    .filter((m) => m && (m.role === "pemandu" || m.role === "psdm_pemandu"))
    .map((m) => ({
      id: parseInt((m.nsa || "").replace(/\D/g, "").slice(-4)) || 0,
      userId: 0,
      fullName: m.name || "",
      email: m.email || m.nsa || "",
      nsa: m.nsa || "",
      expertise: `${m.divisi || ""} (Angkatan ${m.angkatan || ""})`,
      maxMentees: 20,
      phone: m.phone || "",
      status: "active" as const,
    }));
}

// ─── Main React Hook ──────────────────────────────────────────────
export function useLocalData() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const [members, setMembers] = useState<LocalMember[]>([]);
  const [registrants, setRegistrants] = useState<LocalRegistrant[]>([]);
  const [activities, setActivities] = useState<LocalActivity[]>([]);
  const [kelompoks, setKelompoks] = useState<LocalKelompok[]>([]);
  const [kelompokAssignments, setKelompokAssignments] = useState<LocalKelompokAssignment[]>([]);
  const [pemanduAssignments, setPemanduAssignments] = useState<LocalPemanduAssignment[]>([]);
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);
  const [standalonePemandus, setStandalonePemandus] = useState<StandalonePemandu[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setDbError(null);
        const [m, r, a, k, ka, pa, l, sp] = await Promise.all([
          supabase.from("members").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
          supabase.from("registrants").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
          supabase.from("activities").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
          supabase.from("kelompoks").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
          supabase.from("kelompok_assignments").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
          supabase.from("pemandu_assignments").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
          supabase.from("locations").select("name").then(({ data }) => (data || []).map((d: any) => d.name)).catch(() => DEFAULT_LOCATIONS),
          supabase.from("standalone_pemandus").select("*").then(({ data }) => (data || []).map(toCamel)).catch(() => []),
        ]);
        if (cancelled) return;
        
        const mergedMembers = [...PRE_REGISTERED_MEMBERS.map(m => ({ ...m, isPreRegistered: true }))];
        if (Array.isArray(m)) {
          m.forEach(dbM => {
            if (!mergedMembers.some(existing => existing.nsa.toLowerCase() === dbM.nsa?.toLowerCase())) {
              mergedMembers.push({ ...dbM, isPreRegistered: true });
            }
          });
        }

        setMembers(mergedMembers);
        setRegistrants(Array.isArray(r) ? r : []);
        setActivities(Array.isArray(a) ? a : []);
        setKelompoks(Array.isArray(k) ? k : []);
        setKelompokAssignments(Array.isArray(ka) ? ka : []);
        setPemanduAssignments(Array.isArray(pa) ? pa : []);
        setLocations(Array.isArray(l) && l.length > 0 ? l : DEFAULT_LOCATIONS);
        setStandalonePemandus(Array.isArray(sp) ? sp : []);
      } catch (e: any) {
        if (!cancelled) setDbError(e?.message || "Gagal terhubung ke database");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [version]);

  const safeMembers = Array.isArray(members) ? members : [];
  const safeRegistrants = Array.isArray(registrants) ? registrants : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeKelompoks = Array.isArray(kelompoks) ? kelompoks : [];
  const safeKelompokAssignments = Array.isArray(kelompokAssignments) ? kelompokAssignments : [];
  const safeStandalonePemandus = Array.isArray(standalonePemandus) ? standalonePemandus : [];

  const memberPemandus = getPemandusFromMembers(safeMembers);
  const allPemandus = [
    ...memberPemandus,
    ...safeStandalonePemandus.map((p) => ({ ...p, status: "active" as const, userId: 0 }))
  ];

  const getRegistrantByEmail = (email: string) => 
    safeRegistrants.find((r) => r && r.email && r.email.toLowerCase() === (email || "").toLowerCase());

  const getRegistrantById = (id: number) => 
    safeRegistrants.find((r) => r && r.id === id);

  const getPemanduById = (id: number) => 
    allPemandus.find((p) => p && p.id === id);
  
  const getKelompokForRegistrant = (registrantId: number) => 
    safeKelompoks.find((k) => k && safeKelompokAssignments.some((ka) => ka && ka.registrantId === registrantId && ka.kelompokId === k.id));
  
  const getPemandusForRegistrant = (registrantId: number) => {
    const k = getKelompokForRegistrant(registrantId);
    if (!k) return [];
    const pIds = Array.isArray(k.pemanduIds) ? k.pemanduIds : [];
    return allPemandus.filter((p) => p && pIds.includes(p.id));
  };

  const getKelompokNameForRegistrant = (registrantId: number) => 
    getKelompokForRegistrant(registrantId)?.name || "Belum ditugaskan";

  const getActivitiesByRegistrant = (registrantId: number) => 
    safeActivities.filter((a) => a && a.registrantId === registrantId);
  
  const getCUFOByPemandu = (pemanduId: number) => {
    const pemanduKelompoks = safeKelompoks.filter((k) => k && Array.isArray(k.pemanduIds) && k.pemanduIds.includes(pemanduId));
    const kelompokIds = pemanduKelompoks.map((k) => k.id);
    return safeKelompokAssignments
      .filter((ka) => ka && kelompokIds.includes(ka.kelompokId))
      .map((ka) => {
        const reg = safeRegistrants.find((r) => r && r.id === ka.registrantId);
        return reg ? { registrantId: reg.id, registrantName: reg.fullName, registrantEmail: reg.email, registrantYear: reg.year, registrantMajor: reg.major } : null;
      })
      .filter(Boolean);
  };

  const getPointSummary = (registrantId: number) => {
    const acts = getActivitiesByRegistrant(registrantId);
    const verifiedActs = acts.filter((a) => a && a.status === "verified");
    return {
      total: verifiedActs.reduce((s, a) => s + (a.points || 0), 0),
      verified: verifiedActs.length,
      pending: acts.filter((a) => a && a.status === "pending").length,
      rejected: acts.filter((a) => a && a.status === "rejected").length,
      count: acts.length,
    };
  };

  return {
    version,
    refresh,
    dbError,
    members: safeMembers,
    registrants: safeRegistrants,
    activities: safeActivities,
    kelompoks: safeKelompoks,
    kelompokAssignments: safeKelompokAssignments,
    pemanduAssignments: Array.isArray(pemanduAssignments) ? pemanduAssignments : [],
    locations: Array.isArray(locations) && locations.length > 0 ? locations : DEFAULT_LOCATIONS,
    standalonePemandus: safeStandalonePemandus,
    allPemandus,
    activityTypes: ACTIVITY_TYPES, // Disertakan agar aman dipanggil jika dibutuhkan
    getRegistrantByEmail,
    getRegistrantById,
    getPemanduById,
    getKelompokForRegistrant,
    getPemandusForRegistrant,
    getKelompokNameForRegistrant,
    getActivitiesByRegistrant,
    getCUFOByPemandu,
    getPointSummary,
    verifyMemberLogin,
  };
}