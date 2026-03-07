import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  updatePlayer,
  deletePlayer,
  assignRole,
} from "@/services/firebase-service";
import type { Player, CricketRole, CricketSkills } from "@/types";
import {
  Users,
  Edit3,
  Trash2,
  UserCog,
  Search,
} from "lucide-react";

const ROLES: CricketRole[] = ["Batsman", "Bowler", "All-Rounder", "Fielder"];

export default function AdminPlayers() {
  const { players, activeChampionship, loading } = useTournament();
  const [search, setSearch] = useState("");
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [assignPlayer, setAssignPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Assign role form state
  const [selectedRole, setSelectedRole] = useState<CricketRole>("Batsman");
  const [skills, setSkills] = useState<CricketSkills>({
    batting: 5,
    bowling: 5,
    fielding: 5,
    keeping: 5,
    experience: 5,
  });

  if (loading) return <PageLoader />;

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditName = async () => {
    if (!editPlayer || !editName.trim()) return;
    setSaving(true);
    await updatePlayer(editPlayer.id, { name: editName.trim() });
    setEditPlayer(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this player?")) {
      await deletePlayer(id);
    }
  };

  const openAssign = (player: Player) => {
    setAssignPlayer(player);
    setSelectedRole((player.role as CricketRole) || "Batsman");
    setSkills(
      player.skills || {
        batting: 5,
        bowling: 5,
        fielding: 5,
        keeping: 5,
        experience: 5,
      }
    );
  };

  const handleAssign = async () => {
    if (!assignPlayer) return;
    setSaving(true);
    await assignRole(assignPlayer.id, selectedRole, skills);
    setAssignPlayer(null);
    setSaving(false);
  };

  const roleCounts = ROLES.reduce(
    (acc, role) => {
      acc[role] = players.filter((p) => p.role === role).length;
      return acc;
    },
    {} as Record<string, number>
  );
  const unassigned = players.filter((p) => !p.role).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Manage Players</h1>
          <p className="text-muted-foreground">
            {players.length} registered players
          </p>
        </div>
      </div>

      {/* Role Summary */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <Badge key={role} variant="secondary" className="text-xs">
            {role}: {roleCounts[role]}
          </Badge>
        ))}
        <Badge variant="outline" className="text-xs">
          Unassigned: {unassigned}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Player List */}
      <div className="grid gap-3">
        {filtered.map((player) => (
          <Card key={player.id} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <img
                  src={player.photoURL}
                  alt={player.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{player.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {player.role ? (
                      <Badge variant="default" className="text-[10px]">
                        {player.role}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        No Role
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      BAT:{player.skills.batting} BOW:{player.skills.bowling}{" "}
                      FLD:{player.skills.fielding}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openAssign(player)}
                    title="Assign Role & Skills"
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditPlayer(player);
                      setEditName(player.name);
                    }}
                    title="Edit Name"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(player.id)}
                    title="Remove Player"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{search ? "No matching players" : "No players registered yet"}</p>
          </div>
        )}
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={!!editPlayer} onOpenChange={() => setEditPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player Name</DialogTitle>
            <DialogDescription>Update the player's display name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Player Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlayer(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditName} disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={!!assignPlayer} onOpenChange={() => setAssignPlayer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role & Skills</DialogTitle>
            <DialogDescription>
              {assignPlayer?.name} — Set their role and skill ratings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as CricketRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <SkillSlider
                label="Batting"
                value={skills.batting}
                onChange={(v) => setSkills({ ...skills, batting: v })}
              />
              <SkillSlider
                label="Bowling"
                value={skills.bowling}
                onChange={(v) => setSkills({ ...skills, bowling: v })}
              />
              <SkillSlider
                label="Fielding"
                value={skills.fielding}
                onChange={(v) => setSkills({ ...skills, fielding: v })}
              />
              <SkillSlider
                label="Keeping"
                value={skills.keeping}
                onChange={(v) => setSkills({ ...skills, keeping: v })}
              />
              <SkillSlider
                label="Experience"
                value={skills.experience}
                onChange={(v) => setSkills({ ...skills, experience: v })}
              />
            </div>

            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Overall Rating</p>
              <p className="font-heading text-2xl font-bold text-primary">
                {(
                  (skills.batting +
                    skills.bowling +
                    skills.fielding +
                    skills.keeping +
                    skills.experience) /
                  5
                ).toFixed(1)}
                /10
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignPlayer(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SkillSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-bold text-primary">{value}/10</span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
