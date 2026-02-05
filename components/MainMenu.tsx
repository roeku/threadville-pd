import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CaseFile } from '../types';
import { Play, Loader2, FolderOpen, Shield } from 'lucide-react';
import { VIRAL_TOXICITY } from '@/src/data/ViralToxicity';
import { useAuth } from '../contexts/AuthContext';
import AdminLogin from './admin/AdminLogin';

interface MainMenuProps {
    onStartCase: (caseData: CaseFile) => void;
    onOpenAdmin: () => void;
}

export default function MainMenu({ onStartCase, onOpenAdmin }: MainMenuProps) {
    const [cases, setCases] = useState<{ id: string, title: string, isLocal: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const { isAdmin, loading: authLoading } = useAuth();

    // If user is already admin, open admin panel directly
    useEffect(() => {
        if (!authLoading && isAdmin && showAdminLogin) {
            setShowAdminLogin(false);
            onOpenAdmin();
        }
    }, [isAdmin, authLoading, showAdminLogin, onOpenAdmin]);

    useEffect(() => {
        const fetchCases = async () => {
            // START LOCAL DATA INJECTION
            const localCases = [
                { id: VIRAL_TOXICITY.caseId, title: VIRAL_TOXICITY.title, isLocal: true },
            ];
            // END LOCAL DATA INJECTION

            // Fetch only titles from published cases
            const { data, error } = await supabase
                .from('cases')
                .select('id, title')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (data && Array.isArray(data)) {
                setCases([...localCases, ...data.map(d => ({ ...d, isLocal: false }))]);
            } else {
                setCases(localCases);
            }
            setLoading(false);
        };

        fetchCases();
    }, []);

    const handleCaseSelect = async (caseItem: { id: string, title: string, isLocal: boolean }) => {
        if (caseItem.isLocal) {
            // Use local case data directly
            const localCase = VIRAL_TOXICITY;
            onStartCase(localCase);
        } else {
            // Fetch full case data for database cases
            const { data, error } = await supabase
                .from('cases')
                .select('*')
                .eq('id', caseItem.id)
                .single();

            if (error) {
                console.error('Error fetching case:', error);
                return;
            }

            if (data) {
                // The case data is stored in the 'content' field
                const caseFile: CaseFile = data.content as CaseFile;
                onStartCase(caseFile);
            }
        }
    };

    const handleAdminClick = () => {
        if (isAdmin) {
            onOpenAdmin();
        } else {
            setShowAdminLogin(true);
        }
    };

    if (showAdminLogin) {
        return <AdminLogin onCancel={() => setShowAdminLogin(false)} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-amber-500 font-serif">
                        THREADVILLE PD
                    </h1>
                    <p className="text-slate-400 font-mono uppercase tracking-widest text-sm">
                        Detectives Dep. • {new Date().getFullYear()}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200">
                        <FolderOpen className="w-5 h-5 text-amber-600" />
                        <span>Active Case Files</span>
                    </h2>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-amber-500">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span>Retrieving Archive...</span>
                            </div>
                        ) : cases.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded bg-slate-950/50">
                                <p>No cases available in the archive.</p>
                                <p className="text-xs mt-2">Please check database connection.</p>
                            </div>
                        ) : (
                            cases.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleCaseSelect(c)}
                                    className="w-full text-left p-4 rounded bg-slate-950 border border-slate-800 hover:border-amber-500 hover:bg-slate-900 transition-all group relative overflow-hidden"
                                >
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-200 group-hover:text-amber-500 transition-colors">
                                                {c.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 font-mono mt-1">
                                                CASE ID: {c.id || 'UNK'}
                                            </p>
                                        </div>
                                        <Play className="w-5 h-5 text-slate-700 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex justify-center pt-8">
                    <button
                        onClick={handleAdminClick}
                        className="text-xs text-slate-700 hover:text-slate-500 flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
                    >
                        <Shield className="w-3 h-3" />
                        Admin Access
                    </button>
                </div>
            </div>
        </div>
    );
}
