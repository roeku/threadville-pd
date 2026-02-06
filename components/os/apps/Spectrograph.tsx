import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Radio, HelpCircle, Activity, Play, Pause, Volume2, Printer } from 'lucide-react';
import { useOS } from '../context/OSContext';

interface SpectrographProps {
    data?: {
        entityId: string;
    };
}

export const Spectrograph: React.FC<SpectrographProps> = ({ data }) => {
    const { currentCase, onPrint } = useOS();
    const [amplitude, setAmplitude] = useState(30);
    const [wavelength, setWavelength] = useState(50);
    const [showHelp, setShowHelp] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Get Evidence
    const evidence = useMemo(() => {
        if (!data?.entityId || !currentCase) return null;
        return currentCase.entities.find(e => e.id === data.entityId);
    }, [data, currentCase]);

    // Check if it's audio evidence
    const isAudio = evidence?.type === 'AUDIO' || evidence?.type === 'audio' || evidence?.type === 'video' || evidence?.forensicData?.type === 'AUDIO';

    // Target settings for this specific audio clip (derived from ID)
    const targetSettings = useMemo(() => {
        if (!evidence) return { amp: 75, wave: 25 };
        let hash = 0;
        for (let i = 0; i < evidence.id.length; i++) hash += evidence.id.charCodeAt(i);
        return {
            amp: 20 + (hash % 70),
            wave: 20 + ((hash * 2) % 70)
        }
    }, [evidence]);

    const tolerance = 5;
    const isLocked =
        Math.abs(amplitude - targetSettings.amp) < tolerance &&
        Math.abs(wavelength - targetSettings.wave) < tolerance;

    const handlePrintReport = () => {
        if (!evidence) return;
        const timestamp = new Date().toLocaleString();

        const reportData = {
            type: 'forensic-report',
            caseNumber: currentCase?.id || "UNKNOWN",
            title: 'Spectrographic Analysis Report',
            reportType: 'SPECTROGRAPHIC ANALYSIS',
            analyst: 'Automated Audio DSP',
            date: timestamp,
            evidenceId: evidence.id,
            findings: isLocked
                ? `Signal isolation complete. Background noise reduced by 94%. Transcript generated from clarified audio stream:\n\n"${evidence.transcript || evidence.content}"`
                : "Signal too noisy for transcription.",
            status: isLocked ? "CONCLUSIVE" : "INCONCLUSIVE",
        };

        onPrint(
            `Audio Transcript: ${evidence.label}`,
            `Spectrograph Report`,
            reportData
        );
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        let t = 0;

        const draw = () => {
            if (!canvas) return;

            const { width, height } = canvas.getBoundingClientRect();
            // Only resize if dimensions change to avoid flicker/perf issues
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            ctx.clearRect(0, 0, width, height);

            // Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x < width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for (let y = 0; y < height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();

            const centerY = height / 2;
            const scaleY = height / 3;

            // Draw wave
            ctx.beginPath();
            ctx.moveTo(0, centerY);

            // Audio visualization logic
            // If locked, show a clean wave. If not, show static/noise.
            const noiseFactor = isLocked ? 0.05 : 1 - (1 / (1 + (Math.abs(amplitude - targetSettings.amp) + Math.abs(wavelength - targetSettings.wave)) / 50));

            for (let x = 0; x < width; x++) {
                // Base wave from knobs
                const freq = (wavelength / 100) * 0.2; // Driven by user knob
                const amp = (amplitude / 100);       // Driven by user knob

                let y = centerY;

                if (isLocked) {
                    // Clean signal
                    y += Math.sin(x * 0.05 + t) * (scaleY * 0.8) * Math.sin(t * 0.5);
                } else {
                    // Noisy signal logic
                    // Mix user wave with random noise
                    const signal = Math.sin(x * freq + t * 0.5);
                    const noise = (Math.random() - 0.5) * 2;
                    y += (signal * (1 - noiseFactor) + noise * noiseFactor) * scaleY * amp;
                }

                ctx.lineTo(x, y);
            }

            ctx.lineWidth = isLocked ? 2 : 1;
            ctx.strokeStyle = isLocked ? '#10b981' : '#f59e0b';
            ctx.stroke();

            // Glow
            ctx.shadowBlur = isLocked ? 10 : 0;
            ctx.shadowColor = isLocked ? '#10b981' : 'transparent';

            t += isPlaying || !isLocked ? 0.2 : 0; // Move if playing OR static (static always moves)
            frameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(frameId);
    }, [amplitude, wavelength, isPlaying, isLocked, targetSettings]);

    if (!evidence || !isAudio) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Volume2 size={48} className="mb-4 opacity-50" />
                <p>No Audio Source Loaded</p>
                <p className="text-xs text-slate-600 mt-2">Open an audio file from the Evidence Board.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 p-4 gap-4 relative">
            {showHelp && (
                <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 rounded">
                    <h3 className="text-emerald-500 font-bold mb-4 flex items-center gap-2 border-b border-emerald-900 pb-2"><HelpCircle size={18} /> TUNER GUIDE</h3>
                    <ul className="text-slate-300 text-xs sm:text-sm space-y-3 text-left font-mono list-disc pl-4 mb-6">
                        <li>The received signal is noisy and distorted.</li>
                        <li>Adjust <span className="text-emerald-400 font-bold">AMPLITUDE</span> to match signal strength.</li>
                        <li>Adjust <span className="text-emerald-400 font-bold">WAVELENGTH</span> to match signal frequency.</li>
                        <li>When the wave turns <span className="text-emerald-500 font-bold">GREEN</span>, the audio is clean enough to interpret.</li>
                    </ul>
                    <button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded border border-slate-600 transition-colors">CLOSE GUIDE</button>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-3 border border-slate-700 rounded mb-2">
                <div className="flex items-center gap-3">
                    <Activity size={18} className="text-emerald-500" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200 tracking-wider">AUDIO ANALYZER</span>
                        <span className="text-[10px] text-slate-500 font-mono">SRC: {evidence.label}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isLocked ? (
                        <span className="text-xs font-bold text-black bg-emerald-500 px-2 py-0.5 rounded">SIGNAL CLEAR</span>
                    ) : (
                        <span className="text-xs font-bold text-amber-500 animate-pulse">NOISY SIGNAL</span>
                    )}
                    <button onClick={() => setShowHelp(true)} className="text-slate-500 hover:text-white"><HelpCircle size={16} /></button>
                </div>
            </div>

            {/* Visualizer */}
            <div className="flex-1 bg-black rounded border border-slate-800 relative overflow-hidden shadow-inner">
                <canvas ref={canvasRef} className="w-full h-full block" />

                {/* Playback Controls Overlay when Locked */}
                {isLocked && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 px-6 py-2 rounded-full border border-emerald-500/30 backdrop-blur-sm animate-in slide-in-from-bottom-5">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-slate-900 transition-colors"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <div className="text-xs font-mono text-emerald-400">
                            {isPlaying ? "PLAYING..." : "READY"}
                        </div>
                    </div>
                )}
            </div>

            {/* Transcript / Result Area (Only if locked) */}
            <div className={`h-24 bg-slate-900 border border-slate-700 rounded p-3 overflow-y-auto transition-all duration-1000 ${isLocked ? 'opacity-100' : 'opacity-30 grayscale blur-[2px]'}`}>
                <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] text-slate-500 font-bold">DECODED TRANSCRIPT:</div>
                    {isLocked && (
                        <button onClick={handlePrintReport} className="text-slate-400 hover:text-emerald-400 p-0.5 rounded transition-colors" title="Print Transcript">
                            <Printer size={12} />
                        </button>
                    )}
                </div>
                <p className="font-mono text-xs text-emerald-300 leading-relaxed">
                    {isLocked
                        ? (evidence.content || ">> NO TRANSCRIPT DATA AVAILABLE IN FILE <<")
                        : ">> SIGNAL DEGRADATION TOO HIGH. UNABLE TO PARSE AUDIO STREAM. PLEASE ADJUST TUNERS. <<"}
                </p>
            </div>

            {/* Knobs */}
            <div className="grid grid-cols-2 gap-4 bg-slate-800/30 p-3 rounded border border-slate-700">
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>AMPLITUDE</span>
                        <span className="font-mono text-emerald-500">{amplitude}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={amplitude}
                        onChange={(e) => setAmplitude(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>WAVELENGTH</span>
                        <span className="font-mono text-emerald-500">{wavelength}nm</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={wavelength}
                        onChange={(e) => setWavelength(parseInt(e.target.value))}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};
