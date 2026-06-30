import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocalData } from "@/hooks/useLocalData";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  ShieldCheck,
  X,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function PemanduDashboard() {
  const { user } = useAuth();
  const local = useLocalData();
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Find the pemandu record for this user using stored pemanduId
  const myPemandu = useMemo(() => {
    const mockUser = user as any;
    if (mockUser?.pemanduId) {
      return local.pemandus.find((m) => m.id === Number(mockUser.pemanduId)) || null;
    }
    return null;
  }, [user, local.pemandus]);

  // Get mentees for this pemandu
  const mentees = useMemo(() => {
    if (!myPemandu) return [];
    return local.getMenteesByPemandu(myPemandu.id);
  }, [myPemandu, refreshTick]);

  // Get pending activities for mentees
  const pendingActivities = useMemo(() => {
    if (!myPemandu || mentees.length === 0) return [];
    const menteeIds = mentees.map((m) => m!.registrantId);
    return local.activities
      .filter((a) => menteeIds.includes(a.registrantId) && a.status === "pending")
      .map((a) => {
        const reg = local.registrants.find((r) => r.id === a.registrantId);
        const atype = local.activityTypes.find((t) => t.id === a.activityTypeId);
        return { ...a, registrantName: reg?.fullName || "-", activityTypeName: atype?.name || "-" };
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [myPemandu, mentees, refreshTick]);

  // Count verified activities for mentees
  const verifiedCount = useMemo(() => {
    if (!myPemandu || mentees.length === 0) return 0;
    const menteeIds = mentees.map((m) => m!.registrantId);
    return local.activities.filter((a) => menteeIds.includes(a.registrantId) && a.status === "verified").length;
  }, [myPemandu, mentees, refreshTick]);

  const handleApprove = (activityId: number) => {
    local.updateActivity(activityId, { status: "verified", verifiedAt: new Date().toISOString(), verifiedBy: myPemandu?.id });
    setRefreshTick((t) => t + 1);
    setSelectedActivity(null);
    setDetailsOpen(false);
  };

  const handleReject = (activityId: number) => {
    local.updateActivity(activityId, { status: "rejected", notes: rejectionNote || undefined });
    setRefreshTick((t) => t + 1);
    setSelectedActivity(null);
    setRejectionNote("");
    setDetailsOpen(false);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Pemandu</h1>
          <p className="text-sm text-gray-500">
            {myPemandu ? `${myPemandu.fullName} - Kelola dan verifikasi kegiatan calon anggota` : "Kelola dan verifikasi kegiatan calon anggota"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Jumlah Mentee</p><p className="text-2xl font-bold">{mentees.length}</p></div><Users className="h-8 w-8 text-red-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Menunggu</p><p className="text-2xl font-bold text-yellow-600">{pendingActivities.length}</p></div><Clock className="h-8 w-8 text-yellow-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Terverifikasi</p><p className="text-2xl font-bold text-green-600">{verifiedCount}</p></div><ShieldCheck className="h-8 w-8 text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Kegiatan</p><p className="text-2xl font-bold">{verifiedCount + pendingActivities.length}</p></div><FileText className="h-8 w-8 text-gray-600" /></div></CardContent></Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Menunggu Verifikasi
              {pendingActivities.length > 0 && <Badge variant="secondary" className="ml-2">{pendingActivities.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="mentees">
              <Users className="h-4 w-4 mr-2" />
              Daftar Mentee
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Kegiatan Menunggu Verifikasi</CardTitle>
                <CardDescription>Review dan verifikasi kegiatan yang diajukan oleh mentee Anda</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingActivities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Mentee</TableHead>
                          <TableHead>Nama Kegiatan</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Poin</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-medium">{activity.registrantName}</TableCell>
                            <TableCell>
                              {activity.activityName}
                              {activity.role && <p className="text-xs text-gray-500">Peran: {activity.role}</p>}
                            </TableCell>
                            <TableCell>{activity.activityTypeName}</TableCell>
                            <TableCell>{format(new Date(activity.activityDate), "dd MMM yyyy", { locale: id })}</TableCell>
                            <TableCell>{activity.points}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => { setSelectedActivity(activity); setDetailsOpen(true); }}><Eye className="h-3 w-3" /></Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(activity.id)}><Check className="h-3 w-3" /></Button>
                                <Button size="sm" variant="destructive" onClick={() => { setSelectedActivity(activity); setRejectionNote(""); }}><X className="h-3 w-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada kegiatan yang menunggu verifikasi</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentees">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Mentee</CardTitle>
                <CardDescription>Calon anggota yang berada di bawah bimbingan Anda</CardDescription>
              </CardHeader>
              <CardContent>
                {mentees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mentees.filter(Boolean).map((mentee: any) => (
                      <Card key={mentee.registrantId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                              <Users className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{mentee.registrantName}</p>
                              <p className="text-sm text-gray-500">{mentee.registrantEmail}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{mentee.registrantYear}</Badge>
                                <span className="text-xs text-gray-400">{mentee.registrantMajor}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada mentee yang ditugaskan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Activity Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detail Kegiatan</DialogTitle>
              <DialogDescription>Informasi lengkap mengenai kegiatan yang diajukan</DialogDescription>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Nama Mentee</p><p className="font-medium">{selectedActivity.registrantName}</p></div>
                  <div><p className="text-sm text-gray-500">Jenis Kegiatan</p><p className="font-medium">{selectedActivity.activityTypeName}</p></div>
                  <div><p className="text-sm text-gray-500">Tanggal</p><p className="font-medium">{format(new Date(selectedActivity.activityDate), "dd MMMM yyyy", { locale: id })}</p></div>
                  <div><p className="text-sm text-gray-500">Poin</p><p className="font-medium">{selectedActivity.points}</p></div>
                  <div className="col-span-2"><p className="text-sm text-gray-500">Lokasi</p><p className="font-medium">{selectedActivity.location}</p></div>
                  {selectedActivity.role && <div className="col-span-2"><p className="text-sm text-gray-500">Peran</p><p className="font-medium">{selectedActivity.role}</p></div>}
                  {selectedActivity.documentationUrl && <div className="col-span-2"><p className="text-sm text-gray-500">Dokumentasi</p><a href={selectedActivity.documentationUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline text-sm break-all">{selectedActivity.documentationUrl}</a></div>}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Catatan Penolakan (opsional)</p>
                  <Textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder="Berikan alasan jika menolak..." />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setDetailsOpen(false)}><X className="h-4 w-4 mr-2" />Tutup</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedActivity.id)}><XCircle className="h-4 w-4 mr-2" />Tolak</Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedActivity.id)}><CheckCircle className="h-4 w-4 mr-2" />Setuju</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
