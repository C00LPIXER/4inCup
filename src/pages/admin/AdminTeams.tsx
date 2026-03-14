import { useState, useRef } from "react";
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
  shuffleTeams, updateTeam, deleteTeam, movePlayer, createTeam, updatePlayer,
} from "@/services/firebase-service";
import { TEAM_DEFAULT_NAMES, TEAM_COLORS, type Player, type Team } from "@/types";
import { Shuffle, Edit3, Users, ArrowRightLeft, Shield, Plus, Trash2, Palette, UserCircle2, GripVertical } from "lucide-react";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#64748b", "#a16207",
];

const UNASSIGNED_ZONE = "__unassigned__";

interface DragState {
  playerId: string;
  fromTeamId: string; // "" = unassigned
}

export default function AdminTeams() {
  const { players, teams, activeChampionship, loading } = useTournament();

  const [shuffling, setShuffling] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit team dialog
  const [editTeam, setEditTeam] = useState<{ id: string; name: string; color: string } | null>(null);

  // Move player dialog (kept as fallback)
  const [moveState, setMoveState] = useState<{ player: Player; fromTeamId: string } | null>(null);
  const [targetTeamId, setTargetTeamId] = useState("");

  // Create team dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState(TEAM_COLORS[0]);

  // Delete confirm
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);

  // â”€â”€ Drag & Drop state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null); // teamId or UNASSIGNED_ZONE
  const dragCounters = useRef<Record<string, number>>({});   // per-zone enter counter to avoid flicker

  if (loading) return <PageLoader />;

  const unassignedPlayers = players.filter((p) => !p.teamId);

  // â”€â”€ Shuffle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleShuffle = async () => {
    if (!activeChampionship) return;
    if (teams.length > 0 && !confirm("Re-shuffle all teams? Existing assignments will be lost.")) return;
    setShuffling(true);
    try {
      await shuffleTeams(activeChampionship.id, activeChampionship.teamCount, TEAM_DEFAULT_NAMES, TEAM_COLORS);
    } catch (err) { console.error(err); }
    finally { setShuffling(false); }
  };

  // â”€â”€ Edit team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleEditSave = async () => {
    if (!editTeam || !editTeam.name.trim()) return;
    setSaving(true);
    await updateTeam(editTeam.id, { name: editTeam.name.trim(), color: editTeam.color });
    setEditTeam(null);
    setSaving(false);
  };

  // â”€â”€ Move player dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleMove = async () => {
    if (!moveState || !targetTeamId) return;
    setSaving(true);
    if (moveState.fromTeamId) {
      await movePlayer(moveState.player.id, moveState.fromTeamId, targetTeamId);
    } else {
      // unassigned â†’ team
      await updatePlayer(moveState.player.id, { teamId: targetTeamId });
      const toTeam = teams.find((t) => t.id === targetTeamId);
      if (toTeam) {
        await updateTeam(toTeam.id, { playerIds: [...toTeam.playerIds, moveState.player.id] });
      }
    }
    setMoveState(null);
    setTargetTeamId("");
    setSaving(false);
  };

  // â”€â”€ Create team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleCreate = async () => {
    if (!activeChampionship || !createName.trim()) return;
    setSaving(true);
    await createTeam({ name: createName.trim(), color: createColor, championshipId: activeChampionship.id, playerIds: [] });
    setCreateName("");
    setShowCreate(false);
    setSaving(false);
  };

  // â”€â”€ Delete team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? Players will become unassigned.`)) return;
    setDeletingTeam(teamId);
    const teamPlayers = players.filter((p) => p.teamId === teamId);
    await Promise.all(teamPlayers.map((p) => updatePlayer(p.id, { teamId: "" })));
    await deleteTeam(teamId);
    setDeletingTeam(null);
  };

  // â”€â”€ Remove player from team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRemoveFromTeam = async (player: Player) => {
    await updatePlayer(player.id, { teamId: "" });
    const team = teams.find((t) => t.id === player.teamId);
    if (team) {
      await updateTeam(team.id, { playerIds: team.playerIds.filter((id) => id !== player.id) });
    }
  };

  // â”€â”€ Drag & Drop handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onDragStart = (e: React.DragEvent, player: Player, fromTeamId: string) => {
    setDragging({ playerId: player.id, fromTeamId });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", player.id);
  };

  const onDragEnd = () => {
    setDragging(null);
    setDragOverZone(null);
    dragCounters.current = {};
  };

  const onDragEnter = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    dragCounters.current[zoneId] = (dragCounters.current[zoneId] ?? 0) + 1;
    setDragOverZone(zoneId);
  };

  const onDragLeave = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    dragCounters.current[zoneId] = (dragCounters.current[zoneId] ?? 1) - 1;
    if (dragCounters.current[zoneId] <= 0) {
      dragCounters.current[zoneId] = 0;
      setDragOverZone((prev) => (prev === zoneId ? null : prev));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent, toZoneId: string) => {
    e.preventDefault();
    setDragOverZone(null);
    dragCounters.current = {};
    if (!dragging) return;

    const { playerId, fromTeamId } = dragging;
    setDragging(null);

    // Same zone â€” nothing to do
    if ((toZoneId === UNASSIGNED_ZONE && !fromTeamId) || toZoneId === fromTeamId) return;

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    setSaving(true);
    try {
      if (toZoneId === UNASSIGNED_ZONE) {
        // â†’ unassigned
        await handleRemoveFromTeam(player);
      } else if (!fromTeamId) {
        // unassigned â†’ team
        await updatePlayer(playerId, { teamId: toZoneId });
        const toTeam = teams.find((t) => t.id === toZoneId);
        if (toTeam) {
          await updateTeam(toTeam.id, { playerIds: [...toTeam.playerIds, playerId] });
        }
      } else {
        // team â†’ team
        await movePlayer(playerId, fromTeamId, toZoneId);
      }
    } catch (err) {
      console.error("Drop error:", err);
    } finally {
      setSaving(false);
    }
  };

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const draggedPlayer = dragging ? players.find((p) => p.id === dragging.playerId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Manage Teams</h1>
          <p className="text-muted-foreground">{teams.length} teams â€¢ {players.length} players
            {saving && <span className="ml-2 text-xs text-muted-foreground">savingâ€¦</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Team
          </Button>
          <Button onClick={handleShuffle} disabled={shuffling || players.length < 4} size="lg" className="glow-pulse">
            {shuffling ? <><Spinner size="sm" className="mr-2 text-primary-foreground" />Shufflingâ€¦</> : <><Shuffle className="h-4 w-4 mr-2" />Auto-Split Teams</>}
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

      {/* Drag hint */}
      {teams.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5" />
          Drag players between teams or drop into Unassigned
        </p>
      )}

      {/* Unassigned Players â€” also a drop zone */}
      <Card
        className={`transition-all duration-150 ${
          dragOverZone === UNASSIGNED_ZONE
            ? "border-destructive ring-2 ring-destructive/40 bg-destructive/5"
            : unassignedPlayers.length > 0
            ? "border-destructive/30"
            : dragging
            ? "border-dashed border-border/60"
            : "border-transparent"
        }`}
        onDragEnter={(e) => onDragEnter(e, UNASSIGNED_ZONE)}
        onDragLeave={(e) => onDragLeave(e, UNASSIGNED_ZONE)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, UNASSIGNED_ZONE)}
      >
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-destructive" />
            Unassigned Players ({unassignedPlayers.length})
            {dragOverZone === UNASSIGNED_ZONE && (
              <Badge className="ml-auto text-xs bg-destructive/20 text-destructive border-destructive/30 animate-pulse">
                Drop here to unassign
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unassignedPlayers.length === 0 && !dragging ? (
            <p className="text-xs text-muted-foreground text-center py-2">No unassigned players.</p>
          ) : (
            <div className={`flex flex-wrap gap-2 min-h-[40px] rounded-lg transition-colors ${dragOverZone === UNASSIGNED_ZONE ? "bg-destructive/5" : ""}`}>
              {unassignedPlayers.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, p, "")}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5 cursor-grab active:cursor-grabbing select-none transition-opacity ${
                    dragging?.playerId === p.id ? "opacity-40 scale-95" : "hover:bg-secondary/80"
                  }`}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                  {p.photoURL ? (
                    <img src={p.photoURL} alt={p.name} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
              {dragging && dragging.fromTeamId !== "" && (
                <div className="flex items-center gap-2 border-2 border-dashed border-destructive/40 rounded-full px-3 py-1.5 text-xs text-destructive/60">
                  Drop to unassign
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
            const isOver = dragOverZone === team.id;
            const isSameTeam = dragging?.fromTeamId === team.id;

            return (
              <Card
                key={team.id}
                className={`overflow-hidden transition-all duration-150 ${
                  isOver && !isSameTeam
                    ? "ring-2 shadow-lg"
                    : dragging && !isSameTeam
                    ? "border-dashed border-border/60"
                    : ""
                }`}
                style={isOver && !isSameTeam ? { boxShadow: `0 0 0 2px ${team.color}55` } : undefined}
                onDragEnter={(e) => onDragEnter(e, team.id)}
                onDragLeave={(e) => onDragLeave(e, team.id)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, team.id)}
              >
                <div className="h-1.5" style={{ backgroundColor: team.color }} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{teamPlayers.length} players</Badge>
                    {avgSkill > 0 && <Badge variant="outline" className="text-[10px]">Avg {avgSkill}/10</Badge>}
                    {isOver && !isSameTeam && draggedPlayer && (
                      <Badge className="text-xs animate-pulse" style={{ backgroundColor: `${team.color}30`, color: team.color, borderColor: `${team.color}50` }}>
                        + {draggedPlayer.name}
                      </Badge>
                    )}
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
                  <div
                    className={`space-y-1.5 min-h-[48px] rounded-lg transition-colors ${
                      isOver && !isSameTeam ? "bg-primary/5" : ""
                    }`}
                  >
                    {teamPlayers.length === 0 && !isOver && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {dragging ? "Drop player here" : "No players in this team."}
                      </p>
                    )}
                    {teamPlayers.map((p) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, p, team.id)}
                        onDragEnd={onDragEnd}
                        className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all group select-none cursor-grab active:cursor-grabbing ${
                          dragging?.playerId === p.id
                            ? "opacity-40 scale-95 bg-secondary/30"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 flex-shrink-0 transition-colors" />
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
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { setMoveState({ player: p, fromTeamId: team.id }); setTargetTeamId(""); }}
                            title="Move to another team"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFromTeam(p)}
                            title="Remove from team"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Ghost drop target row */}
                    {isOver && !isSameTeam && draggedPlayer && (
                      <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg border-2 border-dashed opacity-60 pointer-events-none"
                        style={{ borderColor: team.color }}>
                        <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                        {draggedPlayer.photoURL ? (
                          <img src={draggedPlayer.photoURL} alt={draggedPlayer.name} className="h-7 w-7 rounded-full object-cover border border-border flex-shrink-0" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{draggedPlayer.name}</p>
                          {draggedPlayer.role && <p className="text-[10px] text-muted-foreground">{draggedPlayer.role}</p>}
                        </div>
                      </div>
                    )}
                  </div>
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
              {saving ? "Creatingâ€¦" : "Create Team"}
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
              {saving ? "Savingâ€¦" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Player Dialog (fallback via ArrowRightLeft button) */}
      <Dialog open={!!moveState} onOpenChange={() => setMoveState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Player</DialogTitle>
            <DialogDescription>Move <strong>{moveState?.player.name}</strong> to a different team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Destination Team</Label>
            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
              <SelectTrigger><SelectValue placeholder="Select teamâ€¦" /></SelectTrigger>
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
              {saving ? "Movingâ€¦" : "Move Player"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
