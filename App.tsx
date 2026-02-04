import React, { useState, useRef } from 'react';
import GameScene from './components/GameScene';
import { generateTTS } from './services/geminiService';
import { useGameStore } from './stores/useGameStore';
import { createDeductionState } from './services/deductionService';
import { GameState, EvidenceType, CaseFile } from './types';
import { Loader2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import MainMenu from './components/MainMenu';
import AdminDashboard from './components/admin/AdminDashboard';
import { startCaseSession, completeCaseSession, getSessionReport } from './services/gameProgressService';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentCase: null,
    status: 'briefing',
    focusedItemId: null,
    loading: false,
    error: null,
  });

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [completionReport, setCompletionReport] = useState<any>(null);
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
  const setDeductionState = useGameStore(state => state.setDeductionState);
  const clearLinks = useGameStore(state => state.clearLinks);
  const setView = useGameStore(state => state.setView);
  const documentStates = useGameStore(state => state.documentStates);
  const setDocumentPage = useGameStore(state => state.setDocumentPage);

  // Game Progress Tracking
  const sessionId = useGameStore(state => state.sessionId);
  const sessionStartTime = useGameStore(state => state.sessionStartTime);
  const setSessionId = useGameStore(state => state.setSessionId);
  const setSessionStartTime = useGameStore(state => state.setSessionStartTime);
  const showCompletionModal = useGameStore(state => state.showCompletionModal);
  const setShowCompletionModal = useGameStore(state => state.setShowCompletionModal);
  const solved = useGameStore(state => state.solved);
  const setSolved = useGameStore(state => state.setSolved);

  const handleFocusItem = (id: string | null) => {
    setFocusedItem(id);
    setGameState(prev => ({ ...prev, focusedItemId: id }));
  };

  const handleStartCase = async (caseData: CaseFile) => {
    console.log('[Case Solution]', caseData.solution);
    const deductionState = createDeductionState(caseData);

    // Log the expected connections for debugging
    console.log('\n=== DEDUCTION PUZZLE ===');
    console.log(`Total Rules: ${deductionState.rules.length}`);
    console.log(`Critical Rules: ${deductionState.criticalRuleIds.length}`);
    console.log('\n--- CRITICAL CONNECTIONS (Required to solve) ---');
    deductionState.rules
      .filter(r => r.weight >= 1.0 && !r.isRedHerring)
      .forEach((rule, i) => {
        const sourceItem = caseData.entities.find(e => e.id === rule.source) || caseData.suspects.find(s => s.id === rule.source);
        const targetItem = caseData.entities.find(e => e.id === rule.target) || caseData.suspects.find(s => s.id === rule.target);
        console.log(`${i + 1}. [${sourceItem?.label || rule.source}] --${rule.type}--> [${targetItem?.label || targetItem?.name || rule.target}]`);
        console.log(`   Reasoning: ${rule.reasoning}`);
      });
    console.log('\n--- RED HERRINGS (Optional/Misleading) ---');
    deductionState.rules
      .filter(r => r.isRedHerring)
      .forEach((rule, i) => {
        const sourceItem = caseData.entities.find(e => e.id === rule.source) || caseData.suspects.find(s => s.id === rule.source);
        const targetItem = caseData.entities.find(e => e.id === rule.target) || caseData.suspects.find(s => s.id === rule.target);
        console.log(`${i + 1}. [${sourceItem?.label || rule.source}] --${rule.type}--> [${targetItem?.label || targetItem?.name || rule.target}]`);
      });
    console.log('========================\n');

    setDeductionState(deductionState);
    clearLinks();
    setSolved(false);
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

    // Start tracking session
    try {
      const newSessionId = await startCaseSession(caseData);
      setSessionId(newSessionId);
      setSessionStartTime(Date.now());
      console.log('📊 Session started:', newSessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
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

  // Watch for case completion
  React.useEffect(() => {
    if (solved && sessionId && sessionStartTime && !completionReport && !showCompletionModal) {
      // Case just got solved!
      console.log('🎯 Case completion flow triggered');

      // Calculate time to complete
      const timeElapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
      console.log(`⏱️ Session time: ${timeElapsedSeconds}s`);

      // IMMEDIATE FEEDBACK: Switch to desk and show the folder (even if loading)
      console.log('🏠 Setting view to DESK');
      setView('DESK');
      console.log('📂 Showing completion modal (loading state)');
      setShowCompletionModal(true);

      const completeSession = async () => {
        try {
          // This might take a moment, but the user is already looking at the "Processing..." folder
          await completeCaseSession(sessionId, true, sessionStartTime);
          console.log('✅ Session completed successfully');

          // Load session report
          try {
            console.log('📂 Loading session report for:', sessionId);
            const report = await getSessionReport(sessionId);
            console.log('📊 Report loaded:', report);
            setCompletionReport(report);
          } catch (error) {
            console.error('❌ Failed to load session report:', error);
          }
        } catch (error) {
          console.error('❌ Failed to complete session:', error);
        }
      };

      // Brief delay to let smooth camera transition start before heavy async work
      setTimeout(completeSession, 1000);
    }
  }, [solved, sessionId, sessionStartTime, completionReport, showCompletionModal, setShowCompletionModal, setView]);

  // --- Printer Logic ---
  const printQueue = useGameStore(state => state.printQueue);
  const clearPrintQueue = useGameStore(state => state.clearPrintQueue);

  React.useEffect(() => {
    if (printQueue.length > 0 && gameState.currentCase) {
      const newItems = printQueue.map((printJob, i) => ({
        id: printJob.reportId || `printout_${Date.now()}_${i}`,
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
        const existingEntities = prev.currentCase.entities.filter(
          entity => !newItems.some(item => item.id === entity.id)
        );
        return {
          ...prev,
          currentCase: {
            ...prev.currentCase,
            entities: [...existingEntities, ...newItems]
          }
        };
      });

      clearPrintQueue();
    }
  }, [printQueue, gameState.currentCase, clearPrintQueue]);

  // Completion modal handlers
  const handleNextCase = () => {
    // Reset state and go to main menu (in the future, load next case)
    setShowCompletionModal(false);
    setSessionId(null);
    setSessionStartTime(null);
    setDeductionState(null);
    clearLinks();
    setSolved(false);
    setCompletionReport(null);
    setGameState(prev => ({ ...prev, currentCase: null, status: 'briefing', focusedItemId: null }));
  };

  const handleReplayCase = () => {
    if (gameState.currentCase) {
      setShowCompletionModal(false);
      handleStartCase(gameState.currentCase);
      setCompletionReport(null);
    }
  };

  const handleMainMenu = () => {
    setShowCompletionModal(false);
    setSessionId(null);
    setSessionStartTime(null);
    setDeductionState(null);
    clearLinks();
    setSolved(false);
    setCompletionReport(null);
    setGameState(prev => ({ ...prev, currentCase: null, status: 'briefing', focusedItemId: null }));
  };

  // Handle folder actions from GameScene
  const handleFolderAction = (action: 'next' | 'replay' | 'menu') => {
    if (action === 'next') handleNextCase();
    else if (action === 'replay') handleReplayCase();
    else handleMainMenu();
  };

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
            showCompletionFolder={showCompletionModal}
            completionReport={completionReport}
            sessionId={sessionId}
            sessionStartTime={sessionStartTime}
            onFolderAction={handleFolderAction}
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
                  onClick={() => {
                    setDeductionState(null);
                    clearLinks();
                    setGameState(prev => ({ ...prev, currentCase: null, status: 'briefing', focusedItemId: null }));
                  }}
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
