import { Link } from "react-router-dom";
import { useTournament } from "../context/TournamentContext";
import { Calendar, Users, Trophy, Play } from "lucide-react";
import { Groups } from "./Groups";

export function Home() {
  const { data } = useTournament();
  const teams = data.teams;

  const matchCount = data.matches.length;
  const completedMatches = data.matches.filter((m) => m.completed).length;

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center relative -mt-0">
      {/* Full Width Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/muktasim-azlan-rjWfNR_AC5g-unsplash.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 flex flex-col gap-12">
        <section className="text-center py-12">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 drop-shadow-2xl">
            4inCup
          </h1>
          <p className="text-2xl md:text-3xl text-neutral-200 font-light max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100 drop-shadow-lg">
            Presented By{" "}
            <span className="font-semibold text-lime-400">4inDegree</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <Link
              to="/fixtures"
              className="bg-lime-500 hover:bg-lime-400 text-neutral-950 font-bold py-4 px-10 rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20"
            >
              <Calendar className="w-5 h-5" />
              View Fixtures
            </Link>
            <Link
              to="/standings"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium py-4 px-10 rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2 border border-white/20"
            >
              <Trophy className="w-5 h-5" />
              Standings
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
