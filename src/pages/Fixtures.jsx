import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { STAGES } from '../utils/logic';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

export function Fixtures() {
    const { data } = useTournament();
    const [filter, setFilter] = useState('ALL'); // ALL, GROUP, KNOCKOUT
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PLAYED, UPCOMING

    const filteredMatches = data.matches.filter(m => {
        const stageMatch = filter === 'ALL'
            ? true
            : filter === 'GROUP'
                ? m.stage === STAGES.GROUP
                : m.stage !== STAGES.GROUP;

        const statusMatch = statusFilter === 'ALL'
            ? true
            : statusFilter === 'PLAYED'
                ? m.completed
                : !m.completed;

        return stageMatch && statusMatch;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-4xl font-bold">Fixtures & Results</h1>
                </div>

                <div className="flex flex-col gap-2 bg-neutral-900 p-2 rounded-lg border border-white/10">
                    {/* Stage Filters */}
                    <div className="flex justify-center flex-wrap gap-2">
                        <FilterButton active={filter === 'GROUP'} onClick={() => setFilter('GROUP')} label="Group Stage" />
                        <FilterButton active={filter === 'KNOCKOUT'} onClick={() => setFilter('KNOCKOUT')} label="Knockout" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMatches.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-neutral-500 italic">
                        No matches found.
                    </div>
                ) : (
                    filteredMatches.map(match => {
                        const teamA = data.teams.find(t => t.id === match.teamAId) || { name: 'TBD' };
                        const teamB = data.teams.find(t => t.id === match.teamBId) || { name: 'TBD' };
                        return (
                            <MatchCard key={match.id} match={match} teamA={teamA} teamB={teamB} />
                        );
                    })
                )}
            </div>
        </div>
    );
}

function MatchCard({ match, teamA, teamB }) {
    const isCompleted = match.completed;
    const isLive = !isCompleted && match.scoreA > 0; // Simple heuristic

    const cardStyle = isCompleted
        ? "bg-lime-900/20 border-lime-500/50 hover:border-lime-500"
        : "bg-neutral-900/50 border-white/5 hover:border-lime-500/30";

    return (
        <div className={`${cardStyle} backdrop-blur border rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden group transition-all duration-300`}>
            {/* Status Indicator */}
            <div className="flex justify-between text-xs text-neutral-500 font-medium uppercase tracking-wider">
                <span>{match.stage} • {match.group ? `Group ${match.group}` : match.matchNumber}</span>
                {isCompleted ? (
                    <span className="text-lime-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> FT</span>
                ) : (
                    <span className="text-orange-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled</span>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex-1 text-right">
                    <div className={`font-bold text-lg ${match.winnerId === teamA.id ? 'text-lime-400' : 'text-white'}`}>
                        {teamA.id ? `${teamA.player1} & ${teamA.player2}` : 'TBD'}
                    </div>
                </div>

                <div className="px-4 py-1 bg-black/40 rounded-lg text-xl font-mono font-bold text-white mx-3 tracking-widest min-w-[80px] text-center border border-white/10">
                    {isCompleted || isLive ? `${match.scoreA} - ${match.scoreB}` : 'vs'}
                </div>

                <div className="flex-1 text-left">
                    <div className={`font-bold text-lg ${match.winnerId === teamB.id ? 'text-lime-400' : 'text-white'}`}>
                        {teamB.id ? `${teamB.player1} & ${teamB.player2}` : 'TBD'}
                    </div>
                </div>
            </div>

            {/* Decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-lime-500/10 to-transparent rounded-bl-full pointer-events-none" />
        </div>
    )
}

function FilterButton({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${active ? 'bg-lime-500 text-neutral-950' : 'text-neutral-400 hover:text-white'}`}
        >
            {label}
        </button>
    )
}
