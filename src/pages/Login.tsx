import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function Login() {
  const { signIn, signUp, isDemo } = useSupabaseAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "pemandu" | "psdm">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err.message || "Login gagal");
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nama wajib diisi"); return; }
    setError("");
    setLoading(true);
    const { error: err } = await signUp(email, password, name.trim(), role);
    if (err) setError(err.message || "Registrasi gagal");
    else setMode("login");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-ufo.png" alt="UFO UGM" className="h-12 w-auto" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <img src="/logo-ufo-square.png" alt="UFO UGM" className="h-10 w-auto" />
            </div>
            <CardTitle className="text-xl">
              {mode === "login" ? "Masuk" : "Daftar Akun"}
            </CardTitle>
            <CardDescription>
              {isDemo
                ? "Mode Demo - Data tersimpan di browser"
                : "Buku Poin UFO UGM"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                  Masuk
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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
                <div>
                  <Label>Role</Label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                  >
                    <option value="user">Calon Anggota</option>
                    <option value="pemandu">Pemandu</option>
                    <option value="psdm">PSDM (Admin)</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 h-11"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Daftar
                </Button>
              </form>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="text-sm text-red-600 hover:underline"
              >
                {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
              </button>
            </div>

            <div className="text-center">
              <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
                <ArrowLeft className="h-4 w-4" />Kembali ke Beranda
              </Link>
            </div>

            {isDemo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                <strong>Mode Demo Aktif</strong> — Tambahkan environment variables Supabase pada Vercel untuk go-live.
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">Buku Poin UFO UGM</p>
      </div>
    </div>
  );
}
