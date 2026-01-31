import React, { useState, useRef } from 'react';
import GameScene from './components/GameScene';
import { generateTTS } from './services/geminiService';
import { useGameStore } from './stores/useGameStore';
import { GameState, EvidenceType, CaseFile } from './types';
import { Loader2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import MainMenu from './components/MainMenu';
import AdminDashboard from './components/admin/AdminDashboard';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentCase: null,
    status: 'briefing',
    focusedItemId: null,
    loading: false,
    error: null,
  });

  const [isAdminMode, setIsAdminMode] = useState(false);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // New State for Board
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkStartItem, setLinkStartItem] = useState<string | null>(null);

  const handlePinItem = (id: string, pinned: boolean) => {
    setPinnedItems(prev => {
      const next = new Set(prev);
      if (pinned) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleConnection = (id1: string, id2: string) => {
    if (id1 === id2) return;
    // Check if exists
    const exists = connections.some(c => (c[0] === id1 && c[1] === id2) || (c[0] === id2 && c[1] === id1));
    if (!exists) {
      setConnections(prev => [...prev, [id1, id2]]);
    }
  };

  const { setFocusedItem } = useGameStore();
  const setView = useGameStore(state => state.setView);
  const documentStates = useGameStore(state => state.documentStates);
  const setDocumentPage = useGameStore(state => state.setDocumentPage);

  const handleFocusItem = (id: string | null) => {
    setFocusedItem(id);
    setGameState(prev => ({ ...prev, focusedItemId: id }));
  };

  const handleStartCase = (caseData: CaseFile) => {
    setGameState(prev => ({
      ...prev,
      currentCase: caseData,
      loading: false,
      status: 'investigating',
      error: null
    }));
    setFocusedItem(null);
    setAudioUrl(null);
    setView('DESK');
  };

  const playBriefing = async () => {
    if (!gameState.currentCase) return;

    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      let url = audioUrl;

      if (!url) {
        url = await generateTTS(gameState.currentCase.briefing);
        setAudioUrl(url);
      }

      if (url) {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        } else {
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          audio.play();
        }
      }
    } catch (e) {
      console.error("TTS failed", e);
      setIsPlayingAudio(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusedItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFocusedItem]);

  // --- Printer Logic ---
  const printQueue = useGameStore(state => state.printQueue);
  const clearPrintQueue = useGameStore(state => state.clearPrintQueue);

  React.useEffect(() => {
    if (printQueue.length > 0 && gameState.currentCase) {
      const newItems = printQueue.map((printJob, i) => ({
        id: `printout_${Date.now()}_${i}`,
        type: EvidenceType.PAPER,
        label: printJob.title || "Printed Report",
        content: printJob.content,
        // Spawn inside/near FileBox_Black (x: -0.3, y: 0.9, z: 0.1)
        // FileBox is roughly at [-0.297, 0.909, 0.113]
        position: [-0.3 + (Math.random() * 0.05), 0.95, 0.12 + (Math.random() * 0.05)] as [number, number, number],
        rotation: [0, (Math.random() - 0.5) * 0.2, 0] as [number, number, number], // Less rotation to look stacked
        clues: ["Generated Report"],
        metadata: printJob.metadata
      }));

      setGameState(prev => {
        if (!prev.currentCase) return prev;
        return {
          ...prev,
          currentCase: {
            ...prev.currentCase,
            entities: [...prev.currentCase.entities, ...newItems]
          }
        };
      });

      clearPrintQueue();
    }
  }, [printQueue, gameState.currentCase, clearPrintQueue]);

  return (
    <div style={{ height: "100vh", width: "100vw" }} className="relative w-full h-full overflow-hidden text-neutral-200 font-sans select-none">

      {/* ADMIN MODE */}
      {isAdminMode && !gameState.currentCase && (
        <div className="absolute inset-0 z-50 bg-slate-900">
          <AdminDashboard onExit={() => setIsAdminMode(false)} />
        </div>
      )}

      {/* MAIN MENU */}
      {!isAdminMode && !gameState.currentCase && (
        <div className="absolute inset-0 z-50 bg-black">
          <MainMenu
            onStartCase={handleStartCase}
            onOpenAdmin={() => setIsAdminMode(true)}
          />
        </div>
      )}

      {/* 3D Scene Layer (Only active if case is loaded) */}
      <div className="absolute inset-0 z-0">
        {gameState.currentCase && (
          <GameScene
            evidence={gameState.currentCase.entities}
            focusedItemId={gameState.focusedItemId}
            setFocusedItemId={handleFocusItem}
            pinnedItems={pinnedItems}
            onPinItem={handlePinItem}
            connections={connections}
            onConnect={handleConnection}
            isLinkMode={isLinkMode}
            caseFile={gameState.currentCase}
          />
        )}
      </div>

      {/* UI Overlay Layer */}
      {gameState.currentCase && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">

          {/* Header - Minimal in-game */}
          <div className="flex justify-between items-start pointer-events-auto"></div>

          {gameState.loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-50 pointer-events-auto cursor-wait">
              <div className="text-center">
                <Loader2 size={48} className="animate-spin text-amber-600 mx-auto mb-4" />
                <p className="font-mono text-amber-500 animate-pulse text-lg">LOADING CASE ASSETS...</p>
              </div>
            </div>
          )}

          {/* Bottom HUD: Briefing & Tools */}
          {/* Bottom HUD: Only show briefing control, remove text */}
          {(gameState.currentCase && gameState.status === 'investigating') && (
            <div className="flex justify-between items-end pointer-events-none w-full">
              {/* <div className="bg-black/0 max-w-lg pointer-events-auto">
              <button
                onClick={playBriefing}
                className={`p-4 transition rounded-full ${isPlayingAudio ? 'text-amber-500 bg-amber-900/30' : 'text-neutral-500 hover:text-amber-400 bg-black/50'} border border-neutral-800`}
                title="Play Dispatch Audio"
              >
                {isPlayingAudio ? <Loader2 size={32} className="animate-spin" /> : <Play size={32} />}
              </button>
            </div> */}

              <div className="text-right ml-4 pointer-events-auto">
                <button
                  onClick={() => setGameState(prev => ({ ...prev, currentCase: null, status: 'briefing', focusedItemId: null }))}
                  className="bg-neutral-900/40 hover:bg-neutral-800 text-neutral-500 hover:text-white px-3 py-1 border border-neutral-900 font-mono text-[10px] uppercase tracking-widest transition"
                >
                  Archive Case (Exit)
                </button>
              </div>
            </div>
          )}

          {/* Global Document Navigation HUD */}
          {gameState.focusedItemId && documentStates[gameState.focusedItemId] && documentStates[gameState.focusedItemId].totalPages > 1 && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
              <div className="flex items-center gap-4 bg-black/90 text-white rounded-full px-6 py-3 backdrop-blur-md shadow-2xl border border-white/20">
                <button
                  onClick={() => {
                    const s = documentStates[gameState.focusedItemId!];
                    const prev = (s.currentPage - 1 + s.totalPages) % s.totalPages;
                    setDocumentPage(gameState.focusedItemId!, prev);
                  }}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 flex items-center justify-center w-10 h-10 border border-transparent hover:border-white/30"
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs text-neutral-400 font-bold tracking-widest uppercase">PAGE</span>
                  <span className="font-mono text-xl font-bold tracking-widest">
                    {documentStates[gameState.focusedItemId].currentPage + 1} <span className="text-neutral-500">/</span> {documentStates[gameState.focusedItemId].totalPages}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const s = documentStates[gameState.focusedItemId!];
                    const next = (s.currentPage + 1) % s.totalPages;
                    setDocumentPage(gameState.focusedItemId!, next);
                  }}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors active:scale-95 flex items-center justify-center w-10 h-10 border border-transparent hover:border-white/30"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
