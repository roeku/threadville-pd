import React, { useState, useEffect, useRef } from 'react';
import { Radio, HelpCircle, Activity } from 'lucide-react';

export const Spectrograph: React.FC = () => {
  const [amplitude, setAmplitude] = useState(30);
  const [wavelength, setWavelength] = useState(50);
  const [showHelp, setShowHelp] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const targetAmp = 75;
  const targetWave = 25;
  const tolerance = 5;

  const isLocked = 
    Math.abs(amplitude - targetAmp) < tolerance && 
    Math.abs(wavelength - targetWave) < tolerance;

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
      for(let x = 0; x < width; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
      for(let y = 0; y < height; y+=40) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
      ctx.stroke();

      const centerY = height / 2;
      const scaleY = height / 3;

      // Target Wave (White)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin((x + t) * (targetWave / 500)) * (targetAmp / 100 * scaleY);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // User Wave (Red -> Green)
      ctx.beginPath();
      ctx.strokeStyle = isLocked ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      const noise = isLocked ? 0 : (Math.random() - 0.5) * 5; 
      
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin((x + t) * (wavelength / 500)) * (amplitude / 100 * scaleY) + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 2;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [amplitude, wavelength, isLocked]);

  return (
    <div className="h-full flex flex-col p-4 gap-4 relative">
      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 rounded">
             <h3 className="text-emerald-500 font-bold mb-4 flex items-center gap-2 border-b border-emerald-900 pb-2"><HelpCircle size={18} /> SPECTUNER GUIDE</h3>
             <ul className="text-slate-300 text-xs sm:text-sm space-y-3 text-left font-mono list-disc pl-4 mb-6">
               <li>The <span className="text-white font-bold">WHITE WAVE</span> is the encrypted signal.</li>
               <li>The <span className="text-red-500 font-bold">RED WAVE</span> is your tuner.</li>
               <li>Adjust <span className="text-emerald-400 font-bold">AMPLITUDE</span> (height) and <span className="text-emerald-400 font-bold">WAVELENGTH</span> (width).</li>
               <li>Match your wave to the target to <span className="text-emerald-400 font-bold">LOCK</span> the signal.</li>
             </ul>
             <button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded border border-slate-600 transition-colors">CLOSE GUIDE</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/80 p-3 border border-slate-700 rounded flex justify-between items-center shrink-0">
        <div className="text-xs text-emerald-500 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} /> Signal Analysis
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHelp(true)} 
            className="text-slate-500 hover:text-emerald-400 transition-colors"
            title="Help"
          >
            <HelpCircle size={14} />
          </button>
          {isLocked && <span className="text-emerald-400 text-xs font-bold animate-pulse">LOCKED</span>}
        </div>
      </div>

      {/* Dynamic Canvas Container */}
      <div className="flex-1 min-h-[120px] bg-black border border-slate-700 rounded relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-2 right-2 text-xs font-mono text-emerald-500 flex items-center gap-2">
           <Radio size={14} className={isLocked ? "animate-pulse" : ""} />
        </div>
      </div>

      {/* Controls - Flex wrap for small widths */}
      <div className="flex flex-wrap gap-4 px-4 py-4 bg-slate-800/30 rounded border border-slate-700/50 shrink-0">
        <div className="flex-1 min-w-[120px] flex flex-col gap-2">
           <label className="text-xs text-slate-400 font-sans uppercase font-bold">Amplitude</label>
           <div className="relative h-12 flex items-center">
             <input 
                type="range" 
                min="0" max="100" 
                value={amplitude} 
                onChange={(e) => setAmplitude(Number(e.target.value))}
                className="w-full bg-transparent appearance-none cursor-pointer z-10 
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                           [&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-800 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
             />
             <div className="absolute inset-x-0 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: `${amplitude}%` }} />
             </div>
           </div>
        </div>

        <div className="flex-1 min-w-[120px] flex flex-col gap-2">
           <label className="text-xs text-slate-400 font-sans uppercase font-bold">Wavelength</label>
           <div className="relative h-12 flex items-center">
             <input 
                type="range" 
                min="10" max="100" 
                value={wavelength} 
                onChange={(e) => setWavelength(Number(e.target.value))}
                className="w-full bg-transparent appearance-none cursor-pointer z-10
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                           [&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-800 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
             />
             <div className="absolute inset-x-0 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500" style={{ width: `${(wavelength - 10) / 90 * 100}%` }} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};