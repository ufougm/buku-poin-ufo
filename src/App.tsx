import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import MemberDashboard from "./pages/dashboard/Dashboard";
import PemanduDashboard from "./pages/pemandu/PemanduDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FaqBukuPoin from "./pages/FaqBukuPoin";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/layout/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/leaderboard" element={<Leaderboard />} />

      {/* FAQ - Public Tutorial Page */}
      <Route path="/faq-buku-poin" element={<FaqBukuPoin />} />

      {/* Profile - All authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Member Routes */}
      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
        <Route path="/dashboard" element={<MemberDashboard />} />
      </Route>

      {/* Pemandu Routes */}
      <Route element={<ProtectedRoute allowedRoles={["pemandu", "psdm"]} />}>
        <Route path="/pemandu" element={<PemanduDashboard />} />
      </Route>

      {/* PSDM/Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["psdm"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
