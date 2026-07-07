import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocalData, type LocalRegistrant } from "@/hooks/useLocalData";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Download,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Trophy,
  Loader2,
  X,
  UserPlus,
  Upload,
  Image,
  Trash2,
  Heart,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LocationSuggest from "@/components/LocationSuggest";
import MotivationalToast from "@/components/MotivationalToast";

export default function MemberDashboard() {
  const { user, isUser, isLoading } = useAuth();
  const local = useLocalData();
  const [myRegistrant, setMyRegistrant] = useState<LocalRegistrant | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Activity form state
  const [formOpen, setFormOpen] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityDateEnd, setActivityDateEnd] = useState("");
  const [activityTypeId, setActivityTypeId] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");

  // Image compression utility
  const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 1 * 1024 * 1024) {
        reject(new Error("File terlalu besar. Maksimum 1MB."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas tidak tersedia")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Gagal memuat gambar."));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });
  };

  // Registration form state
  const [regYear, setRegYear] = useState("2024");
  const [regMajor, setRegMajor] = useState("");
  const [regFaculty, setRegFaculty] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Find or auto-create registrant
  useEffect(() => {
    if (user?.name) {
      // Try find by name match
      let found = local.registrants.find((r) =>
        r.fullName.toLowerCase().includes(user.name!.toLowerCase()) ||
        user.name!.toLowerCase().includes(r.fullName.toLowerCase())
      );
      // Auto-create if not found (new Calon Anggota from free signup)
      if (!found) {
        found = local.addRegistrant({
          fullName: user.name,
          email: (user as any)?.email || `${user.id}@placeholder.com`,
          year: new Date().getFullYear().toString(),
          major: "Belum diisi",
        });
      }
      if (found) setMyRegistrant(found);
    }
  }, [user?.name, user?.id, refreshTick]);

  const activities = useMemo(
    () => (myRegistrant ? local.getActivitiesByRegistrant(myRegistrant.id) : []),
    [myRegistrant, refreshTick, local]
  );

  const summary = useMemo(
    () => (myRegistrant ? local.getPointSummary(myRegistrant.id) : { total: 0, verified: 0, pending: 0, rejected: 0, count: 0 }),
    [myRegistrant, refreshTick, local]
  );

  const selectedType = local.activityTypes.find((t) => t.id === Number(activityTypeId));
  const requiresRole = selectedType?.requiresRole === "yes";

  // Photo upload handler with compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadError("");

    // Limit total images to 1
    const remainingSlots = 1 - uploadedImages.length;
    if (remainingSlots <= 0) {
      setUploadError("Maksimum 1 foto per kegiatan.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file, 800, 0.7);
        // Check compressed size (base64 is ~4/3 of binary, so ~1.3MB max)
        const approxSize = (compressed.length * 3) / 4;
        if (approxSize > 1.5 * 1024 * 1024) {
          setUploadError(`Gambar "${file.name}" terlalu besar setelah dikompresi. Coba gambar lain.`);
          continue;
        }
        setUploadedImages((prev) => [...prev, compressed]);
      } catch (err: any) {
        setUploadError(err.message || `Gagal mengupload "${file.name}".`);
      }
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRegister = () => {
    if (!user?.name || !regYear || !regMajor) return;
    const newReg = local.addRegistrant({
      fullName: user.name,
      email: (user as any)?.email || `${user.id}@placeholder.com`,
      year: regYear,
      major: regMajor,
      faculty: regFaculty || undefined,
      phone: regPhone || undefined,
      status: "active",
    });
    setMyRegistrant(newReg);
    setShowRegister(false);
    setRefreshTick((t) => t + 1);
  };

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myRegistrant || !activityTypeId) return;
    setUploadError("");

    try {
      local.addActivity({
        registrantId: myRegistrant.id,
        activityTypeId: Number(activityTypeId),
        activityName,
        activityDate,
        activityDateEnd: activityDateEnd || undefined,
        role: requiresRole ? role : undefined,
        location,
        documentationImages: uploadedImages.length > 0 ? uploadedImages : undefined,
        points: selectedType?.points || 0,
        status: "pending",
      });
      setFormOpen(false);
      resetForm();
      setRefreshTick((t) => t + 1);
    } catch (err: any) {
      if (err.name === "QuotaExceededError" || err.message?.includes("quota") || err.message?.includes("exceeded")) {
        setUploadError("Penyimpanan penuh. Coba hapus beberapa foto atau kurangi ukurannya.");
      } else {
        setUploadError("Gagal menyimpan kegiatan. Coba lagi.");
      }
    }
  };

  const resetForm = () => {
    setActivityName("");
    setActivityDate("");
    setActivityDateEnd("");
    setActivityTypeId("");
    setRole("");
    setLocation("");
    setUploadedImages([]);
    setUploadError("");
  };

  // PDF Generation — Buku Poin UFO UGM Format
  const generatePDF = () => {
    if (!activities || !myRegistrant) return;
    const verifiedActivities = activities.filter((a) => a.status === "verified");
    const doc = new jsPDF();

    // Resolve kelompok and pemandu info for this registrant
    const kelompokName = local.getKelompokNameForRegistrant(myRegistrant.id);
    const pemandus = local.getPemandusForRegistrant(myRegistrant.id);
    const pemanduNames = pemandus.length > 0
      ? pemandus.map((p) => p.fullName).join(" & ")
      : "Belum ditugaskan";
    // Resolve pemeriksa name from verifiedBy
    const getPemeriksaName = (activity: any) => {
      if (activity.verifiedBy) {
        const p = local.getPemanduById(activity.verifiedBy);
        if (p) return p.fullName;
      }
      return pemanduNames;
    };

    // Title
    doc.setFontSize(18);
    doc.text("BUKU POIN UFO UGM", 105, 20, { align: "center" });
    doc.setFontSize(11);
    doc.text("Buku Poin Calon Anggota", 105, 27, { align: "center" });

    // Member Info Box
    doc.setFontSize(10);
    const startY = 40;
    doc.text(`Nama     : ${myRegistrant.fullName}`, 14, startY);
    doc.text(`Kelompok : ${kelompokName}`, 14, startY + 6);
    doc.text(`Pemandu  : ${pemanduNames}`, 14, startY + 12);

    // Tabel Poin Header
    doc.setFontSize(11);
    doc.text("Tabel Poin:", 14, startY + 22);

    const tableData = verifiedActivities.map((a, i) => {
      const dateStr = a.activityDateEnd
        ? `${format(new Date(a.activityDate), "dd MMM yyyy")} - ${format(new Date(a.activityDateEnd), "dd MMM yyyy")}`
        : format(new Date(a.activityDate), "dd MMMM yyyy", { locale: id });
      return [
        (i + 1).toString(),
        dateStr,
        a.activityName + (a.role ? ` (${a.role})` : ""),
        getPemeriksaName(a),
        a.points.toString(),
        "Diterima",
      ];
    });

    autoTable(doc, {
      startY: startY + 26,
      head: [["No.", "Tanggal", "Kegiatan", "Pemeriksa", "Poin", "Keterangan"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [153, 27, 27] }, // darker red for header
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 55 },
        3: { cellWidth: 30 },
        4: { cellWidth: 12 },
        5: { cellWidth: 25 },
      },
    });

    // Keterangan
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(9);
    doc.text("Keterangan tabel poin:", 14, finalY + 10);
    doc.setFontSize(8);
    const keterangan = [
      "1. Tanggal: diisi sesuai tanggal kegiatan dilaksanakan (diisi oleh CUFO)",
      "2. Kegiatan: berisi nama kegiatan yang dilaksanakan (diisi oleh CUFO)",
      "3. Pemeriksa: berisi nama pemandu atau perwakilan UFO yang memeriksa buku poin (diisi oleh pemandu)",
      "4. Poin: diisi sesuai ketentuan poin yang ada (diisi oleh CUFO)",
      "5. Keterangan: berisi Diterima/Tidak Diterima (diisi oleh pemandu/pemeriksa)",
    ];
    keterangan.forEach((text, i) => {
      doc.text(text, 14, finalY + 16 + i * 4);
    });

    // Total
    doc.setFontSize(11);
    doc.text(`Total Poin: ${summary.verified}`, 14, finalY + 42);

    // Lampiran — Photo evidence
    const activitiesWithPhotos = verifiedActivities.filter((a) => a.documentationImages && a.documentationImages.length > 0);
    if (activitiesWithPhotos.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("LAMPIRAN", 105, 20, { align: "center" });
      doc.setFontSize(9);
      doc.text("Lampiran ini berisi bukti kegiatan berupa foto kegiatan yang dicantumkan di dalam Tabel Poin.", 105, 28, { align: "center" });
      doc.text("Lampiran ini sebagai syarat kegiatan bisa diterima oleh pemeriksa.", 105, 33, { align: "center" });

      let imgY = 45;
      activitiesWithPhotos.forEach((activity) => {
        if (imgY > 250) {
          doc.addPage();
          imgY = 20;
        }
        // Activity title
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${activity.activityName}`, 14, imgY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(format(new Date(activity.activityDate), "dd MMMM yyyy", { locale: id }), 14, imgY + 5);

        // Draw images
        const imgs = activity.documentationImages || [];
        let imgX = 14;
        imgs.slice(0, 4).forEach((imgData) => {
          if (imgX > 160) {
            imgX = 14;
            imgY += 40;
          }
          try {
            doc.addImage(imgData, "JPEG", imgX, imgY + 8, 35, 30);
          } catch {
            // skip if image can't be added
          }
          imgX += 40;
        });
        imgY += Math.max(45, 10 + (imgs.length > 0 ? 40 : 0));
      });
    }

    doc.save(`Buku_Poin_${myRegistrant.fullName.replace(/\s+/g, "_")}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Terverifikasi</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  // ... rest of the component (registration form, not-found state) same as before
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </MainLayout>
    );
  }

  if (!myRegistrant && !showRegister) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center p-8">
            <UserPlus className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Daftar sebagai Calon Anggota</h2>
            <p className="text-gray-600 mb-6">
              Anda belum terdaftar sebagai calon anggota. Daftarkan diri Anda untuk mulai menginput kegiatan dan melihat poin.
            </p>
            <Button onClick={() => setShowRegister(true)} className="bg-red-600 hover:bg-red-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Daftar Sekarang
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!myRegistrant && showRegister) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Form Pendaftaran Calon Anggota</CardTitle>
              <CardDescription>Lengkapi data diri Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nama Lengkap</Label><Input value={user?.name || ""} disabled className="bg-gray-50" /></div>
              <div><Label>Email</Label><Input value={user?.email || ""} disabled className="bg-gray-50" /></div>
              <div>
                <Label>Angkatan</Label>
                <Select value={regYear} onValueChange={setRegYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["2024", "2023", "2022", "2025"].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Jurusan *</Label><Input value={regMajor} onChange={(e) => setRegMajor(e.target.value)} placeholder="Contoh: Teknik Informatika" required /></div>
              <div><Label>Fakultas</Label><Input value={regFaculty} onChange={(e) => setRegFaculty(e.target.value)} placeholder="Contoh: FT" /></div>
              <div><Label>No. Telepon</Label><Input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" /></div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowRegister(false)}>Batal</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleRegister} disabled={!regMajor}>Daftar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Calon Anggota</h1>
            <p className="text-sm text-gray-500">Selamat datang, {myRegistrant?.fullName}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generatePDF} variant="outline" disabled={!activities.some((a) => a.status === "verified")}>
              <Download className="h-4 w-4 mr-2" />
              Unduh Buku Poin
            </Button>
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-2" />Tambah Kegiatan</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Form Input Kegiatan</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmitActivity} className="space-y-4">
                  <div>
                    <Label>Nama Kegiatan</Label>
                    <Input value={activityName} onChange={(e) => setActivityName(e.target.value)} placeholder="Contoh: Workshop Fotografi Dasar" required />
                  </div>
                  <div>
                    <Label>Jenis Kegiatan</Label>
                    <Select value={activityTypeId} onValueChange={setActivityTypeId}>
                      <SelectTrigger><SelectValue placeholder="Pilih jenis kegiatan" /></SelectTrigger>
                      <SelectContent>
                        {local.activityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.number}. {type.name} ({type.points} poin)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {requiresRole && (
                    <div>
                      <Label>Peran/Jabatan</Label>
                      <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Contoh: Ketua Pelaksana" required={requiresRole} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tanggal Mulai</Label><Input type="date" value={activityDate} onChange={(e) => setActivityDate(e.target.value)} required /></div>
                    <div><Label>Tanggal Selesai (opsional)</Label><Input type="date" value={activityDateEnd} onChange={(e) => setActivityDateEnd(e.target.value)} /></div>
                  </div>
                  <div>
                    <Label>Lokasi</Label>
                    <LocationSuggest value={location} onChange={setLocation} />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <Label>Dokumentasi (Foto)</Label>
                    <div className="mt-1">
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors">
                        <div className="flex flex-col items-center">
                          <Upload className="h-5 w-5 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Klik untuk upload foto</span>
                          <span className="text-xs text-gray-400">(Max 1 foto, max 1MB)</span>
                        </div>
                        <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                    {uploadError && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">{uploadError}</div>
                    )}
                    {uploadedImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt={`Dokumentasi ${idx + 1}`} className="h-16 w-full object-cover rounded-lg" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{uploadedImages.length}/1 foto</p>
                  </div>

                  {selectedType && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm text-red-700">Poin: <strong>{selectedType.points} poin</strong></p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="flex-1"><X className="h-4 w-4 mr-2" />Batal</Button>
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-2" />Simpan</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Membership Progress Card */}
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">Progress Menuju Anggota Resmi</p>
                    <p className="text-xs text-white/70">Minimum 100 poin untuk menjadi anggota UFO UGM</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{summary.verified}<span className="text-lg font-normal text-white/60"> / 100</span></p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-white/25 rounded-full h-3.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    summary.verified >= 100
                      ? "bg-yellow-300 w-full"
                      : "bg-white"
                  }`}
                  style={{ width: `${Math.min((summary.verified / 100) * 100, 100)}%` }}
                />
              </div>
              {/* Status message */}
              <p className="text-xs mt-2 text-white/80">
                {summary.verified >= 100
                  ? "Selamat! Anda telah memenuhi syarat minimum poin. Silakan hubungi PSDM untuk proses selanjutnya."
                  : summary.verified >= 75
                  ? `Tinggal ${100 - summary.verified} poin lagi! Semangat!`
                  : summary.verified >= 50
                  ? `Sudah ${summary.verified}% dari target. Teruskan!`
                  : summary.verified >= 25
                  ? `Baru ${summary.verified}% dari target. Jangan menyerah!`
                  : summary.verified > 0
                  ? `Mulai dari ${summary.verified} poin. Ayo input kegiatan!`
                  : "Belum ada poin terverifikasi. Ayo input kegiatan pertama Anda!"}
              </p>
            </div>
            {/* Quick info row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50/50">
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500">Terverifikasi</p>
                <p className="text-lg font-bold text-green-600">{summary.verified}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500">Menunggu</p>
                <p className="text-lg font-bold text-yellow-600">{summary.pending}</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-gray-500">Total Kegiatan</p>
                <p className="text-lg font-bold text-gray-900">{summary.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Kegiatan</CardTitle>
            <CardDescription>Daftar kegiatan dan status verifikasinya</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Kegiatan</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Poin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Foto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => {
                      const atype = local.activityTypes.find((t) => t.id === activity.activityTypeId);
                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">
                            {activity.activityName}
                            {activity.role && <p className="text-xs text-gray-500">Peran: {activity.role}</p>}
                          </TableCell>
                          <TableCell>{atype?.name || "-"}</TableCell>
                          <TableCell>
                            {format(new Date(activity.activityDate), "dd MMM yyyy", { locale: id })}
                            {activity.activityDateEnd && <span> - {format(new Date(activity.activityDateEnd), "dd MMM yyyy", { locale: id })}</span>}
                          </TableCell>
                          <TableCell>{activity.location}</TableCell>
                          <TableCell>{activity.points}</TableCell>
                          <TableCell>{getStatusBadge(activity.status)}</TableCell>
                          <TableCell>
                            {activity.documentationImages && activity.documentationImages.length > 0 ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <Image className="h-4 w-4" />
                                <span className="text-xs">{activity.documentationImages.length} foto</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Belum ada kegiatan yang diinput</p>
                <p className="text-sm text-gray-400 mt-1">Klik "Tambah Kegiatan" untuk memulai</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Floating motivational toast for Calon Anggota */}
      {isUser && <MotivationalToast />}
    </MainLayout>
  );
}
