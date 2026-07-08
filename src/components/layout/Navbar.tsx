import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { SYNC_STATUS } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  User,
  Shield,
  Users,
  LayoutDashboard,
  Trophy,
  HelpCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

function MobileNavLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  const location = useLocation();
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        location.pathname === to
          ? "text-red-600 bg-red-50"
          : "text-gray-600 hover:text-red-600 hover:bg-red-50"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isPsdm, isMentor, isUser, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLandingPage = location.pathname === "/";
  const isLocalMode = SYNC_STATUS === "local";

  const navLinks = [
    { to: "/leaderboard", label: "Peringkat", icon: Trophy },
    ...(isLandingPage
      ? [
          { href: "#hero", label: "Beranda" },
          { href: "#about", label: "Tentang" },
          { href: "#vision", label: "Visi & Misi" },
          { href: "#org-structure", label: "Struktur" },
          { href: "#gallery", label: "Galeri" },
        ]
      : []),
    ...(isAuthenticated
      ? [
          ...(isUser ? [
            { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { to: "/faq-buku-poin", label: "FAQ Buku Poin", icon: HelpCircle },
          ] : []),
          ...(isMentor ? [{ to: "/pemandu", label: "Dashboard Pemandu", icon: Users }] : []),
          ...(isPsdm ? [{ to: "/admin", label: "Panel PSDM", icon: Shield }] : []),
          { to: "/profile", label: "Profil", icon: Settings },
        ]
      : []),
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-ufo.png" alt="UFO UGM" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link: any) =>
              link.href ? (
                <button key={link.href} onClick={() => handleNavClick(link.href)} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">{link.label}</button>
              ) : (
                <Link key={link.to} to={link.to} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${location.pathname === link.to ? "text-red-600 bg-red-50" : "text-gray-600 hover:text-red-600 hover:bg-red-50"}`}>
                  {link.icon && <link.icon className="h-4 w-4" />}{link.label}
                </Link>
              )
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Sync mode indicator (PSDM only) */}
            {isAuthenticated && isLocalMode && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded-full border border-orange-200" title="Data hanya tersimpan di perangkat ini. Hubungkan Supabase untuk sinkronisasi antar perangkat.">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Local Mode
              </span>
            )}
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium">{user?.name || "User"}</span>
                  {user?.role === "psdm_pemandu" && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">PSDM + Pemandu</span>}
                  {user?.role === "psdm" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">PSDM</span>}
                  {user?.role === "pemandu" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Pemandu</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-red-600 hidden md:flex">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-red-600 hover:bg-red-700">Masuk</Button>
              </Link>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="p-4 border-b">
                    <img src="/logo-ufo.png" alt="UFO UGM" className="h-7 w-auto" />
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* User info */}
                    {isAuthenticated && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">{user?.name || "User"}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.id || ""}</p>
                        <div className="mt-1.5">
                          {user?.role === "psdm_pemandu" && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">PSDM + Pemandu</span>}
                          {user?.role === "psdm" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">PSDM</span>}
                          {user?.role === "pemandu" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Pemandu</span>}
                          {isUser && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Calon Anggota</span>}
                        </div>
                      </div>
                    )}

                    {/* Main Menu */}
                    {isAuthenticated && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Menu</p>
                        <div className="space-y-0.5">
                          {isUser && (
                            <>
                              <MobileNavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                              <MobileNavLink to="/faq-buku-poin" icon={HelpCircle} label="FAQ Buku Poin" />
                            </>
                          )}
                          {isMentor && <MobileNavLink to="/pemandu" icon={Users} label="Pemandu" />}
                          {isPsdm && <MobileNavLink to="/admin" icon={Shield} label="Panel PSDM" />}
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Info</p>
                      <div className="space-y-0.5">
                        <MobileNavLink to="/leaderboard" icon={Trophy} label="Peringkat" />
                        {isLandingPage && (
                          <>
                            <button onClick={() => handleNavClick("#about")} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md">Tentang</button>
                            <button onClick={() => handleNavClick("#gallery")} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md">Galeri</button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Account */}
                    {isAuthenticated && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Akun</p>
                        <div className="space-y-0.5">
                          <MobileNavLink to="/profile" icon={Settings} label="Profil" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t">
                    {isAuthenticated ? (
                      <Button variant="outline" className="w-full" onClick={() => { logout(); setMobileOpen(false); }}><LogOut className="h-4 w-4 mr-2" />Keluar</Button>
                    ) : (
                      <Link to="/login" onClick={() => setMobileOpen(false)}><Button className="w-full bg-red-600 hover:bg-red-700">Masuk</Button></Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
