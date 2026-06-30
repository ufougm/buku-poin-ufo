import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, ArrowLeft, Loader2, ShieldCheck, Users, User } from "lucide-react";
import { Link } from "react-router";
import { verifyMember, autoCreateRegistrant, addPemandu, getPemandus, updatePemandu } from "@/hooks/useLocalData";

// ─── Stored Users Management ──────────────────────────────────────
interface StoredUser {
  id: number;
  name: string;
  email: string;
  password: string; // plain text for demo
  role: "user" | "pemandu" | "psdm";
  serialNumber?: string;
  pemanduId?: number;
}

const USERS_KEY = "ukm_registered_users";

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUser(user: StoredUser) {
  const users = getStoredUsers();
  const existing = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (existing >= 0) {
    users[existing] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUserByEmail(email: string): StoredUser | undefined {
  return getStoredUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// ─── Direct Login ─────────────────────────────────────────────────
function directLogin(user: StoredUser) {
  const sessionUser: any = {
    id: user.id,
    unionId: `user_${Date.now()}`,
    name: user.name,
    email: user.email,
    role: user.role,
    serialNumber: user.serialNumber,
  };
  if (user.pemanduId) sessionUser.pemanduId = user.pemanduId;
  localStorage.setItem("ukm_mock_user", JSON.stringify(sessionUser));

  // Auto-create registrant for Calon Anggota
  if (user.role === "user") {
    autoCreateRegistrant(user.name, user.email);
  }

  // Redirect based on role
  if (user.role === "psdm") {
    window.location.href = "#/admin";
  } else if (user.role === "pemandu") {
    window.location.href = "#/pemandu";
  } else {
    window.location.href = "#/dashboard";
  }
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "pemandu" | "psdm">("user");
  const [serialNumber, setSerialNumber] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi");
      return;
    }

    const user = findUserByEmail(email);
    if (!user) {
      setError("Email belum terdaftar. Silakan daftar terlebih dahulu.");
      return;
    }
    if (user.password !== password) {
      setError("Password salah.");
      return;
    }

    setLoading(true);
    directLogin(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!name.trim()) { setError("Nama lengkap wajib diisi"); return; }
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    // Check if email already registered
    if (findUserByEmail(email)) {
      setError("Email sudah terdaftar. Silakan masuk.");
      return;
    }

    // Role-specific validation
    if (role === "pemandu" || role === "psdm") {
      if (!serialNumber.trim()) {
        setError("Nomor Seri Anggota wajib diisi untuk role ini");
        return;
      }
      const verified = verifyMember(serialNumber.trim(), role, role === "psdm" ? adminPin : undefined);
      if (!verified) {
        if (role === "psdm") {
          setError("Nomor Seri Anggota tidak valid atau PIN salah");
        } else {
          setError("Nomor Seri Anggota tidak terdaftar sebagai Pemandu");
        }
        return;
      }
    }

    setLoading(true);

    // Create pemandu record if registering as pemandu
    let pemanduId: number | undefined;
    if (role === "pemandu") {
      const verified = verifyMember(serialNumber.trim(), "pemandu");
      if (verified) {
        const existing = getPemandus().find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
        if (!existing) {
          const newPemandu = addPemandu({
            userId: 0,
            fullName: name.trim(),
            email: email.trim(),
            expertise: "",
            maxMentees: 10,
          });
          pemanduId = newPemandu.id;
        } else {
          pemanduId = existing.id;
        }
      }
    }

    // Create new user
    const newUser: StoredUser = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      serialNumber: serialNumber.trim() || undefined,
      pemanduId,
    };

    // Update pemandu userId if created
    if (pemanduId) {
      updatePemandu(pemanduId, { userId: newUser.id });
    }

    saveUser(newUser);
    directLogin(newUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="w-full max-w-sm">
        {/* Upper logo - horizontal, bigger */}
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-ufo.png" alt="UFO UGM" className="h-16 w-auto max-w-[280px] object-contain" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            {/* Lower logo - sunburst with solid black circle background, bigger */}
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

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@mail.ugm.ac.id"
                      required
                    />
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

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  {/* Role Selection */}
                  <div>
                    <Label>Daftar Sebagai</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => { setRole("user"); setError(""); }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                          role === "user"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-600 hover:border-red-300"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        <span>Calon Anggota</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRole("pemandu"); setError(""); }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                          role === "pemandu"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-600 hover:border-red-300"
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        <span>Pemandu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRole("psdm"); setError(""); }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                          role === "psdm"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-600 hover:border-red-300"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>PSDM</span>
                      </button>
                    </div>
                  </div>

                  {/* Role-specific notice */}
                  {role === "user" && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Calon Anggota dapat mendaftar secara mandiri.
                    </p>
                  )}
                  {role === "pemandu" && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      Pemandu wajib memasukkan Nomor Seri Anggota yang valid.
                    </p>
                  )}
                  {role === "psdm" && (
                    <p className="text-xs text-red-700 bg-red-50 p-2 rounded">
                      PSDM wajib memasukkan Nomor Seri Anggota dan PIN khusus.
                    </p>
                  )}

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
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@mail.ugm.ac.id"
                      required
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      required
                    />
                  </div>

                  {/* Pemandu/PSDM: Nomor Seri Anggota */}
                  {(role === "pemandu" || role === "psdm") && (
                    <div>
                      <Label>Nomor Seri Anggota *</Label>
                      <Input
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Contoh: UFO-2024-001"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Masukkan Nomor Seri Anggota UFO Anda
                      </p>
                    </div>
                  )}

                  {/* PSDM only: Special PIN */}
                  {role === "psdm" && (
                    <div>
                      <Label>PIN Khusus PSDM *</Label>
                      <Input
                        type="password"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        placeholder="PIN dari admin"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Hubungi admin untuk mendapatkan PIN
                      </p>
                    </div>
                  )}

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
