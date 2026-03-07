import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Championship, Player, Team, Match } from "@/types";
import {
  getChampionships,
  createChampionship,
  subscribePlayers,
  subscribeTeams,
  subscribeMatches,
  subscribeChampionship,
} from "@/services/firebase-service";

interface TournamentContextType {
  championships: Championship[];
  activeChampionship: Championship | null;
  setActiveChampionshipId: (id: string) => void;
  players: Player[];
  teams: Team[];
  matches: Match[];
  loading: boolean;
  refreshChampionships: () => Promise<void>;
  createNewChampionship: (
    data: Omit<Championship, "id" | "createdAt">
  ) => Promise<string>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [activeChampionshipId, setActiveChampionshipId] = useState<string>("");
  const [activeChampionship, setActiveChampionship] =
    useState<Championship | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Load championships on mount
  useEffect(() => {
    refreshChampionships();
  }, []);

  // Auto-select latest championship
  useEffect(() => {
    if (championships.length > 0 && !activeChampionshipId) {
      setActiveChampionshipId(championships[0].id);
    }
  }, [championships, activeChampionshipId]);

  // Subscribe to active championship data
  useEffect(() => {
    if (!activeChampionshipId) return;

    setLoading(true);
    const unsubs: Array<() => void> = [];

    try {
      unsubs.push(
        subscribeChampionship(activeChampionshipId, (c) => {
          setActiveChampionship(c);
        })
      );

      unsubs.push(
        subscribePlayers(activeChampionshipId, (p) => {
          setPlayers(p);
          setLoading(false);
        })
      );

      unsubs.push(
        subscribeTeams(activeChampionshipId, (t) => {
          setTeams(t);
        })
      );

      unsubs.push(
        subscribeMatches(activeChampionshipId, (m) => {
          setMatches(m);
        })
      );
    } catch (err) {
      console.error("Firebase subscription error:", err);
      setLoading(false);
    }

    return () => unsubs.forEach((u) => u());
  }, [activeChampionshipId]);

  async function refreshChampionships() {
    try {
      const list = await getChampionships();
      setChampionships(list);
    } catch (err) {
      console.error("Failed to load championships:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createNewChampionship(
    data: Omit<Championship, "id" | "createdAt">
  ) {
    const id = await createChampionship(data);
    await refreshChampionships();
    setActiveChampionshipId(id);
    return id;
  }

  return (
    <TournamentContext.Provider
      value={{
        championships,
        activeChampionship,
        setActiveChampionshipId,
        players,
        teams,
        matches,
        loading,
        refreshChampionships,
        createNewChampionship,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx)
    throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
