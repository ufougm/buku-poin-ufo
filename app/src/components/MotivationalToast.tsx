import { useState, useEffect } from "react";
import { X, Camera } from "lucide-react";

const MESSAGES = [
  {
    type: "motivation" as const,
    text: "Setiap klik \"+ Tambah Kegiatan\" adalah satu langkah lebih dekat untuk menjadi bagian resmi dari keluarga besar UFO UGM! 📸",
  },
  {
    type: "motivation" as const,
    text: "Jangan biarkan bar merah dasarmu kosong! Yuk, berburu momen, ikuti kegiatan, dan penuhi target 100 poinmu!",
  },
  {
    type: "motivation" as const,
    text: "Bukan sekadar mengejar angka 100, tapi setiap poin yang kamu ajukan adalah bukti proses dan dedikasimu dalam dunia fotografi.",
  },
  {
    type: "motivation" as const,
    text: "Dokumentasikan kegiatanmu, unggah buktinya, dan saksikan progres keanggotaan resmimu terus meningkat setiap harinya!",
  },
  {
    type: "motivation" as const,
    text: "Yuk, cicil submisi kegiatannya dari sekarang! Konsistensi kecil hari ini adalah kunci pelantikanmu sebagai anggota resmi esok hari. ✨",
  },
  {
    type: "quote" as const,
    text: "\"What I love about photography is that they capture a moment that's gone forever, impossible to reproduce.\"\n— Karl Lagerfeld",
  },
  {
    type: "quote" as const,
    text: "\"Photography is a way of feeling, of touching, of loving. What you have caught on film is captured forever…\"\n— Aaron Siskind",
  },
  {
    type: "quote" as const,
    text: "\"There are no rules for good photographs, there are only good photographs.\"\n— Ansel Adams",
  },
  {
    type: "quote" as const,
    text: "\"Which of my photographs is my favorite? The one I'm going to take tomorrow.\"\n— Imogen Cunningham",
  },
  {
    type: "quote" as const,
    text: "\"You don't take a photograph, you make it.\"\n— Ansel Adams",
  },
  {
    type: "quote" as const,
    text: "\"Skill in photography is acquired by practice and not by purchase.\"\n— Percy W. Harris",
  },
  {
    type: "tagline" as const,
    text: "Kami Percaya UFO itu Ada dan Mengudara! 🛸",
  },
];

export default function MotivationalToast() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MESSAGES.length);
    setMessage(MESSAGES[randomIndex]);

    const showTimer = setTimeout(() => setVisible(true), 600);
    const autoHideTimer = setTimeout(() => handleClose(), 8600);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(autoHideTimer);
    };
  }, []);

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  const isQuote = message.type === "quote";
  const isTagline = message.type === "tagline";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Centered card */}
      <div
        className={`relative z-10 mx-4 w-full max-w-lg rounded-2xl shadow-2xl p-8 transform transition-all duration-300 ${
          fadeOut ? "scale-95 opacity-0" : "scale-100 opacity-100"
        } ${
          isQuote
            ? "bg-gray-900 text-white border border-gray-700"
            : isTagline
            ? "bg-gradient-to-br from-red-500 to-red-600 text-white border border-red-400"
            : "bg-white text-gray-800 border border-gray-200"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isQuote
              ? "text-gray-400 hover:text-white hover:bg-gray-700"
              : isTagline
              ? "text-red-200 hover:text-white hover:bg-red-700"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isQuote
                ? "bg-gray-700"
                : isTagline
                ? "bg-white/20"
                : "bg-red-50"
            }`}
          >
            <Camera
              className={`h-7 w-7 ${
                isQuote ? "text-yellow-400" : isTagline ? "text-white" : "text-red-500"
              }`}
            />
          </div>
        </div>

        {/* Message */}
        <p
          className={`text-center text-lg leading-relaxed whitespace-pre-line ${
            isQuote
              ? "text-gray-200 italic font-medium"
              : isTagline
              ? "font-bold text-xl"
              : "text-gray-700 font-medium"
          }`}
        >
          {message.text}
        </p>

        {/* Footer hint */}
        <p
          className={`text-center text-xs mt-5 ${
            isQuote
              ? "text-gray-500"
              : isTagline
              ? "text-red-200"
              : "text-gray-400"
          }`}
        >
          Klik X atau klik di luar popup untuk menutup
        </p>
      </div>
    </div>
  );
}
