import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Lock, ShieldCheck, Users, Save, AlertTriangle } from "lucide-react";
import { getMembers, updateMember } from "@/hooks/useLocalData";
import { updateRegistrantPassword, getRegistrantByEmail, verifyRegistrantLogin } from "@/lib/googleSheets";

const FREE_USERS_KEY = "ukm_free_users";
const SESSION_KEY = "ukm_session_user";

export default function Profile() {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile fields
  const [newUsername, setNewUsername] = useState(user?.id || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Silakan masuk terlebih dahulu.</p>
      </div>
    );
  }

  const effectiveRole = user.role === "psdm_pemandu" ? "psdm" : user.role;
  const isPsdm = effectiveRole === "psdm";
  const isPemandu = user.role === "pemandu";
  const isCalonAnggota = effectiveRole === "user";

  const roleLabel = isPsdm
    ? "PSDM (Admin)"
    : isPemandu
    ? "Pemandu"
    : user.role === "psdm_pemandu"
    ? "PSDM + Pemandu"
    : "Calon Anggota";

  const roleBadgeColor = isPsdm
    ? "bg-red-100 text-red-700"
    : isPemandu
    ? "bg-green-100 text-green-700"
    : user.role === "psdm_pemandu"
    ? "bg-purple-100 text-purple-700"
    : "bg-gray-100 text-gray-700";

  // Check if username is taken by anyone else
  function isUsernameTaken(username: string, excludeCurrentId: string): boolean {
    const u = username.toLowerCase().trim();
    // Check free users
    const freeUsers = getFreeUsers();
    if (freeUsers.some((fu: any) => fu.username.toLowerCase() === u && fu.username.toLowerCase() !== excludeCurrentId.toLowerCase())) {
      return true;
    }
    // Check pre-registered members (NSA)
    const members = getMembers();
    if (members.some((m) => m.nsa.toLowerCase() === u && m.nsa.toLowerCase() !== excludeCurrentId.toLowerCase())) {
      return true;
    }
    return false;
  }

  // Update free user by old username
  function updateFreeUser(oldUsername: string, updates: { username?: string; password?: string }) {
    const users = getFreeUsers();
    const idx = users.findIndex((u: any) => u.username.toLowerCase() === oldUsername.toLowerCase());
    if (idx >= 0) {
      if (updates.username) users[idx].username = updates.username;
      if (updates.password) users[idx].password = updates.password;
      localStorage.setItem(FREE_USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  }

  function getFreeUsers(): any[] {
    try {
      const raw = localStorage.getItem(FREE_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Handle save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedUsername = newUsername.trim();
    if (!trimmedUsername) {
      setError("Username tidak boleh kosong.");
      return;
    }

    // Check username uniqueness
    if (trimmedUsername.toLowerCase() !== user.id.toLowerCase()) {
      if (isUsernameTaken(trimmedUsername, user.id)) {
        setError("Username sudah digunakan oleh pengguna lain. Silakan pilih username lain.");
        return;
      }
    }

    // Password change validation
    let passwordChanged = false;
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setError("Masukkan password saat ini untuk mengubah password.");
        return;
      }
      if (newPassword.length < 4) {
        setError("Password baru minimal 4 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Password baru dan konfirmasi password tidak cocok.");
        return;
      }
      passwordChanged = true;
    }

    // Apply changes based on user type
    if (user.isPreRegistered) {
      // Pre-registered member: update member DB
      const member = getMembers().find((m) => m.nsa === user.id);
      if (member) {
        if (trimmedUsername !== user.id) {
          setError("Anggota terdaftar tidak dapat mengubah NSA. Hanya password yang dapat diubah.");
          return;
        }
        if (passwordChanged) {
          if (currentPassword !== member.password) {
            setError("Password saat ini salah.");
            return;
          }
          updateMember(user.id, { password: newPassword });
        }
      }
    } else if (user.role === "user" && user.email) {
      // Calon Anggota (from Google Sheets): password stored in Supabase registrants table
      if (trimmedUsername !== user.id) {
        setError("Calon Anggota tidak dapat mengubah ID. Hanya password yang dapat diubah.");
        return;
      }
      if (passwordChanged) {
        // Verify current password: accept either NIM or current password
        const registrant = await verifyRegistrantLogin(user.email, currentPassword);
        if (!registrant) {
          setError("Password saat ini salah. Masukkan NIM Anda atau password yang sudah diubah.");
          return;
        }
        const ok = await updateRegistrantPassword(user.email, newPassword);
        if (!ok) {
          setError("Gagal mengubah password. Coba lagi nanti.");
          return;
        }
      }
    } else {
      // Free signup user: can change both username and password
      const freeUser = getFreeUsers().find((u: any) => u.username.toLowerCase() === user.id.toLowerCase());
      if (!freeUser) {
        setError("Data pengguna tidak ditemukan.");
        return;
      }

      if (passwordChanged && currentPassword !== freeUser.password) {
        setError("Password saat ini salah.");
        return;
      }

      updateFreeUser(user.id, {
        username: trimmedUsername !== user.id ? trimmedUsername : undefined,
        password: passwordChanged ? newPassword : undefined,
      });

      if (trimmedUsername !== user.id) {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
        session.id = trimmedUsername;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }

    // Update session password if changed
    if (passwordChanged) {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
      // No password field in session, just reload to reflect changes
    }

    setSuccess("Profil berhasil diperbarui!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    // Reload page after short delay to reflect username change
    if (trimmedUsername !== user.id) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={isPsdm ? "/admin" : isPemandu ? "/pemandu" : "/dashboard"}>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                <ArrowLeft className="h-4 w-4 mr-1" />Kembali
              </Button>
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <User className="h-5 w-5 text-red-600" />
            <h1 className="text-lg font-bold text-gray-900">Profil Saya</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Profile Info Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${roleBadgeColor}`}>
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                  {user.email && (
                    <span className="text-xs text-gray-400">{user.email}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              Ubah Profil
            </CardTitle>
            <CardDescription>
              {user.isPreRegistered
                ? "Anggota terdaftar hanya dapat mengubah password. NSA tidak dapat diubah."
                : user.role === "user" && user.email
                ? "Calon Anggota hanya dapat mengubah password. Email: " + user.email
                : "Ubah username dan password akun Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
                <Save className="h-4 w-4 shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Username / ID */}
              <div>
                <Label>
                  {user.isPreRegistered ? "NSA" : user.role === "user" && user.email ? "ID" : "Username"}
                </Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={user.isPreRegistered || (user.role === "user" && !!user.email)}
                  className={(user.isPreRegistered || (user.role === "user" && !!user.email)) ? "bg-gray-100 text-gray-500" : ""}
                />
                {(user.isPreRegistered || (user.role === "user" && !!user.email)) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {user.isPreRegistered ? "NSA tidak dapat diubah." : "ID tidak dapat diubah."}
                  </p>
                )}
              </div>

              {/* Current Password */}
              <div>
                <Label>Password Saat Ini</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                />
              </div>

              {/* New Password */}
              <div>
                <Label>Password Baru</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 4 karakter (kosongkan jika tidak ingin mengubah)"
                />
              </div>

              {/* Confirm New Password */}
              {newPassword && (
                <div>
                  <Label>Konfirmasi Password Baru</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 h-11"
              >
                <Save className="h-4 w-4 mr-2" />
                Simpan Perubahan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Role Info Card */}
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Informasi Akun</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="text-gray-400">Nama:</span> {user.name}</p>
              <p><span className="text-gray-400">{user.isPreRegistered ? "NSA" : "Username"}:</span> {user.id}</p>
              {user.email && <p><span className="text-gray-400">Email:</span> {user.email}</p>}
              <p><span className="text-gray-400">Role:</span> {roleLabel}</p>
              <p><span className="text-gray-400">Tipe:</span> {user.isPreRegistered ? "Anggota Terdaftar" : "Pendaftar Bebas"}</p>
              {user.angkatan && <p><span className="text-gray-400">Angkatan:</span> {user.angkatan}</p>}
              {user.divisi && <p><span className="text-gray-400">Divisi:</span> {user.divisi}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
