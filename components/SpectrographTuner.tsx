import React, { useState, useEffect, useRef } from 'react';
import { Suspect } from '../types';

interface SpectrographTunerProps {
    sampleLabel: string; // e.g., "Cyanide Residue"
    suspects: Suspect[];
    onMatch: (suspect: Suspect) => void;
    onNoMatch: () => void;
}

// Procedurally generate a waveform signature based on a string
const generateWaveform = (label: string, samples: number = 200): number[] => {
    const seed = label.charCodeAt(0) + label.charCodeAt(label.length - 1);
    const waveform: number[] = [];
    for (let i = 0; i < samples; i++) {
        const freq = (seed % 5) + 1;
        const val = Math.sin((i / samples) * freq * Math.PI * 2) * 50 + 50;
        const noise = ((seed * (i + 1)) % 20) - 10;
        waveform.push(Math.max(0, Math.min(100, val + noise * 0.3)));
    }
    return waveform;
};

// Smoothly adjust one waveform to match another
const matchWaveforms = (waveform: number[], targetWaveform: number[], gain: number, offset: number): number[] => {
    return waveform.map((v, i) => {
        const adjusted = (v - 50) * gain + 50 + offset;
        return Math.max(0, Math.min(100, adjusted));
    });
};

const SpectrographTuner: React.FC<SpectrographTunerProps> = ({ sampleLabel, suspects, onMatch }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chemicals = [
        { name: 'Arsenic Trioxide', label: 'Arsenic Residue' },
        { name: 'Strychnine', label: 'Strychnine Alkaloid' },
        { name: 'Cyanide Salt', label: 'Cyanide Residue' },
        { name: 'Vocal-Eze Formula', label: 'Unknown Compound' },
    ];
    const [selectedChemical, setSelectedChemical] = useState<string | null>(chemicals[0].label); // Default to first
    const [gain, setGain] = useState(1); // 0.5 to 1.5
    const [offset, setOffset] = useState(0); // -30 to 30
    const [matchFound, setMatchFound] = useState(false);

    const sampleWaveform = generateWaveform(sampleLabel);

    const selectedChemicalObj = chemicals.find(c => c.label === selectedChemical);
    const tunerWaveform = selectedChemicalObj ? generateWaveform(selectedChemical) : [];
    const adjustedWaveform = tunerWaveform.length > 0 ? matchWaveforms(tunerWaveform, sampleWaveform, gain, offset) : [];

    // Draw oscilloscope-style visualization
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !selectedChemical) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const centerY = h / 2;

        // Clear with grid
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, w, h);

        // Draw grid
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(0, (h / 10) * i);
            ctx.lineTo(w, (h / 10) * i);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo((w / 10) * i, 0);
            ctx.lineTo((w / 10) * i, h);
            ctx.stroke();
        }

        // Draw sample waveform (white)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < sampleWaveform.length; i++) {
            const x = (i / sampleWaveform.length) * w;
            const y = centerY - (sampleWaveform[i] - 50) * (h / 100);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw tuner waveform (red ghost initially, yellow when matched)
        const isMatched = matchFound || (Math.abs(gain - 1) < 0.1 && Math.abs(offset) < 3);
        ctx.strokeStyle = isMatched ? '#ffff00' : '#ff0000';
        ctx.globalAlpha = isMatched ? 1 : 0.6;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i < adjustedWaveform.length; i++) {
            const x = (i / adjustedWaveform.length) * w;
            const y = centerY - (adjustedWaveform[i] - 50) * (h / 100);
            if (i === 0) ctx.beginPath();
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw scanlines for CRT effect
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.02)';
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 2) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }, [selectedChemical, sampleWaveform, adjustedWaveform, matchFound]);

    // Check for match - when waveforms are aligned
    useEffect(() => {
        if (!matchFound && selectedChemical && Math.abs(gain - 1) < 0.15 && Math.abs(offset) < 5) {
            setMatchFound(true);
            // Try to find suspect matching this chemical, otherwise use first
            const chemicalName = selectedChemicalObj?.name || '';
            const matchingSuspect = suspects.find(s =>
                s.chemicalProfile?.includes(chemicalName) ||
                s.name.includes(chemicalName)
            ) || suspects[0];
            if (matchingSuspect) {
                onMatch(matchingSuspect);
            }
        }
    }, [gain, offset, selectedChemical, matchFound, suspects, onMatch, selectedChemicalObj]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
            <h3 className="text-green-500 font-mono text-center text-sm font-bold">SPECTROGRAPH ANALYZER</h3>

            <div className="flex gap-6 items-start">
                {/* Canvas for oscilloscope view */}
                <div className="flex flex-col gap-2">
                    <p className="text-green-700 font-mono text-xs uppercase">Signal Analysis</p>
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={200}
                        className="border-2 border-green-700 bg-black"
                    />
                    <p className="text-green-600 text-xs text-center">
                        {matchFound ? '✓ MATCH LOCKED' : 'Adjust knobs to align waveforms'}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-4">
                    {/* Chemical selector */}
                    <div>
                        <p className="text-green-700 font-mono text-xs uppercase mb-1">Chemical Library</p>
                        <div className="flex flex-col gap-1">
                            {chemicals.map(chem => (
                                <button
                                    key={chem.label}
                                    onClick={() => {
                                        setSelectedChemical(chem.label);
                                        setGain(1);
                                        setOffset(0);
                                        setMatchFound(false);
                                    }}
                                    className={`px-3 py-1 text-xs font-mono text-left ${selectedChemical === chem.label
                                        ? 'bg-green-700 text-black'
                                        : 'bg-green-900/40 text-green-400 hover:bg-green-800/40'
                                        }`}
                                >
                                    {chem.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Knobs */}
                    {selectedChemical && (
                        <div className="w-48 space-y-3 bg-green-900/20 border border-green-900 p-3">
                            <div>
                                <label className="text-green-600 text-xs font-mono block mb-1">GAIN: {gain.toFixed(2)}</label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.05"
                                    value={gain}
                                    onChange={(e) => setGain(Number(e.target.value))}
                                    className="w-full h-1 bg-green-900 border border-green-700 accent-green-500"
                                />
                            </div>
                            <div>
                                <label className="text-green-600 text-xs font-mono block mb-1">OFFSET: {offset}</label>
                                <input
                                    type="range"
                                    min="-30"
                                    max="30"
                                    value={offset}
                                    onChange={(e) => setOffset(Number(e.target.value))}
                                    className="w-full h-1 bg-green-900 border border-green-700 accent-green-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    {matchFound && (
                        <div className="text-center">
                            <p className="text-green-400 font-mono text-sm font-bold blink">WAVEFORMS MERGED!</p>
                            <p className="text-green-600 text-xs mt-1">Compound identified.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpectrographTuner;
