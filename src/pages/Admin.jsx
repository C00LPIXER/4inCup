import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { GROUPS, STAGES } from '../utils/logic';
import { Plus, Save, Play, RefreshCw, Trash2, ArrowRight } from 'lucide-react';

export function Admin() {
    const { data, actions } = useTournament();
    const [activeTab, setActiveTab] = useState('TEAMS'); // TEAMS, MATCHES, SETTINGS

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                Admin Dashboard
            </h1>

            <div className="flex gap-2 border-b border-white/10 pb-1">
                <TabButton active={activeTab === 'TEAMS'} onClick={() => setActiveTab('TEAMS')} label="Manage Teams" />
                <TabButton active={activeTab === 'MATCHES'} onClick={() => setActiveTab('MATCHES')} label="Update Scores" />
                <TabButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} label="Settings" />
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'TEAMS' && <TeamsPanel data={data} actions={actions} />}
                {activeTab === 'MATCHES' && <MatchesPanel data={data} actions={actions} />}
                {activeTab === 'SETTINGS' && <SettingsPanel data={data} actions={actions} />}
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
    const [form, setForm] = useState({ name: '', p1: '', p2: '', group: 'A' });
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            actions.updateTeam(editingId, {
                name: form.name,
                player1: form.p1,
                player2: form.p2,
                group: form.group
            });
            setEditingId(null);
        } else {
            actions.addTeam(form.name, form.p1, form.p2, form.group);
        }
        setForm({ name: '', p1: '', p2: '', group: 'A' });
    };

    const handleEdit = (team) => {
        setForm({
            name: team.name,
            p1: team.player1,
            p2: team.player2,
            group: team.group
        });
        setEditingId(team.id);
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({ name: '', p1: '', p2: '', group: 'A' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {editingId ? <RefreshCw className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingId ? 'Edit Team' : 'Add New Team'}
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Team Name</label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white focus:border-lime-500 outline-none"
                            placeholder="e.g. Thunder Smashers"
                        />
                    </div>
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
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">Group</label>
                        <select
                            value={form.group}
                            onChange={e => setForm({ ...form, group: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-white focus:border-lime-500 outline-none"
                        >
                            <option value="A">Group A</option>
                            <option value="B">Group B</option>
                        </select>
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
                                <div className="font-bold">{team.name}</div>
                                <div className="text-xs text-neutral-400">{team.player1} & {team.player2}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${team.group === 'A' ? 'bg-lime-500/20 text-lime-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    Group {team.group}
                                </span>
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
    if (data.matches.length === 0) {
        return (
            <div className="text-center py-12 text-neutral-500">
                Matches have not been generated yet. Go to Settings to start the tournament.
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {data.matches.map(match => (
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
        <div className="bg-white/5 p-4 rounded-lg flex flex-col md:flex-row items-center gap-4 justify-between border border-white/5">
            <div className="flex-1 w-full flex justify-between md:justify-start items-center gap-4">
                <div className="text-xs font-mono text-neutral-500 w-16 text-center shrink-0" onClick={() => setIsEditingTeams(!isEditingTeams)} title="Click to edit teams">
                    {match.group ? `GRP ${match.group}` : match.matchNumber}
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

function SettingsPanel({ data, actions }) {
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
