import { useState, useEffect } from "react";
import { X, Quote, Camera } from "lucide-react";

const MOTIVATIONAL_MESSAGES = [
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
  const [message, setMessage] = useState(MOTIVATIONAL_MESSAGES[0]);

  useEffect(() => {
    // Pick a random message
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
    setMessage(MOTIVATIONAL_MESSAGES[randomIndex]);

    // Show after a short delay
    const showTimer = setTimeout(() => setVisible(true), 800);

    // Auto-dismiss after 8 seconds
    const hideTimer = setTimeout(() => setVisible(false), 8800);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  const isQuote = message.type === "quote";
  const isTagline = message.type === "tagline";

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div
        className={`rounded-xl shadow-2xl border p-4 relative ${
          isQuote
            ? "bg-gray-900 text-white border-gray-700"
            : isTagline
            ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400"
            : "bg-white text-gray-800 border-gray-200"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setVisible(false)}
          className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
            isQuote
              ? "text-gray-400 hover:text-white hover:bg-gray-700"
              : isTagline
              ? "text-red-200 hover:text-white hover:bg-red-700"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {/* Icon */}
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              isQuote
                ? "bg-gray-700"
                : isTagline
                ? "bg-white/20"
                : "bg-red-50"
            }`}
          >
            {isQuote ? (
              <Quote className="h-4 w-4 text-yellow-400" />
            ) : (
              <Camera className={`h-4 w-4 ${isTagline ? "text-white" : "text-red-500"}`} />
            )}
          </div>

          {/* Message */}
          <div className="flex-1 pr-4">
            <p
              className={`text-sm leading-relaxed whitespace-pre-line ${
                isQuote ? "text-gray-200 italic" : isTagline ? "font-semibold" : "text-gray-700"
              }`}
            >
              {message.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
