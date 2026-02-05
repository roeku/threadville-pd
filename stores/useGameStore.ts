import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { EvidenceLink, LinkType, DeductionState } from '../types/deduction';
import { validateLink, isCaseSolved } from '../services/deductionService';

export type GameView = 'DESK' | 'BOARD' | 'EVIDENCE' | 'COMPUTER' | 'CABINET';

interface StoreState {
  currentView: GameView;
  isInspecting: boolean;
  focusedItemId: string | null;
  hoveredItemId: string | null;
  
  // Session State
  unlockedForensics: Set<string>;
  uncoveredClues: Set<string>;
  printQueue: { content: string, title?: string, metadata?: any }[];

  // Game Progress Tracking
  sessionId: string | null;
  sessionStartTime: number | null;
  setSessionId: (id: string | null) => void;
  setSessionStartTime: (time: number | null) => void;
  showCompletionModal: boolean;
  setShowCompletionModal: (show: boolean) => void;

  // Document Pagination State
  documentStates: Record<string, { currentPage: number; totalPages: number }>;
  setDocumentPage: (id: string, page: number) => void;
  setDocumentTotalPages: (id: string, total: number) => void;

  // Texture Loading State
  texturesLoadingCount: number;
  incrementTextureLoading: () => void;
  decrementTextureLoading: () => void;

  // Deduction Board State
  deductionState: DeductionState | null;
  setDeductionState: (state: DeductionState | null) => void;
  links: EvidenceLink[];
  addLink: (fromId: string, toId: string) => string;
  updateLinkType: (id: string, type: LinkType) => void;
  removeLink: (id: string) => void;
  setLinkStatus: (id: string, status: 'UNCHECKED' | 'VALID' | 'INVALID', reasoning?: string) => void;
  clearLinks: () => void;
  validateAndMarkLinks: () => void;
  solved: boolean;
  setSolved: (s: boolean) => void;
  solvProgress: number;
  
  // Interaction State
  linkingFromId: string | null;
  setLinkingFromId: (id: string | null) => void;
  isDraggingItem: boolean;
  setIsDraggingItem: (dragging: boolean) => void;
  radialMenu: { x: number, y: number, z: number, connectionId: string } | null;
  setRadialMenu: (data: { x: number, y: number, z: number, connectionId: string } | null) => void;

  // Pointer State
  isPointerOnComputer: boolean;
  setIsPointerOnComputer: (isOn: boolean) => void;
  
  // Actions
  setView: (view: GameView) => void;
  setInspecting: (inspecting: boolean) => void;
  setHoveredItem: (id: string | null) => void;
  setFocusedItem: (id: string | null) => void;
  
  addUnlockedForensic: (id: string) => void;
  addUncoveredClue: (clueId: string) => void;
  addToPrintQueue: (item: { content: string, title?: string, metadata?: any, reportId?: string }) => void;
  clearPrintQueue: () => void;
}

export const useGameStore = create<StoreState>((set, get) => ({
  currentView: 'DESK',
  isInspecting: false,
  hoveredItemId: null,
  focusedItemId: null,
  unlockedForensics: new Set(),
  uncoveredClues: new Set(),
  printQueue: [],
  documentStates: {},
  texturesLoadingCount: 0,
  
  // Game Progress
  sessionId: null,
  sessionStartTime: null,
  setSessionId: (id) => set({ sessionId: id }),
  setSessionStartTime: (time) => set({ sessionStartTime: time }),
  showCompletionModal: false,
  setShowCompletionModal: (show) => set({ showCompletionModal: show }),
  
  // Deduction state
  deductionState: null,
  setDeductionState: (state) => set({ deductionState: state }),
  
  links: [],
  solved: false,
  solvProgress: 0,
  
  setSolved: (s) => set({ solved: s }),
  
  addLink: (fromId, toId) => {
    // Prevent self loop
    if (fromId === toId) return '';
    
    // Generate ID
    const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    set((state) => {
      // Check duplicate
      if (state.links.some(l => (l.fromId === fromId && l.toId === toId) || (l.fromId === toId && l.toId === fromId))) {
        return { links: state.links };
      }
      
      const newLink: EvidenceLink = { 
        id, 
        fromId, 
        toId, 
        type: LinkType.UNKNOWN, 
        status: 'UNCHECKED' 
      };
      
      return { links: [...state.links, newLink] };
    });
    return id;
  },
  
  updateLinkType: (id, type) => set((state) => {
    const updatedLinks = state.links.map(l => 
      l.id === id ? { ...l, type } : l
    );
    return { links: updatedLinks };
  }),
  
  removeLink: (id) => set((state) => ({
    links: state.links.filter(l => l.id !== id)
  })),
  
  setLinkStatus: (id, status, reasoning) => set((state) => ({
    links: state.links.map(l => 
      l.id === id ? { ...l, status, reasoning } : l
    )
  })),
  
  clearLinks: () => set({ links: [], solved: false, solvProgress: 0 }),
  
  validateAndMarkLinks: () => set((state) => {
    if (!state.deductionState) return state;
    
    // Validate each link
    const validatedLinks = state.links.map(link => {
      const validation = validateLink(link, state.deductionState!);
      return {
        ...link,
        status: validation.isValid ? 'VALID' : 'INVALID' as const,
        reasoning: validation.reason,
      };
    });
    
    // Check if case is solved
    const solveResult = isCaseSolved(validatedLinks, state.deductionState);
    
    return {
      links: validatedLinks,
      solved: solveResult.solved,
      solvProgress: solveResult.progress,
    };
  }),
  
  linkingFromId: null,
  setLinkingFromId: (id) => set({ linkingFromId: id }),
  isDraggingItem: false,
  setIsDraggingItem: (dragging) => set({ isDraggingItem: dragging }),
  radialMenu: null,
  setRadialMenu: (data) => set({ radialMenu: data }),

  isPointerOnComputer: false,
  setIsPointerOnComputer: (isOn) => set({ isPointerOnComputer: isOn }),

  setDocumentPage: (id, page) => set((state) => ({
    documentStates: {
        ...state.documentStates,
        [id]: { ...state.documentStates[id], currentPage: page }
    }
  })),
  setDocumentTotalPages: (id, total) => set((state) => ({
    documentStates: {
        ...state.documentStates,
        [id]: { ...state.documentStates[id], totalPages: total, currentPage: 0 } // Reset to 0 on init
    }
  })),

  incrementTextureLoading: () => set((state) => ({ texturesLoadingCount: state.texturesLoadingCount + 1 })),
  decrementTextureLoading: () => set((state) => ({ texturesLoadingCount: Math.max(0, state.texturesLoadingCount - 1) })),

  setView: (view) => set({ currentView: view }),
  setInspecting: (inspecting) => set({ isInspecting: inspecting }),
  setHoveredItem: (id) => set({ hoveredItemId: id }),
  setFocusedItem: (id) => set({ focusedItemId: id }),
  
  addUnlockedForensic: (id) => set((state) => {
    const next = new Set(state.unlockedForensics);
    next.add(id);
    return { unlockedForensics: next };
  }),
  addUncoveredClue: (clueId) => set((state) => {
    const next = new Set(state.uncoveredClues);
    next.add(clueId);
    return { uncoveredClues: next };
  }),
  addToPrintQueue: (item) => set((state) => ({ 
    printQueue: [...state.printQueue, { 
      content: item.content, 
      title: item.title, 
      metadata: item.metadata,
      reportId: item.reportId 
    }] 
  })),
  clearPrintQueue: () => set({ printQueue: [] }),
}));
