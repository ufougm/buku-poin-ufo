import { ImageOff, Camera } from "lucide-react";

export default function Gallery() {
  const galleryItems = [
    { title: "Pameran Dikjut 2024", category: "Pameran" },
    { title: "Event Hunting", category: "Hunting" },
    { title: "Workshop Fotografi", category: "Workshop" },
    { title: "Diklat Wajib", category: "Diklat" },
    { title: "HUT UFO", category: "Perayaan" },
    { title: "Kegiatan Rutin", category: "Kegiatan" },
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
            [Placeholder: Tambahkan foto-foto kegiatan di sini]
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryItems.map((item, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-xl bg-gray-200 ${
                index === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <div
                className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 ${
                  index === 0 ? "min-h-[300px] md:min-h-[400px]" : "min-h-[150px]"
                }`}
              >
                <ImageOff className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-500 text-center px-4">
                  {item.title}
                </p>
                <span className="text-xs text-gray-400 mt-1">{item.category}</span>
              </div>

              <div className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-red-200">{item.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
