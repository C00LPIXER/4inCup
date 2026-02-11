import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { STAGES, createTeam, generateGroupFixtures, calculateStandings, getSortedStandings, generateSemiFinals, generateFinal } from '../utils/logic';
import { enabled as firebaseEnabled, getTournament, subscribeTournament, saveTournament } from '../firebase';

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
    // State - starts empty, loads from Firebase
    const [data, setData] = useState({ teams: [], matches: [], stage: STAGES.GROUP });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Flag to avoid write loops when updates come from Firestore snapshot
    const isRemoteUpdate = useRef(false);
    const isInitialized = useRef(false);

    // Load data from Firebase on mount
    useEffect(() => {
        if (!firebaseEnabled) {
            setError('Firebase not configured. Please check your .env file.');
            setLoading(false);
            return;
        }

        let unsub;
        (async () => {
            try {
                // Initial load
                const remote = await getTournament();
                if (remote) {
                    isRemoteUpdate.current = true;
                    setData(remote);
                    isInitialized.current = true;
                }
                setLoading(false);

                // Subscribe to real-time updates
                unsub = subscribeTournament((remoteData) => {
                    if (remoteData) {
                        isRemoteUpdate.current = true;
                        setData(remoteData);
                        isInitialized.current = true;
                    }
                });
            } catch (err) {
                console.error('Firebase load error', err);
                setError(`Failed to load data: ${err.message}`);
                setLoading(false);
            }
        })();

        return () => {
            if (unsub) unsub();
        };
    }, []);

    // Persist all changes to Firebase only
    useEffect(() => {
        if (!firebaseEnabled || !isInitialized.current) return;

        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }

        saveTournament(data).catch(err => {
            console.error('Failed to save to Firebase:', err);
            setError(`Save failed: ${err.message}`);
        });
    }, [data]);

    const actions = {
        addTeam: (p1, p2) => {
            const newTeam = createTeam(p1, p2);
            setData(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
        },

        updateTeam: (id, updates) => {
            setData(prev => ({
                ...prev,
                teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t)
            }));
        },

        deleteTeam: (id) => {
            setData(prev => ({
                ...prev,
                teams: prev.teams.filter(t => t.id !== id)
            }));
        },

        resetTournament: () => {
            if (confirm('Are you sure you want to reset everything?')) {
                const emptyData = { teams: [], matches: [], stage: STAGES.GROUP };
                setData(emptyData);
            }
        },

        startTournament: () => {
            if (data.teams.length < 4) {
                alert("Need at least 4 teams to start.");
                return;
            }
            const fixtures = generateGroupFixtures(data.teams);
            setData(prev => ({ ...prev, matches: fixtures }));
        },

        updateMatch: (matchId, scoreA, scoreB) => {
            setData(prev => {
                const updatedMatches = prev.matches.map(m => {
                    if (m.id === matchId) {
                        return {
                            ...m,
                            scoreA: parseInt(scoreA) || 0,
                            scoreB: parseInt(scoreB) || 0,
                            completed: true,
                            winnerId: (parseInt(scoreA) > parseInt(scoreB)) ? m.teamAId : m.teamBId
                        };
                    }
                    return m;
                });

                return { ...prev, matches: updatedMatches };
            });
        },

        resetMatchScore: (matchId) => {
            setData(prev => {
                const updatedMatches = prev.matches.map(m => {
                    if (m.id === matchId) {
                        return {
                            ...m,
                            scoreA: 0,
                            scoreB: 0,
                            completed: false,
                            winnerId: null
                        };
                    }
                    return m;
                });
                return { ...prev, matches: updatedMatches };
            });
        },

        resetAllScores: () => {
            if (confirm('Are you sure you want to RESET ALL SCORES? This cannot be undone.')) {
                setData(prev => ({
                    ...prev,
                    matches: prev.matches.map(m => ({
                        ...m,
                        scoreA: 0,
                        scoreB: 0,
                        completed: false,
                        winnerId: null
                    }))
                }));
            }
        },

        updateMatchTeams: (matchId, teamAId, teamBId) => {
            setData(prev => ({
                ...prev,
                matches: prev.matches.map(m =>
                    m.id === matchId ? { ...m, teamAId, teamBId, winnerId: null, completed: false, scoreA: 0, scoreB: 0 } : m
                )
            }));
        },

        generateNextStage: () => {
            // Calculate current standings
            const standings = calculateStandings(data.teams, data.matches);
            const sortedStandings = getSortedStandings(standings);

            let newMatches = [...data.matches];
            let nextStage = data.stage;

            // Logic to generate Semis
            // Only generate if we are in Group stage and Semis don't exist yet
            const hasSemis = newMatches.some(m => m.stage === STAGES.SEMI_FINAL);
            if (!hasSemis) {
                const semis = generateSemiFinals(sortedStandings);
                if (semis.length > 0) {
                    newMatches = [...newMatches, ...semis];
                    nextStage = STAGES.SEMI_FINAL;
                }
            }

            // Logic to generate Final
            // Only generate if we have Semis and Final doesn't exist
            const sfMatches = newMatches.filter(m => m.stage === STAGES.SEMI_FINAL);
            const hasFinal = newMatches.some(m => m.stage === STAGES.FINAL);

            if (!hasFinal && sfMatches.length === 2 && sfMatches.every(m => m.completed)) {
                const sf1 = sfMatches.find(m => m.matchNumber === 'SF1');
                const sf2 = sfMatches.find(m => m.matchNumber === 'SF2');
                const finalMatch = generateFinal(sf1, sf2);
                if (finalMatch.length > 0) {
                    newMatches = [...newMatches, ...finalMatch];
                    nextStage = STAGES.FINAL;
                }
            }

            setData(prev => ({ ...prev, matches: newMatches, stage: nextStage }));
        },
        updateMatchScore: (matchId, scoreA, scoreB) => {
            setData(prev => ({
                ...prev,
                matches: prev.matches.map(m =>
                    m.id === matchId
                        ? { ...m, scoreA, scoreB, completed: true }
                        : m
                ),
            }));
        }
    };

    const derived = {
        standings: calculateStandings(data.teams, data.matches)
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
                    <p className="text-lg">Loading tournament data...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
                <div className="text-center max-w-md p-8 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
                    <p className="text-neutral-300 mb-4">{error}</p>
                    <p className="text-sm text-neutral-400">
                        Please check your Firebase configuration and ensure rules are set correctly.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <TournamentContext.Provider value={{ data, actions, derived }}>
            {children}
        </TournamentContext.Provider>
    );
}

export function useTournament() {
    return useContext(TournamentContext);
}
