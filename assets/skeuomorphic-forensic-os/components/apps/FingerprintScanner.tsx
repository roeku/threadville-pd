import React, { useState, useRef, useEffect } from 'react';
import { Scan, Target, Check, HelpCircle } from 'lucide-react';

export const FingerprintScanner: React.FC = () => {
  const [gain, setGain] = useState(50);
  const [threshold, setThreshold] = useState(40);
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);
  
  // Targets for minutiae matching (percentage coordinates)
  const targets = [
    { x: 30, y: 40 },
    { x: 60, y: 50 },
    { x: 45, y: 70 },
  ];

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2; // Center
      const y = e.clientY - rect.top - rect.height / 2; // Center
      setOverlayPos({ x, y });
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if clicked near a target and aligned
    const isAligned = Math.abs(overlayPos.x) < 20 && Math.abs(overlayPos.y) < 20;
    
    if (isAligned) {
      const hit = targets.find(t => Math.hypot(t.x - x, t.y - y) < 5);
      if (hit && !points.find(p => p.x === hit.x && p.y === hit.y)) {
        setPoints([...points, hit]);
      }
    }
  };

  const isComplete = points.length === targets.length;

  return (
    <div className="h-full flex flex-col gap-4 select-none p-4 relative">
        {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 rounded">
             <h3 className="text-emerald-500 font-bold mb-4 flex items-center gap-2 border-b border-emerald-900 pb-2"><HelpCircle size={18} /> SCANNER GUIDE</h3>
             <ul className="text-slate-300 text-xs sm:text-sm space-y-3 text-left font-mono list-disc pl-4 mb-6">
               <li>Drag the <span className="text-emerald-400 font-bold">GREEN OVERLAY</span> to align it perfectly with the white base print.</li>
               <li>Use sliders to adjust <span className="text-slate-300 font-bold">Gain</span> and <span className="text-slate-300 font-bold">Threshold</span> if visibility is poor.</li>
               <li>Once aligned, <span className="text-emerald-400 font-bold">CLICK</span> on the minutiae points (small circles) to identify them.</li>
               <li>Find all 3 matches to complete the scan.</li>
             </ul>
             <button onClick={() => setShowHelp(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded border border-slate-600 transition-colors">CLOSE GUIDE</button>
        </div>
      )}

       <div className="bg-slate-900/80 p-2 border border-slate-700 flex justify-between items-center text-xs shrink-0">
          <span className="text-slate-400">SUBJECT: A. DOE</span>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowHelp(true)} 
                className="text-slate-500 hover:text-emerald-400 transition-colors"
                title="Help"
              >
                <HelpCircle size={14} />
              </button>
              <span className={`${isComplete ? 'text-emerald-500' : 'text-amber-500'}`}>
                {isComplete ? 'MATCH CONFIRMED' : `${points.length}/3 MINUTIAE IDENTIFIED`}
              </span>
          </div>
       </div>

       <div className="flex-1 relative bg-black border border-slate-700 overflow-hidden cursor-crosshair min-h-[100px]" ref={containerRef} onClick={handleCanvasClick}>
          {/* Base Print (Suspect) */}
          <div className="absolute inset-0 opacity-50 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 stroke-slate-600 fill-none stroke-[0.5]">
               <path d="M50 90 Q10 50 50 10 Q90 50 50 90" />
               <path d="M50 80 Q20 50 50 20 Q80 50 50 20 Q80 50 50 80" />
               <path d="M50 70 Q30 50 50 30 Q70 50 50 70" />
               {/* Minutiae fake details */}
               <circle cx="30" cy="40" r="1" className="fill-slate-600 stroke-none" />
               <circle cx="60" cy="50" r="1" className="fill-slate-600 stroke-none" />
               <circle cx="45" cy="70" r="1" className="fill-slate-600 stroke-none" />
            </svg>
          </div>

          {/* Lifted Print (Overlay) */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-move mix-blend-screen"
            style={{ 
              transform: `translate(${overlayPos.x}px, ${overlayPos.y}px)`,
              opacity: gain / 100,
              filter: `contrast(${threshold}%)`
            }}
            onPointerDown={handlePointerDown}
          >
             <svg viewBox="0 0 100 100" className="w-3/4 h-3/4 stroke-emerald-500 fill-none stroke-[0.5]">
               <path d="M50 90 Q10 50 50 10 Q90 50 50 90" />
               <path d="M50 80 Q20 50 50 20 Q80 50 50 80" />
               <path d="M50 70 Q30 50 50 30 Q70 50 70" />
               <circle cx="30" cy="40" r="1" className="fill-emerald-500 stroke-none" />
               <circle cx="60" cy="50" r="1" className="fill-emerald-500 stroke-none" />
               <circle cx="45" cy="70" r="1" className="fill-emerald-500 stroke-none" />
            </svg>
          </div>

          {/* Points */}
          {points.map((p, i) => (
             <div 
               key={i} 
               className="absolute w-4 h-4 -ml-2 -mt-2 border border-emerald-400 rounded-full flex items-center justify-center animate-ping"
               style={{ left: `${p.x}%`, top: `${p.y}%` }}
             >
                <div className="w-1 h-1 bg-emerald-400 rounded-full" />
             </div>
          ))}

          {/* Points Static (Matched) */}
          {points.map((p, i) => (
             <div 
               key={`static-${i}`} 
               className="absolute w-4 h-4 -ml-2 -mt-2 border border-emerald-500 rounded-full flex items-center justify-center"
               style={{ left: `${p.x}%`, top: `${p.y}%` }}
             >
                <Check size={10} className="text-emerald-500" />
             </div>
          ))}
       </div>

       {/* Controls */}
       <div className="grid grid-cols-2 gap-4 bg-slate-800/40 p-3 rounded border border-slate-700 shrink-0">
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">Signal Gain</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={gain} 
              onChange={e => setGain(Number(e.target.value))}
              className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">Noise Threshold</label>
            <input 
              type="range" 
              min="0" max="200" 
              value={threshold} 
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
            />
          </div>
       </div>
    </div>
  );
};