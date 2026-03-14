import { useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  updatePlayer, deletePlayer, assignRole, createManualPlayer,
} from "@/services/firebase-service";
import type { Player, CricketRole } from "@/types";
import {
  Users, Edit3, Trash2, UserCog, Search, Plus, Filter, UserCircle2, X,
} from "lucide-react";

const ROLES: CricketRole[] = ["Batsman", "Bowler", "All-Rounder", "Fielder"];

export default function AdminPlayers() {
  const { players, teams, activeChampionship, loading } = useTournament();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  // Edit name dialog
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhotoURL, setEditPhotoURL] = useState("");

  // Role dialog
  const [assignPlayer, setAssignPlayer] = useState<Player | null>(null);
  const [selectedRole, setSelectedRole] = useState<CricketRole>("Batsman");

  // Add player dialog
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhotoURL, setAddPhotoURL] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (loading) return <PageLoader />;

  // ── Filters ──
  const filtered = players.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" ? true : filterRole === "unassigned" ? !p.role : p.role === filterRole;
    const matchTeam = filterTeam === "all" ? true : filterTeam === "unassigned" ? !p.teamId : p.teamId === filterTeam;
    return matchSearch && matchRole && matchTeam;
  });

  // ── Handlers ──
  const handleEditSave = async () => {
    if (!editPlayer || !editName.trim()) return;
    setSaving(true);
    await updatePlayer(editPlayer.id, { name: editName.trim(), photoURL: editPhotoURL.trim() || editPlayer.photoURL });
    setEditPlayer(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this player? This cannot be undone.")) return;
    setDeleting(id);
    await deletePlayer(id);
    setDeleting(null);
  };

  const openAssign = (player: Player) => {
    setAssignPlayer(player);
    setSelectedRole((player.role as CricketRole) || "Batsman");
  };

  const handleAssign = async () => {
    if (!assignPlayer) return;
    setSaving(true);
    await assignRole(assignPlayer.id, selectedRole);
    setAssignPlayer(null);
    setSaving(false);
  };

  const handleAddPlayer = async () => {
    if (!activeChampionship || !addName.trim()) return;
    setSaving(true);
    await createManualPlayer(activeChampionship.id, addName.trim(), addPhotoURL.trim());
    setAddName("");
    setAddPhotoURL("");
    setShowAdd(false);
    setSaving(false);
  };

  const roleCounts = ROLES.reduce((acc, role) => { acc[role] = players.filter((p) => p.role === role).length; return acc; }, {} as Record<string, number>);
  const unassigned = players.filter((p) => !p.role).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Manage Players</h1>
          <p className="text-muted-foreground">{players.length} registered players</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Player
        </Button>
      </div>

      {/* Role Summary */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <Badge key={role} variant="secondary" className="cursor-pointer text-xs" onClick={() => setFilterRole(filterRole === role ? "all" : role)}>
            {role}: {roleCounts[role]}
          </Badge>
        ))}
        <Badge variant="outline" className="cursor-pointer text-xs" onClick={() => setFilterRole(filterRole === "unassigned" ? "all" : "unassigned")}>
          Unassigned: {unassigned}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search players…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {teams.length > 0 && (
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="unassigned">No Team</SelectItem>
              {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {(filterRole !== "all" || filterTeam !== "all" || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterRole("all"); setFilterTeam("all"); setSearch(""); }}>
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">Showing {filtered.length} of {players.length} players</p>

      {/* Player List */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No players match your filters.</p>
          </div>
        ) : (
          filtered.map((player) => {
            const team = teams.find((t) => t.id === player.teamId);
            return (
              <Card key={player.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {player.photoURL ? (
                      <img src={player.photoURL} alt={player.name} className="h-12 w-12 rounded-full object-cover border-2 border-border flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <UserCircle2 className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{player.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {player.role ? (
                          <Badge variant="default" className="text-[10px]">{player.role}</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">No Role</Badge>
                        )}
                        {team ? (
                          <Badge variant="secondary" className="text-[10px]" style={{ borderLeft: `3px solid ${team.color}` }}>
                            {team.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">No Team</Badge>
                        )}

                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openAssign(player)} title="Assign Role & Skills">
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditPlayer(player); setEditName(player.name); setEditPhotoURL(player.photoURL || ""); }} title="Edit Player">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(player.id)} disabled={deleting === player.id} title="Delete Player">
                        {deleting === player.id ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Player Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Player Manually</DialogTitle>
            <DialogDescription>Add a player directly without the public registration form.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Player Name *</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Full name" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Photo URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={addPhotoURL} onChange={(e) => setAddPhotoURL(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddPlayer} disabled={saving || !addName.trim()}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Adding…" : "Add Player"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={!!editPlayer} onOpenChange={() => setEditPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Player Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Photo URL</Label>
              <Input value={editPhotoURL} onChange={(e) => setEditPhotoURL(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlayer(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving || !editName.trim()}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role/Skills Dialog */}
      <Dialog open={!!assignPlayer} onOpenChange={() => setAssignPlayer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>{assignPlayer?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as CricketRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignPlayer(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Saving…" : "Save Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
