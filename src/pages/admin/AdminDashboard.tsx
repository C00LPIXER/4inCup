import { useState } from "react";
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
} from "lucide-react";
import { updateChampionship } from "@/services/firebase-service";
import type { Championship } from "@/types";
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
  } = useTournament();

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("4inCup Cricket Tournament – Season 1");
  const [newOrganizer, setNewOrganizer] = useState("4inDegree");
  const [newSeason, setNewSeason] = useState(1);
  const [newOvers, setNewOvers] = useState(6);
  const [copied, setCopied] = useState(false);

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
        teamCount: 4,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your cricket tournament
          </p>
        </div>
        <div className="flex items-center gap-3">
          {championships.length > 1 && (
            <Select
              value={activeChampionship?.id || ""}
              onValueChange={setActiveChampionshipId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select championship" />
              </SelectTrigger>
              <SelectContent>
                {championships.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Championship
          </Button>
        </div>
      </div>

      {!activeChampionship ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">
              Welcome to 4inCup Admin
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first championship to get started.
            </p>
            <Button size="lg" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Championship
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Championship Info */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="font-heading text-xl font-bold">
                    {activeChampionship.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Season {activeChampionship.season} •{" "}
                    {activeChampionship.organizer} •{" "}
                    {activeChampionship.oversPerMatch} overs/match
                  </p>
                  <Badge
                    className="mt-2"
                    variant={
                      activeChampionship.registrationOpen
                        ? "default"
                        : "secondary"
                    }
                  >
                    {activeChampionship.registrationOpen
                      ? "Registration Open"
                      : "Registration Closed"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleRegistration}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    {activeChampionship.registrationOpen
                      ? "Close Registration"
                      : "Open Registration"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-primary" />
                Registration Link
              </CardTitle>
              <CardDescription>
                Share this link with players to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={registrationLink}
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              icon={<Users className="h-5 w-5" />}
              label="Players"
              value={players.length}
              color="text-blue-400"
            />
            <StatsCard
              icon={<Shield className="h-5 w-5" />}
              label="Teams"
              value={teams.length}
              color="text-primary"
            />
            <StatsCard
              icon={<Calendar className="h-5 w-5" />}
              label="Total Matches"
              value={matches.length}
              color="text-accent"
            />
            <StatsCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Completed"
              value={completedMatches.length}
              color="text-purple-400"
            />
          </div>
        </>
      )}

      {/* Create Championship Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Championship</DialogTitle>
            <DialogDescription>
              Set up a new tournament championship
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Championship Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. 4inCup Cricket Tournament – Season 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Organizer</Label>
              <Input
                value={newOrganizer}
                onChange={(e) => setNewOrganizer(e.target.value)}
                placeholder="e.g. 4inDegree"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Season Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={newSeason}
                  onChange={(e) => setNewSeason(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Overs Per Match</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={newOvers}
                  onChange={(e) => setNewOvers(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? (
                <>
                  <Spinner size="sm" className="mr-2 text-primary-foreground" />
                  Creating...
                </>
              ) : (
                "Create Championship"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className={`mx-auto mb-2 ${color}`}>{icon}</div>
        <p className="font-heading text-3xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
