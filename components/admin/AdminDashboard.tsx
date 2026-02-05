import React, { useState } from 'react';
import { LayoutDashboard, Plus, FileText, Database, Shield, LogOut, User } from 'lucide-react';
import CaseList from './CaseList';
import CaseEditor from './CaseEditor';
import { useAuth } from '../../contexts/AuthContext';

type View = 'list' | 'create' | 'edit';

export default function AdminDashboard({ onExit }: { onExit: () => void }) {
    const [view, setView] = useState<View>('list');
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        onExit();
    };

    const handleEdit = (id: string) => {
        setSelectedCaseId(id);
        setView('edit');
    };

    const handleCreate = () => {
        setSelectedCaseId(null);
        setView('create');
    };

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-mono">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-700 p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-8 text-amber-500">
                    <Shield className="w-6 h-6" />
                    <span className="font-bold text-lg">ADMIN PORTS</span>
                </div>

                {user && (
                    <div className="mb-4 p-3 bg-slate-950 rounded border border-slate-800">
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                            <User className="w-3 h-3" />
                            <span>AUTHENTICATED</span>
                        </div>
                        <div className="text-sm text-slate-300 font-mono truncate" title={user.email}>
                            {user.email}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-3 px-4 py-2 rounded transition-colors ${view === 'list' ? 'bg-slate-800 text-amber-500' : 'hover:bg-slate-800/50'}`}
                >
                    <Database className="w-4 h-4" />
                    <span>Case Database</span>
                </button>

                <button
                    onClick={handleCreate}
                    className={`flex items-center gap-3 px-4 py-2 rounded transition-colors ${view === 'create' ? 'bg-slate-800 text-amber-500' : 'hover:bg-slate-800/50'}`}
                >
                    <Plus className="w-4 h-4" />
                    <span>Generate New</span>
                </button>

                <div className="mt-auto">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-amber-500 w-full px-4 py-2 rounded hover:bg-slate-800/50 transition-colors mb-2"
                    >
                        <LogOut className="w-3 h-3" />
                        SIGN OUT
                    </button>
                    <button
                        onClick={onExit}
                        className="text-xs text-slate-500 hover:text-slate-300 w-full text-left px-4"
                    >
                        EXIT TO MAIN MENU
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-slate-950 p-8">
                {view === 'list' && (
                    <CaseList onEdit={handleEdit} />
                )}
                {view === 'create' && (
                    <CaseEditor mode="create" onSave={() => setView('list')} />
                )}
                {view === 'edit' && selectedCaseId && (
                    <CaseEditor mode="edit" caseId={selectedCaseId} onSave={() => setView('list')} />
                )}
            </div>
        </div>
    );
}
