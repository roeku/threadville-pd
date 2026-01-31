
import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useProgress } from '@react-three/drei';
import DeductionBoard from './components/DeductionBoard';
import { Monitor, Coffee, HelpCircle, MousePointer2 } from 'lucide-react';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<'DESK' | 'BOARD'>('DESK');
  const [isLinking, setIsLinking] = useState(false);

  return (
    <div className="relative w-full h-full bg-[#111]">
      {/* 2D HUD / Menu Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-500 ${viewState === 'DESK' ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 pointer-events-auto">
           <button 
            onClick={() => setViewState('BOARD')}
            className="bg-amber-900/80 text-amber-100 px-8 py-3 rounded border-2 border-amber-700 hover:bg-amber-800 hover:scale-105 transition shadow-xl font-bold uppercase tracking-widest backdrop-blur-sm"
           >
             Open Mind Palace
           </button>
        </div>
        
        <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-auto">
            <h1 className="text-5xl font-black text-white/90 tracking-tighter mb-2 drop-shadow-lg">DETECTIVE'S DESK</h1>
            <p className="text-white/60 font-mono tracking-widest">CASE #402: THE MANOR</p>
        </div>
      </div>

      {/* Board Mode HUD */}
      <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-300 ${viewState === 'BOARD' ? 'opacity-100' : 'opacity-0'}`}>
          {/* Controls Helper */}
          <div className="absolute bottom-6 left-6 text-white/70 bg-black/60 p-4 rounded-lg backdrop-blur-md pointer-events-auto">
              <h3 className="text-amber-500 font-bold mb-2 flex items-center gap-2">
                  <HelpCircle size={18} /> CONTROLS
              </h3>
              <ul className="text-sm space-y-1 font-mono">
                  <li>• <span className="text-white font-bold">DRAG</span> cards to organize.</li>
                  <li>• Click <span className="text-red-400 font-bold">RED PINS</span> to connect strings.</li>
                  <li>• Define logic (Matches, Locates, etc) in the menu.</li>
                  <li>• Flip the <span className="text-blue-300 font-bold">BREAKER SWITCH</span> to verify.</li>
                  <li>• Valid connections glow <span className="text-yellow-400 font-bold">GOLD</span>.</li>
              </ul>
          </div>

          {/* Linking Indicator */}
          {isLinking && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-6 py-2 rounded-full font-bold tracking-widest animate-pulse shadow-lg border border-red-400">
                  Select Target to Connect...
              </div>
          )}

          {/* Close Button */}
          <button 
            onClick={() => setViewState('DESK')}
            className="absolute top-4 left-4 z-50 bg-black/50 text-white p-3 rounded-full hover:bg-black/80 transition pointer-events-auto border border-white/10"
          >
            Close Board
          </button>
      </div>
      
      {/* The 3D Scene */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 35 }}
        className="touch-none"
      >
        <Suspense fallback={null}>
            <DeductionBoard viewState={viewState} onLinkingStateChange={setIsLinking} />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
};

export default App;
