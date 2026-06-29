import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import MemberDashboard from "./pages/dashboard/Dashboard";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/layout/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/leaderboard" element={<Leaderboard />} />

      {/* Member Routes */}
      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
        <Route path="/dashboard" element={<MemberDashboard />} />
      </Route>

      {/* Mentor Routes */}
      <Route element={<ProtectedRoute allowedRoles={["mentor", "psdm"]} />}>
        <Route path="/mentor" element={<MentorDashboard />} />
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
