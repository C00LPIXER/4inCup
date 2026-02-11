export const STAGES = {
    GROUP: 'Group Stage',
    SEMI_FINAL: 'Semi Final',
    FINAL: 'Final'
};

export const createTeam = (player1, player2) => ({
    id: crypto.randomUUID(),
    player1,
    player2,
});

export const generateGroupFixtures = (teams) => {
    const fixtures = [];
    let matchNum = 1;
    
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            fixtures.push({
                id: crypto.randomUUID(),
                teamAId: teams[i].id,
                teamBId: teams[j].id,
                scoreA: 0,
                scoreB: 0,
                stage: STAGES.GROUP,
                matchNumber: matchNum++,
                completed: false,
                winnerId: null
            });
        }
    }
    
    return fixtures;
};


export const calculateStandings = (teams, matches) => {
    // Initialize stats
    const stats = teams.reduce((acc, team) => {
        acc[team.id] = {
            ...team,
            played: 0,
            won: 0,
            lost: 0,
            points: 0,
            scoreDiff: 0, // Points scored - Points conceded
        };
        return acc;
    }, {});

    // Process completed group matches
    matches.filter(m => m.stage === STAGES.GROUP && m.completed).forEach(match => {
        const teamA = stats[match.teamAId];
        const teamB = stats[match.teamBId];

        if (!teamA || !teamB) return;

        teamA.played += 1;
        teamB.played += 1;

        teamA.scoreDiff += (match.scoreA - match.scoreB);
        teamB.scoreDiff += (match.scoreB - match.scoreA);

        if (match.scoreA > match.scoreB) {
            teamA.won += 1;
            teamA.points += 2; // Assuming 2 points for a win
            teamB.lost += 1;
        } else {
            teamB.won += 1;
            teamB.points += 2;
            teamA.lost += 1;
        }
    });

    return Object.values(stats);
};

export const getSortedStandings = (standings) => {
    return standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
        return 0;
    });
};

export const generateSemiFinals = (standings) => {
    // Always generate 4 skeleton semi-final matches
    if (standings.length < 4) {
        return [
            {
                id: crypto.randomUUID(),
                teamAId: null,
                teamBId: null,
                scoreA: 0,
                scoreB: 0,
                stage: STAGES.SEMI_FINAL,
                matchNumber: 'SF1',
                completed: false,
                winnerId: null
            },
            {
                id: crypto.randomUUID(),
                teamAId: null,
                teamBId: null,
                scoreA: 0,
                scoreB: 0,
                stage: STAGES.SEMI_FINAL,
                matchNumber: 'SF2',
                completed: false,
                winnerId: null
            },
            {
                id: crypto.randomUUID(),
                teamAId: null,
                teamBId: null,
                scoreA: 0,
                scoreB: 0,
                stage: STAGES.SEMI_FINAL,
                matchNumber: 'SF3',
                completed: false,
                winnerId: null
            },
            {
                id: crypto.randomUUID(),
                teamAId: null,
                teamBId: null,
                scoreA: 0,
                scoreB: 0,
                stage: STAGES.SEMI_FINAL,
                matchNumber: 'SF4',
                completed: false,
                winnerId: null
            }
        ];
    }

    const semiFinals = [
        {
            id: crypto.randomUUID(),
            teamAId: standings[0].id, // 1st place
            teamBId: standings[3].id, // 4th place
            scoreA: 0,
            scoreB: 0,
            stage: STAGES.SEMI_FINAL,
            matchNumber: 'SF1',
            completed: false,
            winnerId: null
        },
        {
            id: crypto.randomUUID(),
            teamAId: standings[1].id, // 2nd place
            teamBId: standings[2].id, // 3rd place
            scoreA: 0,
            scoreB: 0,
            stage: STAGES.SEMI_FINAL,
            matchNumber: 'SF2',
            completed: false,
            winnerId: null
        },
        {
            id: crypto.randomUUID(),
            teamAId: null,
            teamBId: null,
            scoreA: 0,
            scoreB: 0,
            stage: STAGES.SEMI_FINAL,
            matchNumber: 'SF3',
            completed: false,
            winnerId: null
        },
        {
            id: crypto.randomUUID(),
            teamAId: null,
            teamBId: null,
            scoreA: 0,
            scoreB: 0,
            stage: STAGES.SEMI_FINAL,
            matchNumber: 'SF4',
            completed: false,
            winnerId: null
        }
    ];
    return semiFinals;
};

export const generateFinal = (sf1, sf2) => {
    // Always generate 2 skeleton final matches
    if (!sf1?.winnerId || !sf2?.winnerId) {
        return [
            {
                id: crypto.randomUUID(),
                teamAId: null,
                teamBId: null,
                scoreA: 0,
                scoreB: 0,
                stage: STAGES.FINAL,
                matchNumber: 'FINAL1',
                completed: false,
                winnerId: null
            },
            {
                id: crypto.randomUUID(),
                teamAId: null,
                teamBId: null,
                scoreA: 0,
                scoreB: 0,
                stage: STAGES.FINAL,
                matchNumber: 'FINAL2',
                completed: false,
                winnerId: null
            }
        ];
    }

    return [
        {
            id: crypto.randomUUID(),
            teamAId: sf1.winnerId,
            teamBId: sf2.winnerId,
            scoreA: 0,
            scoreB: 0,
            stage: STAGES.FINAL,
            matchNumber: 'FINAL1',
            completed: false,
            winnerId: null
        },
        {
            id: crypto.randomUUID(),
            teamAId: null,
            teamBId: null,
            scoreA: 0,
            scoreB: 0,
            stage: STAGES.FINAL,
            matchNumber: 'FINAL2',
            completed: false,
            winnerId: null
        }
    ];
};

