import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
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
  BookOpen,
  Trophy,
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, isPsdm, isMentor, isUser, signOut } = useSupabaseAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLandingPage = location.pathname === "/";

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
          ...(isUser ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
          ...(isMentor ? [{ to: "/mentor", label: "Dashboard Mentor", icon: Users }] : []),
          ...(isPsdm ? [{ to: "/admin", label: "Panel PSDM", icon: Shield }] : []),
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
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-ufo.png" alt="UFO UGM" className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link: any) =>
              link.href ? (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    location.pathname === link.to
                      ? "text-red-600 bg-red-50"
                      : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                  }`}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium">{user?.full_name || "User"}</span>
                  {isPsdm && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">PSDM</span>}
                  {isMentor && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Mentor</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-500 hover:text-red-600">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  <BookOpen className="h-4 w-4 mr-1.5" />Masuk
                </Button>
              </Link>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <img src="/logo-ufo.png" alt="UFO UGM" className="h-7 w-auto" />
                </div>
                <div className="flex-1 p-4 space-y-1">
                  {isAuthenticated && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm">{user?.full_name || "User"}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-2">
                        {isPsdm && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Admin PSDM</span>}
                        {isMentor && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Mentor</span>}
                        {isUser && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Calon Anggota</span>}
                      </div>
                    </div>
                  )}
                  {navLinks.map((link: any) =>
                    link.href ? (
                      <button key={link.href} onClick={() => handleNavClick(link.href)} className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md">{link.label}</button>
                    ) : (
                      <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md ${location.pathname === link.to ? "text-red-600 bg-red-50" : "text-gray-600 hover:text-red-600 hover:bg-red-50"}`}>
                        {link.icon && <link.icon className="h-4 w-4" />}{link.label}
                      </Link>
                    )
                  )}
                </div>
                <div className="p-4 border-t">
                  {isAuthenticated ? (
                    <Button variant="outline" className="w-full" onClick={() => { signOut(); setMobileOpen(false); }}><LogOut className="h-4 w-4 mr-2" />Keluar</Button>
                  ) : (
                    <Link to="/login" onClick={() => setMobileOpen(false)}><Button className="w-full bg-red-600 hover:bg-red-700">Masuk</Button></Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
