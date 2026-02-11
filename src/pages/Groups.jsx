import { useTournament } from '../context/TournamentContext';
import { Users, User } from 'lucide-react';

export function Groups() {
    const { data } = useTournament();

    return (
        <div className="space-y-12">
            <h1 className="text-4xl font-bold text-center mb-8">Participating Teams</h1>

            <div className="flex justify-center w-full">
                <TeamCard teams={data.teams} />
            </div>
        </div>
    );
}

function TeamCard({ teams }) {
    return (
        <div className="rounded-xl overflow-hidden border border-lime-500/30 bg-neutral-900/50 backdrop-blur-md max-w-2xl w-full">
            <div className="p-4 bg-gradient-to-r from-lime-500/10 to-transparent border-b border-lime-500/30">
                <h2 className="text-2xl font-bold text-lime-400 flex items-center gap-2">
                    <Users className="w-6 h-6" /> All Teams
                </h2>
            </div>
            <div className="p-4 space-y-3">
                {teams.length === 0 ? (
                    <div className="text-neutral-500 italic py-4 text-center">No teams yet</div>
                ) : (
                    teams.map((team, idx) => (
                        <div key={team.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="text-neutral-500 font-mono w-6">#{idx + 1}</span>
                            <div>
                                <div className="font-bold text-lg text-white">{team.player1} & {team.player2}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
