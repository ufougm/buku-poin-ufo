import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogIn, Users, ShieldCheck, User, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth, type MockUser } from "@/hooks/useAuth";

interface MentorOption {
  id: number;
  fullName: string;
  expertise?: string;
}

const roleOptions = [
  { value: "user" as const, label: "Calon Anggota", icon: User, color: "bg-red-100 text-red-700", desc: "Input kegiatan, lihat poin, unduh buku poin" },
  { value: "mentor" as const, label: "Mentor", icon: Users, color: "bg-green-100 text-green-700", desc: "Verifikasi kegiatan mentee" },
  { value: "psdm" as const, label: "PSDM (Admin)", icon: ShieldCheck, color: "bg-purple-100 text-purple-700", desc: "Kelola mentor, monitoring data" },
];

function getMentorsFromStorage(): MentorOption[] {
  try {
    const raw = localStorage.getItem("ukm_mentors");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Fallback defaults
  return [
    { id: 9001, fullName: "Dr. Budi Santoso, M.Sn.", expertise: "Fotografi Jurnalistik" },
    { id: 9002, fullName: "Rina Amelia, M.Ds.", expertise: "Fotografi Komersial" },
  ];
}

export default function Login() {
  const navigate = useNavigate();
  const { loginMock, isStaticDeployment } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MockUser["role"]>("user");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [step, setStep] = useState<"form" | "role-select">("form");
  const [mentors, setMentors] = useState<MentorOption[]>([]);

  useEffect(() => {
    setMentors(getMentorsFromStorage());
  }, []);

  const selectedMentor = mentors.find((m) => m.id.toString() === selectedMentorId);

  const handleLogin = () => {
    let displayName = name.trim() || "Demo User";
    let displayEmail = email.trim() || "demo@ugm.ac.id";
    let mentorId: number | undefined = undefined;

    // If mentor role and a mentor is selected, use the mentor's name and ID
    if (role === "mentor" && selectedMentor) {
      displayName = selectedMentor.fullName;
      displayEmail = email.trim() || "mentor@ugm.ac.id";
      mentorId = selectedMentor.id;
    }

    loginMock({
      id: Math.floor(Math.random() * 9000) + 1000,
      unionId: `dev_${Date.now()}`,
      name: displayName,
      email: displayEmail,
      role,
      mentorId,
    });

    if (role === "psdm") navigate("/admin");
    else if (role === "mentor") navigate("/mentor");
    else navigate("/dashboard");
  };

  const canLogin = role !== "mentor" || (role === "mentor" && selectedMentorId !== "");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-ufo.png" alt="UFO UGM" className="h-12 w-auto" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <img src="/logo-ufo.png" alt="UFO UGM" className="h-10 w-auto" />
            </div>
            <CardTitle className="text-xl">Masuk ke Sistem</CardTitle>
            <CardDescription>
              {step === "form"
                ? "Masukkan data Anda untuk melanjutkan"
                : "Pilih role untuk mengakses dashboard"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === "form" ? (
              <>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama Anda"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@mail.ugm.ac.id"
                      className="h-11"
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-red-600 hover:bg-red-700 h-11 text-base font-medium"
                  onClick={() => name.trim() && setStep("role-select")}
                  disabled={!name.trim()}
                >
                  Lanjutkan
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>

                <div className="text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Beranda
                  </Link>
                </div>

                {isStaticDeployment && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                    <strong>Mode Demo Aktif</strong> — Backend server tidak tersedia pada deploy statis.
                    Gunakan form di atas untuk testing semua fitur.
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pilih Role</Label>
                  {roleOptions.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setRole(r.value);
                        if (r.value !== "mentor") setSelectedMentorId("");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        role === r.value
                          ? "border-red-500 bg-red-50"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-10 h-10 ${r.color} rounded-lg flex items-center justify-center shrink-0`}>
                        <r.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Mentor picker (only when Mentor role) */}
                {role === "mentor" && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-medium">Pilih Mentor</Label>
                    <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Pilih mentor yang akan disimulasikan" />
                      </SelectTrigger>
                      <SelectContent>
                        {mentors.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{m.fullName}</span>
                              {m.expertise && <span className="text-xs text-gray-500">{m.expertise}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedMentor && (
                      <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        Anda akan masuk sebagai: <strong>{selectedMentor.fullName}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* User picker hint for Calon Anggota */}
                {role === "user" && (
                  <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700 space-y-1">
                    <p className="font-medium">Tips:</p>
                    <p>Gunakan nama salah satu calon anggota untuk melihat data mereka:</p>
                    <ul className="list-disc list-inside text-red-600">
                      <li>Ahmad Rizky Pratama</li>
                      <li>Siti Nurhaliza Putri</li>
                      <li>Bima Sakti Wijaya</li>
                      <li>Dan 7 lainnya...</li>
                    </ul>
                  </div>
                )}

                <Button
                  className="w-full bg-red-600 hover:bg-red-700 h-11 text-base font-medium"
                  onClick={handleLogin}
                  disabled={!canLogin}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Masuk
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    setStep("form");
                    setSelectedMentorId("");
                  }}
                >
                  Kembali
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Buku Poin UFO UGM
        </p>
      </div>
    </div>
  );
}
