import { useEffect, useState } from 'react';
import { getSessionReport } from '../services/gameProgressService';

interface CaseCompletionModalProps {
    sessionId: string;
    caseTitle: string;
    solved: boolean;
    timeToComplete: number; // in seconds
    onNextCase: () => void;
    onReplay: () => void;
    onMainMenu: () => void;
}

export default function CaseCompletionModal({
    sessionId,
    caseTitle,
    solved,
    timeToComplete,
    onNextCase,
    onReplay,
    onMainMenu,
}: CaseCompletionModalProps) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadReport() {
            try {
                const data = await getSessionReport(sessionId);
                setReport(data);
            } catch (error) {
                console.error('Failed to load session report:', error);
            } finally {
                setLoading(false);
            }
        }
        loadReport();
    }, [sessionId]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        return `${minutes}m ${secs}s`;
    };

    const validConnections = report?.connections.filter((c: any) => c.is_valid && !c.removed_at) || [];
    const invalidConnections = report?.connections.filter((c: any) => !c.is_valid && !c.removed_at) || [];
    const criticalConnections = validConnections.filter((c: any) => c.is_critical);
    const solvedPuzzles = report?.puzzles.filter((p: any) => p.solved) || [];
    const totalPuzzles = report?.puzzles.length || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-4 border-amber-800 rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className={`p-6 border-b-4 ${solved ? 'bg-green-700 border-green-900' : 'bg-red-700 border-red-900'}`}>
                    <h1 className="text-4xl font-bold text-white text-center mb-2">
                        {solved ? '🎉 CASE SOLVED!' : '❌ CASE INCOMPLETE'}
                    </h1>
                    <p className="text-xl text-white/90 text-center">{caseTitle}</p>
                </div>

                {/* Stats Section */}
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white border-2 border-amber-700 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-amber-800">
                                {formatTime(timeToComplete)}
                            </div>
                            <div className="text-sm text-gray-600 uppercase tracking-wide">Time to Complete</div>
                        </div>

                        <div className="bg-white border-2 border-amber-700 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-amber-800">
                                {validConnections.length}
                            </div>
                            <div className="text-sm text-gray-600 uppercase tracking-wide">Valid Connections</div>
                        </div>

                        <div className="bg-white border-2 border-amber-700 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-amber-800">
                                {criticalConnections.length}
                            </div>
                            <div className="text-sm text-gray-600 uppercase tracking-wide">Critical Connections</div>
                        </div>

                        <div className="bg-white border-2 border-amber-700 rounded p-4 text-center">
                            <div className="text-3xl font-bold text-amber-800">
                                {solvedPuzzles.length}/{totalPuzzles}
                            </div>
                            <div className="text-sm text-gray-600 uppercase tracking-wide">Puzzles Solved</div>
                        </div>
                    </div>

                    {/* Detailed Stats */}
                    {!loading && report && (
                        <div className="space-y-4">
                            {/* Documents Printed */}
                            {report.documents.length > 0 && (
                                <div className="bg-white border-2 border-amber-700 rounded p-4">
                                    <h3 className="font-bold text-lg mb-2 text-amber-900">
                                        📄 Documents Printed ({report.documents.length})
                                    </h3>
                                    <ul className="text-sm space-y-1">
                                        {report.documents.map((doc: any, idx: number) => (
                                            <li key={idx} className="text-gray-700">
                                                • {doc.document_label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Invalid Connections (Mistakes) */}
                            {invalidConnections.length > 0 && (
                                <div className="bg-red-50 border-2 border-red-400 rounded p-4">
                                    <h3 className="font-bold text-lg mb-2 text-red-800">
                                        ❌ Incorrect Connections ({invalidConnections.length})
                                    </h3>
                                    <ul className="text-sm space-y-1">
                                        {invalidConnections.map((conn: any, idx: number) => (
                                            <li key={idx} className="text-red-700">
                                                • {conn.from_label} --{conn.link_type}--&gt; {conn.to_label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Valid Connections */}
                            {validConnections.length > 0 && (
                                <div className="bg-green-50 border-2 border-green-400 rounded p-4">
                                    <h3 className="font-bold text-lg mb-2 text-green-800">
                                        ✅ Correct Connections ({validConnections.length})
                                    </h3>
                                    <ul className="text-sm space-y-1">
                                        {validConnections.map((conn: any, idx: number) => (
                                            <li key={idx} className={conn.is_critical ? 'text-green-900 font-bold' : 'text-green-700'}>
                                                {conn.is_critical && '⭐ '}
                                                {conn.from_label} --{conn.link_type}--&gt; {conn.to_label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Puzzles */}
                            {report.puzzles.length > 0 && (
                                <div className="bg-blue-50 border-2 border-blue-400 rounded p-4">
                                    <h3 className="font-bold text-lg mb-2 text-blue-800">
                                        🧩 Forensic Analysis
                                    </h3>
                                    <ul className="text-sm space-y-1">
                                        {report.puzzles.map((puzzle: any, idx: number) => (
                                            <li key={idx} className="text-blue-700">
                                                {puzzle.solved ? '✓' : '○'} {puzzle.puzzle_type}: {puzzle.evidence_label}
                                                {puzzle.attempts > 1 && ` (${puzzle.attempts} attempts)`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t-4 border-amber-800 bg-amber-100 flex gap-4 justify-center">
                    <button
                        onClick={onNextCase}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-colors"
                    >
                        Next Case →
                    </button>
                    <button
                        onClick={onReplay}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors"
                    >
                        Replay Case 🔄
                    </button>
                    <button
                        onClick={onMainMenu}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-colors"
                    >
                        Main Menu
                    </button>
                </div>
            </div>
        </div>
    );
}
