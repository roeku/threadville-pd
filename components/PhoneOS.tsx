import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { useAudioContext } from '../contexts/AudioContext';
import { CaseFile } from '../types';
import { getInterrogationReply } from '../services/interrogationService';
import type { InterrogationMessage } from '../stores/useGameStore';

interface PhoneOSProps {
    caseFile: CaseFile;
}

const getSessionKey = (caseId: string, suspectId: string) => `${caseId}:${suspectId}`;

export const PhoneOS: React.FC<PhoneOSProps> = ({ caseFile }) => {
    console.log('[PhoneOS] Render - caseFile:', caseFile?.caseId);

    const solved = useGameStore(state => state.solved);
    const currentView = useGameStore(state => state.currentView);
    const interrogationSessions = useGameStore(state => state.interrogationSessions);
    const appendInterrogationMessage = useGameStore(state => state.appendInterrogationMessage);
    const setView = useGameStore(state => state.setView);
    const { playSFX } = useAudioContext();

    console.log('[PhoneOS] Current view:', currentView, 'Solved:', solved);

    const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuspectList, setShowSuspectList] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const suspects = useMemo(() => caseFile?.suspects ?? [], [caseFile]);

    useEffect(() => {
        if (!selectedSuspectId && suspects.length > 0) {
            setSelectedSuspectId(suspects[0].id);
        }
    }, [selectedSuspectId, suspects]);

    const activeSuspect = useMemo(() => {
        if (!caseFile || !selectedSuspectId) return null;
        return caseFile.suspects.find(s => s.id === selectedSuspectId) ?? null;
    }, [caseFile, selectedSuspectId]);

    const sessionKey = useMemo(() => {
        if (!caseFile || !activeSuspect) return null;
        return getSessionKey(caseFile.caseId, activeSuspect.id);
    }, [caseFile, activeSuspect]);

    const messages = useMemo(() => {
        if (!sessionKey) return [];
        return interrogationSessions[sessionKey]?.messages ?? [];
    }, [interrogationSessions, sessionKey]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, selectedSuspectId]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (currentView !== 'PHONE') return;
            const target = event.target as Node | null;
            if (containerRef.current && target && containerRef.current.contains(target)) return;
            setView('DESK');
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [currentView, setView]);

    const ensureIntroMessage = () => {
        if (!caseFile || !activeSuspect || !sessionKey) return;
        if (messages.length > 0) return;
        appendInterrogationMessage(caseFile.caseId, activeSuspect.id, {
            id: `sys-${Date.now()}`,
            sender: 'SYSTEM',
            text: `Secure line opened with ${activeSuspect.name}.`,
            timestamp: Date.now(),
        });
    };

    useEffect(() => {
        ensureIntroMessage();
    }, [sessionKey, caseFile, activeSuspect, messages.length, appendInterrogationMessage]);

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSend = async () => {
        if (!caseFile || !activeSuspect || !input.trim() || !sessionKey) return;
        setError(null);
        playSFX('phone-send');


        const messageText = input.trim();
        const userMessage: InterrogationMessage = {
            id: `msg-${Date.now()}`,
            sender: 'PLAYER',
            text: messageText,
            timestamp: Date.now(),
        };

        appendInterrogationMessage(caseFile.caseId, activeSuspect.id, userMessage);
        setInput('');
        setIsSending(true);

        try {
            const reply = await getInterrogationReply({
                caseFile: caseFile,
                suspect: activeSuspect,
                message: messageText,
                isSolved: solved,
            });

            appendInterrogationMessage(caseFile.caseId, activeSuspect.id, {
                id: `msg-${Date.now()}-suspect`,
                sender: 'SUSPECT',
                text: reply,
                timestamp: Date.now(),
            });
        } catch (e: any) {
            setError('Connection unstable. Try again.');
            appendInterrogationMessage(caseFile.caseId, activeSuspect.id, {
                id: `sys-${Date.now()}-error`,
                sender: 'SYSTEM',
                text: 'Signal lost. Awaiting response...',
                timestamp: Date.now(),
            });
        } finally {
            setIsSending(false);
        }
    };



    // Guard: only render if in PHONE view and caseFile exists
    if (currentView !== 'PHONE' || !caseFile) {
        console.log('[PhoneOS] Guard clause triggered - returning null. currentView:', currentView, 'caseFile:', !!caseFile);
        return null;
    }

    console.log('[PhoneOS] Rendering UI - activeSuspect:', activeSuspect?.name, 'messages:', messages.length);

    return (
        <div ref={containerRef} className="w-80 h-[640px] rounded-3xl border-8 border-gray-900 bg-black shadow-2xl flex flex-col overflow-hidden relative">
            {/* Phone notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-7 bg-black rounded-b-3xl z-50" />

            {/* Status bar */}
            <div className="bg-black text-white text-xs px-4 py-2 flex justify-between items-center text-center flex-grow-0">
                <span>9:41</span>
                <span className="font-semibold">Secure Line</span>
                <span className="text-[10px] tracking-wide">Signal</span>
            </div>

            {/* Header - Suspect selector */}
            <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                <button
                    onClick={() => setShowSuspectList(!showSuspectList)}
                    className="text-gray-400 hover:text-white transition flex-shrink-0"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={() => setShowSuspectList(!showSuspectList)}
                    className="flex-1 text-center text-white font-semibold text-sm hover:text-gray-300 transition"
                >
                    {activeSuspect?.name || 'Select Suspect'}
                </button>
                <button
                    onClick={() => setView('DESK')}
                    className="text-gray-400 hover:text-white transition flex-shrink-0 text-lg leading-none"
                >
                    ×
                </button>
            </div>

            {/* Suspect list dropdown */}
            {showSuspectList && (
                <div className="absolute top-20 left-0 right-0 bg-gray-800 border-b border-gray-700 z-50 max-h-40 overflow-y-auto">
                    {suspects.map(suspect => (
                        <button
                            key={suspect.id}
                            onClick={() => {
                                playSFX('phone-tap');
                                setSelectedSuspectId(suspect.id);
                                setShowSuspectList(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm border-b border-gray-700 ${suspect.id === selectedSuspectId ? 'bg-blue-700 text-white' : 'text-gray-200 hover:bg-gray-700'}`}
                        >
                            {suspect.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-black">
                {messages.map(message => (
                    <div key={message.id} className={`flex ${message.sender === 'PLAYER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[78%] ${message.sender === 'PLAYER' ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div
                                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.sender === 'PLAYER'
                                    ? 'bg-blue-600 text-white'
                                    : message.sender === 'SUSPECT'
                                        ? 'bg-gray-700 text-gray-100'
                                        : 'bg-gray-900 text-gray-400 text-xs uppercase'
                                    }`}
                            >
                                {message.text}
                            </div>
                            <div className={`mt-1 text-[10px] text-gray-500 ${message.sender === 'PLAYER' ? 'text-right' : 'text-left'}`}>
                                {formatTimestamp(message.timestamp)}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Error message */}
            {error && (
                <div className="px-3 py-2 text-xs text-amber-400 flex items-center gap-2 bg-gray-900">
                    <AlertTriangle size={14} /> {error}
                </div>
            )}

            {/* Input area */}
            <div className="px-3 py-2 bg-gray-900 border-t border-gray-800">
                <div className="flex items-center gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={solved ? 'Case closed' : 'Ask...'}
                        disabled={solved}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={solved || isSending || !input.trim()}
                        className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-white text-xs flex items-center gap-1"
                    >
                        <Send size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};
