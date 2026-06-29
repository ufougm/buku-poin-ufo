import { Eye, Target, Users, BookOpen, Handshake } from "lucide-react";

export default function VisionMission() {
  return (
    <section id="vision" className="py-20 bg-gradient-to-br from-[#0a0303] via-gray-900 to-[#0a0303]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Vision */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Eye className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Visi</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-lg">
              Menjadikan Unit Fotografi UGM sebagai sarana pengembangan yang kritis, 
              kreatif, dan berdaya saing melalui praktik fotografi.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Misi</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Menciptakan komunitas belajar yang inklusif serta kolaboratif",
                "Menjaga hubungan internal dan menjalin hubungan kolaboratif dengan pihak eksternal",
                "Mewadahi anggota dan calon anggota UFO dalam belajar hingga berkarya dalam bidang fotografi",
              ].map((misi, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-xs font-bold text-red-400 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-300 text-sm leading-relaxed">{misi}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Inklusif",
              desc: "UFO adalah ruang aman bagi siapa saja yang ingin belajar fotografi, tanpa memandang tingkat keahlian.",
            },
            {
              icon: BookOpen,
              title: "Kolaboratif",
              desc: "Komunitas belajar yang saling mendukung, berbagi pengetahuan, dan tumbuh bersama dalam karya.",
            },
            {
              icon: Handshake,
              title: "Eksploratif",
              desc: "Semangat murni untuk eksplorasi dan pembelajaran, bukan ajang kompetisi.",
            },
          ].map((v) => (
            <div key={v.title} className="text-center p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <v.icon className="h-6 w-6 text-red-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{v.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
