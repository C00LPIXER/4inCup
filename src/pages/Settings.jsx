import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { STAGES } from '../utils/logic';
import { Plus, Save, Play, RefreshCw, Trash2, ArrowRight, Lock, LogOut, Key } from 'lucide-react';

export function Settings() {
    const { isAuthenticated, logout } = useAuth();

    if (!isAuthenticated) {
        return <LoginForm />;
    }

    return <SettingsDashboard logout={logout} />;
}

function LoginForm() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);
        setLoading(false);

        if (!result.success) {
            setError(result.error || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="bg-neutral-900 border border-white/10 p-8 rounded-xl shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <div className="bg-lime-500/10 p-4 rounded-full">
                            <Lock className="w-8 h-8 text-lime-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">Settings Access</h2>
                    <p className="text-neutral-400 text-center text-sm mb-6">
                        Enter your credentials to access tournament settings
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-lime-500 outline-none transition-colors"
                                placeholder="Enter username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-lime-500 outline-none transition-colors"
                                placeholder="Enter password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Authenticating...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

function SettingsDashboard({ logout }) {
    const { data, actions } = useTournament();
    const [activeTab, setActiveTab] = useState('TEAMS');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    Settings Dashboard
                </h1>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>

            <div className="flex gap-2 border-b border-white/10 pb-1">
                <TabButton active={activeTab === 'TEAMS'} onClick={() => setActiveTab('TEAMS')} label="Manage Teams" />
                <TabButton active={activeTab === 'MATCHES'} onClick={() => setActiveTab('MATCHES')} label="Update Scores" />
                <TabButton active={activeTab === 'TOURNAMENT'} onClick={() => setActiveTab('TOURNAMENT')} label="Tournament" />
                <TabButton active={activeTab === 'SECURITY'} onClick={() => setActiveTab('SECURITY')} label="Security" />
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'TEAMS' && <TeamsPanel data={data} actions={actions} />}
                {activeTab === 'MATCHES' && <MatchesPanel data={data} actions={actions} />}
                {activeTab === 'TOURNAMENT' && <TournamentPanel data={data} actions={actions} />}
                {activeTab === 'SECURITY' && <SecurityPanel />}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 
                ${active ? 'border-lime-500 text-lime-400' : 'border-transparent text-neutral-400 hover:text-white'}`}
        >
            {label}
        </button>
    )
}

function TeamsPanel({ data, actions }) {
    const [form, setForm] = useState({ p1: '', p2: '' });
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            actions.updateTeam(editingId, {
                player1: form.p1,
                player2: form.p2
            });
            setEditingId(null);
        } else {
            actions.addTeam(form.p1, form.p2);
        }
        setForm({ p1: '', p2: '' });
    };

    const handleEdit = (team) => {
        setForm({
            p1: team.player1,
            p2: team.player2
        });
        setEditingId(team.id);
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({ p1: '', p2: '' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {editingId ? <RefreshCw className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingId ? 'Edit Team' : 'Add New Team'}
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Player 1</label>
                        <input
                            required
                            type="text"
                            value={form.p1}
                            onChange={e => setForm({ ...form, p1: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white focus:border-lime-500 outline-none"
                            placeholder="Name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Player 2</label>
                        <input
                            required
                            type="text"
                            value={form.p2}
                            onChange={e => setForm({ ...form, p2: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white focus:border-lime-500 outline-none"
                            placeholder="Name"
                        />
                    </div>
                    <div className="flex items-end gap-2 text-right justify-end md:col-span-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className={`font-bold py-2 px-6 rounded-md transition-colors
                                ${editingId ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-lime-500 hover:bg-lime-400 text-black'}`}
                        >
                            {editingId ? 'Update Team' : 'Add Team'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold">Current Teams ({data.teams.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.teams.map(team => (
                        <div key={team.id} className={`bg-white/5 p-4 rounded-lg flex justify-between items-center group
                            ${editingId === team.id ? 'border border-yellow-500/50 bg-yellow-500/10' : ''}`}>
                            <div>
                                <div className="font-bold">{team.player1} & {team.player2}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleEdit(team)} className="text-neutral-400 hover:text-yellow-400 transition-colors" title="Edit">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button onClick={() => actions.deleteTeam(team.id)} className="text-neutral-600 hover:text-red-500 transition-colors" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}


function MatchesPanel({ data, actions }) {
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'played', 'notPlayed'
    const [showAddMatch, setShowAddMatch] = useState(false);
    const [newMatch, setNewMatch] = useState({
        teamAId: '',
        teamBId: '',
        matchNumber: '',
        stage: STAGES.GROUP
    });

    if (data.matches.length === 0) {
        return (
            <div className="text-center py-12 space-y-4">
                <p className="text-neutral-500">Matches have not been generated yet.</p>
                <button
                    onClick={actions.startTournament}
                    disabled={data.teams.length < 4}
                    className={`py-3 px-8 rounded-lg font-bold flex items-center justify-center gap-2 mx-auto transition-colors
                        ${data.teams.length < 4 
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                            : 'bg-lime-500 hover:bg-lime-400 text-black'}`}
                >
                    <Play className="w-5 h-5" /> Generate Matches & Start Tournament
                </button>
                {data.teams.length < 4 && (
                    <p className="text-red-400 text-sm">Need at least 4 teams to start the tournament</p>
                )}
            </div>
        )
    }

    const filteredMatches = data.matches.filter(match => {
        if (filterStatus === 'played') return match.completed;
        if (filterStatus === 'notPlayed') return !match.completed;
        return true;
    });

    const handleAddMatch = () => {
        if (!newMatch.teamAId || !newMatch.teamBId || !newMatch.matchNumber) {
            alert('Please fill in all fields');
            return;
        }
        if (newMatch.teamAId === newMatch.teamBId) {
            alert('Teams must be different');
            return;
        }
        
        const match = {
            id: crypto.randomUUID(),
            teamAId: newMatch.teamAId,
            teamBId: newMatch.teamBId,
            scoreA: 0,
            scoreB: 0,
            stage: newMatch.stage,
            matchNumber: newMatch.matchNumber,
            completed: false,
            winnerId: null
        };
        
        actions.addMatch(match);
        
        setNewMatch({ teamAId: '', teamBId: '', matchNumber: '', stage: STAGES.GROUP });
        setShowAddMatch(false);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filterStatus === 'all' 
                                ? 'bg-lime-500 text-black' 
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                        }`}
                    >
                        All ({data.matches.length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('played')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filterStatus === 'played' 
                                ? 'bg-green-500 text-black' 
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                        }`}
                    >
                        Played ({data.matches.filter(m => m.completed).length})
                    </button>
                    <button
                        onClick={() => setFilterStatus('notPlayed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filterStatus === 'notPlayed' 
                                ? 'bg-red-500 text-black' 
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                        }`}
                    >
                        Not Played ({data.matches.filter(m => !m.completed).length})
                    </button>
                </div>
                
                <button
                    onClick={() => setShowAddMatch(!showAddMatch)}
                    className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Match
                </button>
            </div>

            {showAddMatch && (
                <div className="bg-neutral-900 border border-lime-500/50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-bold mb-4 text-lime-400">Create New Match</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Team A</label>
                            <select
                                value={newMatch.teamAId}
                                onChange={e => setNewMatch({...newMatch, teamAId: e.target.value})}
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            >
                                <option value="">Select Team</option>
                                {data.teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.player1} & {t.player2}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Team B</label>
                            <select
                                value={newMatch.teamBId}
                                onChange={e => setNewMatch({...newMatch, teamBId: e.target.value})}
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            >
                                <option value="">Select Team</option>
                                {data.teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.player1} & {t.player2}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Match Number</label>
                            <input
                                type="text"
                                value={newMatch.matchNumber}
                                onChange={e => setNewMatch({...newMatch, matchNumber: e.target.value})}
                                placeholder="e.g., 1 or SF1"
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-400 mb-1">Stage</label>
                            <select
                                value={newMatch.stage}
                                onChange={e => setNewMatch({...newMatch, stage: e.target.value})}
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            >
                                <option value={STAGES.GROUP}>Group Stage</option>
                                <option value={STAGES.SEMI_FINAL}>Semi Final</option>
                                <option value={STAGES.FINAL}>Final</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleAddMatch}
                            className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded transition-colors"
                        >
                            Create Match
                        </button>
                        <button
                            onClick={() => setShowAddMatch(false)}
                            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            
            {filteredMatches.map(match => (
                <ScoreEditor
                    key={match.id}
                    match={match}
                    teams={data.teams}
                    onUpdate={actions.updateMatch}
                    onUpdateTeams={actions.updateMatchTeams}
                    onReset={actions.resetMatchScore}
                />
            ))}
        </div>
    )
}

function ScoreEditor({ match, teams, onUpdate, onUpdateTeams, onReset }) {
    const teamA = teams.find(t => t.id === match.teamAId);
    const teamB = teams.find(t => t.id === match.teamBId);
    const [sA, setSA] = useState(match.scoreA);
    const [sB, setSB] = useState(match.scoreB);
    const [isEditingTeams, setIsEditingTeams] = useState(false);
    const [editTeamA, setEditTeamA] = useState(match.teamAId);
    const [editTeamB, setEditTeamB] = useState(match.teamBId);

    const handleSaveScore = () => {
        onUpdate(match.id, sA, sB);
    };

    const handleSaveTeams = () => {
        onUpdateTeams(match.id, editTeamA, editTeamB);
        setIsEditingTeams(false);
    };

    return (
        <div className={`p-4 rounded-lg flex flex-col md:flex-row items-center gap-4 justify-between border-2 ${
            match.completed 
                ? 'bg-green-900/20 border-green-500/50' 
                : 'bg-red-900/20 border-red-500/50'
        }`}>
            <div className="flex-1 w-full flex justify-between md:justify-start items-center gap-4">
                <div className="text-xs font-mono text-neutral-500 w-16 text-center shrink-0" onClick={() => setIsEditingTeams(!isEditingTeams)} title="Click to edit teams">
                    {match.matchNumber}
                </div>

                {isEditingTeams ? (
                    <select
                        value={editTeamA}
                        onChange={e => setEditTeamA(e.target.value)}
                        className="bg-black text-white p-1 rounded text-sm w-full max-w-[150px]"
                    >
                        {teams.map(t => <option key={t.id} value={t.id}>{t.player1} & {t.player2}</option>)}
                    </select>
                ) : (
                    <div className="text-right flex-1 md:flex-none font-medium w-32 truncate" title={teamA ? `${teamA.player1} & ${teamA.player2}` : 'TBD'}>
                        {teamA ? `${teamA.player1} & ${teamA.player2}` : 'TBD'}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={sA}
                    onChange={e => setSA(e.target.value)}
                    className="w-12 h-10 bg-black/50 border border-white/10 rounded text-center text-lg font-bold outline-none focus:border-lime-500"
                />
                <span className="text-neutral-500">-</span>
                <input
                    type="number"
                    value={sB}
                    onChange={e => setSB(e.target.value)}
                    className="w-12 h-10 bg-black/50 border border-white/10 rounded text-center text-lg font-bold outline-none focus:border-lime-500"
                />
            </div>

            <div className="flex-1 w-full flex justify-between md:justify-end items-center gap-4">
                {isEditingTeams ? (
                    <div className="flex items-center gap-2">
                        <select
                            value={editTeamB}
                            onChange={e => setEditTeamB(e.target.value)}
                            className="bg-black text-white p-1 rounded text-sm w-full max-w-[150px]"
                        >
                            {teams.map(t => <option key={t.id} value={t.id}>{t.player1} & {t.player2}</option>)}
                        </select>
                        <button onClick={handleSaveTeams} className="text-green-500 hover:text-green-400 p-1"><Save size={16} /></button>
                        <button onClick={() => setIsEditingTeams(false)} className="text-red-500 hover:text-red-400 p-1">X</button>
                    </div>
                ) : (
                    <div className="text-left flex-1 md:flex-none font-medium w-32 truncate" title={teamB ? `${teamB.player1} & ${teamB.player2}` : 'TBD'}>
                        {teamB ? `${teamB.player1} & ${teamB.player2}` : 'TBD'}
                    </div>
                )}

                {!isEditingTeams && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setSA(0);
                                setSB(0);
                                onReset(match.id);
                            }}
                            className="bg-white/5 hover:bg-neutral-500 hover:text-white text-neutral-400 p-2 rounded-md transition-colors"
                            title="Reset Score"
                        >
                            <span className="font-mono text-xs">0-0</span>
                        </button>
                        <button
                            onClick={() => setIsEditingTeams(true)}
                            className="bg-white/5 hover:bg-yellow-500 hover:text-black text-white p-2 rounded-md transition-colors"
                            title="Edit Match Teams"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSaveScore}
                            className="bg-white/10 hover:bg-lime-500 hover:text-black text-white p-2 rounded-md transition-colors"
                            title="Save Score"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function TournamentPanel({ data, actions }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold mb-4">Tournament Actions</h3>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={actions.startTournament}
                        disabled={data.matches.length > 0}
                        className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 text-lg
                            ${data.matches.length > 0 ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-lime-500 hover:bg-lime-400 text-black'}`}
                    >
                        <Play className="w-5 h-5" /> Generate Fixtures & Start
                    </button>

                    <button
                        onClick={actions.generateNextStage}
                        className="w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 text-lg bg-orange-500 hover:bg-orange-400 text-black"
                    >
                        <ArrowRight className="w-5 h-5" /> Force Generate Next Stage (Semi/Final)
                    </button>

                    <button
                        onClick={actions.resetAllScores}
                        className="w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 text-lg bg-orange-600 hover:bg-orange-500 text-white"
                    >
                        <RefreshCw className="w-5 h-5" /> Reset ONLY Scores (Keep Teams)
                    </button>

                    <p className="text-xs text-neutral-500 text-center">
                        Note: Next stages are usually auto-generated when enough matches complete. Use "Force Generate" if needed.
                    </p>
                </div>
            </div>

            <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20">
                <h3 className="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>
                <button
                    onClick={actions.resetTournament}
                    className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Reset Tournament Data
                </button>
            </div>
        </div>
    )
}

function SecurityPanel() {
    const { changePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const result = await changePassword(currentPassword, newPassword);
            if (result.success) {
                setSuccess('Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(result.error || 'Failed to change password');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold mb-4">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm">
                            {success}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-2">Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-lime-500 text-white"
                            placeholder="Enter current password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-lime-500 text-white"
                            placeholder="Enter new password (min 6 characters)"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-lime-500 text-white"
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Lock className="w-5 h-5" /> Change Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
