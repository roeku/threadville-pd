import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AppId, WindowState } from '../types';
import { APPS } from '../constants';

interface OSState {
  windows: Record<string, WindowState>;
  windowOrder: string[]; // Array of window IDs, last is on top
}

type Action =
  | { type: 'OPEN_APP'; payload: AppId }
  | { type: 'CLOSE_WINDOW'; payload: string }
  | { type: 'FOCUS_WINDOW'; payload: string }
  | { type: 'MINIMIZE_WINDOW'; payload: string }
  | { type: 'TOGGLE_MAXIMIZE_WINDOW'; payload: string }
  | { type: 'UPDATE_WINDOW_POS'; payload: { id: string; x: number; y: number } }
  | { type: 'UPDATE_WINDOW_SIZE'; payload: { id: string; w: number; h: number } };

const initialState: OSState = {
  windows: {},
  windowOrder: [],
};

const osReducer = (state: OSState, action: Action): OSState => {
  switch (action.type) {
    case 'OPEN_APP': {
      const appId = action.payload;
      // Check if already open
      const existingWindowId = Object.keys(state.windows).find(
        (id) => state.windows[id].appId === appId
      );

      if (existingWindowId) {
        // Bring to front
        const newOrder = state.windowOrder.filter((id) => id !== existingWindowId);
        newOrder.push(existingWindowId);
        return {
          ...state,
          windows: {
            ...state.windows,
            [existingWindowId]: { ...state.windows[existingWindowId], isMinimized: false },
          },
          windowOrder: newOrder,
        };
      }

      // Create new window
      const newId = `win-${Date.now()}`;
      const app = APPS[appId];
      const newWindow: WindowState = {
        id: newId,
        appId,
        title: app.name,
        x: 10 + (state.windowOrder.length * 2), // Cascade
        y: 10 + (state.windowOrder.length * 2),
        w: app.defaultW,
        h: app.defaultH,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: state.windowOrder.length + 10,
      };

      return {
        ...state,
        windows: { ...state.windows, [newId]: newWindow },
        windowOrder: [...state.windowOrder, newId],
      };
    }

    case 'CLOSE_WINDOW': {
      const { [action.payload]: _, ...remainingWindows } = state.windows;
      return {
        ...state,
        windows: remainingWindows,
        windowOrder: state.windowOrder.filter((id) => id !== action.payload),
      };
    }

    case 'FOCUS_WINDOW': {
      if (state.windowOrder[state.windowOrder.length - 1] === action.payload) {
        return state; // Already on top
      }
      const newOrder = state.windowOrder.filter((id) => id !== action.payload);
      newOrder.push(action.payload);
      return {
        ...state,
        windowOrder: newOrder,
      };
    }

    case 'MINIMIZE_WINDOW': {
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload]: { ...state.windows[action.payload], isMinimized: true },
        },
      };
    }

    case 'TOGGLE_MAXIMIZE_WINDOW': {
      const win = state.windows[action.payload];
      return {
        ...state,
        windows: {
          ...state.windows,
          [action.payload]: { ...state.windows[action.payload], isMaximized: !win.isMaximized },
        },
        windowOrder: state.windowOrder.filter((id) => id !== action.payload).concat(action.payload), // Focus on maximize
      };
    }

    case 'UPDATE_WINDOW_POS': {
      const { id, x, y } = action.payload;
      return {
        ...state,
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], x, y },
        },
      };
    }

    case 'UPDATE_WINDOW_SIZE': {
      const { id, w, h } = action.payload;
      return {
        ...state,
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], w, h },
        },
      };
    }

    default:
      return state;
  }
};

interface OSContextType extends OSState {
  openApp: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  updateWindowPos: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, w: number, h: number) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(osReducer, initialState);

  const openApp = useCallback((appId: AppId) => dispatch({ type: 'OPEN_APP', payload: appId }), []);
  const closeWindow = useCallback((id: string) => dispatch({ type: 'CLOSE_WINDOW', payload: id }), []);
  const focusWindow = useCallback((id: string) => dispatch({ type: 'FOCUS_WINDOW', payload: id }), []);
  const minimizeWindow = useCallback((id: string) => dispatch({ type: 'MINIMIZE_WINDOW', payload: id }), []);
  const toggleMaximizeWindow = useCallback((id: string) => dispatch({ type: 'TOGGLE_MAXIMIZE_WINDOW', payload: id }), []);
  const updateWindowPos = useCallback((id: string, x: number, y: number) => dispatch({ type: 'UPDATE_WINDOW_POS', payload: { id, x, y } }), []);
  const updateWindowSize = useCallback((id: string, w: number, h: number) => dispatch({ type: 'UPDATE_WINDOW_SIZE', payload: { id, w, h } }), []);

  return (
    <OSContext.Provider
      value={{
        ...state,
        openApp,
        closeWindow,
        focusWindow,
        minimizeWindow,
        toggleMaximizeWindow,
        updateWindowPos,
        updateWindowSize,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) throw new Error('useOS must be used within an OSProvider');
  return context;
};
