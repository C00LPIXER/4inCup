import { useState } from "react";
import { Link } from "react-router-dom";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  Trophy,
  Users,
  Shield,
  Calendar,
  BarChart3,
  Plus,
  Copy,
  Check,
  Link as LinkIcon,
  Settings,
  UserCircle2,
  Swords,
  CheckCircle,
  Clock,
  Activity,
  ChevronRight,
} from "lucide-react";
import {
  updateChampionship,
  deleteChampionship,
} from "@/services/firebase-service";
import type { Championship, Player, Team } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const {
    championships,
    activeChampionship,
    setActiveChampionshipId,
    players,
    teams,
    matches,
    loading,
    createNewChampionship,
    refreshChampionships,
  } = useTournament();

  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("4inCup Cricket Tournament – Season 1");
  const [newOrganizer, setNewOrganizer] = useState("4inDegree");
  const [newSeason, setNewSeason] = useState(1);
  const [newOvers, setNewOvers] = useState(6);
  const [copied, setCopied] = useState(false);

  const [settingsName, setSettingsName] = useState("");
  const [settingsOrganizer, setSettingsOrganizer] = useState("");
  const [settingsOvers, setSettingsOvers] = useState(6);

  if (loading && championships.length === 0) return <PageLoader />;

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createNewChampionship({
        name: newName,
        season: newSeason,
        sport: "cricket",
        organizer: newOrganizer,
        status: "registration",
        teamCount: 5,
        maxPlayersPerTeam: 11,
        oversPerMatch: newOvers,
        registrationOpen: true,
      });
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const openSettings = () => {
    if (!activeChampionship) return;
    setSettingsName(activeChampionship.name);
    setSettingsOrganizer(activeChampionship.organizer);
    setSettingsOvers(activeChampionship.oversPerMatch);
    setShowSettings(true);
  };

  const handleSaveSettings = async () => {
    if (!activeChampionship) return;
    setSaving(true);
    await updateChampionship(activeChampionship.id, {
      name: settingsName.trim(),
      organizer: settingsOrganizer.trim(),
      oversPerMatch: settingsOvers,
    });
    setShowSettings(false);
    setSaving(false);
  };

  const handleDeleteChampionship = async () => {
    if (!activeChampionship) return;
    if (!confirm(`Delete "${activeChampionship.name}"? This cannot be undone.`)) return;
    await deleteChampionship(activeChampionship.id);
    await refreshChampionships();
    setShowSettings(false);
  };

  const registrationLink = activeChampionship
    ? `${window.location.origin}/register/${activeChampionship.id}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleRegistration = async () => {
    if (!activeChampionship) return;
    await updateChampionship(activeChampionship.id, {
      registrationOpen: !activeChampionship.registrationOpen,
    });
  };

  const completedMatches = matches.filter((m) => m.status === "completed");
  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const teamsFormed = teams.length > 0;
  const unassignedPlayers = players.filter((p) => !p.teamId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your 4inCup cricket tournament</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {championships.length > 1 && (
            <Select value={activeChampionship?.id || ""} onValueChange={setActiveChampionshipId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select championship" />
              </SelectTrigger>
              <SelectContent>
                {championships.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Championship
          </Button>
        </div>
      </div>

      {!activeChampionship ? (
        <Card className="text-center py-16">
          <CardContent>
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">Welcome to 4inCup Admin</h2>
            <p className="text-muted-foreground mb-6">Create your first championship to get started.</p>
            <Button size="lg" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Championship
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Championship Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="font-heading text-xl font-bold">{activeChampionship.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Season {activeChampionship.season} • {activeChampionship.organizer} • {activeChampionship.oversPerMatch} overs/match
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={activeChampionship.registrationOpen ? "default" : "secondary"}>
                      {activeChampionship.registrationOpen ? "Registration Open" : "Registration Closed"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {activeChampionship.status.replace(/_/g, " ")}
                    </Badge>
                    {liveMatches.length > 0 && (
                      <Badge className="bg-red-500 text-white animate-pulse">
                        🔴 {liveMatches.length} Live
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={toggleRegistration}>
                    {activeChampionship.registrationOpen ? "Close Registration" : "Open Registration"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={openSettings}>
                    <Settings className="h-3 w-3 mr-1" /> Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-primary" /> Player Registration Link
              </CardTitle>
              <CardDescription>Share this link with players to self-register</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input readOnly value={registrationLink} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatsCard icon={<Users className="h-5 w-5" />} label="Players" value={players.length}
              sub={unassignedPlayers.length > 0 ? `${unassignedPlayers.length} unassigned` : "All assigned"}
              color="text-blue-400" href="/admin/players" />
            <StatsCard icon={<Shield className="h-5 w-5" />} label="Teams" value={teams.length}
              sub={teamsFormed ? "Teams formed" : "Not split yet"}
              color="text-primary" href="/admin/teams" />
            <StatsCard icon={<Calendar className="h-5 w-5" />} label="Fixtures" value={matches.length}
              sub={`${upcomingMatches.length} upcoming`}
              color="text-accent" href="/admin/matches" />
            <StatsCard icon={<CheckCircle className="h-5 w-5" />} label="Completed" value={completedMatches.length}
              sub={matches.length ? `${Math.round((completedMatches.length / matches.length) * 100)}%` : "0%"}
              color="text-green-400" href="/admin/matches" />
            <StatsCard icon={<Activity className="h-5 w-5" />} label="Live Now" value={liveMatches.length}
              sub={liveMatches.length ? "In progress" : "No live match"}
              color="text-red-400" href="/admin/matches" />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction href="/admin/players" icon={<Users className="h-5 w-5" />} label="Manage Players" desc="Add, edit, assign roles" />
            <QuickAction href="/admin/teams" icon={<Shield className="h-5 w-5" />} label="Manage Teams" desc="Split, rename, move players" />
            <QuickAction href="/admin/matches" icon={<Swords className="h-5 w-5" />} label="Manage Matches" desc="Fixtures & scorecards" />
            <QuickAction href="/admin/standings" icon={<BarChart3 className="h-5 w-5" />} label="Standings" desc="Points table & NRR" />
          </div>

          {/* Player Roster */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5 text-primary" /> Player Roster
                </CardTitle>
                <CardDescription>
                  {players.length} registered players
                  {teamsFormed ? ` — grouped by ${teams.length} teams` : " — teams not split yet"}
                </CardDescription>
              </div>
              <Link to="/admin/players">
                <Button variant="outline" size="sm">Manage <ChevronRight className="h-3 w-3 ml-1" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No players registered yet.</p>
                  <p className="text-xs mt-1">Share the registration link above.</p>
                </div>
              ) : teamsFormed ? (
                <div className="space-y-6">
                  {teams.map((team) => (
                    <TeamRosterGroup
                      key={team.id}
                      team={team}
                      players={players.filter((p) => p.teamId === team.id)}
                    />
                  ))}
                  {unassignedPlayers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-muted-foreground/50 inline-block" />
                        Unassigned ({unassignedPlayers.length})
                      </h3>
                      <PlayerGrid players={unassignedPlayers} />
                    </div>
                  )}
                </div>
              ) : (
                <PlayerGrid players={players} />
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          {completedMatches.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" /> Recent Results
                </CardTitle>
                <Link to="/admin/matches">
                  <Button variant="ghost" size="sm">All <ChevronRight className="h-3 w-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...completedMatches].reverse().slice(0, 5).map((m) => {
                  const t1 = teams.find((t) => t.id === m.team1Id);
                  const t2 = teams.find((t) => t.id === m.team2Id);
                  return (
                    <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/40 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs font-mono">#{m.matchNumber}</Badge>
                        <span className="font-medium">{t1?.name ?? "?"} <span className="text-muted-foreground">vs</span> {t2?.name ?? "?"}</span>
                      </div>
                      {m.result && <span className="text-xs text-accent font-medium">{m.result.summary}</span>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Upcoming */}
          {upcomingMatches.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" /> Upcoming Matches
                </CardTitle>
                <Link to="/admin/matches">
                  <Button variant="ghost" size="sm">Manage <ChevronRight className="h-3 w-3 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingMatches.slice(0, 5).map((m) => {
                  const t1 = teams.find((t) => t.id === m.team1Id);
                  const t2 = teams.find((t) => t.id === m.team2Id);
                  return (
                    <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-secondary/40 text-sm">
                      <Badge variant="outline" className="text-xs font-mono">#{m.matchNumber}</Badge>
                      <span className="font-medium">{t1?.name ?? "?"} <span className="text-muted-foreground">vs</span> {t2?.name ?? "?"}</span>
                      {m.date && <span className="ml-auto text-xs text-muted-foreground">{m.date}</span>}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Championship</DialogTitle>
            <DialogDescription>Set up a new tournament championship</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Championship Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. 4inCup Cricket Tournament – Season 1" />
            </div>
            <div className="space-y-2">
              <Label>Organizer</Label>
              <Input value={newOrganizer} onChange={(e) => setNewOrganizer(e.target.value)} placeholder="e.g. 4inDegree" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Season Number</Label>
                <Input type="number" min={1} value={newSeason} onChange={(e) => setNewSeason(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Overs Per Match</Label>
                <Input type="number" min={1} max={50} value={newOvers} onChange={(e) => setNewOvers(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {creating ? "Creating…" : "Create Championship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Championship Settings</DialogTitle>
            <DialogDescription>Edit details for {activeChampionship?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Championship Name</Label>
              <Input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Organizer</Label>
              <Input value={settingsOrganizer} onChange={(e) => setSettingsOrganizer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Overs Per Match</Label>
              <Input type="number" min={1} max={50} value={settingsOvers} onChange={(e) => setSettingsOvers(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" size="sm" onClick={handleDeleteChampionship} className="sm:mr-auto">
              Delete Championship
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ──

function StatsCard({ icon, label, value, sub, color, href }: {
  icon: React.ReactNode; label: string; value: number; sub: string; color: string; href: string;
}) {
  return (
    <Link to={href}>
      <Card className="hover:border-primary/30 transition-colors cursor-pointer">
        <CardContent className="pt-5 pb-4 text-center">
          <div className={`mx-auto mb-2 ${color} flex justify-center`}>{icon}</div>
          <p className="font-heading text-3xl font-bold">{value}</p>
          <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link to={href}>
      <Card className="hover:border-primary/40 hover:bg-secondary/30 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-[11px] text-muted-foreground">{desc}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

function TeamRosterGroup({ team, players }: { team: Team; players: Player[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
        <h3 className="text-sm font-semibold">{team.name}</h3>
        <Badge variant="secondary" className="text-[10px]">{players.length} players</Badge>
      </div>
      <PlayerGrid players={players} teamColor={team.color} />
    </div>
  );
}

function PlayerGrid({ players, teamColor }: { players: Player[]; teamColor?: string }) {
  if (players.length === 0) return <p className="text-xs text-muted-foreground py-2 px-1">No players.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {players.map((p) => (
        <div
          key={p.id}
          className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors text-center"
          style={teamColor ? { borderTop: `2px solid ${teamColor}` } : undefined}
        >
          {p.photoURL ? (
            <img src={p.photoURL} alt={p.name} className="h-10 w-10 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <UserCircle2 className="h-6 w-6" />
            </div>
          )}
          <p className="text-xs font-medium leading-tight line-clamp-2">{p.name}</p>
          {p.role ? (
            <Badge variant="default" className="text-[9px] px-1.5 py-0">{p.role}</Badge>
          ) : (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0">No role</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
