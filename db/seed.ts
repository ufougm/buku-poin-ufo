import { getDb } from "../api/queries/connection";
import { activityTypes } from "./schema";

const activityTypeData = [
  { number: 1, name: "Diksar", points: 25, requiresRole: "no" as const },
  { number: 2, name: "Pameris Pameran Dikjut", points: 20, requiresRole: "no" as const },
  { number: 3, name: "Panitia Pameran Dikjut", points: 20, requiresRole: "yes" as const },
  { number: 4, name: "Piket Sekre Akbar", points: 10, requiresRole: "no" as const },
  { number: 5, name: "Diklat Wajib & Umum", points: 10, requiresRole: "no" as const },
  { number: 6, name: "Ketua Kelas Pameran Pra Pelantikan", points: 5, requiresRole: "yes" as const },
  { number: 7, name: "Event Hunting", points: 10, requiresRole: "no" as const },
  { number: 8, name: "Piket Sekre", points: 10, requiresRole: "no" as const },
  { number: 9, name: "Ikut Presentasi Karya Pameris (Pra-pel)", points: 3, requiresRole: "no" as const },
  { number: 10, name: "Menjadi Divisi DDD di kepanitiaan", points: 5, requiresRole: "yes" as const },
  { number: 11, name: "Memenangkan Lomba Fotografi/Videografi", points: 10, requiresRole: "no" as const },
  { number: 12, name: "Mengikuti Lomba Fotografi/Videografi", points: 2, requiresRole: "no" as const },
  { number: 13, name: "Submit Karya untuk pameran", points: 3, requiresRole: "no" as const },
  { number: 14, name: "Membantu dokumentasi UKM / komunitas di UGM", points: 3, requiresRole: "no" as const },
  { number: 15, name: "Berpartisipasi Dalam Kegiatan HUT UFO", points: 2, requiresRole: "no" as const },
  { number: 16, name: "Kurasi Pameran", points: 3, requiresRole: "no" as const },
  { number: 17, name: "Hunting individu", points: 2, requiresRole: "no" as const },
  { number: 18, name: "Hunting bareng UFO/CUFO (min. 3 orang)", points: 5, requiresRole: "no" as const },
  { number: 19, name: "Main ke Sekre UFO (min. 2 jam)", points: 2, requiresRole: "no" as const },
  { number: 20, name: "Mengikuti Workshop/Seminar Fotografi/Videografi (selain UFO)", points: 5, requiresRole: "no" as const },
  { number: 21, name: "Mengunjungi Pameran", points: 2, requiresRole: "no" as const },
  { number: 22, name: "Mengunjungi Pameran bersama UFO/CUFO", points: 5, requiresRole: "no" as const },
  { number: 23, name: "Mengikuti One Week Challenge (poin dihitung perhari)", points: 1, requiresRole: "no" as const },
  { number: 24, name: "Kegiatan lain Sesuai Kebijakan/Persetujuan Ketua UFO (tentative)", points: 0, requiresRole: "no" as const },
];

async function seed() {
  const db = getDb();

  // Clear existing data
  await db.delete(activityTypes);

  // Insert all activity types
  await db.insert(activityTypes).values(activityTypeData);

  console.log(`Seeded ${activityTypeData.length} activity types`);
}

seed().catch(console.error);
