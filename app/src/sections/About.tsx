import { Users, Lightbulb, Camera, Target, Compass } from "lucide-react";

export default function About() {
  const activities = [
    {
      icon: Lightbulb,
      title: "Workshop dan Pelatihan",
      description:
        "Sesi komprehensif yang dirancang untuk membekali anggota dengan pengetahuan dan teknik fotografi penting. Topik berkisar dari pengoperasian kamera dan pencahayaan dasar hingga komposisi dan pengeditan tingkat lanjut menggunakan perangkat lunak profesional.",
    },
    {
      icon: Camera,
      title: "Hunting Foto",
      description:
        "Mengunjungi lokasi yang indah atau kaya budaya di mana anggota dapat mempraktikkan teknik fotografi secara langsung. Aktivitas ini tidak hanya meningkatkan keterampilan teknis tetapi juga mendorong kolaborasi dan berbagi ide di antara peserta.",
    },
    {
      icon: Compass,
      title: "Pameran Fotografi",
      description:
        "Memamerkan karya seni anggota UFO UGM kepada publik, pameran ini berfungsi sebagai platform untuk ekspresi, kritik, dan apresiasi. Pameran ini juga memberikan kesempatan bagi anggota untuk mendapatkan pengakuan atas kreativitas dan keahlian mereka.",
    },
    {
      icon: Users,
      title: "Proyek Kolaboratif",
      description:
        "UFO UGM sering berkolaborasi dengan organisasi atau departemen lain di dalam UGM untuk dokumentasi dan proyek fotografi kreatif. Kemitraan ini menawarkan pengalaman langsung kepada anggota dalam lingkungan profesional.",
    },
    {
      icon: Target,
      title: "Kompetisi",
      description:
        "Anggota didorong untuk berpartisipasi dalam kompetisi fotografi lokal dan nasional, memungkinkan mereka untuk menantang diri sendiri dan meraih penghargaan atas karya mereka.",
    },
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">
            Tentang Kami
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            Unit Fotografi UGM
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-gray-600 leading-relaxed text-justify">
            Unit Fotografi UGM (UFO) secara resmi berdiri pada 31 Maret 1991 melalui perjalanan panjang. 
            Bermula dari gagasan pameran di tahun 1986 dan sempat bernaung di bawah UKM Seni Rupa Kelompok 
            Bulak Sumur (kini USER UGM). Momentum kebangkitannya terjadi pada 1990 berkat inisiatif panitia 
            foto pementasan SWAMI yang mendanai pameran perdana sekaligus menetapkan nama UFO, dengan Teguh 
            "Gepeng" sebagai ketua umum pertama. Meskipun awalnya sempat ditolak kampus menjadi Unit Kegiatan 
            Mahasiswa (UKM), UFO berhasil membuktikan eksistensinya dengan mencetak fotografer profesional 
            dan menorehkan prestasi nasional. Namun, pada hakikatnya, UFO bukanlah ajang kompetisi, melainkan 
            ruang aman dan inklusif bagi siapa saja untuk belajar serta mengeksplorasi dunia fotografi tanpa 
            memandang tingkat keahlian, seraya membawa semangat dan tagline kebanggaan{" "}
            <em className="font-semibold text-red-700">
              "Kami percaya, UFO itu ada dan mengudara!"
            </em>
          </p>
        </div>

        {/* Activities Grid */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Kegiatan UFO UGM
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((item) => (
              <div
                key={item.title}
                className="group p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-100/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300">
                  <item.icon className="h-6 w-6 text-red-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed text-justify">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed History */}
        <div className="bg-gradient-to-br from-gray-50 to-red-50 rounded-2xl p-8 sm:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Jejak Langkah
          </h3>
          <div className="max-w-4xl mx-auto text-gray-600 leading-relaxed space-y-4 text-justify">
            <p>
              Unit Fotografi UGM (UFO) secara resmi menancapkan tonggak sejarahnya pada 31 Maret 1991. 
              Namun, di balik tanggal bersejarah tersebut, tersimpan perjalanan panjang yang penuh lika-liku. 
              Lahirnya UFO tidak terjadi dalam satu malam, melainkan buah dari semangat, dedikasi, dan visi 
              besar para pecinta fotografi UGM dari waktu ke waktu.
            </p>
            <p>
              Gagasan pendirian komunitas fotografi mahasiswa di UGM sejatinya dimulai pada tahun 1986, 
              dengan diadakannya sebuah pameran fotografi bertajuk "Pamer Lukis + Foto Juga", sekalipun 
              belum ada komunitas yang menaungi para pameris foto. Setelahnya, mulai ada pergerakan untuk 
              menginisiasi lahirnya sebuah komunitas fotografi yang dimotori oleh 4 orang, yakni Dudy Arif, 
              Waluyo TS, Nurpinto Hadi, dan Herlambang Yudo, meskipun pada awalnya belum memiliki kegiatan 
              yang berarti. Tak lama waktu berselang, Fotografi resmi lahir sebagai sebuah seksi dari UKM 
              Seni Rupa KBS "Komunitas Bulak Sumur", yang kini lebih dikenal sebagai USER UGM.
            </p>
            <p>
              Awal kebangkitan yang berarti sejatinya terjadi pada tahun 1990, yang mana pada masa itu 
              panitia foto dari pementasan grup musik SWAMI sepakat untuk memanfaatkan keuntungan penjualan 
              tiket sebagai modal untuk membentuk komunitas fotografi di UGM, dengan membeli 200 frame foto 
              untuk mengadakan pameran. Dalam rangka mendukung keberlangsungan pameran fotografi untuk 
              pertama kalinya, secara resmi komunitas fotografi UGM didirikan dengan nama UFO dan Teguh 
              "Gepeng" dipilih sebagai ketua umum pertama. Pameran foto pertama pun resmi dihelat pada 
              5-8 Oktober 1991, bertempat di Gelanggang Mahasiswa (kini telah dirubuhkan), yang bertujuan 
              tak hanya sebagai wadah pengembangan minat dan bakat fotografi mahasiswa, tetapi juga sebagai 
              sarana mempromosikan komunitas baru di lingkungan kampus.
            </p>
            <p>
              Meskipun pada awalnya tidak mendapat persetujuan untuk menjadi sebuah UKM oleh kampus, tetapi 
              UFO terus mendapat dukungan yang solid dari berbagai pihak untuk melangsungkan kegiatannya. 
              Seiring berjalannya waktu, UFO UGM yang telah bertransformasi menjadi Unit Kegiatan Mahasiswa 
              telah mewadahi minat dan bakat serta melahirkan beragam fotografer profesional, dengan juga 
              menorehkan berbagai prestasi di tingkat nasional.
            </p>
            <p>
              Meskipun kini lekat dengan berbagai pencapaian, pada hakikatnya UFO bukanlah arena untuk 
              saling berkompetisi. UFO adalah rumah bagi siapa saja yang terpesona oleh keindahan dan 
              keunikan di sekitar kita. Ini adalah ruang aman untuk belajar bagaimana mengabadikan momen 
              menjadi sebuah karya yang kaya akan makna. UFO didirikan dengan semangat murni untuk eksplorasi 
              dan pembelajaran. Oleh karena itu, pintu kami selalu terbuka lebar bagi siapa pun, tanpa pernah 
              memandang seberapa jauh tingkat keahlian fotografinya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
