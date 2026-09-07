import { Users, UserCheck, ChevronRight } from "lucide-react";

export default function OrgStructure() {
  const pembina = [
    { name: "Prof. Dr. Harno Dwi Pranowo, M.Si.", role: "Pembina" },
  ];

  const dewanPenasihat = [
    { name: "Dzaky Ferdiansyah", role: "Dewan Penasihat" },
    { name: "Abraham Garnet S.", role: "Dewan Penasihat" },
    { name: "Naufal Arif N. Firdaus", role: "Dewan Penasihat" },
  ];

  const pengurusHarian = [
    // Core board
    { name: "Naufal Reza Al Luthfi", role: "Ketua Umum" },
    { name: "Muhammad Naufal Hafizh", role: "Wakil Ketua Umum" },
    { name: "Nabiel Thoriq Ilyasa", role: "Sekretaris" },
    { name: "Narazahra Fadhilla Amalia", role: "Sekretaris" },
    { name: "Saskia Ainun Nisa", role: "Bendahara" },
    { name: "Jasmine Naila Faradina Maharani", role: "Bendahara" },
    // Division heads
    { name: "Awindya Ayuningtyas Ramadhani", role: "Kepala Divisi PSDM" },
    { name: "Naufal Arif Ardhiansyah", role: "Wakil Kepala Divisi PSDM" },
    { name: "Muhammad Alvin Fairiza", role: "Kepala Divisi Medfo" },
    { name: "Raihan Esfandyka Suwandi", role: "Wakil Kepala Divisi Medfo" },
    { name: "Naufal Prihananda", role: "Kepala Divisi Humas" },
    { name: "Bintang Ariya Putra Samudera", role: "Wakil Kepala Divisi Humas" },
    { name: "Fajarian Maulana Rafif", role: "Kepala Divisi MAK" },
    { name: "Jazibiyya Khairunnisa", role: "Wakil Kepala Divisi MAK" },
    { name: "Jovita Sekar Ayu", role: "Kepala Divisi Pameran" },
    { name: "Naila Diarosma Putri", role: "Wakil Kepala Divisi Pameran" },
    { name: "Rafael Jatmiko Wahyu Hendro Wibowo", role: "Kepala Divisi Hunting" },
    { name: "Naufal Arif Samiaji", role: "Wakil Kepala Divisi Hunting" },
    { name: "Dipa Phinensula Whani", role: "Kepala Divisi Diklat" },
    { name: "Bob Hadyan Haryatmo", role: "Wakil Kepala Divisi Diklat" },
  ];

  const Section = ({
    title,
    icon: Icon,
    members,
  }: {
    title: string;
    icon: any;
    members: { name: string; role: string }[];
  }) => (
    <div className="mb-8">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-red-600" />
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm text-gray-900">{m.name}</p>
              <p className="text-xs text-gray-500">{m.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section id="org-structure" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">
            Struktur Organisasi
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            Pengurus UFO UGM
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <Section title="Pembina" icon={UserCheck} members={pembina} />
          <Section title="Dewan Penasihat Organisasi" icon={Users} members={dewanPenasihat} />
          <Section title="Pengurus Harian" icon={Users} members={pengurusHarian} />
        </div>
      </div>
    </section>
  );
}
