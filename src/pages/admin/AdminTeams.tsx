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
  shuffleTeams, updateTeam, deleteTeam, movePlayer, createTeam,
} from "@/services/firebase-service";
import { TEAM_DEFAULT_NAMES, TEAM_COLORS, type Player, type Team } from "@/types";
import { Shuffle, Edit3, Users, ArrowRightLeft, Shield, Plus, Trash2, Palette, UserCircle2 } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#64748b", "#a16207",
];

export default function AdminTeams() {
  const { players, teams, activeChampionship, loading } = useTournament();

  const [shuffling, setShuffling] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit team dialog
  const [editTeam, setEditTeam] = useState<{ id: string; name: string; color: string } | null>(null);

  // Move player dialog
  const [moveState, setMoveState] = useState<{ player: Player; fromTeamId: string } | null>(null);
  const [targetTeamId, setTargetTeamId] = useState("");

  // Create team dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState(TEAM_COLORS[0]);

  // Delete confirm
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);

  if (loading) return <PageLoader />;

  const unassignedPlayers = players.filter((p) => !p.teamId);

  const handleShuffle = async () => {
    if (!activeChampionship) return;
    if (teams.length > 0 && !confirm("Re-shuffle all teams? Existing assignments will be lost.")) return;
    setShuffling(true);
    try {
      await shuffleTeams(activeChampionship.id, activeChampionship.teamCount, TEAM_DEFAULT_NAMES, TEAM_COLORS);
    } catch (err) { console.error(err); }
    finally { setShuffling(false); }
  };

  const handleEditSave = async () => {
    if (!editTeam || !editTeam.name.trim()) return;
    setSaving(true);
    await updateTeam(editTeam.id, { name: editTeam.name.trim(), color: editTeam.color });
    setEditTeam(null);
    setSaving(false);
  };

  const handleMove = async () => {
    if (!moveState || !targetTeamId) return;
    setSaving(true);
    await movePlayer(moveState.player.id, moveState.fromTeamId, targetTeamId);
    setMoveState(null);
    setTargetTeamId("");
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!activeChampionship || !createName.trim()) return;
    setSaving(true);
    await createTeam({ name: createName.trim(), color: createColor, championshipId: activeChampionship.id, playerIds: [] });
    setCreateName("");
    setShowCreate(false);
    setSaving(false);
  };

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? Players will become unassigned.`)) return;
    setDeletingTeam(teamId);
    // Unassign all players in this team
    const teamPlayers = players.filter((p) => p.teamId === teamId);
    await Promise.all(teamPlayers.map((p) => import("@/services/firebase-service").then(({ updatePlayer }) => updatePlayer(p.id, { teamId: "" }))));
    await deleteTeam(teamId);
    setDeletingTeam(null);
  };

  const handleRemoveFromTeam = async (player: Player) => {
    await import("@/services/firebase-service").then(({ updatePlayer }) =>
      updatePlayer(player.id, { teamId: "" })
    );
    // also update the team's playerIds
    const team = teams.find((t) => t.id === player.teamId);
    if (team) {
      await updateTeam(team.id, { playerIds: team.playerIds.filter((id) => id !== player.id) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Manage Teams</h1>
          <p className="text-muted-foreground">{teams.length} teams • {players.length} players</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Team
          </Button>
          <Button onClick={handleShuffle} disabled={shuffling || players.length < 4} size="lg" className="glow-pulse">
            {shuffling ? <><Spinner size="sm" className="mr-2 text-primary-foreground" />Shuffling…</> : <><Shuffle className="h-4 w-4 mr-2" />Auto-Split Teams</>}
          </Button>
        </div>
      </div>

      {players.length < 4 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="p-4 text-center text-sm text-accent">
            Need at least 4 players to auto-split teams. Currently: {players.length}
          </CardContent>
        </Card>
      )}

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-destructive" />
              Unassigned Players ({unassignedPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassignedPlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5">
                  {p.photoURL ? (
                    <img src={p.photoURL} alt={p.name} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-14 w-14 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No teams yet.</p>
          <p className="text-sm mt-1">Use "Auto-Split Teams" or create teams manually.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {teams.map((team) => {
            const teamPlayers = players.filter((p) => p.teamId === team.id);
            const avgSkill = teamPlayers.length
              ? Math.round(teamPlayers.reduce((s, p) => s + (p.skills.batting + p.skills.bowling + p.skills.fielding + p.skills.experience) / 4, 0) / teamPlayers.length)
              : 0;

            return (
              <Card key={team.id} className="overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: team.color }} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{teamPlayers.length} players</Badge>
                    {avgSkill > 0 && <Badge variant="outline" className="text-[10px]">Avg {avgSkill}/10</Badge>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditTeam({ id: team.id, name: team.name, color: team.color })} title="Edit Team">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(team.id, team.name)} disabled={deletingTeam === team.id} title="Delete Team">
                      {deletingTeam === team.id ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {teamPlayers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No players in this team.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {teamPlayers.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors group">
                          {p.photoURL ? (
                            <img src={p.photoURL} alt={p.name} className="h-7 w-7 rounded-full object-cover border border-border flex-shrink-0" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            {p.role && <p className="text-[10px] text-muted-foreground">{p.role}</p>}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMoveState({ player: p, fromTeamId: team.id }); setTargetTeamId(""); }} title="Move to another team">
                              <ArrowRightLeft className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemoveFromTeam(p)} title="Remove from team">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Thunder Hawks" autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Team Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => setCreateColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${createColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={createColor} onChange={(e) => setCreateColor(e.target.value)}
                  className="h-8 w-8 rounded-full cursor-pointer border border-border" title="Custom color" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !createName.trim()}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Creating…" : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={!!editTeam} onOpenChange={() => setEditTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          {editTeam && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input value={editTeam.name} onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> Team Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setEditTeam({ ...editTeam, color: c })}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${editTeam.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <input type="color" value={editTeam.color} onChange={(e) => setEditTeam({ ...editTeam, color: e.target.value })}
                    className="h-8 w-8 rounded-full cursor-pointer border border-border" title="Custom color" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: editTeam.color }} />
                  <span className="text-sm text-muted-foreground">{editTeam.color}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeam(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving || !editTeam?.name.trim()}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Player Dialog */}
      <Dialog open={!!moveState} onOpenChange={() => setMoveState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Player</DialogTitle>
            <DialogDescription>Move <strong>{moveState?.player.name}</strong> to a different team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Destination Team</Label>
            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
              <SelectTrigger><SelectValue placeholder="Select team…" /></SelectTrigger>
              <SelectContent>
                {teams.filter((t) => t.id !== moveState?.fromTeamId).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveState(null)}>Cancel</Button>
            <Button onClick={handleMove} disabled={saving || !targetTeamId}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Moving…" : "Move Player"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// inline X icon for remove-from-team button
function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
