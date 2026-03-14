import { useTournament } from "@/context/TournamentContext";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Shield, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TeamsPage() {
  const { teams, players, loading, activeChampionship } = useTournament();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  if (loading) return <PageLoader />;

  if (teams.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="font-heading text-2xl font-bold mb-1">No Teams Yet</h2>
        <p className="text-muted-foreground">
          Teams will be formed once registration is complete.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Teams</h1>
        <p className="text-muted-foreground">
          {activeChampionship?.name} — {teams.length} Teams
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teams.map((team) => {
          const teamPlayers = players.filter((p) => p.teamId === team.id);
          return (
            <Card
              key={team.id}
              className="overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-lg"
              onClick={() => { setSelectedTeam(team); setShowTeamModal(true); }}
            >
              <div className="h-2" style={{ backgroundColor: team.color }} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: team.color }} />
                    {team.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {teamPlayers.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {teamPlayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No players assigned yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {teamPlayers.slice(0, 9).map((player) => (
                        <div key={player.id} className="flex flex-col items-center gap-2 p-2">
                          <img
                            src={player.photoURL}
                            alt={player.name}
                            className="h-20 w-20 rounded-full object-cover border-2"
                            style={{ borderColor: team.color }}
                          />
                          <div className="text-sm text-center font-medium truncate w-full">{player.name}</div>
                        </div>
                    ))}
                    {teamPlayers.length > 9 && (
                      <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                        +{teamPlayers.length - 9} more
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team modal - full player list */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTeam?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(players.filter((p) => p.teamId === selectedTeam?.id) || []).map((player) => (
              <div key={player.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                <img src={player.photoURL} alt={player.name} className="h-20 w-20 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-base truncate">{player.name}</p>
                  {player.role && <Badge variant="outline" className="text-[11px] mt-0.5">{player.role}</Badge>}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTeamModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
