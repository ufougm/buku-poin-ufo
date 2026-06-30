import { useState, useMemo } from "react";
import { useLocalData } from "@/hooks/useLocalData";
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function AdminDashboard() {
  const local = useLocalData();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPemandu, setSelectedPemandu] = useState("");
  const [selectedRegistrant, setSelectedRegistrant] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // Data Management state
  const [dmTab, setDmTab] = useState<"pemandu" | "verified" | "locations" | "registrants">("pemandu");
  const [showPemanduForm, setShowPemanduForm] = useState(false);
  const [showVerifiedForm, setShowVerifiedForm] = useState(false);
  const [editingPemandu, setEditingPemandu] = useState<any>(null);
  const [editingVerified, setEditingVerified] = useState<any>(null);
  const [newLocation, setNewLocation] = useState("");
  const [pemanduForm, setPemanduForm] = useState({ fullName: "", email: "", expertise: "", maxMentees: 10 });
  const [verifiedForm, setVerifiedForm] = useState({ serialNumber: "", fullName: "", email: "", role: "pemandu" as "pemandu" | "psdm" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: any } | null>(null);

  // Get data from localStorage
  const data = useMemo(() => {
    const registrants = local.registrants;
    const pemandus = local.pemandus;
    const activities = local.activities;
    const assignments = local.assignments;

    // Unassigned registrants
    const assignedIds = new Set(assignments.map((a) => a.registrantId));
    const unassigned = registrants.filter((r) => !assignedIds.has(r.id) && r.status === "active");

    // Stats
    const stats = {
      users: registrants.length + pemandus.length,
      pemandus: pemandus.length,
      registrants: registrants.length,
      activities: activities.length,
      pendingActivities: activities.filter((a) => a.status === "pending").length,
      verifiedActivities: activities.filter((a) => a.status === "verified").length,
      totalPoints: activities.filter((a) => a.status === "verified").reduce((sum, a) => sum + a.points, 0),
      pemanduAssignments: assignments.length,
    };

    // Recent activities with names
    const recentActivities = [...activities]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10)
      .map((a) => {
        const reg = registrants.find((r) => r.id === a.registrantId);
        const atype = local.activityTypes.find((t) => t.id === a.activityTypeId);
        return { ...a, registrantName: reg?.fullName || "-", activityTypeName: atype?.name || "-" };
      });

    // Top registrants by verified points
    const topRegistrants = registrants
      .map((r) => {
        const regActivities = activities.filter((a) => a.registrantId === r.id && a.status === "verified");
        return {
          registrantId: r.id,
          registrantName: r.fullName,
          totalPoints: regActivities.reduce((sum, a) => sum + a.points, 0),
          activityCount: regActivities.length,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5);

    // Activity distribution
    const activityDistribution = local.activityTypes
      .map((t) => {
        const typeActs = activities.filter((a) => a.activityTypeId === t.id && a.status === "verified");
        return { activityTypeName: t.name, count: typeActs.length, totalPoints: typeActs.reduce((sum, a) => sum + a.points, 0) };
      })
      .filter((d) => d.count > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Pemandu stats
    const pemanduStats = pemandus.map((m) => {
      const cufoCount = assignments.filter((a) => a.pemanduId === m.id).length;
      return { pemanduId: m.id, pemanduName: m.fullName, cufoCount, maxMentees: m.maxMentees };
    });

    // All assignments with names
    const allAssignments = assignments.map((a) => {
      const pemandu = pemandus.find((m) => m.id === a.pemanduId);
      const reg = registrants.find((r) => r.id === a.registrantId);
      return { assignmentId: a.id, pemanduId: a.pemanduId, pemanduName: pemandu?.fullName || "-", pemanduEmail: pemandu?.email || "-", registrantId: a.registrantId, registrantName: reg?.fullName || "-", registrantEmail: reg?.email || "-", registrantYear: reg?.year || "-", registrantMajor: reg?.major || "-" };
    });

    return { stats, recentActivities, topRegistrants, activityDistribution, pemanduStats, allAssignments, unassigned, registrants, pemandus };
  }, [refreshTick]);

  const handleAssign = () => {
    if (!selectedPemandu || !selectedRegistrant) return;
    local.addAssignment(Number(selectedPemandu), Number(selectedRegistrant));
    setRefreshTick((t) => t + 1);
    setSelectedPemandu("");
    setSelectedRegistrant("");
  };

  const handleRemove = (assignmentId: number) => {
    local.removeAssignment(assignmentId);
    setRefreshTick((t) => t + 1);
  };

  // ─── Data Management Handlers ────────────────────────────────────
  const refreshData = () => setRefreshTick((t) => t + 1);

  const handleSavePemandu = () => {
    if (!pemanduForm.fullName.trim() || !pemanduForm.email.trim()) return;
    if (editingPemandu) {
      local.updatePemandu(editingPemandu.id, {
        fullName: pemanduForm.fullName.trim(),
        email: pemanduForm.email.trim(),
        expertise: pemanduForm.expertise.trim(),
        maxMentees: Number(pemanduForm.maxMentees) || 10,
      });
    } else {
      local.addPemandu({
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

  const handleDeletePemandu = (id: number) => {
    local.deletePemandu(id);
    setDeleteConfirm(null);
    refreshData();
  };

  const handleSaveVerified = () => {
    if (!verifiedForm.serialNumber.trim() || !verifiedForm.fullName.trim()) return;
    if (editingVerified) {
      local.updateVerifiedMember(editingVerified.serialNumber, {
        serialNumber: verifiedForm.serialNumber.trim(),
        fullName: verifiedForm.fullName.trim(),
        email: verifiedForm.email.trim(),
        role: verifiedForm.role,
      });
    } else {
      try {
        local.addVerifiedMember({
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

  const handleDeleteVerified = (serialNumber: string) => {
    local.deleteVerifiedMember(serialNumber);
    setDeleteConfirm(null);
    refreshData();
  };

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    local.addLocation(newLocation.trim());
    setNewLocation("");
    refreshData();
  };

  const handleDeleteLocation = (name: string) => {
    local.deleteLocation(name);
    refreshData();
  };

  const handleDeleteRegistrant = (id: number) => {
    local.deleteRegistrant(id);
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
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="pemandu-mapping"><LinkIcon className="h-4 w-4 mr-2" />Pemetaan Pemandu</TabsTrigger>
            <TabsTrigger value="activities"><Activity className="h-4 w-4 mr-2" />Kegiatan</TabsTrigger>
            <TabsTrigger value="data-management"><Database className="h-4 w-4 mr-2" />Manajemen Data</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
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

          {/* Pemandu Mapping */}
          <TabsContent value="pemandu-mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tugaskan Pemandu ke Calon Anggota</CardTitle>
                <CardDescription>Pilih pemandu dan calon anggota untuk membuat pemetaan baru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Pemandu</label>
                    <Select value={selectedPemandu} onValueChange={setSelectedPemandu}>
                      <SelectTrigger><SelectValue placeholder="Pilih pemandu" /></SelectTrigger>
                      <SelectContent>
                        {data.pemandus.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Calon Anggota (Belum Punya Pemandu)</label>
                    <Select value={selectedRegistrant} onValueChange={setSelectedRegistrant}>
                      <SelectTrigger><SelectValue placeholder="Pilih calon anggota" /></SelectTrigger>
                      <SelectContent>
                        {data.unassigned.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.fullName} ({r.year})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAssign} disabled={!selectedPemandu || !selectedRegistrant} className="bg-red-600 hover:bg-red-700"><LinkIcon className="h-4 w-4 mr-2" />Tugaskan</Button>
                </div>

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
                <CardDescription>Semua pemetaan pemandu - calon anggota</CardDescription>
              </CardHeader>
              <CardContent>
                {data.allAssignments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Pemandu</TableHead><TableHead>Calon Anggota</TableHead><TableHead>Angkatan</TableHead><TableHead>Jurusan</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.allAssignments.map((a) => (
                          <TableRow key={a.assignmentId}>
                            <TableCell className="font-medium">{a.pemanduName}</TableCell>
                            <TableCell>{a.registrantName}</TableCell>
                            <TableCell>{a.registrantYear}</TableCell>
                            <TableCell>{a.registrantMajor}</TableCell>
                            <TableCell><Button size="sm" variant="ghost" onClick={() => handleRemove(a.assignmentId)}><Unlink className="h-4 w-4 text-red-500" /></Button></TableCell>
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
                        <TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Keahlian</TableHead><TableHead>Kapasitas</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.pemandus.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.fullName}</TableCell>
                            <TableCell>{p.email}</TableCell>
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
                          <TableRow key={v.serialNumber}>
                            <TableCell className="font-mono text-xs">{v.serialNumber}</TableCell>
                            <TableCell className="font-medium">{v.fullName}</TableCell>
                            <TableCell>{v.email}</TableCell>
                            <TableCell><Badge className={v.role === "psdm" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}>{v.role === "psdm" ? "PSDM" : "Pemandu"}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { setEditingVerified(v); setVerifiedForm({ serialNumber: v.serialNumber, fullName: v.fullName, email: v.email, role: v.role }); setShowVerifiedForm(true); }}>
                                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: "verified", id: v.serialNumber })}>
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
                        <TableRow><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Angkatan</TableHead><TableHead>Jurusan</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.registrants.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.fullName}</TableCell>
                            <TableCell>{r.email}</TableCell>
                            <TableCell>{r.year}</TableCell>
                            <TableCell>{r.major}</TableCell>
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
                <div className="space-y-4">
                  <div><Label>Nama Lengkap *</Label><Input value={pemanduForm.fullName} onChange={(e) => setPemanduForm({ ...pemanduForm, fullName: e.target.value })} placeholder="Nama pemandu" /></div>
                  <div><Label>Email *</Label><Input type="email" value={pemanduForm.email} onChange={(e) => setPemanduForm({ ...pemanduForm, email: e.target.value })} placeholder="email@ugm.ac.id" /></div>
                  <div><Label>Keahlian</Label><Input value={pemanduForm.expertise} onChange={(e) => setPemanduForm({ ...pemanduForm, expertise: e.target.value })} placeholder="Contoh: Fotografi Jurnalistik" /></div>
                  <div><Label>Kapasitas CUFO</Label><Input type="number" value={pemanduForm.maxMentees} onChange={(e) => setPemanduForm({ ...pemanduForm, maxMentees: Number(e.target.value) })} /></div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowPemanduForm(false)}>Batal</Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleSavePemandu} disabled={!pemanduForm.fullName.trim() || !pemanduForm.email.trim()}>
                      {editingPemandu ? "Simpan Perubahan" : "Tambah Pemandu"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* ─── Verified Member Form Dialog ─── */}
            <Dialog open={showVerifiedForm} onOpenChange={setShowVerifiedForm}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingVerified ? "Edit Anggota Terverifikasi" : "Tambah Anggota Terverifikasi"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nomor Seri Anggota *</Label><Input value={verifiedForm.serialNumber} onChange={(e) => setVerifiedForm({ ...verifiedForm, serialNumber: e.target.value })} placeholder="Contoh: UFO-2024-003" disabled={!!editingVerified} /></div>
                  <div><Label>Nama Lengkap *</Label><Input value={verifiedForm.fullName} onChange={(e) => setVerifiedForm({ ...verifiedForm, fullName: e.target.value })} placeholder="Nama lengkap" /></div>
                  <div><Label>Email</Label><Input type="email" value={verifiedForm.email} onChange={(e) => setVerifiedForm({ ...verifiedForm, email: e.target.value })} placeholder="email@ugm.ac.id" /></div>
                  <div><Label>Role</Label>
                    <select value={verifiedForm.role} onChange={(e) => setVerifiedForm({ ...verifiedForm, role: e.target.value as "pemandu" | "psdm" })} className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm">
                      <option value="pemandu">Pemandu</option>
                      <option value="psdm">PSDM (Admin)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowVerifiedForm(false)}>Batal</Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleSaveVerified} disabled={!verifiedForm.serialNumber.trim() || !verifiedForm.fullName.trim()}>
                      {editingVerified ? "Simpan Perubahan" : "Tambah"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* ─── Delete Confirmation Dialog ─── */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle></DialogHeader>
                <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus {deleteConfirm?.type === "pemandu" ? "pemandu ini" : deleteConfirm?.type === "verified" ? "anggota terverifikasi ini" : "calon anggota ini"}? Data yang terkait juga akan dihapus.</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Batal</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => {
                    if (deleteConfirm?.type === "pemandu") handleDeletePemandu(deleteConfirm.id);
                    else if (deleteConfirm?.type === "verified") handleDeleteVerified(deleteConfirm.id);
                    else if (deleteConfirm?.type === "registrant") handleDeleteRegistrant(deleteConfirm.id);
                  }}>Hapus</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
