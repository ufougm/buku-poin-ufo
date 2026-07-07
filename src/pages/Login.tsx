import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, ArrowLeft, Loader2, ShieldCheck, Users, User } from "lucide-react";
import { Link } from "react-router";
import { getMembers, seedMembers, getMemberByNSA } from "@/hooks/useLocalData";

// ─── Stored Users Management ──────────────────────────────────────
// Users who signed up freely (not pre-registered via NSA)
const FREE_USERS_KEY = "ukm_free_users";

interface FreeUser {
  username: string;
  name: string;
  email?: string;
  password: string;
  role: "user";
  createdAt: string;
}

function getFreeUsers(): FreeUser[] {
  try {
    const raw = localStorage.getItem(FREE_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFreeUser(user: FreeUser) {
  const users = getFreeUsers();
  users.push(user);
  localStorage.setItem(FREE_USERS_KEY, JSON.stringify(users));
}

function findFreeUserByUsername(username: string): FreeUser | undefined {
  return getFreeUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

// ─── Session Management ───────────────────────────────────────────
interface SessionUser {
  id: string;       // NSA or username
  name: string;
  role: string;
  angkatan?: number;
  divisi?: string;
  isPreRegistered: boolean;
}

function setSession(user: SessionUser) {
  localStorage.setItem("ukm_session_user", JSON.stringify(user));
  // Redirect based on effective role
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
  // Seed pre-registered members on first load
  seedMembers();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Login handler ──────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    // Try 1: Pre-registered member by NSA
    const member = getMemberByNSA(username.trim());
    if (member) {
      if (member.password !== password) {
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

    // Try 2: Free signup user by username
    const freeUser = findFreeUserByUsername(username.trim());
    if (freeUser) {
      if (freeUser.password !== password) {
        setError("Password salah.");
        return;
      }
      setLoading(true);
      setSession({
        id: freeUser.username,
        name: freeUser.name,
        role: freeUser.role,
        isPreRegistered: false,
      });
      return;
    }

    setError("Username tidak ditemukan. Silakan daftar terlebih dahulu.");
  };

  // ─── Register handler ───────────────────────────────────────────
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Nama lengkap wajib diisi"); return; }
    if (!username.trim()) { setError("Username wajib diisi"); return; }
    if (!password.trim()) { setError("Password wajib diisi"); return; }
    if (password.length < 4) { setError("Password minimal 4 karakter"); return; }

    // Check if username conflicts with existing NSA
    if (getMemberByNSA(username.trim())) {
      setError("Username sudah terdaftar sebagai Nomor Seri Anggota. Gunakan NSA Anda untuk masuk.");
      return;
    }

    // Check if username already taken by free user
    if (findFreeUserByUsername(username.trim())) {
      setError("Username sudah digunakan. Silakan pilih username lain.");
      return;
    }

    setLoading(true);

    const newUser: FreeUser = {
      username: username.trim(),
      name: name.trim(),
      email: email.trim() || undefined,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    saveFreeUser(newUser);

    setSession({
      id: newUser.username,
      name: newUser.name,
      role: "user",
      isPreRegistered: false,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="w-full max-w-sm">
        {/* Upper logo - horizontal */}
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-ufo.png" alt="UFO UGM" className="h-16 w-auto max-w-[280px] object-contain" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            {/* Lower logo - sunburst with solid black circle */}
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-black flex items-center justify-center shadow-lg">
              <img src="/logo-ufo-square.png" alt="UFO UGM" className="w-20 h-20 object-contain" />
            </div>
            <CardTitle className="text-xl">
              {mode === "login" ? "Masuk" : "Daftar Akun"}
            </CardTitle>
            <CardDescription>
              Buku Poin UFO UGM
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setError(""); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              {/* ─── LOGIN ─── */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div>
                    <Label>Username / NSA</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan NSA atau username"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Anggota terdaftar: masukkan NSA Anda
                    </p>
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Password default anggota: 4 digit terakhir NSA
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

              {/* ─── REGISTER ─── */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div>
                    <Label>Nama Lengkap *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                      required
                    />
                  </div>
                  <div>
                    <Label>Username *</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Buat username Anda"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Username bebas, tidak perlu NSA
                    </p>
                  </div>
                  <div>
                    <Label>Email (opsional)</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@mail.ugm.ac.id"
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 4 karakter"
                      required
                    />
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                    Pendaftaran ini untuk Calon Anggota baru. Role akan otomatis menjadi "Calon Anggota".
                  </p>
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 h-11"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Daftar
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
