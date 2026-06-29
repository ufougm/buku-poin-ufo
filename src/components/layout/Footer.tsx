import { MapPin, Mail, Instagram, ExternalLink } from "lucide-react";

export default function Footer() {
  const socials = [
    {
      label: "@ufougm",
      url: "https://www.instagram.com/ufougm",
      icon: Instagram,
    },
    {
      label: "@ufougm_",
      url: "https://www.tiktok.com/@ufougm_",
      icon: () => (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
    },
    {
      label: "UFO UGM",
      url: "https://www.youtube.com/@ufougm6266",
      icon: () => (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.86.55 9.38.55 9.38.55s7.52 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.81zM9.55 15.5V8.5l6.27 3.5-6.27 3.5z" />
        </svg>
      ),
    },
    {
      label: "@ufougm",
      url: "https://x.com/ufougm",
      icon: () => (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo-ufo.png" alt="UFO UGM" className="h-10 w-auto" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Unit Fotografi UGM (UFO) — ruang aman dan inklusif bagi siapa saja 
              untuk belajar serta mengeksplorasi dunia fotografi tanpa memandang 
              tingkat keahlian.
            </p>
            <p className="text-xs text-red-400 mt-3 italic">
              "Kami percaya, UFO itu ada dan mengudara!"
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Kontak & Informasi</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <span className="text-sm">
                  Sekretariat Bersama N58, Jl. Bhinneka Tunggal Ika, Sendowo, 
                  Sinduadi, Mlati, Sleman, DIY 55281
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-red-400" />
                <span className="text-sm">ukm.foto@ugm.ac.id</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-red-400" />
                <a
                  href="https://ufo.ukm.ugm.ac.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-red-400 transition-colors"
                >
                  ufo.ukm.ugm.ac.id
                </a>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold text-white mb-4">Media Sosial UFO</h3>
            <div className="space-y-3">
              {socials.map((s) => (
                <a
                  key={s.label + s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors"
                >
                  <s.icon className="h-4 w-4" />
                  <span>{s.label}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Unit Fotografi UGM (UFO). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
