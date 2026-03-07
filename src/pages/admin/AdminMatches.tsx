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
  generateFixtures,
  updateMatchScore,
  updateMatch,
} from "@/services/firebase-service";
import type { Match, InningsScore, MatchResult } from "@/types";
import {
  Calendar,
  PlayCircle,
  CheckCircle2,
  Trophy,
} from "lucide-react";

export default function AdminMatches() {
  const { matches, teams, activeChampionship, loading } = useTournament();
  const [generating, setGenerating] = useState(false);
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
  const [saving, setSaving] = useState(false);

  // Score form
  const [t1Runs, setT1Runs] = useState(0);
  const [t1Wickets, setT1Wickets] = useState(0);
  const [t1Overs, setT1Overs] = useState(0);
  const [t1Balls, setT1Balls] = useState(0);
  const [t2Runs, setT2Runs] = useState(0);
  const [t2Wickets, setT2Wickets] = useState(0);
  const [t2Overs, setT2Overs] = useState(0);
  const [t2Balls, setT2Balls] = useState(0);
  const [winnerId, setWinnerId] = useState("");
  const [resultSummary, setResultSummary] = useState("");

  if (loading) return <PageLoader />;

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const handleGenerate = async () => {
    if (!activeChampionship) return;
    if (
      matches.length > 0 &&
      !confirm("This will regenerate all fixtures. Existing matches will be lost. Continue?")
    )
      return;

    setGenerating(true);
    try {
      await generateFixtures(activeChampionship.id);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const openScoreEntry = (match: Match) => {
    setScoreMatch(match);
    setT1Runs(match.team1Score?.runs || 0);
    setT1Wickets(match.team1Score?.wickets || 0);
    setT1Overs(match.team1Score?.overs || 0);
    setT1Balls(match.team1Score?.balls || 0);
    setT2Runs(match.team2Score?.runs || 0);
    setT2Wickets(match.team2Score?.wickets || 0);
    setT2Overs(match.team2Score?.overs || 0);
    setT2Balls(match.team2Score?.balls || 0);
    setWinnerId(match.result?.winnerId || "");
    setResultSummary(match.result?.summary || "");
  };

  const handleScoreSave = async () => {
    if (!scoreMatch) return;
    setSaving(true);

    const team1Score: InningsScore = {
      runs: t1Runs,
      wickets: t1Wickets,
      overs: t1Overs,
      balls: t1Balls,
    };
    const team2Score: InningsScore = {
      runs: t2Runs,
      wickets: t2Wickets,
      overs: t2Overs,
      balls: t2Balls,
    };

    let summary = resultSummary;
    if (!summary && winnerId) {
      const winnerName = teamMap[winnerId]?.name || "Winner";
      const loserName =
        teamMap[winnerId === scoreMatch.team1Id ? scoreMatch.team2Id : scoreMatch.team1Id]?.name || "Loser";

      if (winnerId === scoreMatch.team1Id) {
        const diff = t1Runs - t2Runs;
        summary = `${winnerName} won by ${diff} runs`;
      } else {
        const wicketsLeft = 10 - t2Wickets;
        summary = `${winnerName} won by ${wicketsLeft} wickets`;
      }
    }

    const result: MatchResult = {
      winnerId: winnerId || "",
      summary: summary || "Match completed",
    };

    await updateMatchScore(scoreMatch.id, team1Score, team2Score, result);
    setScoreMatch(null);
    setSaving(false);
  };

  const handleSetLive = async (matchId: string) => {
    await updateMatch(matchId, { status: "live" });
  };

  const formatScore = (score: InningsScore | null) => {
    if (!score) return "-";
    return `${score.runs}/${score.wickets} (${score.overs}.${score.balls})`;
  };

  const upcoming = matches.filter((m) => m.status === "upcoming");
  const live = matches.filter((m) => m.status === "live");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Manage Matches</h1>
          <p className="text-muted-foreground">
            {matches.length} fixtures • {completed.length} completed
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating || teams.length < 2}
          size="lg"
        >
          {generating ? (
            <>
              <Spinner size="sm" className="mr-2 text-primary-foreground" />
              Generating...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Generate Fixtures
            </>
          )}
        </Button>
      </div>

      {teams.length < 2 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="p-4 text-center text-sm text-accent">
            Need at least 2 teams to generate fixtures. Create teams first.
          </CardContent>
        </Card>
      )}

      {/* Live Matches */}
      {live.length > 0 && (
        <MatchSection title="🔴 Live Matches" matches={live} teamMap={teamMap}>
          {(match) => (
            <MatchRow
              key={match.id}
              match={match}
              teamMap={teamMap}
              formatScore={formatScore}
              onScore={() => openScoreEntry(match)}
              actionLabel="Enter Result"
              actionIcon={<CheckCircle2 className="h-3 w-3 mr-1" />}
            />
          )}
        </MatchSection>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <MatchSection title="Upcoming Matches" matches={upcoming} teamMap={teamMap}>
          {(match) => (
            <MatchRow
              key={match.id}
              match={match}
              teamMap={teamMap}
              formatScore={formatScore}
              onScore={() => handleSetLive(match.id)}
              actionLabel="Start Match"
              actionIcon={<PlayCircle className="h-3 w-3 mr-1" />}
              actionVariant="outline"
            />
          )}
        </MatchSection>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <MatchSection title="Completed Matches" matches={completed} teamMap={teamMap}>
          {(match) => (
            <MatchRow
              key={match.id}
              match={match}
              teamMap={teamMap}
              formatScore={formatScore}
              onScore={() => openScoreEntry(match)}
              actionLabel="Edit"
              actionIcon={<Trophy className="h-3 w-3 mr-1" />}
              actionVariant="ghost"
            />
          )}
        </MatchSection>
      )}

      {matches.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="font-heading text-2xl font-bold mb-2">
            No Fixtures Yet
          </h2>
          <p className="text-muted-foreground">
            Click &quot;Generate Fixtures&quot; to create match schedule.
          </p>
        </div>
      )}

      {/* Score Entry Dialog */}
      <Dialog open={!!scoreMatch} onOpenChange={() => setScoreMatch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match #{scoreMatch?.matchNumber} Result</DialogTitle>
            <DialogDescription>
              {teamMap[scoreMatch?.team1Id || ""]?.name || "Team 1"} vs{" "}
              {teamMap[scoreMatch?.team2Id || ""]?.name || "Team 2"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Team 1 Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        teamMap[scoreMatch?.team1Id || ""]?.color || "#666",
                    }}
                  />
                  {teamMap[scoreMatch?.team1Id || ""]?.name || "Team 1"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">Runs</Label>
                    <Input
                      type="number"
                      min={0}
                      value={t1Runs}
                      onChange={(e) => setT1Runs(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Wickets</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={t1Wickets}
                      onChange={(e) => setT1Wickets(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Overs</Label>
                    <Input
                      type="number"
                      min={0}
                      value={t1Overs}
                      onChange={(e) => setT1Overs(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Balls</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={t1Balls}
                      onChange={(e) => setT1Balls(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team 2 Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        teamMap[scoreMatch?.team2Id || ""]?.color || "#666",
                    }}
                  />
                  {teamMap[scoreMatch?.team2Id || ""]?.name || "Team 2"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">Runs</Label>
                    <Input
                      type="number"
                      min={0}
                      value={t2Runs}
                      onChange={(e) => setT2Runs(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Wickets</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={t2Wickets}
                      onChange={(e) => setT2Wickets(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Overs</Label>
                    <Input
                      type="number"
                      min={0}
                      value={t2Overs}
                      onChange={(e) => setT2Overs(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Balls</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      value={t2Balls}
                      onChange={(e) => setT2Balls(Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Winner */}
            <div className="space-y-2">
              <Label>Winner</Label>
              <Select value={winnerId} onValueChange={setWinnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select winner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={scoreMatch?.team1Id || "t1"}>
                    {teamMap[scoreMatch?.team1Id || ""]?.name || "Team 1"}
                  </SelectItem>
                  <SelectItem value={scoreMatch?.team2Id || "t2"}>
                    {teamMap[scoreMatch?.team2Id || ""]?.name || "Team 2"}
                  </SelectItem>
                  <SelectItem value="tie">Tie / No Result</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Result Summary */}
            <div className="space-y-2">
              <Label>Result Summary (auto-generated if empty)</Label>
              <Input
                value={resultSummary}
                onChange={(e) => setResultSummary(e.target.value)}
                placeholder="e.g. Team A won by 25 runs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreMatch(null)}>
              Cancel
            </Button>
            <Button onClick={handleScoreSave} disabled={saving}>
              {saving ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchSection({
  title,
  matches: _matches,
  teamMap: _teamMap,
  children,
}: {
  title: string;
  matches: Match[];
  teamMap: Record<string, any>;
  children: (match: Match) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-heading text-xl font-bold text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3">{_matches.map(children)}</div>
    </div>
  );
}

function MatchRow({
  match,
  teamMap,
  formatScore,
  onScore,
  actionLabel,
  actionIcon,
  actionVariant = "default",
}: {
  match: Match;
  teamMap: Record<string, any>;
  formatScore: (s: InningsScore | null) => string;
  onScore: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  actionVariant?: "default" | "outline" | "ghost";
}) {
  const team1 = teamMap[match.team1Id];
  const team2 = teamMap[match.team2Id];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className="text-xs flex-shrink-0">
            #{match.matchNumber}
          </Badge>

          <div className="flex-1 flex items-center justify-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <span className="font-semibold truncate">
                {team1?.name || "TBD"}
              </span>
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: team1?.color || "#666" }}
              />
            </div>

            <div className="flex flex-col items-center px-2">
              {match.team1Score ? (
                <div className="text-center">
                  <p className="font-mono text-xs font-bold">
                    {formatScore(match.team1Score)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">vs</p>
                  <p className="font-mono text-xs font-bold">
                    {formatScore(match.team2Score)}
                  </p>
                </div>
              ) : (
                <span className="text-muted-foreground font-heading font-bold">
                  VS
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-1">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: team2?.color || "#666" }}
              />
              <span className="font-semibold truncate">
                {team2?.name || "TBD"}
              </span>
            </div>
          </div>

          <Button
            variant={actionVariant}
            size="sm"
            onClick={onScore}
            className="flex-shrink-0"
          >
            {actionIcon}
            <span className="hidden sm:inline">{actionLabel}</span>
          </Button>
        </div>

        {match.result && (
          <p className="text-center text-xs text-accent font-medium mt-2 pt-2 border-t border-border">
            {match.result.summary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
