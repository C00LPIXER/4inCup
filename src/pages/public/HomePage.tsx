import { Link } from "react-router-dom";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowRight, Sparkles } from "lucide-react";
import { PageLoader } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { activeChampionship, players, teams, matches, loading } =
    useTournament();

  if (loading) return <PageLoader />;

  if (!activeChampionship) {
    return (
      <div className="flex min-h-[100vh] flex-col items-center justify-center text-center">
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border h-[80vh] flex p-8 md:p-12">
        {/* Background image */}
        <img
          src="/bg-image.jpg"
          alt="Stadium"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          style={{ filter: "brightness(0.55)" }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Season {activeChampionship.season}
          </Badge>
          <h1 className="font-heading text-4xl md:text-6xl font-bold mb-3 tracking-wide text-white drop-shadow-lg">
            {activeChampionship.name}
          </h1>
          <p className="text-white/70 text-lg mb-6 drop-shadow">
            Organized by{" "}
            <span className="text-amber-300 font-semibold">
              {activeChampionship.organizer}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            {activeChampionship.registrationOpen && (
              <Link to={`/register/${activeChampionship.id}`}>
                <Button size="lg" className="glow-pulse shadow-lg">
                  Register Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/teams">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                View Teams
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
