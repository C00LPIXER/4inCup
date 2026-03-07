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
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  shuffleTeams,
  updateTeam,
  movePlayer,
} from "@/services/firebase-service";
import { TEAM_DEFAULT_NAMES, TEAM_COLORS, type Player } from "@/types";
import {
  Shuffle,
  Edit3,
  Users,
  ArrowRightLeft,
  Shield,
} from "lucide-react";

export default function AdminTeams() {
  const { players, teams, activeChampionship, loading } = useTournament();
  const [shuffling, setShuffling] = useState(false);
  const [renameTeam, setRenameTeam] = useState<{ id: string; name: string } | null>(null);
  const [movePlayerState, setMovePlayerState] = useState<{
    player: Player;
    fromTeamId: string;
  } | null>(null);
  const [targetTeamId, setTargetTeamId] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading) return <PageLoader />;

  const handleShuffle = async () => {
    if (!activeChampionship) return;
    if (
      teams.length > 0 &&
      !confirm(
        "This will re-shuffle all teams. Existing team assignments will be lost. Continue?"
      )
    )
      return;

    setShuffling(true);
    try {
      await shuffleTeams(
        activeChampionship.id,
        activeChampionship.teamCount,
        TEAM_DEFAULT_NAMES,
        TEAM_COLORS
      );
    } catch (err) {
      console.error(err);
    } finally {
      setShuffling(false);
    }
  };

  const handleRename = async () => {
    if (!renameTeam || !renameTeam.name.trim()) return;
    setSaving(true);
    await updateTeam(renameTeam.id, { name: renameTeam.name.trim() });
    setRenameTeam(null);
    setSaving(false);
  };

  const handleMove = async () => {
    if (!movePlayerState || !targetTeamId) return;
    setSaving(true);
    await movePlayer(
      movePlayerState.player.id,
      movePlayerState.fromTeamId,
      targetTeamId
    );
    setMovePlayerState(null);
    setTargetTeamId("");
    setSaving(false);
  };

  const unassignedPlayers = players.filter((p) => !p.teamId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Manage Teams</h1>
          <p className="text-muted-foreground">
            {teams.length} teams • {players.length} players
          </p>
        </div>
        <Button
          onClick={handleShuffle}
          disabled={shuffling || players.length < 4}
          size="lg"
          className="glow-pulse"
        >
          {shuffling ? (
            <>
              <Spinner size="sm" className="mr-2 text-primary-foreground" />
              Shuffling...
            </>
          ) : (
            <>
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle Teams
            </>
          )}
        </Button>
      </div>

      {players.length < 4 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="p-4 text-center text-sm text-accent">
            Need at least 4 players to shuffle into teams. Currently:{" "}
            {players.length}
          </CardContent>
        </Card>
      )}

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-destructive" />
              Unassigned Players ({unassignedPlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassignedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5"
                >
                  <img
                    src={p.photoURL}
                    alt={p.name}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {teams.map((team) => {
          const teamPlayers = players.filter((p) => p.teamId === team.id);
          return (
            <Card key={team.id} className="overflow-hidden">
              <div
                className="h-1.5"
                style={{ backgroundColor: team.color }}
              />
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {teamPlayers.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setRenameTeam({ id: team.id, name: team.name })
                  }
                  title="Rename Team"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teamPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <img
                        src={player.photoURL}
                        alt={player.name}
                        className="h-9 w-9 rounded-full object-cover border"
                        style={{ borderColor: team.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {player.name}
                        </p>
                        <div className="flex items-center gap-1">
                          {player.role && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0"
                            >
                              {player.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setMovePlayerState({
                            player,
                            fromTeamId: team.id,
                          })
                        }
                        title="Move to another team"
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {teamPlayers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No players
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-16">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="font-heading text-2xl font-bold mb-2">No Teams Yet</h2>
          <p className="text-muted-foreground mb-4">
            Click &quot;Shuffle Teams&quot; to automatically create balanced teams.
          </p>
        </div>
      )}

      {/* Rename Team Dialog */}
      <Dialog open={!!renameTeam} onOpenChange={() => setRenameTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Team</DialogTitle>
            <DialogDescription>Change the team name</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Team Name</Label>
            <Input
              value={renameTeam?.name || ""}
              onChange={(e) =>
                setRenameTeam(
                  renameTeam ? { ...renameTeam, name: e.target.value } : null
                )
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTeam(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Player Dialog */}
      <Dialog
        open={!!movePlayerState}
        onOpenChange={() => setMovePlayerState(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Player</DialogTitle>
            <DialogDescription>
              Move {movePlayerState?.player.name} to another team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Target Team</Label>
            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams
                  .filter((t) => t.id !== movePlayerState?.fromTeamId)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMovePlayerState(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={saving || !targetTeamId}
            >
              {saving ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              Move Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
