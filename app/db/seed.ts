import { getDb } from "../api/queries/connection";
import { activityTypes } from "./schema";

const activityTypeData = [
  { number: 1, name: "Diksar", points: 15, requiresRole: "no" as const },
  { number: 2, name: "Pameris UTOPIA", points: 15, requiresRole: "no" as const },
  { number: 3, name: "Pameris Pameran Prapel", points: 10, requiresRole: "no" as const },
  { number: 4, name: "Panitia Pameran Prapel", points: 10, requiresRole: "yes" as const },
  { number: 5, name: "Memenangkan Lomba Fotografi/Videografi diluar UGM (S&K Berlaku)", points: 8, requiresRole: "no" as const },
  { number: 6, name: "Diklat Wajib & Umum", points: 8, requiresRole: "no" as const },
  { number: 7, name: "Event Hunting UFO", points: 8, requiresRole: "no" as const },
  { number: 8, name: "Kunjungan Pameran UTOPIA", points: 8, requiresRole: "no" as const },
  { number: 9, name: "Berpartisipasi Dalam Kegiatan HUT UFO", points: 5, requiresRole: "no" as const },
  { number: 10, name: "Hunting Bareng Ufo/Cufo Diluar Event Hunting (Min. 3 Orang)", points: 5, requiresRole: "no" as const },
  { number: 11, name: "Ketua Kelas Pameran Pra Pelantikan", points: 5, requiresRole: "yes" as const },
  { number: 12, name: "Mengunjungi Pameran bersama UFO/ CUFO", points: 5, requiresRole: "no" as const },
  { number: 13, name: "Memenangkan Lomba Fotografi/Videografi di UGM", points: 5, requiresRole: "no" as const },
  { number: 14, name: "Piket Sekre Akbar", points: 5, requiresRole: "no" as const },
  { number: 15, name: "Piket Sekre", points: 5, requiresRole: "no" as const },
  { number: 16, name: "Submit Penugasan Diklat", points: 5, requiresRole: "no" as const },
  { number: 17, name: "UFOlunteer", points: 5, requiresRole: "no" as const },
  { number: 18, name: "Ikut Presentasi Karya Pameris (Pra-pel)", points: 3, requiresRole: "no" as const },
  { number: 19, name: "Menjadi Divisi DDD di kepanitiaan", points: 3, requiresRole: "yes" as const },
  { number: 20, name: "Mengikuti Workshop/Seminar Fotografi/Videografi (selain UFO)", points: 3, requiresRole: "no" as const },
  { number: 21, name: "Hunting Individu", points: 2, requiresRole: "no" as const },
  { number: 22, name: "Kurasi Pameran", points: 2, requiresRole: "no" as const },
  { number: 23, name: "Mengikuti Lomba Fotografi/Videografi", points: 2, requiresRole: "no" as const },
  { number: 24, name: "Membantu Dokumentasi UKM / Komunitas di UGM", points: 2, requiresRole: "no" as const },
  { number: 25, name: "First Gathering CUFO", points: 1, requiresRole: "no" as const },
  { number: 26, name: "Main ke Sekre UFO (min. 2 jam)", points: 1, requiresRole: "no" as const },
  { number: 27, name: "Mengunjungi Pameran Mandiri", points: 1, requiresRole: "no" as const },
  { number: 28, name: "Mengikuti One Week Challenge (poin dihitung perhari)", points: 1, requiresRole: "no" as const },
  { number: 29, name: "Kegiatan lain Sesuai Kebijakan/Persetujuan Ketua UFO", points: 0, requiresRole: "no" as const },
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
