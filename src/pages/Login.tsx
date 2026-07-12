import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, ArrowLeft, Loader2, Users } from "lucide-react";
import { Link } from "react-router";
import { seedMembers, getMemberByNSA } from "@/hooks/useLocalData";
import { verifyRegistrantLogin } from "@/lib/googleSheets";

// ─── Session Management ───────────────────────────────────────────
interface SessionUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  angkatan?: number;
  divisi?: string;
  isPreRegistered: boolean;
}

function setSession(user: SessionUser) {
  localStorage.setItem("ukm_session_user", JSON.stringify(user));
  localStorage.setItem("ukm_session_user_ts", String(Date.now()));
  const effectiveRole = user.role === "psdm_pemandu" ? "psdm" : user.role;
  if (effectiveRole === "psdm") {
    window.location.href = "#/admin";
  } else if (effectiveRole === "pemandu") {
    window.location.href = "#/pemandu";
  } else {
    window.location.href = "#/dashboard";
  }
}

export default function Login() {
  seedMembers();

  // ─── Tab: anggota (NSA) ─────────────────────────────────────────
  const [nsaUsername, setNsaUsername] = useState("");
  const [nsaPassword, setNsaPassword] = useState("");

  // ─── Tab: calon anggota (Email + NIM) ───────────────────────────
  const [caEmail, setCaEmail] = useState("");
  const [caNim, setCaNim] = useState("");

  // ─── Shared state ───────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Login: Anggota (NSA-based) ─────────────────────────────────
  const handleAnggotaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nsaUsername.trim() || !nsaPassword.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    // Try 1: Pre-registered member by NSA
    const member = await getMemberByNSA(nsaUsername.trim());
    if (member) {
      if (member.password !== nsaPassword) {
        setError("Password salah.");
        return;
      }
      setLoading(true);
      setSession({
        id: member.nsa,
        name: member.name,
        role: member.role,
        angkatan: member.angkatan,
        divisi: member.divisi,
        isPreRegistered: true,
      });
      return;
    }

    setError("NSA tidak ditemukan. Pastikan NSA Anda benar.");
  };

  // ─── Login: Calon Anggota (Email + NIM) ─────────────────────────
  const handleCalonAnggotaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!caEmail.trim() || !caNim.trim()) {
      setError("Email dan NIM wajib diisi");
      return;
    }

    // Verify registrant: accepts either NIM (first login) or changed password
    const registrant = await verifyRegistrantLogin(caEmail.trim(), caNim.trim());
    if (!registrant) {
      setError("Email atau NIM/Password salah. Password awal = NIM Anda.");
      return;
    }

    setLoading(true);
    setSession({
      id: String(registrant.id),
      name: registrant.fullName,
      email: registrant.email,
      role: "user",
      isPreRegistered: false,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-ufo.png" alt="UFO UGM" className="h-16 w-auto max-w-[280px] object-contain" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-black flex items-center justify-center shadow-lg">
              <img src="/logo-ufo-square.png" alt="UFO UGM" className="w-20 h-20 object-contain" />
            </div>
            <CardTitle className="text-xl">Masuk</CardTitle>
            <CardDescription>Buku Poin UFO UGM</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
            )}

            <Tabs defaultValue="anggota" onValueChange={() => setError("")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="anggota">Anggota</TabsTrigger>
                <TabsTrigger value="calon">Calon Anggota</TabsTrigger>
              </TabsList>

              {/* ─── ANGGOTA (NSA Login) ─── */}
              <TabsContent value="anggota">
                <form onSubmit={handleAnggotaLogin} className="space-y-4 mt-4">
                  <div>
                    <Label>NSA / Username</Label>
                    <Input
                      value={nsaUsername}
                      onChange={(e) => setNsaUsername(e.target.value)}
                      placeholder="Masukkan NSA Anda"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Contoh: NSA.3325.023.1132
                    </p>
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={nsaPassword}
                      onChange={(e) => setNsaPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Password default: 4 digit terakhir NSA
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-2" />
                    )}
                    Masuk
                  </Button>
                </form>
              </TabsContent>

              {/* ─── CALON ANGGOTA (Email + NIM Login) ─── */}
              <TabsContent value="calon">
                <form onSubmit={handleCalonAnggotaLogin} className="space-y-4 mt-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Catatan:</strong> Login ini khusus Calon Anggota yang sudah mengisi form pendaftaran CUFO. Password awal = NIM Anda.
                    </p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={caEmail}
                      onChange={(e) => setCaEmail(e.target.value)}
                      placeholder="email@mail.ugm.ac.id"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Email yang Anda gunakan saat mendaftar
                    </p>
                  </div>
                  <div>
                    <Label>NIM / Password</Label>
                    <Input
                      type="password"
                      value={caNim}
                      onChange={(e) => setCaNim(e.target.value)}
                      placeholder="Masukkan NIM Anda"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Password awal = NIM. Bisa diubah di Profil nanti.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Masuk
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="text-center">
              <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
                <ArrowLeft className="h-4 w-4" />Kembali ke Beranda
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">UFO UGM Integrated Point System</p>
      </div>
    </div>
  );
}
