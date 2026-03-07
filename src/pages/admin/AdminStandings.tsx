import { useTournament } from "@/context/TournamentContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { calculatePointsTable } from "@/services/firebase-service";
import { BarChart3, Trophy } from "lucide-react";

export default function AdminStandings() {
  const { matches, teams, loading, activeChampionship } = useTournament();

  if (loading) return <PageLoader />;

  if (teams.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="font-heading text-2xl font-bold mb-1">
          No Standings Yet
        </h2>
        <p className="text-muted-foreground">
          Create teams and play matches to see standings.
        </p>
      </div>
    );
  }

  const pointsTable = calculatePointsTable(matches, teams);
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Standings</h1>
        <p className="text-muted-foreground">
          {activeChampionship?.name} — Admin View
        </p>
      </div>

      {/* Leader */}
      {pointsTable.length > 0 && pointsTable[0].played > 0 && (
        <Card className="bg-gradient-to-r from-accent/10 to-primary/5 border-accent/20">
          <CardContent className="p-6 flex items-center gap-4">
            <Trophy className="h-10 w-10 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Current Leader</p>
              <p className="font-heading text-2xl font-bold">
                {teamMap[pointsTable[0].teamId]?.name || "Unknown"}
              </p>
              <div className="flex gap-3 mt-1">
                <Badge variant="default">{pointsTable[0].points} pts</Badge>
                <Badge variant="secondary">
                  NRR: {pointsTable[0].nrr > 0 ? "+" : ""}
                  {pointsTable[0].nrr.toFixed(3)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Points Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3 px-2">Team</th>
                  <th className="text-center py-3 px-2">P</th>
                  <th className="text-center py-3 px-2">W</th>
                  <th className="text-center py-3 px-2">L</th>
                  <th className="text-center py-3 px-2">T</th>
                  <th className="text-center py-3 px-2">Pts</th>
                  <th className="text-center py-3 px-2">NRR</th>
                  <th className="text-center py-3 px-2">RS</th>
                  <th className="text-center py-3 px-2">RC</th>
                </tr>
              </thead>
              <tbody>
                {pointsTable.map((row, idx) => {
                  const team = teamMap[row.teamId];
                  return (
                    <tr
                      key={row.teamId}
                      className={`border-b border-border/50 hover:bg-secondary/50 transition-colors ${
                        idx === 0 && row.played > 0 ? "bg-accent/5" : ""
                      }`}
                    >
                      <td className="py-3 px-2 font-bold text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: team?.color || "#666",
                            }}
                          />
                          <span className="font-semibold">
                            {team?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">{row.played}</td>
                      <td className="text-center py-3 px-2 text-primary font-semibold">
                        {row.wins}
                      </td>
                      <td className="text-center py-3 px-2 text-destructive">
                        {row.losses}
                      </td>
                      <td className="text-center py-3 px-2">{row.ties}</td>
                      <td className="text-center py-3 px-2 font-bold text-accent">
                        {row.points}
                      </td>
                      <td className="text-center py-3 px-2 font-mono text-xs">
                        {row.nrr > 0 ? "+" : ""}
                        {row.nrr.toFixed(3)}
                      </td>
                      <td className="text-center py-3 px-2 text-xs">
                        {row.runsScored}
                      </td>
                      <td className="text-center py-3 px-2 text-xs">
                        {row.runsConceded}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
