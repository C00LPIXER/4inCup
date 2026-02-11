import { useTournament } from '../context/TournamentContext';
import { STAGES, calculateStandings, getSortedStandings } from '../utils/logic';
import { CheckCircle, Clock, Trophy, ArrowRight } from 'lucide-react';

export function Fixtures() {
    const { data, actions } = useTournament();
    
    const groupMatches = data.matches.filter(m => m.stage === STAGES.GROUP).sort((a, b) => {
        if (a.completed !== b.completed) return b.completed ? 1 : -1;
        return a.matchNumber - b.matchNumber;
    });
    
    const semiMatches = data.matches.filter(m => m.stage === STAGES.SEMI_FINAL);
    const finalMatch = data.matches.find(m => m.stage === STAGES.FINAL);
    
    const standings = calculateStandings(data.teams, data.matches);
    const sortedStandings = getSortedStandings(standings);
    const top4Teams = sortedStandings.slice(0, 4);
    
    const allGroupMatchesCompleted = groupMatches.length > 0 && groupMatches.every(m => m.completed);
    const canGenerateSemis = allGroupMatchesCompleted && semiMatches.length === 0 && top4Teams.length >= 4;

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-center">Tournament Bracket</h1>
            
            {canGenerateSemis && (
                <div className="flex justify-center">
                    <button
                        onClick={actions.generateNextStage}
                        className="bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <ArrowRight className="w-5 h-5" /> Generate Semi Finals
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Group Stage Column */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-lime-400 text-center border-b border-lime-500/30 pb-2">
                        Group Stage
                    </h2>
                    <div className="space-y-3">
                        {groupMatches.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 italic">No matches yet</div>
                        ) : (
                            groupMatches.map(match => {
                                const teamA = data.teams.find(t => t.id === match.teamAId);
                                const teamB = data.teams.find(t => t.id === match.teamBId);
                                return <MatchCard key={match.id} match={match} teamA={teamA} teamB={teamB} />;
                            })
                        )}
                    </div>
                    
                    {allGroupMatchesCompleted && top4Teams.length >= 4 && (
                        <div className="mt-6 p-4 bg-lime-900/20 border border-lime-500/30 rounded-lg">
                            <h3 className="font-bold text-lime-400 mb-2 text-center">Top 4 Teams Qualify</h3>
                            <div className="space-y-1 text-sm">
                                {top4Teams.map((team, i) => (
                                    <div key={team.id} className="flex items-center justify-between text-white">
                                        <span className="font-mono">#{i + 1}</span>
                                        <span>{team.player1} & {team.player2}</span>
                                        <span className="text-lime-400 font-bold">{team.points} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Semi Final Column */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-orange-400 text-center border-b border-orange-500/30 pb-2">
                        Semi Finals
                    </h2>
                    <div className="space-y-3">
                        {semiMatches.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 italic">
                                {allGroupMatchesCompleted ? 'Ready to generate' : 'Complete group stage first'}
                            </div>
                        ) : (
                            semiMatches.map(match => {
                                const teamA = data.teams.find(t => t.id === match.teamAId);
                                const teamB = data.teams.find(t => t.id === match.teamBId);
                                return <MatchCard key={match.id} match={match} teamA={teamA} teamB={teamB} />;
                            })
                        )}
                    </div>
                </div>

                {/* Final Column */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-yellow-400 text-center border-b border-yellow-500/30 pb-2 flex items-center justify-center gap-2">
                        <Trophy className="w-6 h-6" /> Final
                    </h2>
                    <div className="space-y-3">
                        {!finalMatch ? (
                            <div className="text-center py-8 text-neutral-500 italic">
                                {semiMatches.every(m => m.completed) && semiMatches.length === 2 ? 'Ready to generate' : 'Complete semi finals first'}
                            </div>
                        ) : (
                            <MatchCard 
                                match={finalMatch} 
                                teamA={data.teams.find(t => t.id === finalMatch.teamAId)} 
                                teamB={data.teams.find(t => t.id === finalMatch.teamBId)} 
                            />
                        )}
                    </div>
                    
                    {finalMatch?.completed && (
                        <div className="mt-6 p-6 bg-yellow-900/20 border-2 border-yellow-500/50 rounded-lg text-center">
                            <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                            <h3 className="font-bold text-2xl text-yellow-400 mb-2">Champions!</h3>
                            <div className="text-xl text-white font-bold">
                                {data.teams.find(t => t.id === finalMatch.winnerId)?.player1} & {data.teams.find(t => t.id === finalMatch.winnerId)?.player2}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MatchCard({ match, teamA, teamB }) {
    const isCompleted = match.completed;
    const cardStyle = isCompleted
        ? "bg-lime-900/20 border-lime-500/50"
        : "bg-neutral-900/50 border-white/5";

    return (
        <div className={`${cardStyle} backdrop-blur border rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden transition-all duration-300`}>
            <div className="flex justify-between text-xs text-neutral-500 font-medium uppercase tracking-wider">
                <span>Match #{match.matchNumber}</span>
                {isCompleted ? (
                    <span className="text-lime-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> FT</span>
                ) : (
                    <span className="text-orange-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled</span>
                )}
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-right">
                    <div className={`font-bold text-sm ${match.winnerId === teamA?.id ? 'text-lime-400' : 'text-white'}`}>
                        {teamA ? `${teamA.player1} & ${teamA.player2}` : 'TBD'}
                    </div>
                </div>

                <div className="px-3 py-1 bg-black/40 rounded text-lg font-mono font-bold text-white tracking-wide min-w-[60px] text-center border border-white/10">
                    {isCompleted ? `${match.scoreA}-${match.scoreB}` : 'vs'}
                </div>

                <div className="flex-1 text-left">
                    <div className={`font-bold text-sm ${match.winnerId === teamB?.id ? 'text-lime-400' : 'text-white'}`}>
                        {teamB ? `${teamB.player1} & ${teamB.player2}` : 'TBD'}
                    </div>
                </div>
            </div>
        </div>
    );
}
