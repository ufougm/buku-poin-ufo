import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-[#0a0303] to-gray-900"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 border border-red-400/20 rounded-full animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 border border-red-400/10 rounded-full" />
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-red-400 rounded-full animate-ping" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-400/20 rounded-full mb-6">
          <img src="/logo-ufo.png" alt="UFO" className="h-5 w-auto" />
          <span className="text-sm text-red-300">Unit Kegiatan Mahasiswa Fotografi UGM</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          UFO UGM
          <span className="block text-red-400">Integrated Point System</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Platform digital untuk pencatatan, penghitungan poin, dan verifikasi 
          kegiatan calon anggota UFO UGM. Gantikan sistem manual dengan 
          solusi modern.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-red-600/25 transition-all hover:shadow-xl hover:shadow-red-600/30"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Masuk ke Sistem
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          <button
            onClick={() => {
              const el = document.querySelector("#about");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-3 text-gray-300 hover:text-white font-medium transition-colors"
          >
            Pelajari Lebih Lanjut
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { label: "Anggota Aktif", value: "150+" },
            { label: "Kegiatan/Tahun", value: "50+" },
            { label: "Tahun Berdiri", value: "30+" },
            { label: "Prestasi", value: "100+" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
