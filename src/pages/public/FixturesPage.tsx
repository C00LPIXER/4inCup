import { useEffect, useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { subscribeMatch } from "@/services/firebase-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Calendar } from "lucide-react";
import type { Match, LiveInnings, Player, Team } from "@/types";

export default function FixturesPage() {
  const { matches, teams, players, loading, activeChampionship } = useTournament();

  if (loading) return <PageLoader />;

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

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
            <LiveMatchCard key={m.id} match={m} teamMap={teamMap} playerMap={playerMap} />
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

// ─── Live Match Card (subscribes to real-time updates) ─────────────────────────
function LiveMatchCard({
  match: initialMatch,
  teamMap,
  playerMap,
}: {
  match: Match;
  teamMap: Record<string, Team>;
  playerMap: Record<string, Player>;
}) {
  const [match, setMatch] = useState<Match>(initialMatch);

  useEffect(() => {
    const unsub = subscribeMatch(initialMatch.id, (m) => {
      if (m) setMatch(m);
    });
    return () => unsub();
  }, [initialMatch.id]);

  const team1 = teamMap[match.team1Id];
  const team2 = teamMap[match.team2Id];

  // Pick the active innings
  const currentInnings: LiveInnings | null =
    match.team2Innings?.inningNumber === 2
      ? match.team2Innings
      : match.team1Innings
      ? match.team1Innings
      : null;

  const battingTeam = currentInnings ? teamMap[currentInnings.battingTeamId] : null;
  const bowlingTeam = currentInnings ? teamMap[currentInnings.bowlingTeamId] : null;

  const currentScore = currentInnings
    ? (currentInnings.inningNumber === 1 ? match.team1Score : match.team2Score)
    : null;
  const firstInningsScore = match.team1Score;

  const striker = currentInnings?.batsmen.find((b) => b.playerId === currentInnings.strikerPlayerId);
  const nonStriker = currentInnings?.batsmen.find((b) => b.playerId === currentInnings.nonStrikerPlayerId);
  const currentBowler = currentInnings?.bowlers.find((b) => b.playerId === currentInnings.currentBowlerPlayerId);

  const totalExtras = currentInnings
    ? Object.values(currentInnings.extras).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <Card className="border-red-500/40 overflow-hidden">
      {/* Live top bar */}
      <div className="bg-red-500/10 px-4 py-2 flex items-center gap-2 border-b border-red-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Live</span>
        <Badge variant="outline" className="text-xs ml-auto">Match #{match.matchNumber}</Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Score header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Team 1 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: team1?.color || "#666" }} />
              <span className="font-heading font-bold text-sm truncate">{team1?.name || "TBD"}</span>
              {currentInnings?.battingTeamId === match.team1Id && (
                <Badge className="text-[9px] px-1 py-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">batting</Badge>
              )}
            </div>
            {match.team1Score && (
              <p className={`text-xl font-heading font-bold mt-1 ${currentInnings?.battingTeamId === match.team1Id ? "text-primary" : "text-muted-foreground"}`}>
                {match.team1Score.runs}/{match.team1Score.wickets}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({match.team1Score.overs}.{match.team1Score.balls})
                </span>
              </p>
            )}
          </div>

          <span className="text-muted-foreground font-heading text-base font-bold">VS</span>

          {/* Team 2 */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-2 justify-end">
              {currentInnings?.battingTeamId === match.team2Id && (
                <Badge className="text-[9px] px-1 py-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">batting</Badge>
              )}
              <span className="font-heading font-bold text-sm truncate">{team2?.name || "TBD"}</span>
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: team2?.color || "#666" }} />
            </div>
            {match.team2Score && (
              <p className={`text-xl font-heading font-bold mt-1 ${currentInnings?.battingTeamId === match.team2Id ? "text-primary" : "text-muted-foreground"}`}>
                {match.team2Score.runs}/{match.team2Score.wickets}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({match.team2Score.overs}.{match.team2Score.balls})
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Live innings detail */}
        {currentInnings && currentScore && (
          <>
            {/* Target info */}
            {currentInnings.inningNumber === 2 && firstInningsScore && (
              <div className="text-xs text-center bg-amber-500/10 text-amber-400 rounded-md py-1.5 px-3 border border-amber-500/20">
                Target: <span className="font-bold">{firstInningsScore.runs + 1}</span>
                {" · "}Need: <span className="font-bold">{Math.max(0, firstInningsScore.runs + 1 - currentScore.runs)}</span> runs
              </div>
            )}

            {/* Batsmen at crease */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                At the Crease — {battingTeam?.name}
              </p>
              <div className="space-y-1.5">
                {[striker, nonStriker].filter(Boolean).map((b) => {
                  if (!b) return null;
                  const isS = b.playerId === currentInnings.strikerPlayerId;
                  const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : "—";
                  return (
                    <div key={b.playerId} className="flex items-center gap-2 text-sm">
                      <span className={`text-xs w-3 text-center ${isS ? "text-yellow-400" : "text-muted-foreground"}`}>
                        {isS ? "●" : "○"}
                      </span>
                      <span className={`flex-1 font-medium ${isS ? "text-foreground" : "text-muted-foreground"}`}>
                        {playerMap[b.playerId]?.name || "—"}
                      </span>
                      <span className={`font-heading font-bold ${isS ? "text-foreground" : "text-muted-foreground"}`}>
                        {b.runs}
                      </span>
                      <span className="text-muted-foreground text-xs">({b.balls})</span>
                      {b.fours > 0 && <span className="text-xs text-blue-400">{b.fours}×4</span>}
                      {b.sixes > 0 && <span className="text-xs text-purple-400">{b.sixes}×6</span>}
                      <span className="text-xs text-muted-foreground">SR {sr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current bowler */}
            {currentBowler && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Bowling — {bowlingTeam?.name}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-green-400 text-xs">▶</span>
                  <span className="flex-1 font-medium">{playerMap[currentBowler.playerId]?.name || "—"}</span>
                  <span className="font-heading font-bold">{currentBowler.overs}.{currentBowler.balls}</span>
                  <span className="text-muted-foreground text-xs">ov</span>
                  <span className="font-bold">{currentBowler.runs}</span>
                  <span className="text-muted-foreground text-xs">runs</span>
                  <span className="font-bold text-red-400">{currentBowler.wickets}W</span>
                </div>
              </div>
            )}

            {/* Extras & overs */}
            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap pt-1 border-t border-border/50">
              <span>Overs: <span className="text-foreground font-medium">{currentInnings.overs}.{currentInnings.balls}</span></span>
              <span>Extras: <span className="text-foreground font-medium">{totalExtras}</span>
                {currentInnings.extras.wides > 0 && ` (WD ${currentInnings.extras.wides})`}
                {currentInnings.extras.noBalls > 0 && ` (NB ${currentInnings.extras.noBalls})`}
              </span>
              <span>Innings: <span className="text-foreground font-medium">{currentInnings.inningNumber}</span></span>
            </div>
          </>
        )}

        {/* No innings data yet */}
        {!currentInnings && (
          <p className="text-sm text-muted-foreground text-center py-1">Match is live — scorecard will appear shortly.</p>
        )}

        {match.venue && (
          <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">📍 {match.venue}</p>
        )}
      </CardContent>
    </Card>
  );
}

function MatchCard({
  match,
  teamMap,
}: {
  match: Match;
  teamMap: Record<string, Team>;
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
        {match.date && (
          <p className="text-center text-xs text-muted-foreground mt-2">📅 {match.date}</p>
        )}
        {match.venue && (
          <p className="text-center text-xs text-muted-foreground">📍 {match.venue}</p>
        )}
      </CardContent>
    </Card>
  );
}
