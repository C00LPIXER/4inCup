// ============================================================
// Scalable Sports Tournament Types
// Currently: Cricket | Future: Football, Badminton, etc.
// ============================================================

export type SportType = "cricket" | "football" | "badminton";

// ---------- Cricket-specific roles & skills ----------
export type CricketRole = "Batsman" | "Bowler" | "All-Rounder" | "Fielder";

export interface CricketSkills {
  batting: number;   // 1-10
  bowling: number;   // 1-10
  fielding: number;  // 1-10
  keeping: number;   // 1-10
  experience: number;// 1-10
}

// ---------- Generic Player ----------
export interface Player {
  id: string;
  name: string;
  photoURL: string;
  role: CricketRole | "";
  skills: CricketSkills;
  teamId: string;
  championshipId: string;
  createdAt: number;
}

// ---------- Team ----------
export interface Team {
  id: string;
  name: string;
  color: string;
  championshipId: string;
  playerIds: string[];
  createdAt: number;
}

// ---------- Match ----------
export type MatchStatus = "upcoming" | "live" | "completed";

export interface InningsScore {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
}

export interface MatchResult {
  winnerId: string;
  summary: string; // e.g. "Team A won by 25 runs"
}

export interface Match {
  id: string;
  championshipId: string;
  matchNumber: number;
  team1Id: string;
  team2Id: string;
  status: MatchStatus;
  team1Score: InningsScore | null;
  team2Score: InningsScore | null;
  result: MatchResult | null;
  date: string;
  venue: string;
  createdAt: number;
}

// ---------- Points Table Row ----------
export interface PointsTableRow {
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  noResult: number;
  points: number;
  nrr: number; // Net Run Rate
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
}

// ---------- Championship (Tournament) ----------
export interface Championship {
  id: string;
  name: string;
  season: number;
  sport: SportType;
  organizer: string;
  status: "registration" | "teams_formed" | "in_progress" | "completed";
  teamCount: number;
  maxPlayersPerTeam: number;
  oversPerMatch: number;
  createdAt: number;
  registrationOpen: boolean;
}

// ---------- Team Colors ----------
export const TEAM_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // purple
];

export const TEAM_DEFAULT_NAMES = [
  "Thunder Hawks",
  "Royal Strikers",
  "Golden Eagles",
  "Storm Riders",
];
