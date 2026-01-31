import React from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { useOS } from '../context/OSContext';
import { WindowState } from '../types';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

interface WindowFrameProps {
    window: WindowState;
    parentRef: React.RefObject<HTMLElement>;
    children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win, parentRef, children }) => {
    const { focusWindow, closeWindow, minimizeWindow, toggleMaximizeWindow, updateWindowPos, updateWindowSize, windowOrder } = useOS();

    const isActive = windowOrder[windowOrder.length - 1] === win.id;
    const zIndex = windowOrder.indexOf(win.id) + 10;

    const { isDragging, handlePointerDown: handleDragStart } = useDraggable({
        id: win.id,
        initialX: win.x,
        initialY: win.y,
        onUpdate: updateWindowPos,
        isActive,
        onFocus: () => focusWindow(win.id),
        parentRef
    });

    const { isResizing, handleResizePointerDown } = useResizable({
        id: win.id,
        initialW: win.w,
        initialH: win.h,
        onUpdate: updateWindowSize,
        parentRef
    });

    if (win.isMinimized) return null;

    const style: React.CSSProperties = win.isMaximized
        ? { top: 0, left: 0, width: '100%', height: '100%', zIndex }
        : {
            top: `${win.y}%`,
            left: `${win.x}%`,
            width: `${win.w}%`,
            height: `${win.h}%`,
            zIndex,
        };

    return (
        <div
            className={`absolute flex flex-col rounded-sm overflow-hidden border border-slate-600 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-shadow duration-200 select-none ${isActive ? 'shadow-[0_0_30px_rgba(0,255,128,0.1)] border-emerald-500/50' : ''
                }`}
            style={{
                ...style,
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                cursor: isDragging ? 'grabbing' : 'auto',
            }}
            onPointerDown={() => focusWindow(win.id)}
        >
            {/* Title Bar */}
            <div
                className={`flex items-center justify-between h-8 px-2 cursor-default shrink-0 ${isActive
                    ? 'bg-gradient-to-r from-emerald-900/80 to-slate-800/80 text-emerald-100'
                    : 'bg-slate-800/80 text-slate-400'
                    } border-b border-slate-600`}
                onPointerDown={(e) => !win.isMaximized && handleDragStart(e)}
                onDoubleClick={() => toggleMaximizeWindow(win.id)}
            >
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase font-sans">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                    {win.title}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                        className="p-1 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                    >
                        <Minus size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleMaximizeWindow(win.id); }}
                        className="p-1 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                    >
                        {win.isMaximized ? <Square size={10} /> : <Maximize2 size={10} />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                        className="p-1 hover:bg-red-900/50 hover:text-red-200 rounded text-slate-300 transition-colors"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-center bg-cover text-slate-200 font-mono text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                {/* Pass data to children if they accept props */}
                {React.isValidElement(children)
                    ? React.cloneElement(children as React.ReactElement, { data: win.data } as any)
                    : children}
            </div>

            {/* Resize Handle */}
            {!win.isMaximized && (
                <div
                    className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize z-50 hover:bg-white/10 rounded-br-sm"
                    onPointerDown={handleResizePointerDown}
                >
                    <svg viewBox="0 0 6 6" className="w-full h-full text-slate-500/50">
                        <path d="M6 6H2L6 2V6Z" fill="currentColor" />
                    </svg>
                </div>
            )}
        </div>
    );
};
