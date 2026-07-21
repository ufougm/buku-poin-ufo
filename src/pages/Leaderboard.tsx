import { useMemo } from "react";
import { useLocalData } from "@/hooks/useLocalData";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, TrendingUp } from "lucide-react";

function anonymizeName(name: string): string {
  if (!name || name.length < 3) return "***";
  const first = name[0];
  const last = name[name.length - 1];
  const stars = "*".repeat(Math.min(name.length - 2, 4));
  return `${first}${stars}${last}`;
}

export default function Leaderboard() {
  const local = useLocalData();

  const topFive = useMemo(() => {
    return local.registrants
      .map((r) => {
       const rActivities = local.getActivitiesByRegistrant(r.id) || [];
        
        // Hitung manual poin aslinya seperti di Dashboard
        const realPoints = rActivities
          .filter((a: any) => a.status === "verified")
          .reduce((sum: number, a: any) => sum + (Number(a.points) || 0), 0);

        return {
          id: r.id,
          name: r.fullName,
          anonymousName: anonymizeName(r.fullName),
          year: r.year,
          major: r.major,
          verifiedPoints: realPoints,      // <-- Sekarang menggunakan poin asli
          activityCount: rActivities.length, // <-- Jumlah kegiatan asli
        };
      })
      .sort((a, b) => b.verifiedPoints - a.verifiedPoints)
      .slice(0, 5);
  }, [local]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <TrendingUp className="h-5 w-5 text-red-400" />;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
      case 1:
        return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
      case 2:
        return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
      default:
        return "bg-white border-gray-100";
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Rank #1</Badge>;
      case 1:
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Rank #2</Badge>;
      case 2:
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Rank #3</Badge>;
      default:
        return <Badge variant="outline" className="text-red-600">Rank #{index + 1}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Papan Peringkat</h1>
          <p className="text-gray-500 mt-2">
            Top 5 Calon Anggota dengan Poin Tertinggi
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Nama disamarkan untuk menjaga privasi. Ayo kumpulkan poin lebih banyak!
          </p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {topFive.map((entry, index) => (
            <Card
              key={entry.id}
              className={`border-2 transition-all hover:shadow-lg ${getRankBg(index)}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                    {getRankIcon(index)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-lg text-gray-900">
                        {entry.anonymousName}
                      </p>
                      {getRankBadge(index)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {entry.major} · Angkatan {entry.year}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {entry.activityCount} kegiatan terverifikasi
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-red-600">
                      {entry.verifiedPoints}
                    </p>
                    <p className="text-xs text-gray-500">poin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {topFive.length === 0 && (
          <Card className="text-center p-12">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada data peringkat</p>
            <p className="text-sm text-gray-400 mt-1">
              Data akan muncul setelah kegiatan diverifikasi
            </p>
          </Card>
        )}

        {/* Motivational Card */}
        <Card className="mt-8 bg-gradient-to-r from-red-600 to-red-700 border-0">
          <CardContent className="p-6 text-center text-white">
            <Trophy className="h-8 w-8 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">
              Jadilah yang Teratas!
            </h3>
            <p className="text-sm text-red-100 leading-relaxed">
              Setiap kegiatan yang kamu ikuti membawa kamu lebih dekat ke puncak.
              Jangan berhenti eksplorasi dan kumpulkan poin sebanyak-banyaknya!
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
