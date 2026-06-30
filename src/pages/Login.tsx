import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router";

function directLogin(name: string, email: string, role: string) {
  const user = {
    id: Math.floor(Math.random() * 9000) + 1000,
    unionId: `user_${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    role,
  };
  localStorage.setItem("ukm_mock_user", JSON.stringify(user));
  window.location.href = "/#/dashboard";
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi");
      return;
    }
    setError("");
    setLoading(true);
    const displayName = name.trim() || email.split("@")[0];
    directLogin(displayName, email, role);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nama wajib diisi"); return; }
    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi");
      return;
    }
    setError("");
    setLoading(true);
    directLogin(name.trim(), email, role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="w-full max-w-sm">
        {/* Upper logo - horizontal */}
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-ufo.png" alt="UFO UGM" className="h-12 w-auto" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            {/* Lower logo - circular */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <img src="/logo-ufo-square.png" alt="UFO UGM" className="h-10 w-auto" />
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
                      onChange={(e) => setRole(e.target.value)}
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
