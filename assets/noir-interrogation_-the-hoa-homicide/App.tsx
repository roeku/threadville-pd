import React, { useState } from 'react';
import { CASE_DATA } from './constants';
import { Suspect, CaseData } from './types';
import { SuspectCard } from './components/SuspectCard';
import { InterrogationRoom } from './components/InterrogationRoom';

const App: React.FC = () => {
  const [activeCase] = useState<CaseData>(CASE_DATA[0].content);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [isInterrogating, setIsInterrogating] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);

  // API Key Check
  if (!process.env.API_KEY) {
    return (
        <div className="min-h-screen bg-noir-900 flex items-center justify-center text-noir-paper font-mono">
            <div className="max-w-md text-center p-8 border border-red-900 bg-black">
                <h1 className="text-2xl font-display text-red-600 mb-4">SYSTEM ERROR</h1>
                <p>Missing API Access Token.</p>
                <p className="text-xs text-white/50 mt-4">Please configure process.env.API_KEY to proceed.</p>
            </div>
        </div>
    )
  }

  const startInterrogation = () => {
    if (selectedSuspect) {
      setIsInterrogating(true);
    }
  };

  if (isInterrogating && selectedSuspect) {
    return (
      <div className="h-screen w-screen bg-noir-900">
        <InterrogationRoom 
          suspect={selectedSuspect} 
          caseData={activeCase} 
          onBack={() => setIsInterrogating(false)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir-900 text-noir-paper font-sans selection:bg-noir-accent selection:text-noir-900 flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar: Case Files */}
      <div className={`
        fixed md:relative z-20 top-0 left-0 h-full w-full md:w-96 bg-noir-800 border-r border-white/5 shadow-2xl transform transition-transform duration-300
        ${showBriefing ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
         <div className="p-8 h-full overflow-y-auto">
            <div className="border-b-2 border-noir-accent pb-4 mb-6">
                <h1 className="font-display text-4xl text-white leading-none">THE HOA<br/><span className="text-noir-accent">HOMICIDE</span></h1>
                <div className="mt-2 font-mono text-xs text-white/40 flex justify-between">
                    <span>DIFF: {activeCase.difficulty.toUpperCase()}</span>
                    <span>{activeCase.caseId}</span>
                </div>
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="font-mono text-xs font-bold text-noir-accent uppercase mb-2 tracking-widest">Incident Briefing</h2>
                    <p className="font-mono text-sm text-white/80 leading-relaxed text-justify">
                        {activeCase.briefing}
                    </p>
                </section>

                <section>
                    <h2 className="font-mono text-xs font-bold text-noir-accent uppercase mb-2 tracking-widest">Key Evidence</h2>
                    <ul className="space-y-4">
                        {activeCase.entities.map(e => (
                            <li key={e.id} className="bg-black/30 p-3 border-l border-white/20">
                                <div className="font-display text-lg text-white/90">{e.label}</div>
                                <div className="font-mono text-xs text-white/50 mt-1">{e.clues[0]}</div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
         </div>
         {/* Mobile toggle */}
         <button 
           className="md:hidden absolute top-4 right-4 text-white"
           onClick={() => setShowBriefing(false)}
         >
            ✕
         </button>
      </div>

      {/* Main Content: Suspect Board */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex justify-between items-center bg-noir-800 border-b border-white/10">
            <span className="font-display text-xl">CASE FILES</span>
            <button onClick={() => setShowBriefing(true)} className="text-noir-accent font-mono text-xs border border-noir-accent px-2 py-1">VIEW BRIEF</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <h2 className="font-display text-3xl md:text-5xl text-white/90 mb-2">Suspect Board</h2>
                        <p className="font-mono text-white/40">Select a person of interest to begin interrogation.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    {activeCase.suspects.map(suspect => (
                        <SuspectCard
                            key={suspect.id}
                            suspect={suspect}
                            isSelected={selectedSuspect?.id === suspect.id}
                            onSelect={setSelectedSuspect}
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="h-24 bg-noir-800 border-t border-white/10 flex items-center justify-center px-8 z-10">
            <div className="max-w-4xl w-full flex justify-between items-center">
                <div className="hidden md:block">
                     <div className="font-mono text-xs text-white/30 uppercase">Selected Subject</div>
                     <div className="font-display text-xl text-noir-accent">
                         {selectedSuspect ? selectedSuspect.name : 'NONE'}
                     </div>
                </div>
                
                <button
                    disabled={!selectedSuspect}
                    onClick={startInterrogation}
                    className={`
                        px-8 py-3 font-display text-xl tracking-widest transition-all duration-300 transform
                        ${selectedSuspect 
                            ? 'bg-noir-accent text-noir-900 hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(217,119,6,0.3)]' 
                            : 'bg-white/5 text-white/20 cursor-not-allowed'}
                    `}
                >
                    ENTER INTERROGATION ROOM
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;