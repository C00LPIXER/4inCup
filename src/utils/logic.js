export const GROUPS = {
    A: 'A',
    B: 'B'
};

export const STAGES = {
    GROUP: 'Group Stage',
    SEMI_FINAL: 'Semi Final',
    FINAL: 'Final'
};

export const createTeam = (player1, player2, group) => ({
    id: crypto.randomUUID(),
    player1,
    player2,
    group,
});

export const generateGroupFixtures = (teams) => {
    // Separate teams by group
    const groupA = teams.filter(t => t.group === GROUPS.A);
    const groupB = teams.filter(t => t.group === GROUPS.B);

    const generate = (groupTeams, groupName) => {
        const fixtures = [];
        for (let i = 0; i < groupTeams.length; i++) {
            for (let j = i + 1; j < groupTeams.length; j++) {
                fixtures.push({
                    id: crypto.randomUUID(),
                    teamAId: groupTeams[i].id,
                    teamBId: groupTeams[j].id,
                    scoreA: 0,
                    scoreB: 0,
                    group: groupName,
                    stage: STAGES.GROUP,
                    matchNumber: fixtures.length + 1, // Will reindex later if needed
                    completed: false,
                    winnerId: null
                });
            }
        }
        return fixtures;
    };

    return [...generate(groupA, GROUPS.A), ...generate(groupB, GROUPS.B)];
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

export const getSortedStandings = (standings, group) => {
    return standings
        .filter(t => t.group === group)
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
            // Tie-breaker? Head-to-head would be better but simple score diff is requested
            return 0;
        });
};

export const generateSemiFinals = (groupAStandings, groupBStandings) => {
    if (groupAStandings.length < 2 || groupBStandings.length < 2) return [];

    const semiFinals = [
        {
            id: crypto.randomUUID(),
            teamAId: groupAStandings[0].id, // A1
            teamBId: groupBStandings[1].id, // B2
            scoreA: 0,
            scoreB: 0,
            group: null,
            stage: STAGES.SEMI_FINAL,
            matchNumber: 'SF1',
            completed: false,
            winnerId: null
        },
        {
            id: crypto.randomUUID(),
            teamAId: groupBStandings[0].id, // B1
            teamBId: groupAStandings[1].id, // A2
            scoreA: 0,
            scoreB: 0,
            group: null,
            stage: STAGES.SEMI_FINAL,
            matchNumber: 'SF2',
            completed: false,
            winnerId: null
        }
    ];
    return semiFinals;
};

export const generateFinal = (sf1, sf2) => {
    if (!sf1?.winnerId || !sf2?.winnerId) return [];

    return [{
        id: crypto.randomUUID(),
        teamAId: sf1.winnerId,
        teamBId: sf2.winnerId,
        scoreA: 0,
        scoreB: 0,
        group: null,
        stage: STAGES.FINAL,
        matchNumber: 'FINAL',
        completed: false,
        winnerId: null
    }];
};

