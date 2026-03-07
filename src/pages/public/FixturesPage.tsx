import { useTournament } from "@/context/TournamentContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Calendar } from "lucide-react";

export default function FixturesPage() {
  const { matches, teams, loading, activeChampionship } = useTournament();

  if (loading) return <PageLoader />;

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  if (matches.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="font-heading text-2xl font-bold mb-1">
          No Fixtures Yet
        </h2>
        <p className="text-muted-foreground">
          Match fixtures will be generated once teams are finalized.
        </p>
      </div>
    );
  }

  const upcoming = matches.filter((m) => m.status === "upcoming");
  const live = matches.filter((m) => m.status === "live");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Fixtures</h1>
        <p className="text-muted-foreground">
          {activeChampionship?.name} — {matches.length} Matches
        </p>
      </div>

      {live.length > 0 && (
        <Section title="🔴 Live">
          {live.map((m) => (
            <MatchCard key={m.id} match={m} teamMap={teamMap} />
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} teamMap={teamMap} />
          ))}
        </Section>
      )}

      {completed.length > 0 && (
        <Section title="Completed">
          {completed.map((m) => (
            <MatchCard key={m.id} match={m} teamMap={teamMap} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-heading text-xl font-bold text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function MatchCard({
  match,
  teamMap,
}: {
  match: any;
  teamMap: Record<string, any>;
}) {
  const team1 = teamMap[match.team1Id];
  const team2 = teamMap[match.team2Id];

  const statusColor = {
    upcoming: "bg-blue-500/20 text-blue-400",
    live: "bg-red-500/20 text-red-400",
    completed: "bg-green-500/20 text-green-400",
  }[match.status as string];

  const formatScore = (score: any) => {
    if (!score) return "-";
    return `${score.runs}/${score.wickets} (${score.overs}.${score.balls})`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            Match #{match.matchNumber}
          </Badge>
          <Badge className={statusColor}>
            {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Team 1 */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: team1?.color || "#666" }}
              />
              <span className="font-heading font-bold text-sm md:text-base">
                {team1?.name || "TBD"}
              </span>
            </div>
            {match.team1Score && (
              <p className="text-lg font-bold text-primary">
                {formatScore(match.team1Score)}
              </p>
            )}
          </div>

          {/* VS */}
          <div className="text-muted-foreground font-heading text-xl font-bold">
            VS
          </div>

          {/* Team 2 */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: team2?.color || "#666" }}
              />
              <span className="font-heading font-bold text-sm md:text-base">
                {team2?.name || "TBD"}
              </span>
            </div>
            {match.team2Score && (
              <p className="text-lg font-bold text-primary">
                {formatScore(match.team2Score)}
              </p>
            )}
          </div>
        </div>

        {match.result && (
          <p className="text-center text-sm text-accent font-medium mt-3 pt-3 border-t border-border">
            {match.result.summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
