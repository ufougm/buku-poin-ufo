import { Camera } from "lucide-react";

export default function Gallery() {
  const galleryItems = [
    {
      src: "/gallery/pameran-pra-pelantikan.jpg",
      title: "Pameran Pra-Pelantikan CUFO XXXIII",
      category: "Pameran",
    },
    {
      src: "/gallery/event-hunting.jpg",
      title: "Event Hunting",
      category: "Hunting",
    },
    {
      src: "/gallery/pelantikan-anggota.jpg",
      title: "Pelantikan Anggota UFO",
      category: "Pelantikan",
    },
    {
      src: "/gallery/diklat-proses-kreatif.jpg",
      title: "Diklat Proses Kreatif",
      category: "Diklat",
    },
    {
      src: "/gallery/ufolunteer.jpg",
      title: "UFOlunteer x Desa Mitra BEM FEB UGM",
      subtitle: "Pengabdian Masyarakat",
      category: "Pengabdian",
    },
  ];

  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">
            Galeri
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            Dokumentasi Kegiatan
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Kumpulan dokumentasi kegiatan-kegiatan UFO UGM yang telah dilaksanakan.
          </p>
        </div>

        {/* First photo: full width, larger */}
        <div className="mb-4">
          <div className="group relative overflow-hidden rounded-xl">
            <img
              src={galleryItems[0].src}
              alt={galleryItems[0].title}
              className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-center text-white p-4">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">{galleryItems[0].title}</p>
                <p className="text-xs text-red-200 mt-1">{galleryItems[0].category}</p>
              </div>
            </div>
            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 group-hover:opacity-0 transition-opacity duration-300">
              <p className="text-white font-medium text-sm truncate">{galleryItems[0].title}</p>
            </div>
          </div>
        </div>

        {/* Remaining 4 photos: 2x2 grid, all horizontal */}
        <div className="grid grid-cols-2 gap-4">
          {galleryItems.slice(1).map((item, index) => (
            <div key={index} className="group relative overflow-hidden rounded-xl">
              <img
                src={item.src}
                alt={item.title}
                className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <Camera className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-semibold text-sm">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-red-200">{item.subtitle}</p>
                  )}
                  <p className="text-xs text-red-200 mt-1">{item.category}</p>
                </div>
              </div>
              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 group-hover:opacity-0 transition-opacity duration-300">
                <p className="text-white font-medium text-xs sm:text-sm truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
