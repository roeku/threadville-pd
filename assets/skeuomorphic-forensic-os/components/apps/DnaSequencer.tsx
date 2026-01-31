import React, { useState, useMemo } from 'react';
import { Activity, CheckCircle2, HelpCircle } from 'lucide-react';

export const DnaSequencer: React.FC = () => {
  const [frequency, setFrequency] = useState(50);
  const [phase, setPhase] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  
  const targetFrequency = 72;
  const targetPhase = 35;
  const tolerance = 5;

  const isMatched = 
    Math.abs(frequency - targetFrequency) < tolerance && 
    Math.abs(phase - targetPhase) < tolerance;

  // Generate bands based on parameters
  const generateBands = (freq: number, ph: number) => {
    const bands = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      // Create a pattern using sin wave logic mapped to vertical position
      const y = ((Math.sin((i + ph / 10) * (freq / 20)) + 1) / 2) * 80 + 10;
      bands.push(y);
    }
    return bands;
  };

  const sampleBands = useMemo(() => generateBands(targetFrequency, targetPhase), []);
  const userBands = generateBands(frequency, phase);

  return (
    <div className="h-full flex flex-col gap-4 p-4 relative">
       {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 rounded">
             <h3 className="text-emerald-500 font-bold mb-4 flex items-center gap-2 border-b border-emerald-900 pb-2"><HelpCircle size={18} /> SEQUENCER GUIDE</h3>
             <ul className="text-slate-300 text-xs sm:text-sm space-y-3 text-left font-mono list-disc pl-4 mb-6">
               <li>Adjust <span className="text-emerald-400 font-bold">FREQUENCY</span> to match the spacing between bands.</li>
               <li>Adjust <span className="text-emerald-400 font-bold">PHASE SHIFT</span> to align the bands vertically.</li>
               <li>Match the <span className="text-amber-400">SAMPLE</span> pattern to the <span className="text-blue-400">CONTROL</span> pattern exactly.</li>
             </ul>
             <button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded border border-slate-600 transition-colors">CLOSE GUIDE</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/80 p-3 border border-slate-700 rounded flex justify-between items-center shrink-0">
        <div className="text-xs text-emerald-500 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} /> Sequence Analysis
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHelp(true)} 
            className="text-slate-500 hover:text-emerald-400 transition-colors"
            title="Help"
          >
            <HelpCircle size={14} />
          </button>
          {isMatched && (
            <div className="text-emerald-400 font-bold text-xs flex items-center gap-1 animate-pulse">
              <CheckCircle2 size={14} /> MATCH
            </div>
          )}
        </div>
      </div>

      {/* Main Analysis Area - Flexible */}
      <div className="flex-1 flex gap-4 sm:gap-8 justify-center items-stretch min-h-0">
        {/* Sample Strip (Control) */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[4rem]">
          <span className="text-[10px] text-slate-500 font-sans tracking-tight">CONTROL</span>
          <div className="w-full h-full bg-slate-900/50 border border-slate-700 relative rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
            {sampleBands.map((top, i) => (
              <div
                key={i}
                className="absolute left-1 right-1 h-1.5 bg-blue-500/50 shadow-[0_0_5px_rgba(59,130,246,0.8)] rounded-sm"
                style={{ top: `${top}%` }}
              />
            ))}
          </div>
        </div>

        {/* Comparison Strip (User) */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[4rem]">
          <span className="text-[10px] text-slate-500 font-sans tracking-tight">SAMPLE</span>
          <div className={`w-full h-full bg-slate-900/50 border transition-colors relative rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] ${isMatched ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-slate-700'}`}>
            {userBands.map((top, i) => (
              <div
                key={i}
                className={`absolute left-1 right-1 h-1.5 transition-colors duration-75 rounded-sm ${isMatched ? 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.9)]' : 'bg-amber-500/50 shadow-[0_0_5px_rgba(245,158,11,0.6)]'}`}
                style={{ top: `${top}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800/50 p-3 rounded border border-slate-700 shrink-0 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[10px] text-slate-400 mb-1 font-sans uppercase">Frequency</label>
          <input
            type="range"
            min="10"
            max="100"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[10px] text-slate-400 mb-1 font-sans uppercase">Phase Shift</label>
          <input
            type="range"
            min="0"
            max="100"
            value={phase}
            onChange={(e) => setPhase(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};