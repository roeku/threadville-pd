import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Scan, Target, Check, HelpCircle, User, Fingerprint, Printer } from 'lucide-react';
import { useOS } from '../context/OSContext';
import { trackPuzzleInteraction, trackDocumentPrint } from '../../../services/gameProgressService';
import { useGameStore } from '../../../stores/useGameStore';

interface FingerprintScannerProps {
    data?: {
        entityId: string;
    };
}

export const FingerprintScanner: React.FC<FingerprintScannerProps> = ({ data }) => {
    const { currentCase, onPrint } = useOS();
    const sessionId = useGameStore(state => state.sessionId);
    const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
    const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const [showHelp, setShowHelp] = useState(false);

    // Get Evidence
    const evidence = useMemo(() => {
        if (!data?.entityId || !currentCase) return null;
        return currentCase.entities.find(e => e.id === data.entityId);
    }, [data, currentCase]);

    const isFingerprintEvidence = evidence?.forensicData?.type === 'FINGERPRINT';
    const evidencePattern = evidence?.forensicData?.value;

    // Get Selected Suspect
    const selectedSuspect = useMemo(() => {
        return currentCase?.suspects.find(s => s.id === selectedSuspectId);
    }, [selectedSuspectId, currentCase]);

    // Check Match Logic
    const isMatch = useMemo(() => {
        if (!evidencePattern || !selectedSuspect?.fingerprintPattern) return false;
        return evidencePattern === selectedSuspect.fingerprintPattern;
    }, [evidencePattern, selectedSuspect]);

    const handlePrintReport = () => {
        if (!selectedSuspect || !evidence) return;
        const timestamp = new Date().toLocaleString();

        // Use report definition from evidence metadata or case data when available
        const matchingReport = currentCase?.entities.find(e =>
            e.type === 'PAPER' &&
            e.label?.toLowerCase().includes('fingerprint') &&
            e.label?.toLowerCase().includes('report') &&
            e.metadata?.fields?.evidenceId === evidence.id
        );

        const reportId = evidence.metadata?.reportId || matchingReport?.id || `DOC-FP-${evidence.id}`;
        const reportLabel = evidence.metadata?.reportLabel || matchingReport?.label || `Fingerprint Match Report: ${evidence.label}`;

        const reportData = {
            type: 'forensic-report',
            caseNumber: currentCase?.id || "UNKNOWN",
            title: 'Fingerprint Analysis Report',
            reportType: 'FINGERPRINT MATCH',
            analyst: 'Automated AFIS',
            date: timestamp,
            subject: selectedSuspect.name,
            evidenceId: evidence.id,
            findings: isSuccess
                ? `Latent print from Evidence #${evidence.id} shares 16+ points of minutiae with reference print from Subject ${selectedSuspect.name}. Match confirmed.`
                : `Latent print from Evidence #${evidence.id} does not match reference print from Subject ${selectedSuspect.name}. Significant discrepancies in ridge flow and minutiae.`,
            matchProbability: isSuccess ? "99.8%" : "0.0%",
            status: isSuccess ? "MATCH FOUND" : "INCONCLUSIVE",
        };

        console.log(`[Print] Fingerprint Report ID: ${reportId}, Label: ${reportLabel}`);

        onPrint(
            `Fingerprint Report: ${selectedSuspect.name} vs ${evidence.label}`,
            reportLabel,
            reportData,
            reportId
        );

        // Track puzzle completion and document print
        if (sessionId) {
            trackPuzzleInteraction(sessionId, 'FINGERPRINT_SCANNER', evidence.id, evidence.label, isSuccess);
            trackDocumentPrint(sessionId, reportId, reportLabel, 'FORENSIC_REPORT');
        }
    };

    // Reset overlay when suspect changes
    useEffect(() => {
        setOverlayPos({ x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 });
        setRotation((Math.random() - 0.5) * 45);
    }, [selectedSuspectId]);

    // Alignment Check
    const isAligned = Math.abs(overlayPos.x) < 5 && Math.abs(overlayPos.y) < 5 && Math.abs(rotation) < 10;
    const isSuccess = isMatch && isAligned;
    const isMismatch = !isMatch && isAligned;

    // Drag Logic
    const handlePointerDown = (e: React.PointerEvent) => {
        isDraggingRef.current = true;
    };

    useEffect(() => {
        const handleMove = (e: PointerEvent) => {
            if (!isDraggingRef.current || !containerRef.current) return;
            const movementX = e.movementX;
            const movementY = e.movementY;

            setOverlayPos(prev => ({
                x: prev.x + movementX,
                y: prev.y + movementY
            }));
        };

        const handleUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, []);


    // SVG Generation (Procedural-ish visual)
    const FingerprintPath = ({ seed, color, className }: { seed: string, color: string, className?: string }) => {
        // Generate a consistently messy path based on seed string
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);

        const loops = 4 + (Math.abs(hash) % 4);

        return (
            <svg viewBox="0 0 100 100" className={`w-64 h-64 ${className}`} style={{ fill: 'none', stroke: color, strokeWidth: '1.5', strokeLinecap: 'round' }}>
                {[...Array(loops)].map((_, i) => (
                    <ellipse key={i} cx="50" cy="50" rx={10 + i * 8} ry={15 + i * 10}
                        strokeDasharray={`${20 + (Math.abs(hash + i) % 50)} ${5 + (Math.abs(hash + i) % 10)}`}
                        transform={`rotate(${(hash % 360) + i * 10} 50 50)`}
                    />
                ))}
            </svg>
        );
    };

    if (!evidence || !isFingerprintEvidence) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Fingerprint size={48} className="mb-4 opacity-50" />
                <p>No Latent Print Loaded</p>
            </div>
        );
    }

    return (
        <div className="h-full flex bg-slate-950 text-slate-200">
            {/* Sidebar - Suspects */}
            <div className="w-1/3 min-w-[160px] border-r border-slate-700 bg-slate-900/50 flex flex-col">
                <div className="p-2 border-b border-slate-700 text-xs font-bold text-slate-400">DATABASE</div>
                <div className="flex-1 overflow-y-auto">
                    {currentCase?.suspects.map(suspect => (
                        <button
                            key={suspect.id}
                            onClick={() => setSelectedSuspectId(suspect.id)}
                            className={`w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800 flex items-center gap-2 ${selectedSuspectId === suspect.id ? 'bg-slate-800 border-l-2 border-l-emerald-500' : ''
                                }`}
                        >
                            <User size={16} className="text-slate-500" />
                            <div>
                                <div className="text-xs font-bold text-slate-200">{suspect.name}</div>
                                <div className="text-[10px] text-slate-500">Pattern: {suspect.fingerprintPattern.substring(0, 8)}...</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Scanner */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {showHelp && (
                    <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-8">
                        <div className="max-w-md text-center">
                            <h3 className="text-emerald-500 font-bold mb-4">SCANNER MANUAL</h3>
                            <p className="text-sm text-slate-300 mb-4">Select a suspect from the database. Drag and rotate the overlay print to attempt a match against the evidence.</p>
                            <button onClick={() => setShowHelp(false)} className="px-4 py-2 bg-slate-800 text-white rounded">Got it</button>
                        </div>
                    </div>
                )}

                <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-500">EVIDENCE:</span>
                        <span className="font-mono text-white">{evidence.label}</span>
                    </div>
                    <button onClick={() => setShowHelp(true)}><HelpCircle size={16} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] overflow-hidden" ref={containerRef}>
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />

                    {/* Evidence Layer (Fixed) */}
                    <div className="absolute opacity-60 mix-blend-screen pointer-events-none">
                        <FingerprintPath seed={evidencePattern || 'null'} color="#ffffff" className="w-80 h-80 opacity-50" />
                    </div>

                    {/* Suspect Layer (Draggable) */}
                    {selectedSuspect && (
                        <div
                            className="absolute cursor-move touch-none"
                            style={{
                                transform: `translate(${overlayPos.x}px, ${overlayPos.y}px) rotate(${rotation}deg)`
                            }}
                            onPointerDown={handlePointerDown}
                        >
                            <div className={`p-4 border-2 border-dashed rounded-full ${isSuccess ? 'border-emerald-500 bg-emerald-500/10' :
                                isMismatch ? 'border-red-500 bg-red-500/10' : 'border-amber-500/50'
                                }`}>
                                <FingerprintPath
                                    seed={selectedSuspect.fingerprintPattern}
                                    color={isSuccess ? '#10b981' : isMismatch ? '#ef4444' : '#f59e0b'}
                                    className="w-80 h-80"
                                />
                            </div>
                        </div>
                    )}

                    {/* Controls for Rotation */}
                    {selectedSuspect && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <input
                                type="range" min="-45" max="45" value={rotation}
                                onChange={(e) => setRotation(parseFloat(e.target.value))}
                                className="w-64 accent-amber-500"
                            />
                        </div>
                    )}

                    {/* Success/Failure Notification */}
                    {isSuccess && (
                        <div className="absolute top-8 bg-emerald-900/90 text-emerald-100 px-6 py-3 rounded border border-emerald-500 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <Check size={24} />
                            <div className="font-bold">POSITIVE MATCH CONFIRMED</div>
                            <button onClick={handlePrintReport} className="ml-2 bg-emerald-800 hover:bg-emerald-700 p-1 rounded border border-emerald-400 text-white" title="Print Report">
                                <Printer size={16} />
                            </button>
                        </div>
                    )}
                    {isMismatch && (
                        <div className="absolute top-8 bg-red-900/90 text-red-100 px-6 py-3 rounded border border-red-500 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <Target size={24} />
                            <div className="font-bold">MISMATCH</div>
                            <button onClick={handlePrintReport} className="ml-2 bg-red-800 hover:bg-red-700 p-1 rounded border border-red-400 text-white" title="Print Report">
                                <Printer size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
