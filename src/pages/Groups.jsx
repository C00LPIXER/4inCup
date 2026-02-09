import { useTournament } from '../context/TournamentContext';
import { GROUPS } from '../utils/logic';
import { Users, User } from 'lucide-react';

export function Groups() {
    const { data } = useTournament();

    const groupA = data.teams.filter(t => t.group === GROUPS.A);
    const groupB = data.teams.filter(t => t.group === GROUPS.B);

    return (
        <div className="space-y-12">
            <h1 className="text-4xl font-bold text-center mb-8">Participating Teams</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GroupCard title="Group A" teams={groupA} color="lime" />
                {/* <GroupCard title="Group B" teams={groupB} color="emerald" /> */}
            </div>
        </div>
    );
}

function GroupCard({ title, teams, color }) {
    const isA = color === 'lime';
    const borderColor = isA ? 'border-lime-500/30' : 'border-emerald-500/30';
    const headerColor = isA ? 'text-lime-400' : 'text-emerald-400';
    const bgGradient = isA ? 'from-lime-500/10' : 'from-emerald-500/10';

    return (
        <div className={`rounded-xl overflow-hidden border ${borderColor} bg-neutral-900/50 backdrop-blur-md`}>
            <div className={`p-4 bg-gradient-to-r ${bgGradient} to-transparent border-b ${borderColor}`}>
                <h2 className={`text-2xl font-bold ${headerColor} flex items-center gap-2`}>
                    <Users className="w-6 h-6" /> {title}
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
                                <div className="font-bold text-lg text-white">{team.name}</div>
                                <div className="text-sm text-neutral-400 flex items-center gap-2">
                                    <User className="w-3 h-3" /> {team.player1} & {team.player2}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
