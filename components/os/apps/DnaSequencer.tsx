import React, { useState, useMemo, useEffect } from 'react';
import { Activity, CheckCircle2, HelpCircle, User, AlertCircle, Search, Printer } from 'lucide-react';
import { useOS } from '../context/OSContext';
import { Suspect } from '../../types';
import { trackPuzzleInteraction, trackDocumentPrint } from '../../../services/gameProgressService';
import { useGameStore } from '../../../stores/useGameStore';

interface DnaSequencerProps {
    data?: {
        entityId: string;
    };
}

export const DnaSequencer: React.FC<DnaSequencerProps> = ({ data }) => {
    const { currentCase, onPrint } = useOS();
    const sessionId = useGameStore(state => state.sessionId);
    const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    // Gamification state
    const [frequency, setFrequency] = useState(50);
    const [phase, setPhase] = useState(0);

    // Find the evidence that was passed in
    const evidence = useMemo(() => {
        if (!data?.entityId || !currentCase) return null;
        return currentCase.entities.find(e => e.id === data.entityId);
    }, [data, currentCase]);

    // Reset knobs when suspect changes
    useEffect(() => {
        setFrequency(50);
        setPhase(0);
    }, [selectedSuspectId]);

    // Validation
    const isDnaEvidence = evidence?.forensicData?.type === 'DNA';
    const evidenceDna = evidence?.forensicData?.value;

    const selectedSuspect = useMemo(() => {
        return currentCase?.suspects.find(s => s.id === selectedSuspectId);
    }, [selectedSuspectId, currentCase]);

    // Check for match logic
    const isMatch = useMemo(() => {
        if (!evidenceDna || !selectedSuspect?.dnaSequence) return false;
        return evidenceDna === selectedSuspect.dnaSequence;
    }, [evidenceDna, selectedSuspect]);

    // Alignment logic
    // We arbitrarily decide that the "correct" frequency is 72 and phase is 35 for ALL matches for now to keep it simple, 
    // OR we could derive it from the DNA string itself so each match has unique settings.
    // Let's derive it so it feels less static.
    const targetSettings = useMemo(() => {
        if (!selectedSuspect) return { freq: 50, phase: 0 };
        // Simple hash of ID to get numbers
        let hash = 0;
        for (let i = 0; i < selectedSuspect.id.length; i++) hash += selectedSuspect.id.charCodeAt(i);

        return {
            freq: 30 + (hash % 60), // 30-90
            phase: (hash * 7) % 100
        };
    }, [selectedSuspect]);

    const isAligned = Math.abs(frequency - targetSettings.freq) < 5 && Math.abs(phase - targetSettings.phase) < 5;
    const isSuccess = isMatch && isAligned;
    const isMismatch = !isMatch && isAligned;

    // Generate bands from a DNA string
    const generateBandsFromDna = (dnaString: string, isDistorted: boolean = false, freq: number = 50, ph: number = 0, target: { freq: number, phase: number } = { freq: 50, phase: 0 }) => {
        // Simple hash to generated consistent bands
        const bands = [];
        let hash = 0;
        for (let i = 0; i < dnaString.length; i++) {
            hash = ((hash << 5) - hash) + dnaString.charCodeAt(i);
            hash |= 0;
        }

        // Use RNG
        const rng = (seed: number) => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 0; i < 12; i++) {
            let basePos = rng(Math.abs(hash) + i) * 90 + 5;

            if (isDistorted) {
                // Apply distortion based on how far we are from target
                const freqDiff = freq - target.freq;
                const phaseDiff = ph - target.phase;

                // Shift position based on phase difference
                basePos += (phaseDiff / 2);

                // Stretch/Squash spacing based on frequency difference
                // We pivot around 50%
                const distFromCenter = basePos - 50;
                basePos = 50 + distFromCenter * (1 + freqDiff / 100);
            }

            // Clamp
            if (basePos < 2) basePos = 2;
            if (basePos > 98) basePos = 98;

            bands.push(basePos);
        }
        return bands;
    };

    const evidenceBands = useMemo(() => {
        if (!evidenceDna) return [];
        return generateBandsFromDna(evidenceDna);
    }, [evidenceDna]);

    const suspectBands = useMemo(() => {
        if (!selectedSuspect?.dnaSequence) return [];
        return generateBandsFromDna(selectedSuspect.dnaSequence, true, frequency, phase, targetSettings);
    }, [selectedSuspect, frequency, phase, targetSettings]);


    const handlePrintReport = () => {
        if (!selectedSuspect || !evidence) return;

        const timestamp = new Date().toLocaleString();

        // Use report definition from evidence metadata or case data when available
        const matchingReport = currentCase?.entities.find(e =>
            e.type === 'PAPER' &&
            e.label?.toLowerCase().includes('dna match report') &&
            e.metadata?.fields?.evidenceId === evidence.id
        );

        const reportId = evidence.metadata?.reportId || matchingReport?.id || `DOC-DNA-${evidence.id}`;
        const reportLabel = evidence.metadata?.reportLabel || matchingReport?.label || `DNA Match Report: ${evidence.id}`;

        const reportData = {
            type: 'forensic-report',
            title: 'DNA Analysis Report',
            caseNumber: currentCase?.id || "UNKNOWN",
            reportType: 'DNA ANALYSIS',
            analyst: 'Automated Sequencer',
            date: timestamp,
            subject: selectedSuspect.name,
            evidenceId: evidence.id,
            findings: isSuccess
                ? `Genetic markers from Evidence #${evidence.id} align perfectly with sample provided by Subject ${selectedSuspect.name}. The allele frequency distribution matches across all 12 tested loci.`
                : `Genetic markers from Evidence #${evidence.id} display significant deviation from sample provided by Subject ${selectedSuspect.name}. The subject is excluded as a potential source of this sample.`,
            matchProbability: isSuccess ? "99.9%" : "0.0%",
            status: isSuccess ? "MATCH FOUND" : "INCONCLUSIVE",
        };

        console.log(`[Print] DNA Report ID: ${reportId}, Label: ${reportLabel}`);

        onPrint(
            `DNA Analysis Report: ${selectedSuspect.name} vs ${evidence.label}`,
            reportLabel,
            reportData,
            reportId
        );

        // Track puzzle completion and document print
        if (sessionId) {
            trackPuzzleInteraction(sessionId, 'DNA_SEQUENCER', evidence.id, evidence.label, isSuccess);
            trackDocumentPrint(sessionId, reportId, reportLabel, 'FORENSIC_REPORT');
        }
    };

    if (!evidence || !isDnaEvidence) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Activity size={48} className="mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-slate-400 mb-2">NO SEQUENCE LOADED</h3>
                <p className="text-sm max-w-[200px]">Open a DNA evidence file from the System to begin analysis.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-row overflow-hidden bg-slate-950 text-slate-200">
            {/* Sidebar - Suspects */}
            <div className="w-1/3 min-w-[160px] border-r border-slate-700 flex flex-col bg-slate-900/50">
                <div className="p-3 border-b border-slate-700 font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <User size={12} /> Database
                </div>
                <div className="flex-1 overflow-y-auto">
                    {currentCase?.suspects.map(suspect => (
                        <button
                            key={suspect.id}
                            onClick={() => setSelectedSuspectId(suspect.id)}
                            className={`w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-3 ${selectedSuspectId === suspect.id ? 'bg-slate-800 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedSuspectId === suspect.id ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-700 text-slate-400'
                                }`}>
                                {suspect.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className={`text-xs font-bold ${selectedSuspectId === suspect.id ? 'text-emerald-300' : 'text-slate-300'}`}>
                                    {suspect.name}
                                </div>
                                <div className="text-[10px] text-slate-500">ID: {suspect.id.substring(0, 6)}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-start">
                    <div>
                        <div className="text-[10px] text-emerald-500 font-mono mb-1">EVIDENCE SOURCE</div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" />
                            {evidence.label}
                        </div>
                    </div>
                    {selectedSuspect && (
                        <div className="text-right">
                            <div className="text-[10px] text-blue-400 font-mono mb-1">COMPARING WITH</div>
                            <div className="font-bold text-sm text-white">{selectedSuspect.name}</div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex items-stretch justify-center p-8 gap-12 bg-[#050505]">

                    {/* Evidence Strip */}
                    <div className="flex flex-col items-center flex-1 max-w-[100px]">
                        <div className="text-[10px] text-emerald-500 font-mono mb-2 tracking-widest">SOURCE</div>
                        <div className="w-full flex-1 bg-slate-900 border border-emerald-900/30 rounded relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            {/* Scanline */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/20 blur-[1px] animate-[scan_2s_linear_infinite]" />

                            {evidenceBands.map((y, i) => (
                                <div key={i}
                                    className="absolute left-1 right-1 h-1 bg-emerald-500 rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.8)]"
                                    style={{ top: `${y}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Comparison Strip */}
                    <div className="flex flex-col items-center flex-1 max-w-[100px]">
                        <div className="text-[10px] text-blue-400 font-mono mb-2 tracking-widest">TARGET</div>
                        <div className={`w-full flex-1 bg-slate-900 border rounded relative overflow-hidden transition-all duration-500 ${selectedSuspect
                            ? (isSuccess
                                ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                                : (isMismatch ? 'border-red-500/50' : 'border-slate-700'))
                            : 'border-slate-800'
                            }`}>
                            {!selectedSuspect && (
                                <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                                    <span className="text-[10px] text-slate-600 font-mono">SELECT RECORD</span>
                                </div>
                            )}

                            {selectedSuspect && suspectBands.map((y, i) => (
                                <div key={i}
                                    className={`absolute left-1 right-1 h-1 rounded-sm shadow-sm transition-all duration-75 ${isSuccess ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' :
                                        isMismatch ? 'bg-red-500/60' : 'bg-blue-400/50'
                                        }`}
                                    style={{ top: `${y}%` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Controls Area */}
                {selectedSuspect && (
                    <div className="bg-slate-800/50 p-3 mx-4 mb-4 rounded border border-slate-700 shrink-0 flex flex-wrap gap-4">
                        <label className="flex-1 min-w-[120px]">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>FREQUENCY TUNER</span>
                                <span className="font-mono text-emerald-500">{frequency}Hz</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={frequency}
                                onChange={(e) => setFrequency(parseInt(e.target.value))}
                                className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                disabled={isSuccess || isMismatch}
                            />
                        </label>

                        <label className="flex-1 min-w-[120px]">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>PHASE ALIGNMENT</span>
                                <span className="font-mono text-emerald-500">{phase}°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={phase}
                                onChange={(e) => setPhase(parseInt(e.target.value))}
                                className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                disabled={isSuccess || isMismatch}
                            />
                        </label>
                    </div>
                )}

                {/* Status Footer */}
                <div className="h-14 bg-slate-900 border-t border-slate-700 flex items-center justify-between px-4 shrink-0">
                    <div className="text-[10px] font-mono text-slate-500">
                        SEQ_ID: {evidence.id.substring(0, 8).toUpperCase()}
                    </div>

                    {selectedSuspect && (isSuccess || isMismatch) ? (
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded font-bold text-xs ${isSuccess ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 animate-pulse' : 'bg-red-900/20 text-red-400 border border-red-500/20'
                                }`}>
                                {isSuccess ? (
                                    <>
                                        <CheckCircle2 size={14} />
                                        POSITIVE MATCH CONFIRMED
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={14} />
                                        NO GENETIC MATCH
                                    </>
                                )}
                            </div>
                            <button
                                onClick={handlePrintReport}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded border border-slate-600 transition-colors ml-2"
                                title="Print Report"
                            >
                                <Printer size={16} />
                            </button>
                        </div>
                    ) : (
                        selectedSuspect && <div className="text-xs text-amber-500 font-mono animate-pulse">ALIGN SIGNALS TO VERIFY...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

