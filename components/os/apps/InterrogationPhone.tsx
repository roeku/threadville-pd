import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, PhoneCall, Send, FileText, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOS } from '../context/OSContext';
import { useGameStore } from '../../../stores/useGameStore';
import { CaseFile, Suspect } from '../../../types';
import { getInterrogationReply, resetInterrogationSession } from '@/services/interrogationService';
import type { InterrogationMessage } from '@/stores/useGameStore';

const getSessionKey = (caseId: string, suspectId: string) => `${caseId}:${suspectId}`;

const buildTranscriptMetadata = (caseFile: CaseFile, suspect: Suspect, messages: InterrogationMessage[]) => {
    const speakers = messages
        .filter(m => m.sender !== 'SYSTEM')
        .map(m => ({
            name: m.sender === 'PLAYER' ? 'DETECTIVE' : suspect.name,
            line: m.text
        }));

    const timeRange = messages.length > 0
        ? `${new Date(messages[0].timestamp).toLocaleTimeString()} - ${new Date(messages[messages.length - 1].timestamp).toLocaleTimeString()}`
        : '00:00 - 00:00';

    return {
        templateId: 'transcript',
        source: `${caseFile.title} / Interrogation: ${suspect.name}`,
        timestampRange: timeRange,
        speakers
    };
};

export const InterrogationPhone: React.FC = () => {
    const { currentCase, onPrint } = useOS();
    const solved = useGameStore(state => state.solved);
    const interrogationSessions = useGameStore(state => state.interrogationSessions);
    const appendInterrogationMessage = useGameStore(state => state.appendInterrogationMessage);
    const clearInterrogationSession = useGameStore(state => state.clearInterrogationSession);

    const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    const suspects = useMemo(() => currentCase?.suspects ?? [], [currentCase]);

    useEffect(() => {
        if (!selectedSuspectId && suspects.length > 0) {
            setSelectedSuspectId(suspects[0].id);
        }
    }, [selectedSuspectId, suspects]);

    const activeSuspect = useMemo(() => {
        if (!currentCase || !selectedSuspectId) return null;
        return currentCase.suspects.find(s => s.id === selectedSuspectId) ?? null;
    }, [currentCase, selectedSuspectId]);

    const sessionKey = useMemo(() => {
        if (!currentCase || !activeSuspect) return null;
        return getSessionKey(currentCase.caseId, activeSuspect.id);
    }, [currentCase, activeSuspect]);

    const messages = useMemo(() => {
        if (!sessionKey) return [];
        return interrogationSessions[sessionKey]?.messages ?? [];
    }, [interrogationSessions, sessionKey]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, selectedSuspectId]);

    const ensureIntroMessage = () => {
        if (!currentCase || !activeSuspect || !sessionKey) return;
        if (messages.length > 0) return;
        appendInterrogationMessage(currentCase.caseId, activeSuspect.id, {
            id: `sys-${Date.now()}`,
            sender: 'SYSTEM',
            text: `Secure line opened with ${activeSuspect.name}.`,
            timestamp: Date.now(),
        });
    };

    useEffect(() => {
        ensureIntroMessage();
    }, [sessionKey]);

    const handleSend = async () => {
        if (!currentCase || !activeSuspect || !input.trim() || !sessionKey) return;
        setError(null);

        const messageText = input.trim();
        const userMessage: InterrogationMessage = {
            id: `msg-${Date.now()}`,
            sender: 'PLAYER',
            text: messageText,
            timestamp: Date.now(),
        };

        appendInterrogationMessage(currentCase.caseId, activeSuspect.id, userMessage);
        setInput('');
        setIsSending(true);

        try {
            const reply = await getInterrogationReply({
                caseFile: currentCase,
                suspect: activeSuspect,
                message: messageText,
                isSolved: solved,
            });

            appendInterrogationMessage(currentCase.caseId, activeSuspect.id, {
                id: `msg-${Date.now()}-suspect`,
                sender: 'SUSPECT',
                text: reply,
                timestamp: Date.now(),
            });
        } catch (e: any) {
            setError('Connection unstable. Try again.');
            appendInterrogationMessage(currentCase.caseId, activeSuspect.id, {
                id: `sys-${Date.now()}-error`,
                sender: 'SYSTEM',
                text: 'Signal lost. Awaiting response...',
                timestamp: Date.now(),
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveTranscript = () => {
        if (!currentCase || !activeSuspect || messages.length === 0) return;
        const metadata = buildTranscriptMetadata(currentCase, activeSuspect, messages);

        const content = messages
            .filter(m => m.sender !== 'SYSTEM')
            .map(m => `${m.sender === 'PLAYER' ? 'DETECTIVE' : activeSuspect.name}: ${m.text}`)
            .join('\n');

        onPrint(
            content,
            `Interrogation Transcript - ${activeSuspect.name}`,
            metadata,
            `transcript_${currentCase.caseId}_${activeSuspect.id}_${Date.now()}`
        );
    };

    const handleResetSession = async () => {
        if (!currentCase || !activeSuspect) return;
        clearInterrogationSession(currentCase.caseId, activeSuspect.id);
        await resetInterrogationSession(currentCase.caseId, activeSuspect.id);
    };

    if (!currentCase) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-mono">
                No case loaded.
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-950 text-slate-200 flex border border-slate-800">
            {/* Suspect List */}
            <aside className="w-56 border-r border-slate-800 bg-slate-900/60 flex flex-col">
                <div className="px-3 py-3 border-b border-slate-800 flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
                    <MessageSquare size={14} />
                    Suspects
                </div>
                <div className="flex-1 overflow-y-auto">
                    {suspects.map(suspect => {
                        const isActive = suspect.id === selectedSuspectId;
                        return (
                            <button
                                key={suspect.id}
                                onClick={() => setSelectedSuspectId(suspect.id)}
                                className={`w-full text-left px-3 py-2 text-sm border-b border-slate-800 transition ${isActive ? 'bg-blue-900/30 text-blue-200' : 'hover:bg-slate-800/60 text-slate-300'}`}
                            >
                                <div className="font-semibold truncate">{suspect.name}</div>
                                <div className="text-[11px] text-slate-500 truncate">{suspect.notes || 'No profile notes'}</div>
                            </button>
                        );
                    })}
                </div>
                <div className="px-3 py-2 text-[10px] text-slate-500 border-t border-slate-800">
                    Secure Line v1.2
                </div>
            </aside>

            {/* Chat Panel */}
            <section className="flex-1 flex flex-col">
                <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                            <PhoneCall size={18} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold">{activeSuspect?.name || 'Unknown'}</div>
                            <div className="text-[11px] text-slate-500">
                                {solved ? 'Case Closed - Archive Mode' : 'Active Interrogation'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveTranscript}
                            disabled={!activeSuspect || messages.length === 0}
                            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded border border-slate-700 flex items-center gap-1"
                        >
                            <FileText size={14} />
                            Save Transcript
                        </button>
                        <button
                            onClick={handleResetSession}
                            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 flex items-center gap-1"
                        >
                            <RefreshCw size={14} />
                            Reset
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {messages.map(message => (
                        <div key={message.id} className={`flex ${message.sender === 'PLAYER' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${message.sender === 'PLAYER'
                                        ? 'bg-blue-600 text-white'
                                        : message.sender === 'SUSPECT'
                                            ? 'bg-slate-800 text-slate-100'
                                            : 'bg-slate-900 text-slate-400 text-xs uppercase tracking-wider'
                                    }`}
                            >
                                {message.text}
                            </div>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>

                <div className="border-t border-slate-800 px-4 py-3 bg-slate-900/70">
                    {error && (
                        <div className="mb-2 text-xs text-amber-400 flex items-center gap-2">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}
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
                            placeholder={solved ? 'Case closed. Interrogation archived.' : 'Type a question...'}
                            disabled={solved}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={solved || isSending || !input.trim()}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm flex items-center gap-1"
                        >
                            <Send size={14} />
                            Send
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};
