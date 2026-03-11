import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { col } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type {
  Player,
  Team,
  Match,
  Championship,
  CricketSkills,
  CricketRole,
  InningsScore,
  MatchResult,
  PointsTableRow,
  MatchStatus,
  AdminUser,
} from "@/types";

// ============================================================
// Championships
// ============================================================

export async function createChampionship(
  data: Omit<Championship, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, col("championships")), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getChampionships(): Promise<Championship[]> {
  const snap = await getDocs(collection(db, col("championships")));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Championship))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getChampionship(id: string): Promise<Championship | null> {
  const snap = await getDoc(doc(db, col("championships"), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Championship;
}

export async function updateChampionship(
  id: string,
  data: Partial<Championship>
): Promise<void> {
  await updateDoc(doc(db, col("championships"), id), data);
}

export function subscribeChampionship(
  id: string,
  cb: (c: Championship | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, col("championships"), id), (snap) => {
    if (!snap.exists()) return cb(null);
    cb({ id: snap.id, ...snap.data() } as Championship);
  });
}

// ============================================================
// Players
// ============================================================

export async function registerPlayer(
  championshipId: string,
  name: string,
  photoFile: File
): Promise<string> {
  // Upload photo to Cloudinary
  const photoURL = await uploadToCloudinary(
    photoFile,
    `4incup/${championshipId}`
  );

  const emptySkills: CricketSkills = {
    batting: 5,
    bowling: 5,
    fielding: 5,
    keeping: 5,
    experience: 5,
  };

  const docRef = await addDoc(collection(db, col("players")), {
    name,
    photoURL,
    role: "",
    skills: emptySkills,
    teamId: "",
    championshipId,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getPlayers(championshipId: string): Promise<Player[]> {
  const snap = await getDocs(
    query(
      collection(db, col("players")),
      where("championshipId", "==", championshipId)
    )
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Player))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function subscribePlayers(
  championshipId: string,
  cb: (players: Player[]) => void
): Unsubscribe {
  const q = query(
    collection(db, col("players")),
    where("championshipId", "==", championshipId)
  );
  return onSnapshot(q, (snap) => {
    const players = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Player))
      .sort((a, b) => a.createdAt - b.createdAt);
    cb(players);
  });
}

export async function updatePlayer(
  id: string,
  data: Partial<Player>
): Promise<void> {
  await updateDoc(doc(db, col("players"), id), data);
}

export async function deletePlayer(id: string): Promise<void> {
  await deleteDoc(doc(db, col("players"), id));
}

export async function assignRole(
  playerId: string,
  role: CricketRole,
  skills: CricketSkills
): Promise<void> {
  await updateDoc(doc(db, col("players"), playerId), { role, skills });
}

// ============================================================
// Teams
// ============================================================

export async function createTeam(
  data: Omit<Team, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, col("teams")), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getTeams(championshipId: string): Promise<Team[]> {
  const snap = await getDocs(
    query(
      collection(db, col("teams")),
      where("championshipId", "==", championshipId)
    )
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Team))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function subscribeTeams(
  championshipId: string,
  cb: (teams: Team[]) => void
): Unsubscribe {
  const q = query(
    collection(db, col("teams")),
    where("championshipId", "==", championshipId)
  );
  return onSnapshot(q, (snap) => {
    const teams = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Team))
      .sort((a, b) => a.createdAt - b.createdAt);
    cb(teams);
  });
}

export async function updateTeam(
  id: string,
  data: Partial<Team>
): Promise<void> {
  await updateDoc(doc(db, col("teams"), id), data);
}

export async function deleteTeam(id: string): Promise<void> {
  await deleteDoc(doc(db, col("teams"), id));
}

/** Shuffle players into balanced teams and persist */
export async function shuffleTeams(
  championshipId: string,
  teamCount: number,
  teamNames: string[],
  teamColors: string[]
): Promise<void> {
  const players = await getPlayers(championshipId);
  const existingTeams = await getTeams(championshipId);

  // Delete existing teams
  const batch1 = writeBatch(db);
  existingTeams.forEach((t) => batch1.delete(doc(db, col("teams"), t.id)));
  await batch1.commit();

  // Reset player teamIds
  const batch2 = writeBatch(db);
  players.forEach((p) =>
    batch2.update(doc(db, col("players"), p.id), { teamId: "" })
  );
  await batch2.commit();

  // Group by role
  const roleGroups: Record<string, Player[]> = {
    Batsman: [],
    Bowler: [],
    "All-Rounder": [],
    Fielder: [],
    Unassigned: [],
  };

  players.forEach((p) => {
    const key = p.role || "Unassigned";
    if (roleGroups[key]) roleGroups[key].push(p);
    else roleGroups["Unassigned"].push(p);
  });

  // Sort each group by total skill descending (snake-draft style)
  const totalSkill = (p: Player) =>
    p.skills.batting +
    p.skills.bowling +
    p.skills.fielding +
    p.skills.keeping +
    p.skills.experience;

  Object.values(roleGroups).forEach((group) =>
    group.sort((a, b) => totalSkill(b) - totalSkill(a))
  );

  // Create team buckets
  const teamBuckets: Player[][] = Array.from({ length: teamCount }, () => []);

  // Snake draft per role group for balanced distribution
  const distributeGroup = (group: Player[]) => {
    let forward = true;
    let idx = 0;
    for (const player of group) {
      teamBuckets[idx].push(player);
      if (forward) {
        idx++;
        if (idx >= teamCount) {
          idx = teamCount - 1;
          forward = false;
        }
      } else {
        idx--;
        if (idx < 0) {
          idx = 0;
          forward = true;
        }
      }
    }
  };

  // Distribute each role group
  ["Batsman", "All-Rounder", "Bowler", "Fielder", "Unassigned"].forEach(
    (role) => distributeGroup(roleGroups[role])
  );

  // Create teams in DB and assign players
  for (let i = 0; i < teamCount; i++) {
    const playerIds = teamBuckets[i].map((p) => p.id);
    const teamId = await createTeam({
      name: teamNames[i] || `Team ${i + 1}`,
      color: teamColors[i] || "#16a34a",
      championshipId,
      playerIds,
    });

    const batch = writeBatch(db);
    teamBuckets[i].forEach((p) =>
      batch.update(doc(db, col("players"), p.id), { teamId })
    );
    await batch.commit();
  }
}

/** Move a player from one team to another */
export async function movePlayer(
  playerId: string,
  fromTeamId: string,
  toTeamId: string
): Promise<void> {
  const [fromSnap, toSnap] = await Promise.all([
    getDoc(doc(db, col("teams"), fromTeamId)),
    getDoc(doc(db, col("teams"), toTeamId)),
  ]);

  if (!fromSnap.exists() || !toSnap.exists()) return;

  const fromTeam = fromSnap.data() as Team;
  const toTeam = toSnap.data() as Team;

  const batch = writeBatch(db);
  batch.update(doc(db, col("teams"), fromTeamId), {
    playerIds: fromTeam.playerIds.filter((id) => id !== playerId),
  });
  batch.update(doc(db, col("teams"), toTeamId), {
    playerIds: [...toTeam.playerIds, playerId],
  });
  batch.update(doc(db, col("players"), playerId), { teamId: toTeamId });
  await batch.commit();
}

// ============================================================
// Matches
// ============================================================

export async function createMatch(
  data: Omit<Match, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, col("matches")), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function getMatches(championshipId: string): Promise<Match[]> {
  const snap = await getDocs(
    query(
      collection(db, col("matches")),
      where("championshipId", "==", championshipId)
    )
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Match))
    .sort((a, b) => a.matchNumber - b.matchNumber);
}

export function subscribeMatches(
  championshipId: string,
  cb: (matches: Match[]) => void
): Unsubscribe {
  const q = query(
    collection(db, col("matches")),
    where("championshipId", "==", championshipId)
  );
  return onSnapshot(q, (snap) => {
    const matches = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Match))
      .sort((a, b) => a.matchNumber - b.matchNumber);
    cb(matches);
  });
}

export async function updateMatch(
  id: string,
  data: Partial<Match>
): Promise<void> {
  await updateDoc(doc(db, col("matches"), id), data);
}

export async function updateMatchScore(
  matchId: string,
  team1Score: InningsScore,
  team2Score: InningsScore,
  result: MatchResult,
  status: MatchStatus = "completed"
): Promise<void> {
  await updateDoc(doc(db, col("matches"), matchId), {
    team1Score,
    team2Score,
    result,
    status,
  });
}

/** Generate round-robin fixtures for all teams */
export async function generateFixtures(
  championshipId: string
): Promise<void> {
  // Delete existing matches
  const existing = await getMatches(championshipId);
  const batch = writeBatch(db);
  existing.forEach((m) => batch.delete(doc(db, col("matches"), m.id)));
  await batch.commit();

  const teams = await getTeams(championshipId);
  if (teams.length < 2) return;

  const fixtures: Array<{ team1Id: string; team2Id: string }> = [];

  // Round-robin: every team plays every other team
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({ team1Id: teams[i].id, team2Id: teams[j].id });
    }
  }

  // Shuffle fixture order
  for (let i = fixtures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
  }

  for (let idx = 0; idx < fixtures.length; idx++) {
    await createMatch({
      championshipId,
      matchNumber: idx + 1,
      team1Id: fixtures[idx].team1Id,
      team2Id: fixtures[idx].team2Id,
      status: "upcoming",
      team1Score: null,
      team2Score: null,
      result: null,
      date: "",
      venue: "",
    });
  }
}

// ============================================================
// Points Table Calculation
// ============================================================

export function calculatePointsTable(
  matches: Match[],
  teams: Team[]
): PointsTableRow[] {
  const table: Record<string, PointsTableRow> = {};

  teams.forEach((t) => {
    table[t.id] = {
      teamId: t.id,
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResult: 0,
      points: 0,
      nrr: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
    };
  });

  const oversToDecimal = (overs: number, balls: number) =>
    overs + balls / 6;

  matches
    .filter((m) => m.status === "completed" && m.team1Score && m.team2Score)
    .forEach((m) => {
      const t1 = table[m.team1Id];
      const t2 = table[m.team2Id];
      if (!t1 || !t2) return;

      t1.played++;
      t2.played++;

      const s1 = m.team1Score!;
      const s2 = m.team2Score!;

      t1.runsScored += s1.runs;
      t1.oversFaced += oversToDecimal(s1.overs, s1.balls);
      t1.runsConceded += s2.runs;
      t1.oversBowled += oversToDecimal(s2.overs, s2.balls);

      t2.runsScored += s2.runs;
      t2.oversFaced += oversToDecimal(s2.overs, s2.balls);
      t2.runsConceded += s1.runs;
      t2.oversBowled += oversToDecimal(s1.overs, s1.balls);

      if (m.result) {
        if (m.result.winnerId === m.team1Id) {
          t1.wins++;
          t1.points += 2;
          t2.losses++;
        } else if (m.result.winnerId === m.team2Id) {
          t2.wins++;
          t2.points += 2;
          t1.losses++;
        } else {
          // Tie
          t1.ties++;
          t2.ties++;
          t1.points += 1;
          t2.points += 1;
        }
      }
    });

  // Calculate NRR
  Object.values(table).forEach((row) => {
    if (row.oversFaced > 0 && row.oversBowled > 0) {
      row.nrr =
        row.runsScored / row.oversFaced -
        row.runsConceded / row.oversBowled;
    }
  });

  // Sort: points desc, nrr desc
  return Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });
}

// ============================================================
// Extra Match Operations
// ============================================================

export async function deleteMatch(id: string): Promise<void> {
  await deleteDoc(doc(db, col("matches"), id));
}

export async function resetMatchScore(id: string): Promise<void> {
  await updateDoc(doc(db, col("matches"), id), {
    status: "upcoming",
    team1Score: null,
    team2Score: null,
    result: null,
  });
}

// ============================================================
// Manual Player Creation (no photo upload)
// ============================================================

export async function createManualPlayer(
  championshipId: string,
  name: string,
  photoURL = ""
): Promise<string> {
  const emptySkills: CricketSkills = {
    batting: 5,
    bowling: 5,
    fielding: 5,
    keeping: 5,
    experience: 5,
  };
  const docRef = await addDoc(collection(db, col("players")), {
    name: name.trim(),
    photoURL,
    role: "",
    skills: emptySkills,
    teamId: "",
    championshipId,
    createdAt: Date.now(),
  });
  return docRef.id;
}

// ============================================================
// Championship Delete
// ============================================================

export async function deleteChampionship(id: string): Promise<void> {
  await deleteDoc(doc(db, col("championships"), id));
}

// ============================================================
// Admin User Management (Firestore admins collection)
// ============================================================

export async function getAdmins(): Promise<AdminUser[]> {
  const snap = await getDocs(collection(db, col("admins")));
  return snap.docs.map((d) => ({ ...d.data() } as AdminUser));
}

export async function removeAdmin(uid: string): Promise<void> {
  await deleteDoc(doc(db, col("admins"), uid));
}

export async function upsertAdmin(admin: AdminUser): Promise<void> {
  await updateDoc(doc(db, col("admins"), admin.uid), {
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });
}
