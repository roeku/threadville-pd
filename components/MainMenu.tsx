import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getResolvedCases, getCaseStats } from '../services/gameProgressService';
import { CaseFile } from '../types';
import { Play, Loader2, FolderOpen, Shield, BookOpen, Volume2, VolumeX, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAudioContext } from '../contexts/AudioContext';
import AdminLogin from './admin/AdminLogin';

interface MainMenuProps {
    onStartCase: (caseData: CaseFile) => void;
    onOpenAdmin: () => void;
}

interface CaseWithStats {
    id: string;
    title: string;
    isLocal: boolean;
    isSolved?: boolean;
    bestTime?: number;
}

export default function MainMenu({ onStartCase, onOpenAdmin }: MainMenuProps) {
    const [cases, setCases] = useState<CaseWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const { isAdmin, loading: authLoading } = useAuth();
    const { settings, updateSettings, initialize, isInitialized } = useAudioContext();

    // If user is already admin, open admin panel directly
    useEffect(() => {
        if (!authLoading && isAdmin && showAdminLogin) {
            setShowAdminLogin(false);
            onOpenAdmin();
        }
    }, [isAdmin, authLoading, showAdminLogin, onOpenAdmin]);

    useEffect(() => {
        const fetchCasesWithStats = async () => {
            try {
                const { data, error } = await supabase
                    .from('cases')
                    .select('id, title')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });

                if (data && Array.isArray(data)) {
                    // Fetch resolved cases and stats
                    const resolvedCases = await getResolvedCases();
                    
                    const casesWithStats: CaseWithStats[] = await Promise.all(
                        data.map(async (d) => {
                            const stats = await getCaseStats(d.id);
                            return {
                                ...d,
                                isLocal: false,
                                isSolved: stats.isSolved,
                                bestTime: stats.bestTime,
                            };
                        })
                    );
                    
                    setCases(casesWithStats);
                } else {
                    setCases([]);
                }
            } catch (err) {
                console.error('Error fetching cases:', err);
                setCases([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCasesWithStats();
    }, []);

    const handleCaseSelect = async (caseItem: { id: string, title: string, isLocal: boolean }) => {
        // Initialize audio on first interaction
        if (!isInitialized) {
            initialize();
        }

        if (caseItem.isLocal) {
            // Load local case from predefined cases (not implemented in this snippet)
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

    const handleResetTutorial = () => {
        // Reset tutorial in localStorage
        localStorage.removeItem('cold-case-tutorial-completed');
        // Start first case which will trigger tutorial
        if (cases.length > 0) {
            handleCaseSelect(cases[0]);
        }
    };

    if (showAdminLogin) {
        return <AdminLogin onCancel={() => setShowAdminLogin(false)} />;
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl h-full flex flex-col space-y-4 sm:space-y-6 md:space-y-8">
                <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 flex-shrink-0">
                    <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
                        <img
                            src="/threadville-pd.svg"
                            alt="Threadville PD Badge"
                            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 drop-shadow-lg"
                        />
                    </div>
                    {/* <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-amber-500 font-serif">
                        THREADVILLE PD
                    </h1> */}
                    <p className="text-xs sm:text-sm md:text-base text-slate-400 font-mono uppercase tracking-widest">
                        Detectives Unit • {new Date().getFullYear()}
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 md:p-6 shadow-2xl flex flex-col flex-grow overflow-hidden">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 text-slate-200 flex-shrink-0">
                        <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-600" />
                        <span>Active Case Files</span>
                    </h2>

                    <div className="space-y-2 sm:space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-amber-500">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span>Retrieving Active Cases...</span>
                            </div>
                        ) : cases.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded bg-slate-950/50">
                                <p>No cases available.</p>
                                <p className="text-xs mt-2">Please check database connection.</p>
                            </div>
                        ) : (
                            cases.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleCaseSelect(c)}
                                    className="w-full text-left p-3 sm:p-4 rounded bg-slate-950 border border-slate-800 hover:border-amber-500 hover:bg-slate-900 transition-all group relative overflow-hidden"
                                >
                                    <div className="relative z-10 flex justify-between items-center gap-3">
                                        <div className="min-w-0 flex-grow">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-base sm:text-lg md:text-xl text-slate-200 group-hover:text-amber-500 transition-colors truncate">
                                                    {c.title}
                                                </h3>
                                                {c.isSolved && (
                                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-xs text-slate-500 font-mono truncate">
                                                    CASE ID: {c.id || 'UNK'}
                                                </p>
                                                {c.isSolved && c.bestTime && (
                                                    <span className="text-xs text-green-400 font-mono">
                                                        Best: {Math.floor(c.bestTime / 60)}m {c.bestTime % 60}s
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Play className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 pt-4 sm:pt-6 md:pt-8 flex-shrink-0">
                    <button
                        onClick={handleResetTutorial}
                        className="text-xs sm:text-sm text-slate-700 hover:text-blue-400 flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
                    >
                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Tutorial</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!isInitialized) initialize();
                            updateSettings({ musicEnabled: !settings.musicEnabled, ambianceEnabled: !settings.ambianceEnabled });
                        }}
                        className="text-xs sm:text-sm text-slate-700 hover:text-amber-400 flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
                    >
                        {settings.musicEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />}
                        <span>Audio</span>
                    </button>
                    <button
                        onClick={handleAdminClick}
                        className="text-xs sm:text-sm text-slate-700 hover:text-slate-500 flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
                    >
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Commissioner Access</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
