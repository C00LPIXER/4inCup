import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  generateFixtures, updateMatchScore, updateMatch, deleteMatch, resetMatchScore, createMatch,
} from "@/services/firebase-service";
import type { Match, InningsScore, MatchResult } from "@/types";
import {
  Calendar, PlayCircle, CheckCircle2, Trophy, Plus, Trash2, Edit3, RotateCcw, Filter, Zap,
} from "lucide-react";

type TabType = "all" | "upcoming" | "live" | "completed";

export default function AdminMatches() {
  const { matches, teams, activeChampionship, loading } = useTournament();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Score entry dialog
  const [scoreMatch, setScoreMatch] = useState<Match | null>(null);
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

  // Edit details dialog
  const [detailsMatch, setDetailsMatch] = useState<Match | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editVenue, setEditVenue] = useState("");

  // Add match dialog
  const [showAdd, setShowAdd] = useState(false);
  const [addTeam1, setAddTeam1] = useState("");
  const [addTeam2, setAddTeam2] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addVenue, setAddVenue] = useState("");

  if (loading) return <PageLoader />;

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  const upcoming = matches.filter((m) => m.status === "upcoming");
  const live = matches.filter((m) => m.status === "live");
  const completed = matches.filter((m) => m.status === "completed");

  const tabMatches: Record<TabType, Match[]> = {
    all: matches,
    upcoming,
    live,
    completed,
  };

  const visibleMatches = tabMatches[activeTab];

  // ── Handlers ──
  const handleGenerate = async () => {
    if (!activeChampionship) return;
    if (matches.length > 0 && !confirm("Regenerate all fixtures? Existing matches will be deleted.")) return;
    setGenerating(true);
    try { await generateFixtures(activeChampionship.id); }
    catch (err) { console.error(err); }
    finally { setGenerating(false); }
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
    const team1Score: InningsScore = { runs: t1Runs, wickets: t1Wickets, overs: t1Overs, balls: t1Balls };
    const team2Score: InningsScore = { runs: t2Runs, wickets: t2Wickets, overs: t2Overs, balls: t2Balls };

    let summary = resultSummary;
    if (!summary && winnerId && winnerId !== "tie") {
      const winnerName = teamMap[winnerId]?.name || "Winner";
      if (winnerId === scoreMatch.team1Id) {
        summary = `${winnerName} won by ${t1Runs - t2Runs} runs`;
      } else {
        summary = `${winnerName} won by ${10 - t2Wickets} wickets`;
      }
    }

    const result: MatchResult = { winnerId: winnerId === "tie" ? "" : winnerId, summary: summary || "Match completed" };
    await updateMatchScore(scoreMatch.id, team1Score, team2Score, result);
    setScoreMatch(null);
    setSaving(false);
  };

  const openDetails = (match: Match) => {
    setDetailsMatch(match);
    setEditDate(match.date || "");
    setEditVenue(match.venue || "");
  };

  const handleDetailsSave = async () => {
    if (!detailsMatch) return;
    setSaving(true);
    await updateMatch(detailsMatch.id, { date: editDate.trim(), venue: editVenue.trim() });
    setDetailsMatch(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match? This cannot be undone.")) return;
    setDeletingId(id);
    await deleteMatch(id);
    setDeletingId(null);
  };

  const handleReset = async (id: string) => {
    if (!confirm("Reset this match score? It will go back to 'upcoming'.")) return;
    await resetMatchScore(id);
  };

  const handleSetLive = async (id: string) => {
    await updateMatch(id, { status: "live" });
  };

  const handleAddMatch = async () => {
    if (!activeChampionship || !addTeam1 || !addTeam2) return;
    setSaving(true);
    await createMatch({
      championshipId: activeChampionship.id,
      matchNumber: matches.length + 1,
      team1Id: addTeam1,
      team2Id: addTeam2,
      status: "upcoming",
      team1Score: null,
      team2Score: null,
      result: null,
      date: addDate,
      venue: addVenue,
    });
    setAddTeam1(""); setAddTeam2(""); setAddDate(""); setAddVenue("");
    setShowAdd(false);
    setSaving(false);
  };

  const formatScore = (score: InningsScore | null) => {
    if (!score) return "–";
    return `${score.runs}/${score.wickets} (${score.overs}.${score.balls})`;
  };

  const TABS: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "All", count: matches.length },
    { key: "live", label: "🔴 Live", count: live.length },
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "completed", label: "Completed", count: completed.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Manage Matches</h1>
          <p className="text-muted-foreground">{matches.length} fixtures • {completed.length} completed</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowAdd(true)} disabled={teams.length < 2}>
            <Plus className="h-4 w-4 mr-1" /> Add Match
          </Button>
          <Button onClick={handleGenerate} disabled={generating || teams.length < 2} size="lg">
            {generating ? <><Spinner size="sm" className="mr-2 text-primary-foreground" />Generating…</> : <><Calendar className="h-4 w-4 mr-2" />Generate Fixtures</>}
          </Button>
        </div>
      </div>

      {teams.length < 2 && (
        <Card className="border-accent/50 bg-accent/5">
          <CardContent className="p-4 text-center text-sm text-accent">
            Need at least 2 teams to create fixtures.
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-border pb-1">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.key ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label} {tab.count > 0 && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{tab.count}</Badge>}
          </button>
        ))}
      </div>

      {/* Match Cards */}
      {visibleMatches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-14 w-14 mx-auto mb-3 opacity-40" />
          <p>No {activeTab !== "all" ? activeTab : ""} matches.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleMatches.map((match) => {
            const t1 = teamMap[match.team1Id];
            const t2 = teamMap[match.team2Id];
            const statusColors: Record<string, string> = { upcoming: "bg-secondary text-foreground", live: "bg-red-500/20 text-red-400", completed: "bg-green-500/20 text-green-400" };

            return (
              <Card key={match.id} className={`overflow-hidden ${match.status === "live" ? "border-red-500/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Match info */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs font-mono">#{match.matchNumber}</Badge>
                      <Badge className={`text-[10px] ${statusColors[match.status]}`}>{match.status}</Badge>
                    </div>

                    {/* Teams & Scores */}
                    <div className="flex-1 flex items-center justify-center gap-3">
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t1?.color || "#666" }} />
                        <span className="text-sm font-semibold truncate">{t1?.name || "TBD"}</span>
                      </div>
                      <div className="text-center px-2 flex-shrink-0">
                        {match.team1Score ? (
                          <div className="text-xs font-mono font-bold text-center">
                            <div>{formatScore(match.team1Score)}</div>
                            <div className="text-[10px] text-muted-foreground">vs</div>
                            <div>{formatScore(match.team2Score)}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-bold text-sm">VS</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-sm font-semibold truncate">{t2?.name || "TBD"}</span>
                        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t2?.color || "#666" }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {match.status === "upcoming" && (
                        <Button variant="outline" size="sm" onClick={() => handleSetLive(match.id)} title="Start match">
                          <PlayCircle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Start</span>
                        </Button>
                      )}
                      {match.status === "live" && (
                        <>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => navigate(`/admin/matches/${match.id}/live`)} title="Live scoring">
                            <Zap className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Live Score</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openScoreEntry(match)} title="Enter result">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Result</span>
                          </Button>
                        </>
                      )}
                      {match.status === "completed" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openScoreEntry(match)} title="Edit score">
                            <Edit3 className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Edit Score</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReset(match.id)} title="Reset to upcoming">
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openDetails(match)} title="Edit date/venue">
                        <Calendar className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(match.id)} disabled={deletingId === match.id} title="Delete match">
                        {deletingId === match.id ? <Spinner size="sm" /> : <Trash2 className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* Sub info */}
                  {(match.result || match.date || match.venue) && (
                    <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      {match.result && <span className="text-accent font-medium">{match.result.summary}</span>}
                      {match.date && <span>📅 {match.date}</span>}
                      {match.venue && <span>📍 {match.venue}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Match Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Match</DialogTitle>
            <DialogDescription>Create a custom fixture between two teams.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team 1</Label>
                <Select value={addTeam1} onValueChange={setAddTeam1}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team 2</Label>
                <Select value={addTeam2} onValueChange={setAddTeam2}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{teams.filter((t) => t.id !== addTeam1).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={addDate} onChange={(e) => setAddDate(e.target.value)} placeholder="e.g. Mar 15, 2026" />
            </div>
            <div className="space-y-2">
              <Label>Venue <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={addVenue} onChange={(e) => setAddVenue(e.target.value)} placeholder="e.g. 4inDegree Ground" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddMatch} disabled={saving || !addTeam1 || !addTeam2 || addTeam1 === addTeam2}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Adding…" : "Add Match"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      <Dialog open={!!detailsMatch} onOpenChange={() => setDetailsMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match Details</DialogTitle>
            <DialogDescription>Match #{detailsMatch?.matchNumber} — {teamMap[detailsMatch?.team1Id || ""]?.name} vs {teamMap[detailsMatch?.team2Id || ""]?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={editDate} onChange={(e) => setEditDate(e.target.value)} placeholder="e.g. Mar 15, 2026" />
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input value={editVenue} onChange={(e) => setEditVenue(e.target.value)} placeholder="e.g. 4inDegree Ground" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsMatch(null)}>Cancel</Button>
            <Button onClick={handleDetailsSave} disabled={saving}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score Entry Dialog */}
      <Dialog open={!!scoreMatch} onOpenChange={() => setScoreMatch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Match #{scoreMatch?.matchNumber} Scorecard</DialogTitle>
            <DialogDescription>
              {teamMap[scoreMatch?.team1Id || ""]?.name || "Team 1"} vs {teamMap[scoreMatch?.team2Id || ""]?.name || "Team 2"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Team 1 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: teamMap[scoreMatch?.team1Id || ""]?.color || "#666" }} />
                  {teamMap[scoreMatch?.team1Id || ""]?.name || "Team 1"} Innings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className="text-xs">Runs</Label><Input type="number" min={0} value={t1Runs} onChange={(e) => setT1Runs(Number(e.target.value))} /></div>
                  <div><Label className="text-xs">Wickets</Label><Input type="number" min={0} max={10} value={t1Wickets} onChange={(e) => setT1Wickets(Number(e.target.value))} /></div>
                  <div><Label className="text-xs">Overs</Label><Input type="number" min={0} value={t1Overs} onChange={(e) => setT1Overs(Number(e.target.value))} /></div>
                  <div><Label className="text-xs">Balls</Label><Input type="number" min={0} max={5} value={t1Balls} onChange={(e) => setT1Balls(Number(e.target.value))} /></div>
                </div>
              </CardContent>
            </Card>
            {/* Team 2 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: teamMap[scoreMatch?.team2Id || ""]?.color || "#666" }} />
                  {teamMap[scoreMatch?.team2Id || ""]?.name || "Team 2"} Innings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className="text-xs">Runs</Label><Input type="number" min={0} value={t2Runs} onChange={(e) => setT2Runs(Number(e.target.value))} /></div>
                  <div><Label className="text-xs">Wickets</Label><Input type="number" min={0} max={10} value={t2Wickets} onChange={(e) => setT2Wickets(Number(e.target.value))} /></div>
                  <div><Label className="text-xs">Overs</Label><Input type="number" min={0} value={t2Overs} onChange={(e) => setT2Overs(Number(e.target.value))} /></div>
                  <div><Label className="text-xs">Balls</Label><Input type="number" min={0} max={5} value={t2Balls} onChange={(e) => setT2Balls(Number(e.target.value))} /></div>
                </div>
              </CardContent>
            </Card>
            {/* Winner */}
            <div className="space-y-2">
              <Label>Match Result</Label>
              <Select value={winnerId} onValueChange={setWinnerId}>
                <SelectTrigger><SelectValue placeholder="Select winner…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={scoreMatch?.team1Id || "t1"}>{teamMap[scoreMatch?.team1Id || ""]?.name || "Team 1"} Won</SelectItem>
                  <SelectItem value={scoreMatch?.team2Id || "t2"}>{teamMap[scoreMatch?.team2Id || ""]?.name || "Team 2"} Won</SelectItem>
                  <SelectItem value="tie">Tie / No Result</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Result Summary <span className="text-muted-foreground text-xs">(auto if empty)</span></Label>
              <Input value={resultSummary} onChange={(e) => setResultSummary(e.target.value)} placeholder="e.g. Thunder Hawks won by 25 runs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreMatch(null)}>Cancel</Button>
            <Button onClick={handleScoreSave} disabled={saving}>
              {saving && <Spinner size="sm" className="mr-2 text-primary-foreground" />}
              {saving ? "Saving…" : "Save Scorecard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
