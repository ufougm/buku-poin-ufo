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
  Image,
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

  // Find the pemandu record for this user from the member database
  const myPemandu = useMemo(() => {
    console.log("Nama Akun Login:", user?.name);
    console.log("Daftar Pemandu di Sistem:", local.pemandus);

    if (!user?.name) return null;

    // Look up pemandu by matching user's name
    const ditemukan = local.pemandus.find(
      (m) => m.fullName.toLowerCase() === user.name!.toLowerCase()
    );

    console.log("Hasil Pencocokan:", ditemukan);
    return ditemukan || null;
  }, [user, local.pemandus]);

  // Get CUFO for this pemandu (via kelompok or direct assignment)
  const cufos = useMemo(() => {
    if (!myPemandu) return [];
    return local.getCUFOByPemandu(myPemandu.id);
  }, [myPemandu, refreshTick, local]);

  // Get pending activities for CUFO
  const pendingActivities = useMemo(() => {
    if (!myPemandu || cufos.length === 0) return [];
    const cufoIds = cufos.map((m) => m!.registrantId);
    return local.activities
      .filter((a) => cufoIds.includes(a.registrantId) && a.status === "pending")
      .map((a) => {
        const reg = local.registrants.find((r) => r.id === a.registrantId);
        const atype = local.activityTypes.find((t) => t.id === a.activityTypeId);
        return { ...a, registrantName: reg?.fullName || "-", activityTypeName: atype?.name || "-" };
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [myPemandu, cufos, refreshTick, local]);

  // Get ALL activities for CUFOs in this group (Riwayat Lengkap)
  const groupActivities = useMemo(() => {
    if (!myPemandu || cufos.length === 0) return [];
    const cufoIds = cufos.map((m) => m!.registrantId);
    return local.activities
      .filter((a) => cufoIds.includes(a.registrantId))
      .map((a) => {
        const reg = local.registrants.find((r) => r.id === a.registrantId);
        const atype = local.activityTypes.find((t) => t.id === a.activityTypeId);
        return { ...a, registrantName: reg?.fullName || "-", activityTypeName: atype?.name || "-" };
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [myPemandu, cufos, refreshTick, local]);

  // Count verified activities for CUFO
  const verifiedCount = useMemo(() => {
    if (!myPemandu || cufos.length === 0) return 0;
    const cufoIds = cufos.map((m) => m!.registrantId);
    return local.activities.filter((a) => cufoIds.includes(a.registrantId) && a.status === "verified").length;
  }, [myPemandu, cufos, refreshTick, local]);

  const handleApprove = async (activityId: number) => {
    await local.updateActivity(activityId, { status: "verified", verifiedAt: new Date().toISOString(), verifiedBy: myPemandu?.id?.toString() });
    setRefreshTick((t) => t + 1);
    setSelectedActivity(null);
    setDetailsOpen(false);
  };

  const handleReject = async (activityId: number) => {
    await local.updateActivity(activityId, { status: "rejected", notes: rejectionNote || undefined });
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
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Jumlah CUFO</p><p className="text-2xl font-bold">{cufos.length}</p></div><Users className="h-8 w-8 text-red-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Menunggu</p><p className="text-2xl font-bold text-yellow-600">{pendingActivities.length}</p></div><Clock className="h-8 w-8 text-yellow-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Terverifikasi</p><p className="text-2xl font-bold text-green-600">{verifiedCount}</p></div><ShieldCheck className="h-8 w-8 text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Kegiatan</p><p className="text-2xl font-bold">{groupActivities.length}</p></div><FileText className="h-8 w-8 text-gray-600" /></div></CardContent></Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Menunggu
              {pendingActivities.length > 0 && <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">{pendingActivities.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="h-4 w-4 mr-2" />
              Riwayat Kelompok
            </TabsTrigger>
            <TabsTrigger value="cufos">
              <Users className="h-4 w-4 mr-2" />
              Daftar CUFO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Kegiatan Menunggu Verifikasi</CardTitle>
                <CardDescription>Review dan verifikasi kegiatan yang diajukan oleh CUFO Anda</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingActivities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama CUFO</TableHead>
                          <TableHead>Nama Kegiatan</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Poin</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-semibold text-gray-800">{activity.registrantName}</TableCell>
                            <TableCell>
                              {activity.activityName}
                              <p className="text-xs text-gray-500 mt-1">{activity.activityTypeName}</p>
                              {activity.role && <p className="text-xs text-gray-500">Peran: {activity.role}</p>}
                            </TableCell>
                            <TableCell>{format(new Date(activity.activityDate), "dd MMM yyyy", { locale: id })}</TableCell>
                            <TableCell><span className="font-medium text-red-600">{activity.points}</span></TableCell>
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
                    <p className="text-gray-500">Hore! Tidak ada kegiatan yang menunggu verifikasi.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB BARU: Riwayat Kelompok */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Kegiatan Kelompok</CardTitle>
                <CardDescription>Daftar seluruh kegiatan dari semua CUFO yang ada di kelompok Anda (Diterima, Ditolak, & Menunggu)</CardDescription>
              </CardHeader>
              <CardContent>
                {groupActivities.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama CUFO</TableHead>
                          <TableHead>Kegiatan</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Poin</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-semibold text-gray-800">{activity.registrantName}</TableCell>
                            <TableCell>
                              {activity.activityName}
                              <p className="text-xs text-gray-500 mt-1">{activity.activityTypeName}</p>
                            </TableCell>
                            <TableCell>{format(new Date(activity.activityDate), "dd MMM yyyy", { locale: id })}</TableCell>
                            <TableCell>{activity.points}</TableCell>
                            <TableCell>
                              <Badge className={
                                activity.status === "verified" ? "bg-green-100 text-green-700" :
                                activity.status === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }>
                                {activity.status === "verified" ? "Diterima" : 
                                 activity.status === "rejected" ? "Ditolak" : "Menunggu"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => { setSelectedActivity(activity); setDetailsOpen(true); }}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {activity.status === "pending" && (
                                  <>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(activity.id)}>
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => { setSelectedActivity(activity); setRejectionNote(""); }}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada kegiatan yang diinput oleh anggota kelompok Anda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cufos">
            <Card>
              <CardHeader>
                <CardTitle>Daftar CUFO</CardTitle>
                <CardDescription>Calon anggota yang berada di bawah bimbingan Anda</CardDescription>
              </CardHeader>
              <CardContent>
                {cufos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cufos.filter(Boolean).map((cufo: any) => (
                      <Card key={cufo.registrantId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                              <Users className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{cufo.registrantName}</p>
                              <p className="text-sm text-gray-500">{cufo.registrantEmail}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{cufo.registrantYear}</Badge>
                                <span className="text-xs text-gray-400">{cufo.registrantMajor}</span>
                              </div>
                            </div>
                          </div>
                         {(() => {
                            const summary = local.getPointSummary(cufo.registrantId);
                            const points = summary ? summary.total : 0; 
                            const maxPoints = 100;
                            const progressPercentage = Math.min((points / maxPoints) * 100, 100);

                            return (
                              <div className="mt-4 border-t border-gray-100 pt-4">
                                <div className="flex justify-between items-center mb-1 text-xs">
                                  <span className="font-medium text-gray-600">Progres Poin</span>
                                  <span className="font-bold text-red-600">{points} / {maxPoints}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Belum ada CUFO yang ditugaskan kepada Anda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Activity Details Dialog with Photos */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Kegiatan</DialogTitle>
              <DialogDescription>Informasi lengkap mengenai kegiatan yang diajukan</DialogDescription>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Nama CUFO</p><p className="font-medium">{selectedActivity.registrantName}</p></div>
                  <div><p className="text-sm text-gray-500">Jenis Kegiatan</p><p className="font-medium">{selectedActivity.activityTypeName}</p></div>
                  <div><p className="text-sm text-gray-500">Tanggal</p><p className="font-medium">{format(new Date(selectedActivity.activityDate), "dd MMMM yyyy", { locale: id })}</p></div>
                  <div><p className="text-sm text-gray-500">Poin</p><p className="font-medium">{selectedActivity.points}</p></div>
                  <div className="col-span-2"><p className="text-sm text-gray-500">Lokasi</p><p className="font-medium">{selectedActivity.location}</p></div>
                  {selectedActivity.role && <div className="col-span-2"><p className="text-sm text-gray-500">Peran</p><p className="font-medium">{selectedActivity.role}</p></div>}
                </div>

                {/* Documentation Photos */}
                {selectedActivity.documentationImages && selectedActivity.documentationImages.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5">
                      <Image className="h-4 w-4" />
                      Dokumentasi ({selectedActivity.documentationImages.length} foto)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedActivity.documentationImages.map((img: string, idx: number) => (
                        <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={img}
                            alt={`Dokumentasi ${idx + 1}`}
                            className="w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform"
                           onClick={() => {
                              if (img && img.startsWith("data:image")) {
                                const w = window.open("");
                                w?.document.write(`<title>Dokumentasi Kegiatan</title><body style="background-color: #0e0e0e; display: flex; justify-content: center; align-items: center; margin: 0; height: 100vh;"><img src="${img}" style="max-width: 100%; max-height: 100vh; object-fit: contain;" /></body>`);
                              } else {
                                window.open(img, "_blank");
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActivity.documentationUrl && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Link Dokumentasi</p>
                    <a href={selectedActivity.documentationUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline text-sm break-all">{selectedActivity.documentationUrl}</a>
                  </div>
                )}

                {/* Action forms: only show if the activity is still pending */}
                {selectedActivity.status === "pending" ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Catatan Penolakan (opsional)</p>
                      <Textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder="Berikan alasan jika menolak..." />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setDetailsOpen(false)}><X className="h-4 w-4 mr-2" />Tutup</Button>
                      <Button variant="destructive" className="flex-1" onClick={() => handleReject(selectedActivity.id)}><XCircle className="h-4 w-4 mr-2" />Tolak</Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedActivity.id)}><CheckCircle className="h-4 w-4 mr-2" />Setuju</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="w-full" onClick={() => setDetailsOpen(false)}><X className="h-4 w-4 mr-2" />Tutup Detail</Button>
                  </div>
                )}

              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}