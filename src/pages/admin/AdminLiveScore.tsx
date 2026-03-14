import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTournament } from "@/context/TournamentContext";
import { subscribeMatch, updateMatch, determineWinner } from "@/services/firebase-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type {
  Match,
  LiveInnings,
  BatsmanScore,
  BowlerScore,
} from "@/types";
import { canBowlNextOver } from "@/services/match-utils";
import {
  ArrowLeft,
  Zap,
  User,
  CircleDot,
  Swords,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Trophy,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function blankBatsman(playerId: string): BatsmanScore {
  return { playerId, runs: 0, balls: 0, fours: 0, sixes: 0, status: "batting", howOut: "", bowlerPlayerId: "" };
}
function blankBowler(playerId: string): BowlerScore {
  return { playerId, overs: 0, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 };
}

function oversStr(overs: number, balls: number) {
  return `${overs}.${balls}`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminLiveScore() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { teams, players, activeChampionship } = useTournament();
  const maxOvers = activeChampionship?.oversPerMatch ?? 4;
  const MAX_BOWLER_OVERS = 2;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Setup state (before innings starts)
  const [showSetup, setShowSetup] = useState(false);
  const [setupBatting, setSetupBatting] = useState("");
  const [setupStriker, setSetupStriker] = useState("");
  const [setupNonStriker, setSetupNonStriker] = useState("");
  const [setupBowler, setSetupBowler] = useState("");
  const [setupOvers, setSetupOvers] = useState(maxOvers);

  const [activeMaxOvers, setActiveMaxOvers] = useState(maxOvers);

  // Wicket dialog
  const [showWicket, setShowWicket] = useState(false);
  const [wicketBatsman, setWicketBatsman] = useState(""); // playerId of out batsman
  const [wicketType, setWicketType] = useState("bowled");
  const [newBatsman, setNewBatsman] = useState("");

  // End innings / result
  const [showEndInnings, setShowEndInnings] = useState(false);


  // Change bowler dialog
  const [showChangeBowler, setShowChangeBowler] = useState(false);
  const [newBowlerId, setNewBowlerId] = useState("");

  // Change striker (swap ends)
  // Subscribe to match
  useEffect(() => {
    if (!matchId) return;
    const unsub = subscribeMatch(matchId, (m) => {
      setMatch(m);
      setLoading(false);
    });
    return () => unsub();
  }, [matchId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );

  if (!match) return (
    <div className="text-center py-20 text-muted-foreground">Match not found.</div>
  );

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

  const innings = match.team1Innings?.inningNumber === 1
    ? (match.team2Innings ? [match.team1Innings, match.team2Innings] : [match.team1Innings])
    : match.team2Innings
    ? [match.team2Innings]
    : [];

  const currentInnings: LiveInnings | null =
    match.team1Innings && !match.team2Innings
      ? match.team1Innings
      : match.team2Innings && match.team2Innings.inningNumber === 2
      ? match.team2Innings
      : match.team1Innings
      ? match.team1Innings
      : null;

  const battingPlayers = currentInnings
    ? (players.filter((p) => p.teamId === currentInnings.battingTeamId))
    : [];
  const bowlingPlayers = currentInnings
    ? (players.filter((p) => p.teamId === currentInnings.bowlingTeamId))
    : [];

  const striker = currentInnings
    ? currentInnings.batsmen.find((b) => b.playerId === currentInnings.strikerPlayerId)
    : null;
  const nonStriker = currentInnings
    ? currentInnings.batsmen.find((b) => b.playerId === currentInnings.nonStrikerPlayerId)
    : null;
  const currentBowler = currentInnings
    ? currentInnings.bowlers.find((b) => b.playerId === currentInnings.currentBowlerPlayerId)
    : null;

  // Available batsmen (not yet out)
  const availableBatsmen = battingPlayers.filter((p) => {
    const b = currentInnings?.batsmen.find((bs) => bs.playerId === p.id);
    return !b || b.status === "notout" || b.status === "batting";
  });
  const notYetBatted = battingPlayers.filter(
    (p) => !currentInnings?.batsmen.find((bs) => bs.playerId === p.id)
  );

  // ── setup innings ──────────────────────────────────────────────────────────
  const handleStartInnings = async () => {
    if (!match || !setupBatting || !setupStriker || !setupNonStriker || !setupBowler) return;
    setSaving(true);
    setActiveMaxOvers(setupOvers);
    const bowlingTeamId = setupBatting === match.team1Id ? match.team2Id : match.team1Id;
    const inningNumber: 1 | 2 = !match.team1Innings ? 1 : 2;
    const innings: LiveInnings = {
      battingTeamId: setupBatting,
      bowlingTeamId,
      batsmen: [blankBatsman(setupStriker), blankBatsman(setupNonStriker)],
      bowlers: [blankBowler(setupBowler)],
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      overs: 0,
      balls: 0,
      strikerPlayerId: setupStriker,
      nonStrikerPlayerId: setupNonStriker,
      currentBowlerPlayerId: setupBowler,
      inningNumber,
    };
    const key = inningNumber === 1 ? "team1Innings" : "team2Innings";
    await updateMatch(match.id, { [key]: innings, status: "live" });
    setShowSetup(false);
    setSaving(false);
  };

  // ── add ball ──────────────────────────────────────────────────────────────
  const addBall = async (
    runs: number,
    extras: { wide?: boolean; noBall?: boolean; bye?: number; legBye?: number } = {},
    isWicket = false
  ) => {
    if (!match || !currentInnings) return;
    // Prevent scoring if innings already ended (all out or overs complete)
    const battingTeamPlayersLocal = players.filter((p) => p.teamId === currentInnings.battingTeamId);
    const activeBatsmenCountLocal = currentInnings.batsmen.filter((b) => b.status === "batting" || b.status === "notout").length;
    const remainingUnbattedLocal = battingTeamPlayersLocal.filter((p) => !currentInnings.batsmen.find((bs) => bs.playerId === p.id)).length;
    const inningsAllOutLocal = remainingUnbattedLocal === 0 && activeBatsmenCountLocal === 0;
    if (inningsAllOutLocal || currentInnings.overs >= activeMaxOvers) {
      setShowEndInnings(true);
      return;
    }
    setSaving(true);
    const inn = structuredClone(currentInnings) as LiveInnings;

    const isDelivery = !extras.wide && !extras.noBall; // counts as a ball
    const battingRuns = runs + (extras.bye ?? 0) + (extras.legBye ?? 0);
    const batsmanRuns = !extras.wide && !extras.bye && !extras.legBye ? runs : 0;

    // Update batsman
    if (!isWicket) {
      const bIdx = inn.batsmen.findIndex((b) => b.playerId === inn.strikerPlayerId);
      if (bIdx >= 0) {
        inn.batsmen[bIdx].runs += batsmanRuns;
        if (isDelivery) inn.batsmen[bIdx].balls++;
        if (batsmanRuns === 4) inn.batsmen[bIdx].fours++;
        if (batsmanRuns === 6) inn.batsmen[bIdx].sixes++;
      }
    }

    // Update bowler
    const bowIdx = inn.bowlers.findIndex((b) => b.playerId === inn.currentBowlerPlayerId);
    if (bowIdx >= 0) {
      inn.bowlers[bowIdx].runs += battingRuns + (extras.wide ? 1 : 0) + (extras.noBall ? 1 : 0);
      if (extras.wide) inn.bowlers[bowIdx].wides++;
      if (extras.noBall) inn.bowlers[bowIdx].noBalls++;
      if (isDelivery && !isWicket) {
        inn.bowlers[bowIdx].balls++;
        if (inn.bowlers[bowIdx].balls >= 6) {
          inn.bowlers[bowIdx].overs++;
          inn.bowlers[bowIdx].balls = 0;
        }
      }
    }

    // Update extras
    if (extras.wide) inn.extras.wides++;
    if (extras.noBall) inn.extras.noBalls++;
    if (extras.bye) inn.extras.byes += extras.bye;
    if (extras.legBye) inn.extras.legByes += extras.legBye;

    // Update innings balls/overs
    const totalRuns = battingRuns + (extras.wide ? 1 : 0) + (extras.noBall ? 1 : 0);
    let overJustCompleted = false;
    if (isDelivery) {
      inn.balls++;
      if (inn.balls >= 6) {
        inn.overs++;
        inn.balls = 0;
        overJustCompleted = true;
        // Swap ends at over
        const tmp = inn.strikerPlayerId;
        inn.strikerPlayerId = inn.nonStrikerPlayerId;
        inn.nonStrikerPlayerId = tmp;
      }
    }

    // Swap ends on odd runs (striker only if actual delivery, no wide)
    if (!extras.wide && !isWicket && batsmanRuns % 2 === 1) {
      const tmp = inn.strikerPlayerId;
      inn.strikerPlayerId = inn.nonStrikerPlayerId;
      inn.nonStrikerPlayerId = tmp;
    }

    // Update innings score totals (for summary display)
    const innKey = inn.inningNumber === 1 ? "team1Score" : "team2Score";
    const currentScore = (inn.inningNumber === 1 ? match.team1Score : match.team2Score) ?? { runs: 0, wickets: 0, overs: 0, balls: 0 };
    const newScore = {
      runs: currentScore.runs + totalRuns,
      wickets: currentScore.wickets + (isWicket ? 1 : 0),
      overs: inn.overs,
      balls: inn.balls,
    };

    const innFieldKey = inn.inningNumber === 1 ? "team1Innings" : "team2Innings";
    await updateMatch(match.id, { [innFieldKey]: inn, [innKey]: newScore });
    setSaving(false);

    // If this is 2nd innings, check whether the chasing team reached the target
    const targetReached = inn.inningNumber === 2 && match.team1Score && newScore.runs >= (match.team1Score.runs + 1);
    if (targetReached) {
      const result = determineWinner(match.team1Id, match.team2Id, match.team1Score, newScore);
      await updateMatch(match.id, { [innFieldKey]: inn, [innKey]: newScore, status: "completed", result });
      setShowEndInnings(true);
      return;
    }

    // Recompute all-out after updating
    const battingTeamPlayersAfter = players.filter((p) => p.teamId === inn.battingTeamId);
    const activeBatsmenAfter = inn.batsmen.filter((b) => b.status === "batting" || b.status === "notout").length;
    const remainingUnbattedAfter = battingTeamPlayersAfter.filter((p) => !inn.batsmen.find((bs) => bs.playerId === p.id)).length;
    const isAllOutAfter = remainingUnbattedAfter === 0 && activeBatsmenAfter === 0;
    if (isAllOutAfter) {
      setShowEndInnings(true);
      return;
    }

    if (inn.overs >= activeMaxOvers) {
      setShowEndInnings(true);
    } else if (overJustCompleted) {
      setNewBowlerId("");
      setShowChangeBowler(true);
    }
  };

  // ── wicket ─────────────────────────────────────────────────────────────────
  const handleWicket = async () => {
    if (!match || !currentInnings || !wicketBatsman) return;
    setSaving(true);
    const inn = structuredClone(currentInnings) as LiveInnings;

    const bIdx = inn.batsmen.findIndex((b) => b.playerId === wicketBatsman);
    if (bIdx >= 0) {
      inn.batsmen[bIdx].status = "out";
      inn.batsmen[bIdx].howOut = wicketType;
      inn.batsmen[bIdx].bowlerPlayerId = inn.currentBowlerPlayerId;
      if (isDeliveryWicket(wicketType)) {
        inn.batsmen[bIdx].balls++;
      }
    }

    // Update bowler wickets
    const bowIdx = inn.bowlers.findIndex((b) => b.playerId === inn.currentBowlerPlayerId);
    if (bowIdx >= 0) {
      if (isDeliveryWicket(wicketType)) {
        inn.bowlers[bowIdx].wickets++;
        inn.bowlers[bowIdx].balls++;
        if (inn.bowlers[bowIdx].balls >= 6) {
          inn.bowlers[bowIdx].overs++;
          inn.bowlers[bowIdx].balls = 0;
        }
      }
    }

    // Count as a legal ball for overs
    let overJustCompleted = false;
    if (isDeliveryWicket(wicketType)) {
      inn.balls++;
      if (inn.balls >= 6) {
        inn.overs++;
        inn.balls = 0;
        overJustCompleted = true;
        const tmp = inn.strikerPlayerId;
        inn.strikerPlayerId = inn.nonStrikerPlayerId;
        inn.nonStrikerPlayerId = tmp;
      }
    }

    // New batsman or all out
    const battingTeamPlayers = players.filter((p) => p.teamId === inn.battingTeamId);
    const remainingUnbatted = battingTeamPlayers.filter((p) => !inn.batsmen.find((bs) => bs.playerId === p.id)).length;
    const willReplace = newBatsman && newBatsman !== "none";
    if (willReplace) {
      inn.batsmen.push(blankBatsman(newBatsman));
      // Replace out batsman as striker
      if (wicketBatsman === inn.strikerPlayerId) {
        inn.strikerPlayerId = newBatsman;
      } else {
        inn.nonStrikerPlayerId = newBatsman;
      }
    }

    const innKey = inn.inningNumber === 1 ? "team1Score" : "team2Score";
    const currentScore = (inn.inningNumber === 1 ? match.team1Score : match.team2Score) ?? { runs: 0, wickets: 0, overs: 0, balls: 0 };
    const newScore = {
      ...currentScore,
      wickets: currentScore.wickets + 1,
      overs: inn.overs,
      balls: inn.balls,
    };

    const innFieldKey = inn.inningNumber === 1 ? "team1Innings" : "team2Innings";
    await updateMatch(match.id, { [innFieldKey]: inn, [innKey]: newScore });
    setShowWicket(false);
    setWicketBatsman("");
    setWicketType("bowled");
    setNewBatsman("");
    setSaving(false);

    // If the user explicitly chose "none" or there are no remaining unbatted players
    // and no active batsmen, treat as all out and end the innings.
    const activeBatsmenCount = inn.batsmen.filter((b) => b.status === "batting" || b.status === "notout").length;
    const isAllOut = (!willReplace && newBatsman === "none") || (remainingUnbatted === 0 && activeBatsmenCount === 0);
    if (isAllOut) {
      setShowEndInnings(true);
      return;
    }

    if (inn.overs >= activeMaxOvers) {
      setShowEndInnings(true);
    } else if (overJustCompleted) {
      setNewBowlerId("");
      setShowChangeBowler(true);
    }
  };

  function isDeliveryWicket(type: string) {
    return !["run out", "obstructing the field", "timed out", "handled the ball"].includes(type);
  }

  // ── change bowler ──────────────────────────────────────────────────────────
  const handleChangeBowler = async () => {
    if (!match || !currentInnings || !newBowlerId) return;
    setSaving(true);
    const inn = structuredClone(currentInnings) as LiveInnings;
    // Validate selection: only one bowler may reach 2 overs
    const validate = canBowlNextOver(newBowlerId, inn.bowlers, activeMaxOvers, inn.overs, 1);
    if (!validate.ok) {
      setSaving(false);
      setNewBowlerId("");
      alert(validate.reason);
      return;
    }
    if (!inn.bowlers.find((b) => b.playerId === newBowlerId)) {
      inn.bowlers.push(blankBowler(newBowlerId));
    }
    inn.currentBowlerPlayerId = newBowlerId;
    const innFieldKey = inn.inningNumber === 1 ? "team1Innings" : "team2Innings";
    await updateMatch(match.id, { [innFieldKey]: inn });
    setShowChangeBowler(false);
    setNewBowlerId("");
    setSaving(false);
  };

  // ── end innings / start 2nd ────────────────────────────────────────────────
  const handleEndInnings = async () => {
    if (!match || !currentInnings) return;
    setSaving(true);
    if (currentInnings.inningNumber === 1) {
      setShowSetup(true);
      // Switch teams: batting team becomes bowling
      setSetupBatting(currentInnings.bowlingTeamId);
      setSetupStriker("");
      setSetupNonStriker("");
      setSetupBowler("");
      setShowEndInnings(false);
      setSaving(false);
      return;
    }

    // If we're ending the 2nd innings, auto-compute the match result
    if (currentInnings.inningNumber === 2) {
      const team1Score = match.team1Score;
      const team2Score = match.team2Score ?? { runs: 0, wickets: 0, overs: currentInnings.overs, balls: currentInnings.balls };
      const result = determineWinner(match.team1Id, match.team2Id, team1Score, team2Score);
      await updateMatch(match.id, { status: "completed", result, team2Score });
      setShowEndInnings(false);
      setSaving(false);
      navigate("/admin/matches");
      return;
    }
  };

  // (result auto-computed elsewhere)

  // ── swap striker ───────────────────────────────────────────────────────────
  const handleSwapStrike = async () => {
    if (!match || !currentInnings) return;
    setSaving(true);
    const inn = structuredClone(currentInnings) as LiveInnings;
    const tmp = inn.strikerPlayerId;
    inn.strikerPlayerId = inn.nonStrikerPlayerId;
    inn.nonStrikerPlayerId = tmp;
    const innFieldKey = inn.inningNumber === 1 ? "team1Innings" : "team2Innings";
    await updateMatch(match.id, { [innFieldKey]: inn });
    setSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  const t1 = teamMap[match.team1Id];
  const t2 = teamMap[match.team2Id];
  const battingTeam = currentInnings ? teamMap[currentInnings.battingTeamId] : null;
  const bowlingTeam = currentInnings ? teamMap[currentInnings.bowlingTeamId] : null;

  const setupBattingPlayers = setupBatting
    ? players.filter((p) => p.teamId === setupBatting)
    : [];
  const setupBowlingTeamId = setupBatting
    ? (setupBatting === match.team1Id ? match.team2Id : match.team1Id)
    : "";
  const setupBowlingPlayers = setupBowlingTeamId
    ? players.filter((p) => p.teamId === setupBowlingTeamId)
    : [];

  const hasLiveInnings = !!currentInnings;
  const isSecondInnings = currentInnings?.inningNumber === 2;
  const oversBowled = currentInnings ? `${currentInnings.overs}.${currentInnings.balls}` : "0.0";
  const allOversComplete = !!currentInnings && currentInnings.overs >= activeMaxOvers;

  const activeBatsmenCountGlobal = currentInnings ? currentInnings.batsmen.filter((b) => b.status === "batting" || b.status === "notout").length : 0;
  const remainingUnbattedGlobal = currentInnings ? battingPlayers.filter((p) => !currentInnings.batsmen.find((bs) => bs.playerId === p.id)).length : 0;
  const inningsAllOut = !!currentInnings && remainingUnbattedGlobal === 0 && activeBatsmenCountGlobal === 0;

  const totalExtras = currentInnings
    ? Object.values(currentInnings.extras).reduce((a, b) => a + b, 0)
    : 0;

  const currentScore = currentInnings
    ? (currentInnings.inningNumber === 1 ? match.team1Score : match.team2Score)
    : null;

  const inningsWon = !!(currentInnings && isSecondInnings && match.team1Score && currentScore && (currentScore.runs >= (match.team1Score.runs + 1)));

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/matches")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-400" />
            Live Scoring — Match #{match.matchNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            <span style={{ color: t1?.color }}>{t1?.name}</span>
            {" "}<span className="text-muted-foreground">vs</span>{" "}
            <span style={{ color: t2?.color }}>{t2?.name}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasLiveInnings && (allOversComplete || inningsAllOut || inningsWon) && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowEndInnings(true)}>
                {isSecondInnings ? "End Match" : "End Innings"}
              </Button>
              {/* result is auto-computed; no manual Complete Match button */}
            </>
          )}
          {hasLiveInnings && !allOversComplete && !inningsAllOut && !inningsWon && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {activeMaxOvers - (currentInnings?.overs ?? 0)} overs remaining
            </Badge>
          )}
          {!hasLiveInnings && (
            <Button onClick={() => { setSetupBatting(""); setShowSetup(true); }}>
              Start Innings
            </Button>
          )}
        </div>
      </div>

      {/* Live Scoreboard */}
      {currentInnings && currentScore && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              {battingTeam?.name} — Innings {currentInnings.inningNumber}
              <Badge className="ml-auto bg-red-500/20 text-red-400 border-red-500/30">LIVE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score summary */}
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <p className="text-4xl font-heading font-bold">
                  {currentScore.runs}/{currentScore.wickets}
                </p>
                <p className="text-sm text-muted-foreground">
                  Overs: {oversBowled} • Extras: {totalExtras}
                  {currentInnings.extras.wides > 0 && ` (WD ${currentInnings.extras.wides})`}
                  {currentInnings.extras.noBalls > 0 && ` (NB ${currentInnings.extras.noBalls})`}
                </p>
              </div>
              {isSecondInnings && match.team1Score && (
                <div className="text-sm text-muted-foreground border-l border-border pl-4">
                  <p>Target: <span className="font-bold text-foreground">{match.team1Score.runs + 1}</span></p>
                  <p>Need: <span className="font-bold text-amber-400">
                    {Math.max(0, match.team1Score.runs + 1 - currentScore.runs)} off {" "}
                    {(currentInnings.overs < (match.team1Score.overs || 999)) ? "remaining" : "—"}
                  </span></p>
                </div>
              )}
            </div>

            {/* Batsmen */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left py-1 pr-3">Batsman</th>
                    <th className="text-right px-2">R</th>
                    <th className="text-right px-2">B</th>
                    <th className="text-right px-2">4s</th>
                    <th className="text-right px-2">6s</th>
                    <th className="text-right px-2">SR</th>
                    <th className="text-left px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInnings.batsmen.map((b) => {
                    const isBatting = b.status === "batting" || b.status === "notout";
                    const isStriker = b.playerId === currentInnings.strikerPlayerId;
                    const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "—";
                    return (
                      <tr key={b.playerId} className={`border-b border-border/30 ${isBatting ? "" : "opacity-50"}`}>
                        <td className="py-1.5 pr-3 font-medium">
                          {playerMap[b.playerId]?.name || b.playerId}
                          {isStriker && isBatting && (
                            <span className="ml-1 text-yellow-400 text-xs">●</span>
                          )}
                          {!isStriker && isBatting && (
                            <span className="ml-1 text-muted-foreground text-xs">○</span>
                          )}
                        </td>
                        <td className="text-right px-2 font-bold">{b.runs}</td>
                        <td className="text-right px-2">{b.balls}</td>
                        <td className="text-right px-2">{b.fours}</td>
                        <td className="text-right px-2">{b.sixes}</td>
                        <td className="text-right px-2">{sr}</td>
                        <td className="text-left px-2 text-xs text-muted-foreground">
                          {b.status === "out" ? `${b.howOut}${b.bowlerPlayerId ? ` b ${playerMap[b.bowlerPlayerId]?.name?.split(" ")[0] || ""}` : ""}` : b.status === "batting" ? (isStriker ? "striker" : "non-striker") : "not out"}
                        </td>
                      </tr>
                    );
                  })}
                  {battingPlayers
                    .filter((p) => !currentInnings.batsmen.find((b) => b.playerId === p.id))
                    .map((p) => (
                      <tr key={p.id} className="border-b border-border/30 opacity-40">
                        <td className="py-1.5 pr-3 text-muted-foreground">{p.name}</td>
                        <td className="text-right px-2">—</td>
                        <td className="text-right px-2">—</td>
                        <td className="text-right px-2">—</td>
                        <td className="text-right px-2">—</td>
                        <td className="text-right px-2">—</td>
                        <td className="text-left px-2 text-xs text-muted-foreground">yet to bat</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Bowlers */}
            <div className="overflow-x-auto">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Bowling</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border">
                    <th className="text-left py-1 pr-3">Bowler</th>
                    <th className="text-right px-2">O</th>
                    <th className="text-right px-2">R</th>
                    <th className="text-right px-2">W</th>
                    <th className="text-right px-2">Eco</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInnings.bowlers.map((b) => {
                    const isCurrent = b.playerId === currentInnings.currentBowlerPlayerId;
                    const oversD = b.overs + b.balls / 6;
                    const eco = oversD > 0 ? (b.runs / oversD).toFixed(2) : "—";
                    return (
                      <tr key={b.playerId} className={`border-b border-border/30 ${isCurrent ? "text-foreground" : "opacity-60"}`}>
                        <td className="py-1.5 pr-3 font-medium">
                          {playerMap[b.playerId]?.name || b.playerId}
                          {isCurrent && <span className="ml-1 text-green-400 text-xs">▶</span>}
                        </td>
                        <td className="text-right px-2">{oversStr(b.overs, b.balls)}</td>
                        <td className="text-right px-2">{b.runs}</td>
                        <td className="text-right px-2 font-bold">{b.wickets}</td>
                        <td className="text-right px-2">{eco}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ball Entry Controls */}
      {currentInnings && !inningsAllOut && !allOversComplete && !inningsWon && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-primary" />
              Ball-by-Ball Entry
              {saving && <Spinner size="sm" className="ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current at crease info */}
            <div className="flex flex-wrap gap-4 text-sm p-3 bg-secondary/30 rounded-lg">
              <div>
                <span className="text-muted-foreground text-xs block">Striker ●</span>
                <span className="font-semibold">{playerMap[currentInnings.strikerPlayerId]?.name || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Non-Striker ○</span>
                <span className="font-semibold">{playerMap[currentInnings.nonStrikerPlayerId]?.name || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Bowler ▶</span>
                <span className="font-semibold">{playerMap[currentInnings.currentBowlerPlayerId]?.name || "—"}</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handleSwapStrike} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Swap Strike
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowChangeBowler(true)} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  <Swords className="h-3 w-3 mr-1" /> Change Bowler
                </Button>
              </div>
            </div>

            {/* Run buttons */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Runs (legal delivery)</p>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                  <Button
                    key={r}
                    variant={r === 4 ? "default" : r === 6 ? "default" : "outline"}
                    className={`w-12 h-12 text-lg font-heading font-bold ${r === 4 ? "bg-blue-600 hover:bg-blue-700" : r === 6 ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                    onClick={() => addBall(r)}
                    disabled={saving || inningsAllOut || allOversComplete || inningsWon}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Extras</p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => addBall(0, { wide: true })} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  Wide
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBall(0, { noBall: true })} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  No Ball
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBall(0, { bye: 1 })} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  1 Bye
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBall(0, { bye: 2 })} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  2 Byes
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBall(0, { legBye: 1 })} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  1 Leg Bye
                </Button>
                <Button variant="outline" size="sm" onClick={() => addBall(0, { legBye: 2 })} disabled={saving || inningsAllOut || allOversComplete || inningsWon}>
                  2 Leg Byes
                </Button>
              </div>
            </div>

            {/* Wicket */}
            <div>
              <Button
                variant="destructive"
                onClick={() => {
                  setWicketBatsman(currentInnings.strikerPlayerId);
                  setShowWicket(true);
                }}
                disabled={saving || inningsAllOut || allOversComplete || inningsWon}
              >
                <AlertTriangle className="h-4 w-4 mr-1" /> Wicket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Innings Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {!match.team1Innings ? "Start 1st Innings" : "Start 2nd Innings"}
            </DialogTitle>
            <DialogDescription>
              {!match.team1Innings
                ? `Select total overs, batting team and opening players.`
                : `Select batting team and opening players. (${activeMaxOvers} overs)`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Overs selector — only for 1st innings */}
            {!match.team1Innings && (
              <div className="space-y-2">
                <Label>Total Overs</Label>
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6, 8, 10].map((o) => (
                    <Button
                      key={o}
                      type="button"
                      size="sm"
                      variant={setupOvers === o ? "default" : "outline"}
                      className="w-12"
                      onClick={() => setSetupOvers(o)}
                    >
                      {o}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Each bowler may bowl max {MAX_BOWLER_OVERS} overs</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Batting Team</Label>
              <Select value={setupBatting} onValueChange={(v) => { setSetupBatting(v); setSetupStriker(""); setSetupNonStriker(""); setSetupBowler(""); }}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {/* For 2nd innings, only offer the team that didn't bat first */}
                  {match.team1Innings
                    ? <SelectItem value={match.team1Innings.bowlingTeamId}>{teamMap[match.team1Innings.bowlingTeamId]?.name}</SelectItem>
                    : <>
                        <SelectItem value={match.team1Id}>{t1?.name}</SelectItem>
                        <SelectItem value={match.team2Id}>{t2?.name}</SelectItem>
                      </>
                  }
                </SelectContent>
              </Select>
            </div>

            {setupBatting && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Opening Striker ●</Label>
                    <Select value={setupStriker} onValueChange={setSetupStriker}>
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {setupBattingPlayers.map((p) => (
                          <SelectItem key={p.id} value={p.id} disabled={p.id === setupNonStriker}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opening Non-Striker ○</Label>
                    <Select value={setupNonStriker} onValueChange={setSetupNonStriker}>
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {setupBattingPlayers.map((p) => (
                          <SelectItem key={p.id} value={p.id} disabled={p.id === setupStriker}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Opening Bowler ▶</Label>
                  <Select value={setupBowler} onValueChange={setSetupBowler}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {setupBowlingPlayers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetup(false)}>Cancel</Button>
            <Button
              onClick={handleStartInnings}
              disabled={saving || !setupBatting || !setupStriker || !setupNonStriker || !setupBowler}
            >
              {saving ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              Start Innings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wicket Dialog */}
      <Dialog open={showWicket} onOpenChange={setShowWicket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Wicket</DialogTitle>
            <DialogDescription>Select how the batsman was dismissed and the new batsman.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Batsman Out</Label>
              <Select value={wicketBatsman} onValueChange={setWicketBatsman}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {currentInnings?.batsmen
                    .filter((b) => b.status === "batting")
                    .map((b) => (
                      <SelectItem key={b.playerId} value={b.playerId}>
                        {playerMap[b.playerId]?.name || b.playerId}
                        {b.playerId === currentInnings.strikerPlayerId ? " (striker)" : " (non-striker)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dismissal Type</Label>
              <Select value={wicketType} onValueChange={setWicketType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["bowled", "caught", "lbw", "run out", "stumped", "hit wicket", "caught & bowled", "obstructing the field", "handled the ball", "timed out"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>New Batsman <span className="text-muted-foreground text-xs">(if available)</span></Label>
              <Select value={newBatsman} onValueChange={setNewBatsman}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No new batsman (all out)</SelectItem>
                  {battingPlayers
                    .filter((p) => !currentInnings?.batsmen.find((b) => b.playerId === p.id))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWicket(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleWicket} disabled={saving || !wicketBatsman}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              Confirm Wicket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Bowler Dialog */}
      <Dialog open={showChangeBowler} onOpenChange={setShowChangeBowler}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Bowler</DialogTitle>
            <DialogDescription>Max {MAX_BOWLER_OVERS} overs per bowler • Match: {maxOvers} overs</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Select Bowler</Label>
            <Select value={newBowlerId} onValueChange={setNewBowlerId}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {bowlingPlayers.map((p) => {
                  const rec = currentInnings?.bowlers.find((b) => b.playerId === p.id);
                  const bowled = rec?.overs ?? 0;
                  const remaining = MAX_BOWLER_OVERS - bowled;
                  const atMax = bowled >= MAX_BOWLER_OVERS;
                  const isCurrent = p.id === currentInnings?.currentBowlerPlayerId;
                  const validate = canBowlNextOver(p.id, currentInnings?.bowlers, activeMaxOvers, currentInnings?.overs ?? 0, 1);
                  const disabledBecauseRule = !validate.ok;
                  const label = atMax
                    ? `${p.name} — 0 ov left ⛔`
                    : `${p.name} — ${remaining} ov left${isCurrent ? " ▶ current" : ""}${disabledBecauseRule ? ` — ${validate.reason}` : ""}`;
                  return (
                    <SelectItem key={p.id} value={p.id} disabled={atMax || isCurrent || disabledBecauseRule}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeBowler(false)}>Cancel</Button>
            <Button onClick={handleChangeBowler} disabled={saving || !newBowlerId}>
              {saving ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Innings Dialog */}
      <Dialog open={showEndInnings} onOpenChange={setShowEndInnings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSecondInnings ? "End Match" : "End 1st Innings"}</DialogTitle>
            <DialogDescription>
              {isSecondInnings
                ? `All ${activeMaxOvers} overs completed. Proceed to set the match result.`
                : `All ${activeMaxOvers} overs completed. The 2nd innings will now start.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndInnings(false)}>Cancel</Button>
            <Button onClick={handleEndInnings} disabled={saving}>
              {isSecondInnings ? "Proceed to Result" : "Start 2nd Innings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match result is auto-computed; manual completion dialog removed */}
    </div>
  );
}
