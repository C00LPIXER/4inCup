import { Routes, Route } from "react-router-dom";
import { TournamentProvider } from "@/context/TournamentContext";
import { PublicLayout, AdminLayout } from "@/components/layout/Layout";

// Public pages
import HomePage from "@/pages/public/HomePage";
import TeamsPage from "@/pages/public/TeamsPage";
import FixturesPage from "@/pages/public/FixturesPage";
import StandingsPage from "@/pages/public/StandingsPage";
import PlayersPage from "@/pages/public/PlayersPage";
import RegisterPage from "@/pages/public/RegisterPage";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPlayers from "@/pages/admin/AdminPlayers";
import AdminTeams from "@/pages/admin/AdminTeams";
import AdminMatches from "@/pages/admin/AdminMatches";
import AdminStandings from "@/pages/admin/AdminStandings";

export default function App() {
  return (
    <TournamentProvider>
      <Routes>
        {/* Registration (standalone page) */}
        <Route path="/register/:championshipId" element={<RegisterPage />} />

        {/* Public Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/fixtures" element={<FixturesPage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/players" element={<PlayersPage />} />
        </Route>

        {/* Admin Pages */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="teams" element={<AdminTeams />} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="standings" element={<AdminStandings />} />
        </Route>
      </Routes>
    </TournamentProvider>
  );
}
