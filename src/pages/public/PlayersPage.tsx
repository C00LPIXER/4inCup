import { useTournament } from "@/context/TournamentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Users } from "lucide-react";

export default function PlayersPage() {
  const { players, teams, loading, activeChampionship } = useTournament();

  if (loading) return <PageLoader />;

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  if (players.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="font-heading text-2xl font-bold mb-1">
          No Players Yet
        </h2>
        <p className="text-muted-foreground">
          Players will appear here once registration begins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Players</h1>
        <p className="text-muted-foreground">
          {activeChampionship?.name} — {players.length} Players
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {players.map((player) => {
          const team = player.teamId ? teamMap[player.teamId] : null;
          return (
            <Card
              key={player.id}
              className="overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="aspect-square overflow-hidden bg-secondary">
                <img
                  src={player.photoURL}
                  alt={player.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-3">
                <p className="font-semibold text-sm truncate">{player.name}</p>
                {player.role && (
                  <Badge
                    variant="outline"
                    className="text-[10px] mt-1"
                  >
                    {player.role}
                  </Badge>
                )}
                {team && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="text-[10px] text-muted-foreground truncate">
                      {team.name}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
