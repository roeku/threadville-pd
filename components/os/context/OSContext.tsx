import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { AppId, WindowState } from '../types';
import { APPS } from '../constants';
import { CaseFile } from '../../types';

interface OSState {
    windows: Record<string, WindowState>;
    windowOrder: string[]; // Array of window IDs, last is on top
}

type Action =
    | { type: 'OPEN_APP'; payload: { appId: AppId; data?: any } }
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
            const { appId, data } = action.payload;

            // If passing specific data (like a file), we might want a NEW window even if app is open?
            // Or if app is single-instance (like "Settings"), we bring to front.
            // For now, let's treat 'evidence' (files) as single instance but maybe others as multi?
            // Current implementation: Single instance per AppId for simplicity, unless we refactor ID generation.

            // If we want multiple instances (e.g. 2 images open), we shouldn't check existingWindowId by appId.
            // But for now, user seems to want integration. Let's keep single instance for now but allow data update.

            const existingWindowId = Object.keys(state.windows).find(
                (id) => state.windows[id].appId === appId
            );

            if (existingWindowId) {
                // Bring to front and UPDATE data
                const newOrder = state.windowOrder.filter((id) => id !== existingWindowId);
                newOrder.push(existingWindowId);
                return {
                    ...state,
                    windows: {
                        ...state.windows,
                        [existingWindowId]: {
                            ...state.windows[existingWindowId],
                            isMinimized: false,
                            data: data ?? state.windows[existingWindowId].data // Update data if provided
                        },
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
                data: data
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
            if (state.windowOrder.length === 0 || state.windowOrder[state.windowOrder.length - 1] === action.payload) {
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
                    [action.payload]: { ...win, isMaximized: !win.isMaximized },
                },
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
    openApp: (appId: AppId, data?: any) => void;
    closeWindow: (id: string) => void;
    focusWindow: (id: string) => void;
    minimizeWindow: (id: string) => void;
    toggleMaximizeWindow: (id: string) => void;
    updateWindowPos: (id: string, x: number, y: number) => void;
    updateWindowSize: (id: string, w: number, h: number) => void;

    // New props for integration
    currentCase: CaseFile | null;
    onPrint: (content: string, title?: string, metadata?: any, reportId?: string) => void;
    onLogOut: () => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider: React.FC<{
    children: ReactNode;
    currentCase: CaseFile | null;
    onPrint: (content: string, title?: string, metadata?: any, reportId?: string) => void;
    onLogOut: () => void;
}> = ({ children, currentCase, onPrint, onLogOut }) => {
    const [state, dispatch] = useReducer(osReducer, initialState);

    const openApp = useCallback((appId: AppId, data?: any) => {
        dispatch({ type: 'OPEN_APP', payload: { appId, data } });
    }, []);

    const closeWindow = useCallback((id: string) => {
        dispatch({ type: 'CLOSE_WINDOW', payload: id });
    }, []);

    const focusWindow = useCallback((id: string) => {
        dispatch({ type: 'FOCUS_WINDOW', payload: id });
    }, []);

    const minimizeWindow = useCallback((id: string) => {
        dispatch({ type: 'MINIMIZE_WINDOW', payload: id });
    }, []);

    const toggleMaximizeWindow = useCallback((id: string) => {
        dispatch({ type: 'TOGGLE_MAXIMIZE_WINDOW', payload: id });
    }, []);

    const updateWindowPos = useCallback((id: string, x: number, y: number) => {
        dispatch({ type: 'UPDATE_WINDOW_POS', payload: { id, x, y } });
    }, []);

    const updateWindowSize = useCallback((id: string, w: number, h: number) => {
        dispatch({ type: 'UPDATE_WINDOW_SIZE', payload: { id, w, h } });
    }, []);

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
                currentCase,
                onPrint,
                onLogOut
            }}
        >
            {children}
        </OSContext.Provider>
    );
};

export const useOS = () => {
    const context = useContext(OSContext);
    if (context === undefined) {
        throw new Error('useOS must be used within an OSProvider');
    }
    return context;
};
