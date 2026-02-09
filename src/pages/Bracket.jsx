import { useTournament } from '../context/TournamentContext';
import { STAGES } from '../utils/logic';
import { Trophy } from 'lucide-react';

export function Bracket() {
    const { data } = useTournament();

    const semiFinals = data.matches.filter(m => m.stage === STAGES.SEMI_FINAL);
    const finalMatch = data.matches.find(m => m.stage === STAGES.FINAL);

    const sf1 = semiFinals.find(m => m.matchNumber === 'SF1');
    const sf2 = semiFinals.find(m => m.matchNumber === 'SF2');

    const getTeamName = (id) => {
        const t = data.teams.find(t => t.id === id);
        if (!t) return 'TBD';
        return `${t.player1} & ${t.player2}`;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <h1 className="text-4xl font-bold mb-12">Tournament Bracket</h1>

            <div className="flex items-center gap-8 md:gap-16">
                {/* Semi Finals Column */}
                <div className="flex flex-col gap-16">
                    <MatchNode match={sf1} getTeamName={getTeamName} title="Semi Final 1" />
                    <MatchNode match={sf2} getTeamName={getTeamName} title="Semi Final 2" />
                </div>

                {/* Connectors */}
                <div className="flex flex-col py-12 h-full justify-center">
                    <div className="h-32 border-r-2 border-lime-500/50 w-8 md:w-16 relative top-[-60px]"></div>
                    <div className="h-32 border-r-2 border-lime-500/50 w-8 md:w-16 relative top-[60px]"></div>
                </div>

                {/* Final Column */}
                <div className="flex flex-col justify-center">
                    <MatchNode match={finalMatch} getTeamName={getTeamName} title="Grand Final" isFinal />
                </div>

                {/* Winner Column if exists */}
                {finalMatch?.winnerId && (
                    <div className="ml-8 animate-in fade-in zoom-in duration-700">
                        <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-1 rounded-full">
                            <div className="bg-neutral-900 p-6 rounded-full flex flex-col items-center gap-2 aspect-square justify-center w-40 h-40">
                                <Trophy className="w-10 h-10 text-yellow-400" />
                                <div className="font-bold text-center text-yellow-400">WINNER</div>
                                <div className="text-xl font-bold text-white text-center leading-tight">{getTeamName(finalMatch.winnerId)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MatchNode({ match, getTeamName, title, isFinal }) {
    if (!match) return (
        <div className="w-64 h-32 bg-white/5 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-neutral-500">
            Awaiting Match
        </div>
    );

    const winnerId = match.winnerId;

    return (
        <div className={`w-64 bg-neutral-900 rounded-xl border ${isFinal ? 'border-lime-500 shadow-lg shadow-lime-500/20' : 'border-white/10'} overflow-hidden relative group`}>
            <div className="bg-white/5 p-2 text-xs text-center font-bold uppercase tracking-wider text-neutral-400 border-b border-white/5">
                {title}
            </div>
            <div className="p-4 space-y-2">
                <TeamRow name={getTeamName(match.teamAId)} score={match.scoreA} isWinner={winnerId === match.teamAId} />
                <TeamRow name={getTeamName(match.teamBId)} score={match.scoreB} isWinner={winnerId === match.teamBId} />
            </div>
            {match.completed && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-lime-500 rounded-full shadow-[0_0_10px_rgba(132,204,22,1)]" />
            )}
        </div>
    )
}

function TeamRow({ name, score, isWinner }) {
    return (
        <div className={`flex justify-between items-center ${isWinner ? 'text-lime-400 font-bold' : 'text-neutral-300'}`}>
            <span className="truncate pr-2">{name}</span>
            <span className={`w-8 h-8 rounded flex items-center justify-center bg-white/5 ${isWinner ? 'bg-lime-500/20' : ''}`}>
                {score ?? '-'}
            </span>
        </div>
    )
}
