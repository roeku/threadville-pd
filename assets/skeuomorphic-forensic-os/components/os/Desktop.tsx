import React from 'react';
import { useOS } from '../../context/OSContext';
import { APPS } from '../../constants';
import { WindowFrame } from './WindowFrame';
import { AppId, WindowState } from '../../types';

export const Desktop: React.FC = () => {
  const { windows, openApp } = useOS();
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden p-4">
      {/* Desktop Shortcuts */}
      <div className="absolute inset-4 flex flex-col flex-wrap content-start items-start gap-y-6 gap-x-4 z-0 pointer-events-none">
        {(Object.keys(APPS) as AppId[]).map((appId) => (
          <button
            key={appId}
            onDoubleClick={() => openApp(appId)}
            className="group flex flex-col items-center gap-1 w-20 text-center focus:outline-none pointer-events-auto"
          >
            <div className="w-12 h-12 bg-slate-800/40 rounded-lg border border-transparent group-hover:bg-slate-700/60 group-hover:border-slate-500/50 flex items-center justify-center text-slate-300 transition-all shadow-sm backdrop-blur-sm">
              {React.cloneElement(APPS[appId].icon as React.ReactElement<any>, { size: 28 })}
            </div>
            <span className="text-[11px] font-medium text-slate-300 bg-slate-900/40 px-1.5 py-0.5 rounded shadow-sm group-hover:text-white font-sans">
              {APPS[appId].name}
            </span>
          </button>
        ))}
      </div>

      {/* Windows Portal Layer */}
      {Object.values(windows).map((win: WindowState) => {
        const App = APPS[win.appId].component;
        return (
          <WindowFrame key={win.id} window={win} parentRef={containerRef}>
            <App />
          </WindowFrame>
        );
      })}
    </div>
  );
};