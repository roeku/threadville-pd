import { create } from 'zustand';
import { EvidenceLink, LinkType } from '../types/deduction';

export type GameView = 'DESK' | 'BOARD' | 'EVIDENCE' | 'COMPUTER' | 'AUDIO' | 'CABINET';

interface StoreState {
  currentView: GameView;
  isInspecting: boolean;
  focusedItemId: string | null;
  hoveredItemId: string | null;
  
  // Session State
  unlockedForensics: Set<string>;
  uncoveredClues: Set<string>;
  printQueue: { content: string, title?: string, metadata?: any }[];

  // Document Pagination State
  documentStates: Record<string, { currentPage: number; totalPages: number }>;
  setDocumentPage: (id: string, page: number) => void;
  setDocumentTotalPages: (id: string, total: number) => void;

  // Deduction Board State
  links: EvidenceLink[];
  addLink: (fromId: string, toId: string) => string;
  updateLinkType: (id: string, type: LinkType) => void;
  removeLink: (id: string) => void;
  setLinkStatus: (id: string, status: 'UNCHECKED' | 'VALID' | 'INVALID') => void;
  clearLinks: () => void;
  solved: boolean;
  setSolved: (s: boolean) => void;
  
  // Interaction State
  linkingFromId: string | null;
  setLinkingFromId: (id: string | null) => void;
  isDraggingItem: boolean;
  setIsDraggingItem: (dragging: boolean) => void;
  radialMenu: { x: number, y: number, z: number, connectionId: string } | null;
  setRadialMenu: (data: { x: number, y: number, z: number, connectionId: string } | null) => void;
  
  // Actions
  setView: (view: GameView) => void;
  setInspecting: (inspecting: boolean) => void;
  setHoveredItem: (id: string | null) => void;
  setFocusedItem: (id: string | null) => void;
  
  addUnlockedForensic: (id: string) => void;
  addUncoveredClue: (clueId: string) => void;
  addToPrintQueue: (item: { content: string, title?: string, metadata?: any }) => void;
  clearPrintQueue: () => void;
}

export const useGameStore = create<StoreState>((set) => ({
  currentView: 'DESK',
  isInspecting: false,
  hoveredItemId: null,
  focusedItemId: null,
  unlockedForensics: new Set(),
  uncoveredClues: new Set(),
  printQueue: [],
  documentStates: {},
  
  links: [],
  solved: false,
  setSolved: (s) => set({ solved: s }),
  addLink: (fromId, toId) => {
    // Check if exists
    // We allow multiple multiple edges ? usually yes unless same pair.
    // Prevent self loop
    if (fromId === toId) return '';
    
    // Generate ID
    const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    set((state) => {
        // Check duplicate
        if (state.links.some(l => (l.fromId === fromId && l.toId === toId) || (l.fromId === toId && l.toId === fromId))) {
            return { links: state.links };
        }
        return {
            links: [...state.links, { id, fromId, toId, type: LinkType.UNKNOWN, status: 'UNCHECKED' }]
        };
    });
    return id;
  },
  updateLinkType: (id, type) => set((state) => ({
      links: state.links.map(l => l.id === id ? { ...l, type } : l)
  })),
  removeLink: (id) => set((state) => ({
      links: state.links.filter(l => l.id !== id)
  })),
  setLinkStatus: (id, status) => set((state) => ({
      links: state.links.map(l => l.id === id ? { ...l, status } : l)
  })),
  clearLinks: () => set({ links: [] }),
  
  linkingFromId: null,
  setLinkingFromId: (id) => set({ linkingFromId: id }),
  isDraggingItem: false,
  setIsDraggingItem: (dragging) => set({ isDraggingItem: dragging }),
  radialMenu: null,
  setRadialMenu: (data) => set({ radialMenu: data }),

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
  addToPrintQueue: (item) => set((state) => ({ printQueue: [...state.printQueue, item] })),
  clearPrintQueue: () => set({ printQueue: [] }),
}));
