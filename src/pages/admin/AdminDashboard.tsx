import { useState, useMemo } from "react";
import { useLocalData } from "@/hooks/useLocalData";
import { syncRegistrantsFromSheet } from "@/lib/googleSheets";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Users,
  Activity,
  CheckCircle,
  Clock,
  Trophy,
  BarChart3,
  Link as LinkIcon,
  Unlink,
  XCircle,
  Database,
  Plus,
  Trash2,
  MapPin,
  Edit3,
  X,
  UserCircle,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function safeCompute(local: any) {
  try {
    const registrants = local.registrants || [];
    const pemandus = local.pemandus || [];
    const activities = local.activities || [];
    const assignments = local.pemanduAssignments || [];
    const kelompoks = local.kelompoks || [];
    const kelompokAssignments = local.kelompokAssignments || [];

    const assignedKaIds = new Set(kelompokAssignments.map((a: any) => a.registrantId));
    const unassigned = registrants.filter((r: any) => !assignedKaIds.has(r.id) && r.status === "active");

    const stats = {
      users: registrants.length + pemandus.length,
      pemandus: pemandus.length,
      registrants: registrants.length,
      activities: activities.length,
      pendingActivities: activities.filter((a: any) => a.status === "pending").length,
      verifiedActivities: activities.filter((a: any) => a.status === "verified").length,
      totalPoints: activities.filter((a: any) => a.status === "verified").length((sum: number, a: any) => sum + a.points, 0),
      pemanduAssignments: assignments.length,
    };

    const recentActivities = [...activities]
      .sort((a: any, b: any) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime())
      .slice(0, 10)
      .map((a: any) => {
        const reg = registrants.find((r: any) => r.id === a.registrantId);
        const atype = (local.activityTypes || []).find((t: any) => t.id === a.activityTypeId);
        return { ...a, registrantName: reg?.fullName || "-", activityTypeName: atype?.name || "-" };
      });

    const topRegistrants = registrants
      .map((r: any) => {
        const regActivities = activities.filter((a: any) => a.registrantId === r.id && a.status === "verified");
        return { registrantId: r.id, registrantName: r.fullName, totalPoints: regActivities.reduce((sum: number, a: any) => sum + a.points, 0), activityCount: regActivities.length };
      })
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
      .slice(0, 5);

    const activityDistribution = (local.activityTypes || [])
      .map((t: any) => {
        const typeActs = activities.filter((a: any) => a.activityTypeId === t.id && a.status === "verified");
        return { activityTypeName: t.name, count: typeActs.length, totalPoints: typeActs.reduce((sum: number, a: any) => sum + a.points, 0) };
      })
      .filter((d: any) => d.count > 0)
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    const pemanduStats = pemandus.map((m: any) => {
      const pemanduKelompoks = kelompoks.filter((k: any) => (k.pemanduIds || []).includes(m.id));
      const kelompokIds = pemanduKelompoks.map((k: any) => k.id);
      const cufoCount = new Set(kelompokAssignments.filter((ka: any) => kelompokIds.includes(ka.kelompokId)).map((ka: any) => ka.registrantId)).size;
      return { pemanduId: m.id, pemanduName: m.fullName || m.name || "-", cufoCount, maxMentees: m.maxMentees || 10 };
    });

    const allAssignments = kelompokAssignments.map((ka: any) => {
      const kelompok = kelompoks.find((k: any) => k.id === ka.kelompokId);
      const reg = registrants.find((r: any) => r.id === ka.registrantId);
      const pemanduNames = kelompok ? (kelompok.pemanduIds || []).map((pid: number) => pemandus.find((p: any) => p.id === pid)?.fullName || "-").join(" & ") : "-";
      return { assignmentId: ka.id, kelompokId: ka.kelompokId, kelompokName: kelompok?.name || "-", pemanduNames, registrantId: ka.registrantId, registrantName: reg?.fullName || "-", registrantEmail: reg?.email || "-", registrantYear: reg?.year || "-", registrantMajor: reg?.major || "-" };
    });

    const kelompokData = kelompoks.map((k: any) => {
      const p1 = pemandus.find((p: any) => p.id === (k.pemanduIds || [])[0]);
      const p2 = pemandus.find((p: any) => p.id === (k.pemanduIds || [])[1]);
      const cufoCount = kelompokAssignments.filter((ka: any) => ka.kelompokId === k.id).length;
      return { ...k, pemandu1Name: p1?.fullName || "-", pemandu2Name: p2?.fullName || "-", cufoCount };
    });

    return { stats, recentActivities, topRegistrants, activityDistribution, pemanduStats, allAssignments, unassigned, registrants, pemandus, kelompokData, kelompoks, error: null };
  } catch (e: any) {
    console.error("AdminDashboard data compute error:", e);
    return { error: e.message || "Unknown error", stats: { users: 0, pemandus: 0, registrants: 0, activities: 0, pendingActivities: 0, verifiedActivities: 0, totalPoints: 0, pemanduAssignments: 0 }, recentActivities: [], topRegistrants: [], activityDistribution: [], pemanduStats: [], allAssignments: [], unassigned: [], registrants: [], pemandus: [], kelompokData: [], kelompoks: [] };
  }
}

export default function AdminDashboard() {
  const local = useLocalData();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedKelompok, setSelectedKelompok] = useState("");
  const [selectedRegistrant, setSelectedRegistrant] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // Data Management state
  const [dmTab, setDmTab] = useState<"kelompok" | "pemandu" | "verified" | "locations" | "registrants">("kelompok");
  const [showPemanduForm, setShowPemanduForm] = useState(false);
  const [showVerifiedForm, setShowVerifiedForm] = useState(false);
  const [showKelompokForm, setShowKelompokForm] = useState(false);
  const [editingPemandu, setEditingPemandu] = useState<any>(null);
  const [editingVerified, setEditingVerified] = useState<any>(null);
  const [editingKelompok, setEditingKelompok] = useState<any>(null);
  const [newLocation, setNewLocation] = useState("");
  const [pemanduForm, setPemanduForm] = useState({ fullName: "", email: "", expertise: "", maxMentees: 10 });
  const [verifiedForm, setVerifiedForm] = useState({ serialNumber: "", fullName: "", email: "", role: "pemandu" as "pemandu" | "psdm" });
  const [kelompokForm, setKelompokForm] = useState({ name: "", pemanduId1: "", pemanduId2: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: any } | null>(null);

  // Google Sheets sync state
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; skipped: number; errors: number; details: string[]; fetchedCount: number } | null>(null);
  const [showSyncLogs, setShowSyncLogs] = useState(false);

  // Get data safely with error handling
  const data = useMemo(() => safeCompute(local), [refreshTick, local]);

  const handleAssign = async () => {
    if (!selectedKelompok || !selectedRegistrant) return;
    await local.assignRegistrantToKelompok(Number(selectedRegistrant), Number(selectedKelompok));
    setRefreshTick((t) => t + 1);
    setSelectedKelompok("");
    setSelectedRegistrant("");
  };

  const handleRemove = async (registrantId: number) => {
    await local.removeRegistrantFromKelompok(registrantId);
    setRefreshTick((t) => t + 1);
  };

  // ─── Google Sheets Sync ──────────────────────────────────────────
  const handleSyncSheets = async (updateExisting = false) => {
    setSyncStatus("syncing");
    setSyncResult(null);
    setShowSyncLogs(false);
    const result = await syncRegistrantsFromSheet(updateExisting);
    setSyncResult(result);
    setSyncStatus(result.errors > 0 ? "error" : "done");
    if (result.added > 0 || result.updated > 0) refreshData();
  };

  // ─── Data Management Handlers ────────────────────────────────────
  const refreshData = () => setRefreshTick((t) => t + 1);

  const handleSavePemandu = async () => {
    if (!pemanduForm.fullName.trim() || !pemanduForm.email.trim()) return;
    if (editingPemandu) {
      await local.updatePemandu(editingPemandu.id, {
        fullName: pemanduForm.fullName.trim(),
        email: pemanduForm.email.trim(),
        expertise: pemanduForm.expertise.trim(),
        maxMentees: Number(pemanduForm.maxMentees) || 10,
      });
    } else {
      await local.addPemandu({
        userId: 0,
        fullName: pemanduForm.fullName.trim(),
        email: pemanduForm.email.trim(),
        expertise: pemanduForm.expertise.trim(),
        maxMentees: Number(pemanduForm.maxMentees) || 10,
      });
    }
    setShowPemanduForm(false);
    setEditingPemandu(null);
    setPemanduForm({ fullName: "", email: "", expertise: "", maxMentees: 10 });
    refreshData();
  };

  const handleDeletePemandu = async (id: number) => {
    await local.deletePemandu(id);
    setDeleteConfirm(null);
    refreshData();
  };

  const handleSaveVerified = async () => {
    if (!verifiedForm.serialNumber.trim() || !verifiedForm.fullName.trim()) return;
    if (editingVerified) {
      await local.updateVerifiedMember(editingVerified.nsa, {
        serialNumber: verifiedForm.serialNumber.trim(),
        fullName: verifiedForm.fullName.trim(),
        email: verifiedForm.email.trim(),
        role: verifiedForm.role,
      });
    } else {
      try {
        await local.addVerifiedMember({
          serialNumber: verifiedForm.serialNumber.trim(),
          fullName: verifiedForm.fullName.trim(),
          email: verifiedForm.email.trim(),
          role: verifiedForm.role,
        });
      } catch (e: any) {
        alert(e.message);
        return;
      }
    }
    setShowVerifiedForm(false);
    setEditingVerified(null);
    setVerifiedForm({ serialNumber: "", fullName: "", email: "", role: "pemandu" });
    refreshData();
  };

  const handleDeleteVerified = async (serialNumber: string) => {
    await local.deleteVerifiedMember(serialNumber);
    setDeleteConfirm(null);
    refreshData();
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;
    await local.addLocation(newLocation.trim());
    setNewLocation("");
    refreshData();
  };

  const handleDeleteLocation = async (name: string) => {
    await local.deleteLocation(name);
    refreshData();
  };

  const handleDeleteRegistrant = async (id: number) => {
    await local.deleteRegistrant(id);
    setDeleteConfirm(null);
    refreshData();
  };

  // ─── Kelompok CRUD Handlers ──────────────────────────────────────
  const [kelompokSaving, setKelompokSaving] = useState(false);
  const [kelompokError, setKelompokError] = useState("");

  const handleSaveKelompok = async () => {
    setKelompokError("");

    if (!kelompokForm.name.trim()) { setKelompokError("Nama kelompok wajib diisi"); return; }
    if (!kelompokForm.pemanduId1) { setKelompokError("Pemandu 1 wajib dipilih"); return; }
    if (!kelompokForm.pemanduId2) { setKelompokError("Pemandu 2 wajib dipilih"); return; }
    if (kelompokForm.pemanduId1 === kelompokForm.pemanduId2) { setKelompokError("Pemandu 1 dan 2 harus berbeda"); return; }

    setKelompokSaving(true);
    try {
      const pemanduIds = [Number(kelompokForm.pemanduId1), Number(kelompokForm.pemanduId2)];
      if (editingKelompok) {
        await local.updateKelompok(editingKelompok.id, { name: kelompokForm.name.trim(), pemanduIds });
      } else {
        await local.addKelompok({ name: kelompokForm.name.trim(), pemanduIds });
      }
      setShowKelompokForm(false);
      setEditingKelompok(null);
      setKelompokForm({ name: "", pemanduId1: "", pemanduId2: "" });
      refreshData();
    } catch (e: any) {
      console.error("[handleSaveKelompok] Error:", e);
      setKelompokError(e?.message || "Gagal menyimpan kelompok. Cek koneksi database.");
    } finally {
      setKelompokSaving(false);
    }
  };

  const handleDeleteKelompok = async (id: number) => {
    await local.deleteKelompok(id);
    setDeleteConfirm(null);
    refreshData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Terverifikasi</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {data.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 text-sm">Terjadi kesalahan saat memuat data</p>
              <p className="text-red-600 text-xs mt-1">{data.error}</p>
              <p className="text-red-500 text-xs mt-1">Silakan refresh halaman atau hubungi pengembang.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Panel PSDM (Admin)</h1>
          </div>
          <p className="text-sm text-gray-500">Monitoring sistem dan manajemen pemandu - calon anggota</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Calon Anggota", value: data.stats.registrants, color: "text-purple-600", icon: Users },
            { label: "Pemandu", value: data.stats.pemandus, color: "text-green-600", icon: Users },
            { label: "Total Kegiatan", value: data.stats.activities, color: "text-red-600", icon: Activity },
            { label: "Total Poin", value: data.stats.totalPoints, color: "text-yellow-600", icon: Trophy },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-gray-500">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
                  <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex h-auto overflow-x-auto whitespace-nowrap scrollbar-hide w-full">
            <TabsTrigger value="overview" className="shrink-0"><BarChart3 className="h-4 w-4 mr-1.5 shrink-0" />Overview</TabsTrigger>
            <TabsTrigger value="pemandu-mapping" className="shrink-0"><LinkIcon className="h-4 w-4 mr-1.5 shrink-0" />Pemetaan</TabsTrigger>
            <TabsTrigger value="activities" className="shrink-0"><Activity className="h-4 w-4 mr-1.5 shrink-0" />Kegiatan</TabsTrigger>
            <TabsTrigger value="data-management" className="shrink-0"><Database className="h-4 w-4 mr-1.5 shrink-0" />Data</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Google Sheets Sync Card */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Sinkronisasi Google Form
                </CardTitle>
                <CardDescription>
                  Tarik data pendaftar dari Google Spreadsheet "OPEN RECRUITMENT CUFO XXXIV" ke database.
                  Sinkron baru = hanya tambah data baru. Sinkron ulang = juga perbarui data yang sudah ada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                  <Button
                    onClick={() => handleSyncSheets(false)}
                    disabled={syncStatus === "syncing"}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {syncStatus === "syncing" ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {syncStatus === "syncing" ? "Menyinkronkan..." : "Sinkron Baru"}
                  </Button>
                  <Button
                    onClick={() => handleSyncSheets(true)}
                    disabled={syncStatus === "syncing"}
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sinkron Ulang (Update Data)
                  </Button>
                  {syncStatus === "done" && syncResult && (
                    <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      {syncResult.fetchedCount} dibaca, {syncResult.added} ditambahkan, {syncResult.updated || 0} diperbarui
                    </span>
                  )}
                  {syncStatus === "error" && syncResult && (
                    <span className="text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full">
                      {syncResult.fetchedCount} dibaca, {syncResult.errors} error
                    </span>
                  )}
                  {syncResult && syncResult.details.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSyncLogs((v) => !v)}
                      className="text-xs text-gray-500"
                    >
                      {showSyncLogs ? "Sembunyikan Log" : "Lihat Log"}
                    </Button>
                  )}
                </div>
                {/* Detailed Logs */}
                {showSyncLogs && syncResult && (
                  <div className="mt-3 p-3 bg-gray-900 rounded-lg max-h-60 overflow-y-auto">
                    <div className="font-mono text-xs space-y-0.5">
                      {syncResult.details.map((log, i) => (
                        <div
                          key={i}
                          className={
                            log.startsWith("Error") || log.startsWith("Insert error") || log.startsWith("Fetch error")
                              ? "text-red-400"
                              : log.startsWith("Berhasil") || log.includes("ditambahkan")
                              ? "text-green-400"
                              : log.startsWith("Selesai")
                              ? "text-yellow-400 font-bold"
                              : "text-gray-400"
                          }
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Quick error hint */}
                {syncStatus === "error" && syncResult && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-medium">Troubleshooting:</p>
                    <ul className="text-xs text-red-600 mt-1 list-disc list-inside space-y-0.5">
                      <li>Pastikan spreadsheet diatur ke "Siapa saja yang memiliki link dapat melihat"</li>
                      <li>Pastikan kolom registrants di Supabase sudah ada (jalankan schema SQL)</li>
                      <li>Klik "Lihat Log" di atas untuk detail error</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-red-600" />Kegiatan Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {data.recentActivities.slice(0, 5).map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{a.activityName}</p>
                            <p className="text-xs text-gray-500">{a.registrantName} - {a.activityTypeName}</p>
                          </div>
                          {getStatusBadge(a.status)}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-gray-500 py-4">Belum ada kegiatan</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-600" />Top Calon Anggota</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.topRegistrants.length > 0 ? (
                    <div className="space-y-3">
                      {data.topRegistrants.map((reg, idx) => (
                        <div key={reg.registrantId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-yellow-100 text-yellow-700" : idx === 1 ? "bg-gray-200 text-gray-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>{idx + 1}</span>
                            <div>
                              <p className="font-medium text-sm">{reg.registrantName}</p>
                              <p className="text-xs text-gray-500">{reg.activityCount} kegiatan</p>
                            </div>
                          </div>
                          <span className="font-bold text-red-600">{reg.totalPoints} pts</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-center text-gray-500 py-4">Belum ada data</p>}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-purple-600" />Distribusi Kegiatan</CardTitle>
              </CardHeader>
              <CardContent>
                {data.activityDistribution.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Jenis Kegiatan</TableHead><TableHead>Jumlah</TableHead><TableHead>Total Poin</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.activityDistribution.slice(0, 10).map((item, i) => (
                          <TableRow key={i}><TableCell>{item.activityTypeName}</TableCell><TableCell>{item.count}</TableCell><TableCell>{item.totalPoints}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : <p className="text-center text-gray-500 py-4">Belum ada data</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pemandu Mapping — now Kelompok-based */}
          <TabsContent value="pemandu-mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tugaskan CUFO ke Kelompok</CardTitle>
                <CardDescription>Pilih kelompok dan CUFO. CUFO akan otomatis ditugaskan ke 2 pemandu dalam kelompok tersebut.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => { e.preventDefault(); handleAssign(); }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <label className="text-sm font-medium mb-2 block">Kelompok</label>
                    <select
                      value={selectedKelompok}
                      onChange={(e) => setSelectedKelompok(e.target.value)}
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white appearance-none"
                    >
                      <option value="">Pilih kelompok</option>
                      {data.kelompokData.map((k: any) => (
                        <option key={k.id} value={k.id.toString()}>
                          {k.name} ({k.pemandu1Name} & {k.pemandu2Name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">CUFO (Belum Ditugaskan)</label>
                    <select
                      value={selectedRegistrant}
                      onChange={(e) => setSelectedRegistrant(e.target.value)}
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white appearance-none"
                    >
                      <option value="">Pilih CUFO</option>
                      {data.unassigned.map((r) => <option key={r.id} value={r.id.toString()}>{r.fullName} ({r.year})</option>)}
                    </select>
                  </div>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700"><LinkIcon className="h-4 w-4 mr-2" />Tugaskan</Button>
                </form>

                {data.pemanduStats.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Kapasitas Pemandu</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {data.pemanduStats.map((ms: any) => (
                        <div key={ms.pemanduId} className={`p-3 rounded-lg border ${ms.cufoCount >= ms.maxMentees ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                          <p className="text-sm font-medium truncate">{ms.pemanduName}</p>
                          <p className="text-xs text-gray-500">{ms.cufoCount} / {ms.maxMentees} CUFO</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className={`h-1.5 rounded-full ${ms.cufoCount >= ms.maxMentees ? "bg-red-500" : "bg-red-500"}`} style={{ width: `${Math.min((ms.cufoCount / ms.maxMentees) * 100, 100)}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Pemetaan Aktif</CardTitle>
                <CardDescription>Semua pemetaan kelompok - CUFO (2 pemandu per kelompok)</CardDescription>
              </CardHeader>
              <CardContent>
                {data.allAssignments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Kelompok</TableHead><TableHead>Pemandu</TableHead><TableHead>CUFO</TableHead><TableHead>Angkatan</TableHead><TableHead>Jurusan</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.allAssignments.map((a) => (
                          <TableRow key={a.assignmentId}>
                            <TableCell className="font-medium">{a.kelompokName}</TableCell>
                            <TableCell className="text-xs text-gray-600">{a.pemanduNames}</TableCell>
                            <TableCell>{a.registrantName}</TableCell>
                            <TableCell>{a.registrantYear}</TableCell>
                            <TableCell>{a.registrantMajor}</TableCell>
                            <TableCell><Button size="sm" variant="ghost" onClick={() => handleRemove(a.registrantId)}><Unlink className="h-4 w-4 text-red-500" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8"><LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Belum ada pemetaan</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Semua Kegiatan</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentActivities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Nama Kegiatan</TableHead><TableHead>Calon Anggota</TableHead><TableHead>Jenis</TableHead><TableHead>Poin</TableHead><TableHead>Status</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentActivities.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.activityName}</TableCell>
                            <TableCell>{a.registrantName}</TableCell>
                            <TableCell>{a.activityTypeName}</TableCell>
                            <TableCell>{a.points}</TableCell>
                            <TableCell>{getStatusBadge(a.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : <p className="text-center text-gray-500 py-8">Belum ada kegiatan</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data-management" className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "kelompok", label: "Kelompok", icon: UserCircle },
                { key: "pemandu", label: "Pemandu", icon: Users },
                { key: "verified", label: "Anggota Terverifikasi", icon: Shield },
                { key: "locations", label: "Lokasi", icon: MapPin },
                { key: "registrants", label: "Calon Anggota", icon: Users },
              ].map((t) => (
                <Button
                  key={t.key}
                  variant={dmTab === t.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDmTab(t.key as any)}
                  className={dmTab === t.key ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  <t.icon className="h-4 w-4 mr-1.5" />{t.label}
                </Button>
              ))}
            </div>

            {/* ─── Kelompok Management ─── */}
            {dmTab === "kelompok" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>Daftar Kelompok</CardTitle><CardDescription>Kelola kelompok CUFO (2 pemandu per kelompok)</CardDescription></div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { setEditingKelompok(null); setKelompokForm({ name: "", pemanduId1: "", pemanduId2: "" }); setShowKelompokForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Tambah
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Nama Kelompok</TableHead><TableHead>Pemandu 1</TableHead><TableHead>Pemandu 2</TableHead><TableHead>Jumlah CUFO</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.kelompokData.map((k: any) => (
                          <TableRow key={k.id}>
                            <TableCell className="font-medium">{k.name}</TableCell>
                            <TableCell>{k.pemandu1Name}</TableCell>
                            <TableCell>{k.pemandu2Name}</TableCell>
                            <TableCell>{k.cufoCount} CUFO</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setEditingKelompok(k); setKelompokForm({ name: k.name, pemanduId1: k.pemanduIds[0]?.toString() || "", pemanduId2: k.pemanduIds[1]?.toString() || "" }); setShowKelompokForm(true); }}>
                                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "kelompok", id: k.id })}>
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {data.kelompokData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p>Belum ada kelompok. Tambahkan kelompok terlebih dahulu.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── Pemandu Management ─── */}
            {dmTab === "pemandu" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>Daftar Pemandu</CardTitle><CardDescription>Kelola pemandu yang bertanggung jawab atas CUFO</CardDescription></div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { setEditingPemandu(null); setPemanduForm({ fullName: "", email: "", expertise: "", maxMentees: 10 }); setShowPemanduForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Tambah
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Nama</TableHead><TableHead>NSA</TableHead><TableHead>Keahlian</TableHead><TableHead>Kapasitas</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.pemandus.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.fullName}</TableCell>
                            <TableCell className="font-mono text-xs">{(p as any).nsa || p.email}</TableCell>
                            <TableCell>{p.expertise || "-"}</TableCell>
                            <TableCell>{p.maxMentees} CUFO</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setEditingPemandu(p); setPemanduForm({ fullName: p.fullName, email: p.email, expertise: p.expertise || "", maxMentees: p.maxMentees }); setShowPemanduForm(true); }}>
                                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "pemandu", id: p.id })}>
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Verified Members Management ─── */}
            {dmTab === "verified" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>Anggota Terverifikasi</CardTitle><CardDescription>Daftar orang yang boleh mendaftar sebagai Pemandu atau PSDM</CardDescription></div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { setEditingVerified(null); setVerifiedForm({ serialNumber: "", fullName: "", email: "", role: "pemandu" }); setShowVerifiedForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Tambah
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Nomor Seri</TableHead><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {local.verifiedMembers.map((v) => (
                          <TableRow key={v.nsa}>
                            <TableCell className="font-mono text-xs">{v.nsa}</TableCell>
                            <TableCell className="font-medium">{v.name}</TableCell>
                            <TableCell>{v.email || "-"}</TableCell>
                            <TableCell><Badge className={v.role === "psdm" || v.role === "psdm_pemandu" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}>{v.role === "psdm" || v.role === "psdm_pemandu" ? "PSDM" : "Pemandu"}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setEditingVerified(v); setVerifiedForm({ serialNumber: v.nsa, fullName: v.name, email: v.email || "", role: v.role === "psdm" || v.role === "psdm_pemandu" ? "psdm" : "pemandu" }); setShowVerifiedForm(true); }}>
                                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "verified", id: v.nsa })}>
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Locations Management ─── */}
            {dmTab === "locations" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Daftar Lokasi</CardTitle>
                  <CardDescription>Kelola lokasi yang muncul di autocomplete saat input kegiatan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Nama lokasi baru..." onKeyDown={(e) => e.key === "Enter" && handleAddLocation()} />
                    <Button onClick={handleAddLocation} className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {local.locations.map((loc) => (
                      <div key={loc} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-sm truncate pr-2">{loc}</span>
                        <button onClick={() => handleDeleteLocation(loc)} className="text-gray-400 hover:text-red-500 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Registrants Management ─── */}
            {dmTab === "registrants" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Daftar Calon Anggota</CardTitle>
                  <CardDescription>Kelola calon anggota yang terdaftar di sistem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>NIM</TableHead>
                          <TableHead>Angkatan</TableHead>
                          <TableHead>Jurusan</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>Asal Daerah</TableHead>
                          <TableHead>Domisili</TableHead>
                          <TableHead>Genre Foto</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.registrants.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.fullName}</TableCell>
                            <TableCell>{r.email}</TableCell>
                            <TableCell className="font-mono text-xs">{r.nim}</TableCell>
                            <TableCell>{r.year}</TableCell>
                            <TableCell>{r.major}</TableCell>
                            <TableCell>{r.whatsapp || "-"}</TableCell>
                            <TableCell>{r.asalDaerah || "-"}</TableCell>
                            <TableCell>{r.domisili || "-"}</TableCell>
                            <TableCell>{r.genreFoto || "-"}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "registrant", id: r.id })}>
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Pemandu Form Dialog ─── */}
            <Dialog open={showPemanduForm} onOpenChange={setShowPemanduForm}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingPemandu ? "Edit Pemandu" : "Tambah Pemandu"}</DialogTitle></DialogHeader>
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSavePemandu(); }}
                  className="space-y-4"
                >
                  <div><Label>Nama Lengkap *</Label><Input value={pemanduForm.fullName} onChange={(e) => setPemanduForm({ ...pemanduForm, fullName: e.target.value })} placeholder="Nama pemandu" required /></div>
                  <div><Label>Email *</Label><Input type="email" value={pemanduForm.email} onChange={(e) => setPemanduForm({ ...pemanduForm, email: e.target.value })} placeholder="email@ugm.ac.id" required /></div>
                  <div><Label>Keahlian</Label><Input value={pemanduForm.expertise} onChange={(e) => setPemanduForm({ ...pemanduForm, expertise: e.target.value })} placeholder="Contoh: Fotografi Jurnalistik" /></div>
                  <div><Label>Kapasitas CUFO</Label><Input type="number" value={pemanduForm.maxMentees} onChange={(e) => setPemanduForm({ ...pemanduForm, maxMentees: Number(e.target.value) })} /></div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPemanduForm(false)}>Batal</Button>
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                      {editingPemandu ? "Simpan Perubahan" : "Tambah Pemandu"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* ─── Verified Member Form Dialog ─── */}
            <Dialog open={showVerifiedForm} onOpenChange={setShowVerifiedForm}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingVerified ? "Edit Anggota Terverifikasi" : "Tambah Anggota Terverifikasi"}</DialogTitle></DialogHeader>
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSaveVerified(); }}
                  className="space-y-4"
                >
                  <div><Label>Nomor Seri Anggota *</Label><Input value={verifiedForm.serialNumber} onChange={(e) => setVerifiedForm({ ...verifiedForm, serialNumber: e.target.value })} placeholder="Contoh: UFO-2024-003" disabled={!!editingVerified} required /></div>
                  <div><Label>Nama Lengkap *</Label><Input value={verifiedForm.fullName} onChange={(e) => setVerifiedForm({ ...verifiedForm, fullName: e.target.value })} placeholder="Nama lengkap" required /></div>
                  <div><Label>Email</Label><Input type="email" value={verifiedForm.email} onChange={(e) => setVerifiedForm({ ...verifiedForm, email: e.target.value })} placeholder="email@ugm.ac.id" /></div>
                  <div><Label>Role</Label>
                    <select
                      value={verifiedForm.role}
                      onChange={(e) => setVerifiedForm({ ...verifiedForm, role: e.target.value as "pemandu" | "psdm" })}
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white appearance-none"
                    >
                      <option value="pemandu">Pemandu</option>
                      <option value="psdm">PSDM (Admin)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowVerifiedForm(false)}>Batal</Button>
                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                      {editingVerified ? "Simpan Perubahan" : "Tambah"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* ─── Kelompok Form Dialog ─── */}
            <Dialog open={showKelompokForm} onOpenChange={setShowKelompokForm}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingKelompok ? "Edit Kelompok" : "Tambah Kelompok"}</DialogTitle></DialogHeader>
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSaveKelompok(); }}
                  className="space-y-4"
                >
                  {/* Error display */}
                  {kelompokError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {kelompokError}
                    </div>
                  )}
                  <div>
                    <Label>Nama Kelompok *</Label>
                    <Input
                      value={kelompokForm.name}
                      onChange={(e) => { setKelompokError(""); setKelompokForm({ ...kelompokForm, name: e.target.value }); }}
                      placeholder="Contoh: Kelompok 1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Pemandu 1 *</Label>
                    <select
                      value={kelompokForm.pemanduId1}
                      onChange={(e) => { setKelompokError(""); setKelompokForm({ ...kelompokForm, pemanduId1: e.target.value }); }}
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      required
                    >
                      <option value="">Pilih pemandu</option>
                      {data.pemandus.map((p) => (
                        <option key={p.id} value={p.id.toString()}>{p.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Pemandu 2 *</Label>
                    <select
                      value={kelompokForm.pemanduId2}
                      onChange={(e) => { setKelompokError(""); setKelompokForm({ ...kelompokForm, pemanduId2: e.target.value }); }}
                      className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      required
                    >
                      <option value="">Pilih pemandu</option>
                      {data.pemandus.map((p) => (
                        <option key={p.id} value={p.id.toString()}>{p.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setKelompokError(""); setShowKelompokForm(false); }}
                      disabled={kelompokSaving}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={kelompokSaving}
                    >
                      {kelompokSaving ? "Menyimpan..." : editingKelompok ? "Simpan" : "Tambah"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* ─── Delete Confirmation Dialog ─── */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle></DialogHeader>
                <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus {deleteConfirm?.type === "kelompok" ? "kelompok ini" : deleteConfirm?.type === "pemandu" ? "pemandu ini" : deleteConfirm?.type === "verified" ? "anggota terverifikasi ini" : "calon anggota ini"}? Data yang terkait juga akan dihapus.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (deleteConfirm?.type === "kelompok") handleDeleteKelompok(deleteConfirm.id);
                    else if (deleteConfirm?.type === "pemandu") handleDeletePemandu(deleteConfirm.id);
                    else if (deleteConfirm?.type === "verified") handleDeleteVerified(deleteConfirm.id);
                    else if (deleteConfirm?.type === "registrant") handleDeleteRegistrant(deleteConfirm.id);
                  }}
                  className="flex gap-2 pt-2"
                >
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Batal</Button>
                  <Button type="submit" variant="destructive" className="flex-1">Hapus</Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
