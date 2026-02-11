import { useState, useEffect, useRef } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { STAGES, calculateStandings, getSortedStandings } from '../utils/logic';
import { CheckCircle, Clock, Trophy, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';

export function Fixtures() {
    const { data, actions } = useTournament();
    const { isAuthenticated } = useAuth();
    
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
    
    const allSemisCompleted = semiMatches.length === 2 && semiMatches.every(m => m.completed);
    const canGenerateFinal = allSemisCompleted && !finalMatch;

    // Auto-generate semi-finals when all group matches are completed
    useEffect(() => {
        if (canGenerateSemis) {
            actions.generateNextStage();
        }
    }, [canGenerateSemis]);

    // Auto-generate final when all semi-finals are completed
    useEffect(() => {
        if (canGenerateFinal) {
            actions.generateNextStage();
        }
    }, [canGenerateFinal]);

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-center">Tournament Bracket</h1>

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
                                return <MatchCard key={match.id} match={match} teamA={teamA} teamB={teamB} isAuthenticated={isAuthenticated} />;
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
                        {(() => {
                            // Always show 2 semi-final slots (for 4-team tournament)
                            const semiCards = [];
                            for (let i = 0; i < 2; i++) {
                                const match = semiMatches[i];
                                if (match) {
                                    const teamA = data.teams.find(t => t.id === match.teamAId);
                                    const teamB = data.teams.find(t => t.id === match.teamBId);
                                    semiCards.push(
                                        <MatchCard key={match.id} match={match} teamA={teamA} teamB={teamB} isAuthenticated={isAuthenticated} />
                                    );
                                } else {
                                    semiCards.push(
                                        <div key={i} className="bg-neutral-900/50 border-white/5 border rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden transition-all duration-300 min-h-[72px] opacity-50">
                                            <div className="flex justify-between text-xs text-neutral-500 font-medium uppercase tracking-wider">
                                                <span>Match #SF{i+1}</span>
                                                <span className="text-orange-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1 text-right">
                                                    <div className="font-bold text-sm text-white">&nbsp;</div>
                                                </div>
                                                <div className="px-3 py-1 bg-black/40 rounded text-lg font-mono font-bold text-white tracking-wide min-w-[60px] text-center border border-white/10">
                                                    vs
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-bold text-sm text-white">&nbsp;</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            }
                            return semiCards;
                        })()}
                    </div>
                </div>

                {/* Final Column */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-yellow-400 text-center border-b border-yellow-500/30 pb-2 flex items-center justify-center gap-2">
                        <Trophy className="w-6 h-6" /> Final
                    </h2>
                    <div className="space-y-3">
                        {finalMatch ? (
                            <MatchCard 
                                key={finalMatch.id} 
                                match={finalMatch} 
                                teamA={data.teams.find(t => t.id === finalMatch.teamAId)} 
                                teamB={data.teams.find(t => t.id === finalMatch.teamBId)}
                                isAuthenticated={isAuthenticated} 
                            />
                        ) : (
                            <div className="bg-neutral-900/50 border-white/5 border rounded-lg p-3 flex flex-col gap-2 relative overflow-hidden transition-all duration-300 min-h-[72px] opacity-50">
                                <div className="flex justify-between text-xs text-neutral-500 font-medium uppercase tracking-wider">
                                    <span>Match #FINAL</span>
                                    <span className="text-yellow-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 text-right">
                                        <div className="font-bold text-sm text-white">&nbsp;</div>
                                    </div>
                                    <div className="px-3 py-1 bg-black/40 rounded text-lg font-mono font-bold text-white tracking-wide min-w-[60px] text-center border border-white/10">
                                        vs
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-sm text-white">&nbsp;</div>
                                    </div>
                                </div>
                            </div>
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

function MatchCard({ match, teamA, teamB, isAuthenticated }) {
    const { actions } = useTournament();
    const isCompleted = match.completed;
    const cardStyle = isCompleted
        ? "bg-lime-900/20 border-lime-500/50"
        : "bg-neutral-900/50 border-white/5";

    // Local state for editing
    const [editing, setEditing] = useState(false);
    const [scoreA, setScoreA] = useState(match.scoreA);
    const [scoreB, setScoreB] = useState(match.scoreB);
    const inputContainerRef = useRef(null);

    // Sync local state with match props when not editing
    useEffect(() => {
        if (!editing) {
            setScoreA(match.scoreA);
            setScoreB(match.scoreB);
        }
    }, [match.scoreA, match.scoreB, editing]);

    // Auto-save on score change with debounce
    useEffect(() => {
        if (!editing) return;
        
        const timeoutId = setTimeout(() => {
            if (scoreA !== match.scoreA || scoreB !== match.scoreB) {
                actions.updateMatchScore(match.id, scoreA, scoreB);
            }
        }, 800);
        
        return () => clearTimeout(timeoutId);
    }, [scoreA, scoreB, editing, match.scoreA, match.scoreB, match.id, actions]);

    // Close editing when clicking outside
    useEffect(() => {
        if (!editing) return;
        
        const handleClickOutside = (e) => {
            // Only close if clicking outside the input container
            if (inputContainerRef.current && !inputContainerRef.current.contains(e.target)) {
                setEditing(false);
            }
        };
        
        // Small delay to prevent immediate closing when opening
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editing]);

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

                {editing ? (
                    <div 
                        ref={inputContainerRef}
                        className="flex items-center gap-2 sm:gap-3"
                    >
                        {/* Team A Score with Arrow Buttons */}
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={scoreA}
                                onChange={e => setScoreA(Number(e.target.value))}
                                autoFocus
                                className="w-16 sm:w-24 h-12 sm:h-16 text-2xl sm:text-4xl text-center font-bold rounded bg-black/60 border-2 border-lime-400 text-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
                            />
                            <div className="flex flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={() => setScoreA(Math.max(0, scoreA + 1))}
                                    className="p-1 bg-lime-500/20 hover:bg-lime-500/40 border border-lime-400/50 rounded transition-colors"
                                    aria-label="Increase Team A score"
                                >
                                    <ChevronUp className="w-4 h-4 text-lime-400" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                                    className="p-1 bg-lime-500/20 hover:bg-lime-500/40 border border-lime-400/50 rounded transition-colors"
                                    aria-label="Decrease Team A score"
                                >
                                    <ChevronDown className="w-4 h-4 text-lime-400" />
                                </button>
                            </div>
                        </div>
                        
                        <span className="text-2xl sm:text-3xl font-bold text-white">-</span>
                        
                        {/* Team B Score with Arrow Buttons */}
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={scoreB}
                                onChange={e => setScoreB(Number(e.target.value))}
                                className="w-16 sm:w-24 h-12 sm:h-16 text-2xl sm:text-4xl text-center font-bold rounded bg-black/60 border-2 border-lime-400 text-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
                            />
                            <div className="flex flex-col gap-1">
                                <button
                                    type="button"
                                    onClick={() => setScoreB(Math.max(0, scoreB + 1))}
                                    className="p-1 bg-lime-500/20 hover:bg-lime-500/40 border border-lime-400/50 rounded transition-colors"
                                    aria-label="Increase Team B score"
                                >
                                    <ChevronUp className="w-4 h-4 text-lime-400" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                                    className="p-1 bg-lime-500/20 hover:bg-lime-500/40 border border-lime-400/50 rounded transition-colors"
                                    aria-label="Decrease Team B score"
                                >
                                    <ChevronDown className="w-4 h-4 text-lime-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`px-3 py-1 bg-black/40 rounded text-lg font-mono font-bold text-white tracking-wide min-w-[60px] text-center border border-white/10 ${isAuthenticated ? 'cursor-pointer hover:bg-black/60' : 'cursor-default'}`}
                        onClick={(e) => {
                            if (isAuthenticated) setEditing(true);
                        }}
                        title={isAuthenticated ? "Click to edit score" : "Login to edit scores"}
                    >
                        {isCompleted ? `${match.scoreA}-${match.scoreB}` : 'vs'}
                    </div>
                )}

                <div className="flex-1 text-left">
                    <div className={`font-bold text-sm ${match.winnerId === teamB?.id ? 'text-lime-400' : 'text-white'}`}>
                        {teamB ? `${teamB.player1} & ${teamB.player2}` : 'TBD'}
                    </div>
                </div>
            </div>
        </div>
    );
}
