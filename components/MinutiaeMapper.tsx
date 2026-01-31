import React, { useEffect, useRef, useState } from 'react';
import { Suspect } from '../types';

interface MinutiaeMapperProps {
    sampleFingerprint: string;
    suspects: Suspect[];
    onMatch: (suspect: Suspect) => void;
    onNoMatch: () => void;
}

const parseFingerprint = (pattern: string): string[] => pattern.split('-').filter(Boolean);

const drawFingerprintPattern = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    pattern: string,
    rotation: number,
    threshold: number
) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 20, 0, 0.9)');
    grad.addColorStop(1, 'rgba(0, 10, 0, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const thresholdNorm = threshold / 100;
    const primaryPattern = parseFingerprint(pattern)[0] || 'LOOP';

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);

    const drawRidge = (points: { x: number; y: number }[], thickness: number, alpha: number) => {
        ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    };

    if (primaryPattern === 'WHORL') {
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(w, h) / 2.2;
        for (let r = maxR; r > 8; r -= 1.6) {
            const wobble = (Math.sin(r * 0.4) + Math.cos(r * 0.25)) * 2;
            const alpha = Math.max(0.08, (1 - r / maxR) * thresholdNorm);
            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.lineWidth = 1.1 + thresholdNorm * 1.2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r + wobble, r - wobble * 0.8, 0.15, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (primaryPattern === 'LOOP') {
        const cx = w / 2;
        const cy = h / 1.55;
        for (let i = -16; i <= 16; i += 2.2) {
            const k = i / 16;
            const amp = 18 + Math.abs(i) * 0.6;
            const alpha = Math.max(0.08, (1 - Math.abs(k)) * thresholdNorm);
            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.lineWidth = 1 + thresholdNorm * 1.1;
            ctx.beginPath();
            ctx.ellipse(cx + k * 6, cy + k * 4, 26 + amp, 18 + amp * 0.35, 0.4, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else {
        for (let y = 8; y < h - 8; y += 3) {
            const t = y / h;
            const bend = Math.sin(t * Math.PI) * 18;
            const alpha = Math.max(0.06, Math.sin(t * Math.PI) * thresholdNorm);
            const pts = [
                { x: w * 0.18, y: y },
                { x: w * 0.5 + bend * 0.4, y: y + 1.2 },
                { x: w * 0.82, y: y }
            ];
            drawRidge(pts, 1 + thresholdNorm * 1.2, alpha);
        }
    }

    const pores = 180;
    for (let i = 0; i < pores; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const a = 0.05 + Math.random() * 0.08;
        ctx.fillStyle = `rgba(0, 255, 0, ${a})`;
        ctx.fillRect(x, y, 1, 1);
    }

    ctx.restore();

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
};

const anchorTargets = [
    { key: 'DELTA', x: 0.25, y: 0.32, label: 'Δ' },
    { key: 'LOOP', x: 0.52, y: 0.62, label: 'Λ' },
    { key: 'ISLAND', x: 0.75, y: 0.42, label: '•' },
];

const drawAnchorPoints = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    clickedCount: number
) => {
    anchorTargets.forEach((point, idx) => {
        const clicked = idx < clickedCount;
        const px = point.x * w;
        const py = point.y * h;
        ctx.fillStyle = clicked ? '#00ff00' : '#007000';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,255,0,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = clicked ? '#ffffff' : '#00ff00';
        ctx.font = 'bold 9px "Courier New", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, px, py - 8);
    });
};

const MinutiaeMapper: React.FC<MinutiaeMapperProps> = ({ sampleFingerprint, suspects, onMatch }) => {
    const liftedPrintRef = useRef<HTMLCanvasElement>(null);
    const controlPrintRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(0);
    const [threshold, setThreshold] = useState(50);
    const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
    const [stage, setStage] = useState<'tune' | 'tag'>('tune');
    const [clickedPoints, setClickedPoints] = useState<number>(0);
    const [matchFound, setMatchFound] = useState(false);
    const [wrongSuspect, setWrongSuspect] = useState(false);
    const [status, setStatus] = useState<string>('ALIGN + FILTER, THEN TAG');
    const [overlayOffset, setOverlayOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const requiredPoints = 3;
    const suspect = suspects.find(s => s.id === selectedSuspectId);

    useEffect(() => {
        const canvas = liftedPrintRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        drawFingerprintPattern(ctx, w, h, sampleFingerprint, rotation, threshold);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const noiseAmount = (100 - threshold) * 2.5;

        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < noiseAmount / 255) {
                data[i] = Math.random() * 80;
                data[i + 1] = Math.random() * 200;
                data[i + 2] = 0;
                data[i + 3] = 40 + Math.random() * 80;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }, [sampleFingerprint, rotation, threshold]);

    useEffect(() => {
        const canvas = controlPrintRef.current;
        if (!canvas || !suspect) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawFingerprintPattern(ctx, canvas.width, canvas.height, suspect.fingerprintPattern, 0, 100);

        if (stage === 'tag' && liftedPrintRef.current) {
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.drawImage(liftedPrintRef.current, overlayOffset.x, overlayOffset.y, canvas.width, canvas.height);
            ctx.restore();
        }

        if (stage === 'tag') {
            drawAnchorPoints(ctx, canvas.width, canvas.height, clickedPoints);
        }
    }, [suspect, stage, clickedPoints, overlayOffset]);

    const handleControlPrintClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (stage !== 'tag' || !suspect || matchFound) return;

        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const idx = clickedPoints;
        const target = anchorTargets[idx];
        const targetPx = { x: target.x * rect.width, y: target.y * rect.height };
        const dist = Math.hypot(x - targetPx.x, y - targetPx.y);

        if (dist > 14) {
            setStatus('TAG NEAR CROSSHAIRS');
            return;
        }

        if (suspect.fingerprintPattern === sampleFingerprint) {
            const next = clickedPoints + 1;
            setClickedPoints(next);
            setStatus(`LOCKED ${target.key}`);
            if (next >= requiredPoints) {
                setMatchFound(true);
                onMatch(suspect);
            }
        } else {
            setWrongSuspect(true);
            setStatus('PATTERN DISAGREES');
        }
    };

    const canProceed = Math.abs(rotation) < 5 && threshold > 70;
    const bevelBtn = 'bg-[#d4d0c8] text-[#0a2f0a] border border-[#f8f8f8] border-b-[#404040] border-r-[#404040] shadow-[inset_-1px_-1px_0_#404040,inset_1px_1px_0_#f8f8f8] hover:bg-[#e6e2da]';

    return (
        <div className="w-full h-full flex flex-col p-3 gap-2 overflow-hidden bg-black text-green-400" style={{ fontFamily: '"Courier New", ui-monospace, monospace' }}>
            <h3 className="text-green-500 text-sm font-bold text-center tracking-tight">FINGERPRINT MATCHER · NCIC v3.1</h3>

            <div className="flex-1 flex gap-3 min-h-0">
                {/* Left: Scene Print */}
                <div className="flex flex-col gap-2 min-w-[110px]">
                    <div className="flex flex-col gap-1">
                        <p className="text-green-700 text-xs leading-tight">LIFTED PRINT (EVID.)</p>
                        <canvas
                            ref={liftedPrintRef}
                            width={120}
                            height={140}
                            className="border-2 border-green-700 bg-black"
                        />
                    </div>
                </div>

                {/* Center: Suspect Selector + Control Print */}
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex flex-col gap-1">
                        <p className="text-green-700 text-xs">SUSPECT INDEX</p>
                        <div className="flex gap-1">
                            {suspects.slice(0, 3).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setSelectedSuspectId(s.id);
                                        setStage('tune');
                                        setClickedPoints(0);
                                        setWrongSuspect(false);
                                        setMatchFound(false);
                                        setOverlayOffset({ x: 0, y: 0 });
                                        setStatus('ALIGN + FILTER, THEN TAG');
                                    }}
                                    className={`flex-1 px-2 py-1 text-xs truncate border border-green-800 ${selectedSuspectId === s.id
                                            ? 'bg-green-700 text-black font-bold'
                                            : 'bg-green-900/40 text-green-300 hover:bg-green-800/60'
                                        }`}
                                    title={s.name}
                                >
                                    {s.name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {suspect && (
                        <div className="flex flex-col gap-1 flex-1 min-h-0">
                            <p className="text-green-700 text-xs">{suspect.name.split(' ')[0]} PROFILE</p>
                            <canvas
                                ref={controlPrintRef}
                                width={120}
                                height={140}
                                onClick={handleControlPrintClick}
                                className={`border-2 border-green-700 bg-black flex-1 w-full ${stage === 'tag' ? 'cursor-crosshair' : 'cursor-default'
                                    }`}
                            />
                        </div>
                    )}
                </div>

                {/* Right: Control Panel */}
                <div className="flex flex-col gap-2 min-w-[150px] w-36">
                    {stage === 'tune' ? (
                        <div className="flex-1 flex flex-col gap-2 bg-green-950/60 border-2 border-green-900 p-2 text-xs min-h-0 overflow-y-auto">
                            <p className="text-green-400 font-bold text-sm">PHASE 1 · TUNING</p>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between mb-1 text-[11px] text-green-500">
                                        <span>ORIENT. ANGLE</span>
                                        <span className={`font-bold ${Math.abs(rotation) < 5 ? 'text-green-300' : 'text-yellow-400'}`}>
                                            {rotation}°
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-45"
                                        max="45"
                                        value={rotation}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full h-1 bg-green-900 accent-green-500"
                                    />
                                    <p className={`text-[10px] text-center mt-0.5 ${Math.abs(rotation) < 5 ? 'text-green-300' : 'text-yellow-400'}`}>
                                        {Math.abs(rotation) < 5 ? 'ALIGNED' : 'ADJUST TO <5°'}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex justify-between mb-1 text-[11px] text-green-500">
                                        <span>THRESHOLD FILTER</span>
                                        <span className={`font-bold ${threshold > 70 ? 'text-green-300' : 'text-yellow-400'}`}>
                                            {threshold}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={threshold}
                                        onChange={(e) => setThreshold(Number(e.target.value))}
                                        className="w-full h-1 bg-green-900 accent-green-500"
                                    />
                                    <p className={`text-[10px] text-center mt-0.5 ${threshold > 70 ? 'text-green-300' : 'text-yellow-400'}`}>
                                        {threshold > 70 ? 'CLEAR SIGNAL' : 'REDUCE NOISE >70'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setStage('tag')}
                                disabled={!canProceed || !suspect}
                                className={`mt-auto py-1 font-bold text-sm w-full ${canProceed && suspect
                                        ? 'bg-green-700 hover:bg-green-600 text-black border-2 border-green-600'
                                        : 'bg-green-900/30 text-green-900 border-2 border-green-900'
                                    }`}
                            >
                                ENTER COMPARE
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-2 bg-green-950/60 border-2 border-green-900 p-2 text-xs min-h-0">
                            <p className="text-green-400 font-bold text-sm">PHASE 2 · TAGGING</p>
                            <p className="text-[10px] text-green-500 leading-tight">Overlay is active. Nudge to align, then click 3 minutiae.</p>

                            <div className="grid grid-cols-3 gap-1">
                                <button className={`${bevelBtn} col-span-3 py-1 text-[11px]`} onClick={() => setOverlayOffset(o => ({ ...o, y: o.y - 2 }))}>▲ NUDGE</button>
                                <button className={`${bevelBtn} py-1 text-[11px]`} onClick={() => setOverlayOffset(o => ({ ...o, x: o.x - 2 }))}>◀</button>
                                <button
                                    className={`${bevelBtn} py-1 text-[11px]`}
                                    onClick={() => {
                                        setOverlayOffset({ x: 0, y: 0 });
                                        setClickedPoints(0);
                                        setStatus('ALIGN + TAG');
                                        setWrongSuspect(false);
                                        setMatchFound(false);
                                    }}
                                >
                                    RESET
                                </button>
                                <button className={`${bevelBtn} py-1 text-[11px]`} onClick={() => setOverlayOffset(o => ({ ...o, x: o.x + 2 }))}>▶</button>
                                <button className={`${bevelBtn} col-span-3 py-1 text-[11px]`} onClick={() => setOverlayOffset(o => ({ ...o, y: o.y + 2 }))}>▼ NUDGE</button>
                            </div>

                            <div className="flex flex-col items-center justify-center bg-green-900/40 border border-green-700 p-2 text-center min-h-[70px]">
                                <p className="text-green-300 text-sm font-bold">{status}</p>
                                <p className="text-green-600 text-[10px]">{clickedPoints}/{requiredPoints} points</p>
                            </div>

                            {matchFound ? (
                                <div className="flex-1 flex flex-col items-center justify-center bg-green-900/60 border-2 border-green-700 p-2 rounded">
                                    <p className="text-green-300 font-bold text-lg">✓ MATCH CONFIRMED</p>
                                    <p className="text-green-600 text-[10px] mt-1">Minutiae aligned</p>
                                </div>
                            ) : wrongSuspect ? (
                                <div className="flex-1 flex flex-col items-center justify-center bg-yellow-900/60 border-2 border-yellow-700 p-2 rounded">
                                    <p className="text-yellow-400 font-bold text-lg">✗ NO MATCH</p>
                                    <p className="text-yellow-600 text-[10px] mt-1">Pattern disagreement</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <p className="text-green-400 text-2xl font-bold">{clickedPoints}</p>
                                    <p className="text-green-600 text-[10px]">LOCK Δ · Λ · •</p>
                                    <p className="text-green-700 text-[9px] text-center mt-1">Click target crosshairs on profile</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MinutiaeMapper;
