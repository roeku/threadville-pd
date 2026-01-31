import React, { useState, useEffect, useMemo } from 'react';
import { Suspect } from '../types';

interface GelSequencerProps {
    sampleDNA: string;
    suspects: Suspect[];
    onMatch: (suspect: Suspect) => void;
    onNoMatch: () => void;
}

// Convert DNA string to band positions (simplified: each base → vertical position)
const dnaStringToBands = (dnaSeq: string, frequencyMultiplier: number = 1): number[] => {
    const baseMap = { A: 15, T: 30, G: 45, C: 60 };
    return dnaSeq
        .split('')
        .filter(c => c !== '-')
        .map((c, i) => (baseMap[c as keyof typeof baseMap] || 50) + i * 8 * frequencyMultiplier);
};

const GelSequencer: React.FC<GelSequencerProps> = ({ sampleDNA, suspects, onMatch, onNoMatch }) => {
    const [phaseShift, setPhaseShift] = useState(0); // -50 to 50
    const [frequency, setFrequency] = useState(1); // 0.7 to 1.3
    const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
    const [matchFound, setMatchFound] = useState(false);
    const [wrongSuspect, setWrongSuspect] = useState(false);

    const sampleBands = useMemo(() => dnaStringToBands(sampleDNA), [sampleDNA]);

    // Get selected suspect's DNA bands
    const suspectBands = useMemo(() => {
        if (!selectedSuspectId) return [];
        const suspect = suspects.find(s => s.id === selectedSuspectId);
        return suspect ? dnaStringToBands(suspect.dnaSequence, frequency) : [];
    }, [selectedSuspectId, suspects, frequency]);

    // Check if bands align within tolerance
    useEffect(() => {
        if (suspectBands.length === 0 || matchFound) return;

        const suspect = suspects.find(s => s.id === selectedSuspectId);
        if (!suspect) return;

        const isMatch = suspect.dnaSequence === sampleDNA;

        if (isMatch) {
            // For correct suspect, check if sliders are close to correct values
            const phaseCorrect = Math.abs(phaseShift) < 3;
            const frequencyCorrect = Math.abs(frequency - 1) < 0.05;

            if (phaseCorrect && frequencyCorrect) {
                setMatchFound(true);
                setWrongSuspect(false);
                onMatch(suspect);
            }
        } else {
            // Wrong suspect—sliders can never solve it
            setWrongSuspect(true);
        }
    }, [phaseShift, frequency, selectedSuspectId, suspects, sampleDNA, matchFound, onMatch]);

    const GelStrip = ({ bands, label, yOffset = 0 }: { bands: number[], label: string, yOffset?: number }) => (
        <div className="flex flex-col items-center gap-2">
            <p className="text-green-500 font-mono text-xs uppercase">{label}</p>
            <div className="h-40 w-12 bg-black border border-green-700 relative overflow-hidden">
                {/* Grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:2px_5px]" />

                {/* Bands */}
                {bands.map((y, i) => (
                    <div
                        key={i}
                        className={`absolute left-0 right-0 h-0.5 ${matchFound ? 'bg-green-400' : 'bg-green-500'} shadow-lg`}
                        style={{
                            top: `${(y + yOffset) % 160}px`,
                            transition: 'top 0.1s ease-out',
                            boxShadow: '0 0 4px rgba(0, 255, 0, 0.6)',
                        }}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
            {/* Title */}
            <h3 className="text-green-500 font-mono text-center text-sm font-bold">DNA ELECTROPHORESIS ANALYZER</h3>

            {/* Main gel view */}
            <div className="flex items-end gap-8">
                <GelStrip bands={sampleBands} label="SAMPLE (SCENE)" />
                <div className="flex flex-col gap-2">
                    <p className="text-green-700 font-mono text-xs uppercase">SUSPECTS</p>
                    <div className="flex flex-col gap-1">
                        {suspects.slice(0, 3).map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSuspectId(s.id)}
                                className={`px-3 py-1 text-xs font-mono ${selectedSuspectId === s.id
                                        ? 'bg-green-700 text-black'
                                        : 'bg-green-900/40 text-green-400 hover:bg-green-800/40'
                                    }`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
                {selectedSuspectId && (
                    <GelStrip bands={suspectBands} label="CONTROL" yOffset={phaseShift} />
                )}
            </div>

            {/* Status message */}
            {matchFound && (
                <div className="text-center">
                    <p className="text-green-400 font-mono text-sm font-bold blink">MATCH ESTABLISHED!</p>
                    <p className="text-green-600 text-xs mt-1">Bands aligned perfectly. Suspect confirmed.</p>
                </div>
            )}

            {wrongSuspect && selectedSuspectId && (
                <div className="text-center">
                    <p className="text-yellow-500 font-mono text-xs">⚠ SUSPECT DNA INCOMPATIBLE</p>
                    <p className="text-yellow-600 text-xs mt-1">The bands will not align. Try another suspect.</p>
                </div>
            )}

            {/* Controls */}
            {!matchFound && (
                <div className="w-full max-w-xs space-y-4 bg-green-900/20 border border-green-900 p-3">
                    <div>
                        <label className="text-green-600 text-xs font-mono block mb-1">PHASE SHIFT: {phaseShift}</label>
                        <input
                            type="range"
                            min="-50"
                            max="50"
                            value={phaseShift}
                            onChange={(e) => setPhaseShift(Number(e.target.value))}
                            className="w-full h-1 bg-green-900 border border-green-700 accent-green-500"
                        />
                    </div>
                    <div>
                        <label className="text-green-600 text-xs font-mono block mb-1">
                            FREQUENCY: {frequency.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min="0.7"
                            max="1.3"
                            step="0.05"
                            value={frequency}
                            onChange={(e) => setFrequency(Number(e.target.value))}
                            className="w-full h-1 bg-green-900 border border-green-700 accent-green-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GelSequencer;
