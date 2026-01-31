import React, { useState, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { APPS } from '../constants';
import { AppId, WindowState } from '../types';
import { Power, Menu, LogOut } from 'lucide-react';

export const Taskbar: React.FC = () => {
    const { windows, windowOrder, openApp, focusWindow, minimizeWindow, onLogOut } = useOS();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const openWindows = Object.values(windows);

    return (
        <div className="h-12 bg-slate-900 border-t border-slate-700 flex items-center px-2 z-50 relative shadow-[0_-2px_10px_rgba(0,0,0,0.5)]">
            {/* Start Button */}
            <button
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-600 rounded mr-4 transition-colors text-slate-200 font-bold text-sm shadow-sm active:shadow-inner active:translate-y-[1px]"
                onClick={() => openApp('evidence')}
            >
                <Menu size={16} />
                <span>SYSTEM</span>
            </button>

            {/* Window List */}
            <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
                {openWindows.map((win: WindowState) => {
                    const isActive = windowOrder[windowOrder.length - 1] === win.id && !win.isMinimized;
                    return (
                        <button
                            key={win.id}
                            onClick={() => isActive ? minimizeWindow(win.id) : focusWindow(win.id)}
                            className={`
                flex items-center gap-2 px-3 py-1 min-w-[140px] max-w-[200px] rounded border text-xs font-sans truncate transition-all
                ${isActive
                                    ? 'bg-slate-800 border-slate-500 text-emerald-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] translate-y-[1px]'
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 shadow-sm'
                                }
              `}
                        >
                            <div className="w-4 h-4 min-w-[16px]">
                                {APPS[win.appId].icon}
                            </div>
                            <span className="truncate">{win.title}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tray */}
            <div className="flex items-center gap-4 pl-4 border-l border-slate-700 ml-2">
                <div className="flex flex-col items-end text-[10px] leading-tight text-emerald-500 font-mono">
                    <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-slate-500">{time.toLocaleDateString()}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onLogOut();
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Log Out"
                >
                    <Power size={18} />
                </button>
            </div>
        </div>
    );
};
