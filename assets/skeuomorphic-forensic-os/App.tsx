import React from 'react';
import { OSProvider } from './context/OSContext';
import { Desktop } from './components/os/Desktop';
import { Taskbar } from './components/os/Taskbar';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-[#050505] flex items-center justify-center font-sans select-none">
      {/* Monitor Bezel / Container */}
      <div className="relative w-full h-full max-w-[1600px] aspect-[4/3] bg-slate-900 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col">
        
        {/* Screen Effects Layer (Over everything) */}
        <div className="absolute inset-0 z-[9999] pointer-events-none overflow-hidden rounded-lg">
          {/* Scanlines */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
            backgroundSize: '100% 4px, 6px 100%'
          }} />
          
          {/* Moving Scanline Bar */}
          <div className="absolute inset-x-0 h-1 bg-white/5 scanline-bar blur-sm" />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
          
          {/* Subtle Flicker */}
          <div className="absolute inset-0 bg-white/5 opacity-[0.02] crt-flicker mix-blend-overlay" />
          
          {/* Screen Gloss/Reflection */}
          <div className="absolute top-0 right-0 w-2/3 h-1/3 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-[100px] pointer-events-none" />
        </div>

        {/* Wallpaper */}
        <div className="absolute inset-0 z-0 bg-slate-950">
           {/* Abstract Grid Wallpaper */}
           <div className="w-full h-full opacity-20" style={{
             backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }} />
           <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-transparent to-slate-900" />
           
           {/* Logo Watermark */}
           <div className="absolute bottom-20 right-20 text-slate-800 font-black text-9xl tracking-tighter opacity-10 select-none">
             PD-OS
           </div>
        </div>

        {/* OS Logic */}
        <OSProvider>
          <Desktop />
          <Taskbar />
        </OSProvider>

      </div>
    </div>
  );
};

export default App;
