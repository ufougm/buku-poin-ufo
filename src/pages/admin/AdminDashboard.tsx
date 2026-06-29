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
} from "lucide-react";


export default function AdminDashboard() {
  const local = useLocalData();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedRegistrant, setSelectedRegistrant] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // Get data from localStorage
  const data = useMemo(() => {
    const registrants = local.registrants;
    const mentors = local.mentors;
    const activities = local.activities;
    const assignments = local.assignments;

    // Unassigned registrants
    const assignedIds = new Set(assignments.map((a) => a.registrantId));
    const unassigned = registrants.filter((r) => !assignedIds.has(r.id) && r.status === "active");

    // Stats
    const stats = {
      users: registrants.length + mentors.length,
      mentors: mentors.length,
      registrants: registrants.length,
      activities: activities.length,
      pendingActivities: activities.filter((a) => a.status === "pending").length,
      verifiedActivities: activities.filter((a) => a.status === "verified").length,
      totalPoints: activities.filter((a) => a.status === "verified").reduce((sum, a) => sum + a.points, 0),
      mentorAssignments: assignments.length,
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

    // Mentor stats
    const mentorStats = mentors.map((m) => {
      const menteeCount = assignments.filter((a) => a.mentorId === m.id).length;
      return { mentorId: m.id, mentorName: m.fullName, menteeCount, maxMentees: m.maxMentees };
    });

    // All assignments with names
    const allAssignments = assignments.map((a) => {
      const mentor = mentors.find((m) => m.id === a.mentorId);
      const reg = registrants.find((r) => r.id === a.registrantId);
      return { assignmentId: a.id, mentorId: a.mentorId, mentorName: mentor?.fullName || "-", mentorEmail: mentor?.email || "-", registrantId: a.registrantId, registrantName: reg?.fullName || "-", registrantEmail: reg?.email || "-", registrantYear: reg?.year || "-", registrantMajor: reg?.major || "-" };
    });

    return { stats, recentActivities, topRegistrants, activityDistribution, mentorStats, allAssignments, unassigned, registrants, mentors };
  }, [refreshTick]);

  const handleAssign = () => {
    if (!selectedMentor || !selectedRegistrant) return;
    local.addAssignment(Number(selectedMentor), Number(selectedRegistrant));
    setRefreshTick((t) => t + 1);
    setSelectedMentor("");
    setSelectedRegistrant("");
  };

  const handleRemove = (assignmentId: number) => {
    local.removeAssignment(assignmentId);
    setRefreshTick((t) => t + 1);
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
          <p className="text-sm text-gray-500">Monitoring sistem dan manajemen mentor - calon anggota</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Calon Anggota", value: data.stats.registrants, color: "text-purple-600", icon: Users },
            { label: "Mentor", value: data.stats.mentors, color: "text-green-600", icon: Users },
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
            <TabsTrigger value="mentor-mapping"><LinkIcon className="h-4 w-4 mr-2" />Pemetaan Mentor</TabsTrigger>
            <TabsTrigger value="activities"><Activity className="h-4 w-4 mr-2" />Kegiatan</TabsTrigger>
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

          {/* Mentor Mapping */}
          <TabsContent value="mentor-mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tugaskan Mentor ke Calon Anggota</CardTitle>
                <CardDescription>Pilih mentor dan calon anggota untuk membuat pemetaan baru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mentor</label>
                    <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                      <SelectTrigger><SelectValue placeholder="Pilih mentor" /></SelectTrigger>
                      <SelectContent>
                        {data.mentors.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.fullName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Calon Anggota (Belum Punya Mentor)</label>
                    <Select value={selectedRegistrant} onValueChange={setSelectedRegistrant}>
                      <SelectTrigger><SelectValue placeholder="Pilih calon anggota" /></SelectTrigger>
                      <SelectContent>
                        {data.unassigned.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.fullName} ({r.year})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAssign} disabled={!selectedMentor || !selectedRegistrant} className="bg-red-600 hover:bg-red-700"><LinkIcon className="h-4 w-4 mr-2" />Tugaskan</Button>
                </div>

                {data.mentorStats.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Kapasitas Mentor</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {data.mentorStats.map((ms) => (
                        <div key={ms.mentorId} className={`p-3 rounded-lg border ${ms.menteeCount >= ms.maxMentees ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                          <p className="text-sm font-medium truncate">{ms.mentorName}</p>
                          <p className="text-xs text-gray-500">{ms.menteeCount} / {ms.maxMentees} mentee</p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className={`h-1.5 rounded-full ${ms.menteeCount >= ms.maxMentees ? "bg-red-500" : "bg-red-500"}`} style={{ width: `${Math.min((ms.menteeCount / ms.maxMentees) * 100, 100)}%` }} /></div>
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
                <CardDescription>Semua pemetaan mentor - calon anggota</CardDescription>
              </CardHeader>
              <CardContent>
                {data.allAssignments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Mentor</TableHead><TableHead>Calon Anggota</TableHead><TableHead>Angkatan</TableHead><TableHead>Jurusan</TableHead><TableHead>Aksi</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.allAssignments.map((a) => (
                          <TableRow key={a.assignmentId}>
                            <TableCell className="font-medium">{a.mentorName}</TableCell>
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
        </Tabs>
      </div>
    </MainLayout>
  );
}
