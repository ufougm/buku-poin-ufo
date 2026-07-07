import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  Target,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Camera,
  FileText,
  ShieldCheck,
} from "lucide-react";

const sections = [
  {
    id: "apa-itu",
    icon: BookOpen,
    title: "1. Apa itu Buku Poin?",
    content:
      "Sistem poin merupakan salah satu syarat utama bagi calon anggota untuk dapat lolos dan dilantik menjadi anggota resmi Unit Fotografi UGM. Saat ini, Buku Poin telah sepenuhnya beralih ke platform Website untuk mempermudah proses input, pemantauan progress, dan verifikasi kegiatan secara real-time.",
    highlight: false,
  },
  {
    id: "target-poin",
    icon: Target,
    title: "2. Berapa Minimal Target Poin?",
    content:
      "Target minimal yang harus dikumpulkan oleh setiap calon anggota adalah 100 poin agar dapat dinyatakan memenuhi syarat kelulusan dan dilantik menjadi anggota resmi UFO UGM. Progress pencapaian ini dapat langsung dilihat pada bar indikator warna merah di dasbor akun Anda.",
    highlight: true,
  },
  {
    id: "cara-dapat-poin",
    icon: ClipboardList,
    title: "3. Bagaimana Cara Mendapatkan Poin?",
    content:
      "Poin diperoleh dengan berpartisipasi dalam berbagai kegiatan internal maupun ekternal yang diakui. Besaran poin akan otomatis menyesuaikan berdasarkan Jenis Kegiatan yang Anda pilih pada sistem.",
    examples: [
      "Mengikuti Diklat/Workshop Fotografi (misal: Diksar CUFO dengan bobot 25 poin)",
      "Mengikuti atau menjadi panitia pameran fotografi",
      "Menjadi tim dokumentasi suatu event",
      "Mengikuti kegiatan hunting bersama, seminar, dan sejenisnya",
    ],
    highlight: false,
  },
  {
    id: "alur-verifikasi",
    icon: CheckCircle2,
    title: "4. Alur Pengisian dan Verifikasi Poin",
    content:
      "Proses manual menggunakan tanda tangan fisik kini digantikan oleh sistem pengajuan (submisi) digital dengan alur sebagai berikut:",
    steps: [
      {
        label: "Input Mandiri",
        desc: "Masuk ke website Buku Poin UFO, lalu klik tombol merah \"+ Tambah Kegiatan\" di pojok kanan atas dasbor Anda.",
      },
      {
        label: "Pengisian Formulir",
        desc: "Isi formulir yang muncul secara lengkap: Nama Kegiatan, Jenis Kegiatan (pilih dari drop-down untuk kalkulasi poin otomatis), Tanggal Mulai & Selesai, dan Lokasi Kegiatan.",
      },
      {
        label: "Review Pemandu",
        desc: "Setelah klik \"Simpan\", status kegiatan akan masuk ke kolom \"Menunggu\". Pemandu kelompok Anda akan memeriksa validitas data dan dokumentasi secara berkala.",
      },
      {
        label: "Poin Terakumulasi",
        desc: "Jika dinyatakan valid, pemandu akan menyetujui pengajuan tersebut. Status berubah menjadi \"Terverifikasi\" dan poin otomatis bertambah pada progress Anda.",
      },
    ],
    highlight: false,
  },
  {
    id: "syarat-lengkap",
    icon: ShieldCheck,
    title: "5. Syarat Kelengkapan agar Kegiatan Disetujui",
    content:
      "Agar pengajuan kegiatan Anda tidak ditolak oleh pemandu, pastikan Anda memenuhi kriteria wajib berikut:",
    requirements: [
      {
        icon: Camera,
        text: "Wajib Unggah Dokumentasi (Foto): Setiap submisi kegiatan WAJIB melampirkan bukti foto dokumentasi (Maksimal 1 foto, ukuran maksimal 1MB). Pengajuan tanpa bukti fisik berhak ditolak oleh pemandu.",
      },
      {
        icon: FileText,
        text: "Kelengkapan Atribut: Pastikan nama kegiatan, jenis kegiatan, tanggal, dan lokasi telah terisi dengan benar dan akurat sesuai pelaksanaan riil di lapangan.",
      },
    ],
    highlight: false,
  },
  {
    id: "penting",
    icon: AlertTriangle,
    title: "PENTING UNTUK DIINGAT",
    content:
      "Buku Poin Digital ini adalah instrumen utama dalam penentuan kelulusan Anda. Pantau terus dasbor Anda secara berkala, tertiblah dalam melakukan submisi setelah menyelesaikan suatu kegiatan, dan jangan ragu berkoordinasi dengan pemandu kelompok masing-masing jika ada kendala sistem!",
    highlight: true,
  },
];

export default function FaqBukuPoin() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                <ArrowLeft className="h-4 w-4 mr-1" />Kembali
              </Button>
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <HelpCircle className="h-5 w-5 text-red-600" />
            <h1 className="text-lg font-bold text-gray-900">FAQ Buku Poin</h1>
          </div>
          <Link to="/dashboard">
            <Button size="sm" className="bg-red-600 hover:bg-red-700">Ke Dashboard</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-2">
              FAQ Buku Poin Digital Unit Fotografi UGM (UFO UGM)
            </h2>
            <p className="text-red-100">
              Panduan lengkap bagi calon anggota untuk memahami sistem poin, cara pengisian, dan proses verifikasi kegiatan.
            </p>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Navigasi Cepat:</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 rounded-full transition-colors cursor-pointer border-0"
                >
                  {s.title.split(". ")[1] || s.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {sections.map((section) => (
          <Card
            key={section.id}
            id={`section-${section.id}`}
            className={`border-0 shadow-sm scroll-mt-20 ${
              section.highlight ? "ring-2 ring-red-200" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    section.highlight ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  <section.icon
                    className={`h-5 w-5 ${
                      section.highlight ? "text-red-600" : "text-gray-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      section.highlight ? "text-red-700" : "text-gray-900"
                    }`}
                  >
                    {section.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{section.content}</p>

                  {/* Examples list */}
                  {section.examples && (
                    <ul className="mt-3 space-y-2">
                      {section.examples.map((ex, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-red-500 mt-0.5">-</span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Steps */}
                  {section.steps && (
                    <div className="mt-4 space-y-3">
                      {section.steps.map((step, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {step.label}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Requirements */}
                  {section.requirements && (
                    <div className="mt-4 space-y-3">
                      {section.requirements.map((req, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                          <req.icon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">{req.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Back to Dashboard */}
        <div className="text-center pt-6 pb-8">
          <Link to="/dashboard">
            <Button className="bg-red-600 hover:bg-red-700 h-12 px-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
