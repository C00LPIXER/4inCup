import { Link } from "react-router-dom";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Shield,
  ArrowRight,
  Sparkles,
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

      {/* Stats Grid */}
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
          label="Matches"
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

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickLink
          to="/fixtures"
          icon={<Calendar className="h-6 w-6" />}
          title="Match Fixtures"
          description="View upcoming and completed matches"
        />
        <QuickLink
          to="/standings"
          icon={<BarChart3 className="h-6 w-6" />}
          title="Points Table"
          description="Check team standings and net run rate"
        />
        <QuickLink
          to="/players"
          icon={<Users className="h-6 w-6" />}
          title="Player Directory"
          description="Browse all registered players"
        />
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

function QuickLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link to={to}>
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-primary/10 hover:shadow-xl cursor-pointer group">
        <CardHeader>
          <div className="text-primary mb-2 transition-transform group-hover:scale-110">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
