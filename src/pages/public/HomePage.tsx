import { Link } from "react-router-dom";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Shield,
  ArrowRight,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { PageLoader } from "@/components/ui/spinner";

export default function HomePage() {
  const { activeChampionship, players, teams, matches, loading } =
    useTournament();

  if (loading) return <PageLoader />;

  if (!activeChampionship) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Trophy className="h-16 w-16 text-primary mb-4" />
        <h1 className="font-heading text-4xl font-bold mb-2">
          4inCup Cricket Tournament
        </h1>
        <p className="text-muted-foreground mb-6">
          No active championship yet. Visit the admin panel to create one.
        </p>
        <Link to="/admin">
          <Button size="lg">Go to Admin Panel</Button>
        </Link>
      </div>
    );
  }

  const completedMatches = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-accent/10 border border-border p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Season {activeChampionship.season}
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-3 tracking-wide">
            {activeChampionship.name}
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Organized by{" "}
            <span className="text-accent font-semibold">
              {activeChampionship.organizer}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            {activeChampionship.registrationOpen && (
              <Link to={`/register/${activeChampionship.id}`}>
                <Button size="lg" className="glow-pulse">
                  Register Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/teams">
              <Button variant="outline" size="lg">
                View Teams
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Registered Players
            <Badge variant="secondary" className="text-xs">{players.length}</Badge>
          </h2>
          <Link to="/players">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {players.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No players registered yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {players.map((player, i) => {
              const team = teams.find((t) => t.id === player.teamId);
              return (
                <div
                  key={player.id}
                  className="animate-slide-up opacity-0"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 group">
                    <CardContent className="p-0">
                      {/* Photo */}
                      <div className="relative aspect-square bg-secondary/50 overflow-hidden">
                        {player.photoURL ? (
                          <img
                            src={player.photoURL}
                            alt={player.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserCircle2 className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                        {team && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-1"
                            style={{ backgroundColor: team.color }}
                          />
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-2.5">
                        <p className="text-sm font-semibold truncate leading-tight">{player.name}</p>
                        <div className="flex items-center justify-between mt-1 gap-1">
                          {player.role ? (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 leading-none">
                              {player.role}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Unassigned</span>
                          )}
                          {team && (
                            <span className="text-[9px] text-muted-foreground truncate">{team.name}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
    <Card className="text-center">
      <CardContent className="pt-6">
        <div className={`mx-auto mb-2 ${color}`}>{icon}</div>
        <p className="font-heading text-3xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
