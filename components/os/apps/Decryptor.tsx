import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Smartphone, Lock, Unlock, RefreshCw, Terminal, HelpCircle, Printer } from 'lucide-react';
import { useOS } from '../context/OSContext';

const WORD_LENGTH = 6;
const ROW_COUNT = 16;
const COL_COUNT = 12;
const ATTEMPTS_ALLOWED = 4;

const POSSIBLE_WORDS = [
    'ACCESS', 'BRIDGE', 'CIPHER', 'DEVICE', 'ENERGY', 'FILTER',
    'GLOBAL', 'HACKER', 'INPUTS', 'JUMPER', 'KERNEL', 'LOCKED',
    'MATRIX', 'NUMBER', 'OUTPUT', 'PACKET', 'QUASAR', 'ROUTER',
    'SIGNAL', 'TARGET', 'UNLOCK', 'VECTOR', 'WIDGET', 'ZIGZAG',
    'SYSTEM', 'SECURE', 'MEMORY', 'BUFFER', 'SERVER', 'UPLOAD',
    'PLAYER', 'KEEPER', 'READER', 'LEADER', 'SEARCH', 'DETECT'
];

const SYMBOLS = '!@#$%^&*()_+{}[]<>?,./;:=';

interface CharObj {
    char: string;
    isWord: boolean;
    wordId?: number; // Groups chars into a specific word instance
    index: number; // Global index
}

interface DecryptorProps {
    data?: {
        entityId: string;
    };
}

// Seeded random generator
const createSeededRand = (seedStr: string) => {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
    }
    let s = Math.abs(hash);
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
};

export const Decryptor: React.FC<DecryptorProps> = ({ data }) => {
    const { currentCase, onPrint } = useOS();

    const [grid, setGrid] = useState<CharObj[]>([]);
    const [candidates, setCandidates] = useState<string[]>([]);
    const [password, setPassword] = useState('');
    const [attempts, setAttempts] = useState(ATTEMPTS_ALLOWED);
    const [logs, setLogs] = useState<string[]>([]);
    const [hoveredWordId, setHoveredWordId] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [resetCount, setResetCount] = useState(0);

    const logsEndRef = useRef<HTMLDivElement>(null);

    // Get Evidence
    const evidence = useMemo(() => {
        if (!data?.entityId || !currentCase) return null;
        return currentCase.entities.find(e => e.id === data.entityId);
    }, [data, currentCase]);

    const handlePrintReport = () => {
        if (!evidence || gameState !== 'won') return;
        const timestamp = new Date().toLocaleString();

        const reportData = {
            type: 'forensic-report',
            caseNumber: currentCase?.id || "UNKNOWN",
            title: 'Decryption Log',
            reportType: 'DECRYPTION LOG',
            analyst: 'Automated Cracker',
            date: timestamp,
            evidenceId: evidence.id,
            findings: `Target device authentication bypassed. Root access granted.\n\nExtracted Password: ${password}\n\nDECRYPTED CONTENT:\n----------------\n${evidence.transcript || evidence.content || "No readable data found."}`,
            status: "MATCH FOUND",
        };

        onPrint(
            `Decryption Log: ${evidence.label}`,
            `Decryption Report`,
            reportData
        );
    };

    // Initialize Game with Seed
    useEffect(() => {
        // Generate Seed
        const seed = (evidence?.id || 'default_seed') + resetCount;
        const rng = createSeededRand(seed);

        // 1. Select random words
        // Clone and shuffle
        const shuffled = [...POSSIBLE_WORDS].sort(() => 0.5 - rng());
        const selectedWords = shuffled.slice(0, 10);
        const finalWords = selectedWords.slice(0, 8);

        // Select password (deterministic based on rng)
        const targetPassword = finalWords[Math.floor(rng() * finalWords.length)];

        setPassword(targetPassword);
        setCandidates(finalWords);
        setAttempts(ATTEMPTS_ALLOWED);
        setLogs([
            '> DEVICE_LOCK_V3.0',
            '> CONNECTED TO TARGET',
            '> AUTHENTICATION REQUIRED',
            '> GUIDE: LIKENESS = MATCHING CHAR AT CORRECT POS'
        ]);
        setGameState('playing');

        // 2. Build Grid
        const totalChars = ROW_COUNT * COL_COUNT;
        const newGrid: CharObj[] = new Array(totalChars).fill(null).map((_, i) => ({
            char: SYMBOLS[Math.floor(rng() * SYMBOLS.length)],
            isWord: false,
            index: i
        }));

        // 3. Insert words
        const usedIndices = new Set<number>();

        finalWords.forEach((word, wordIdx) => {
            let placed = false;
            let attemptCount = 0;
            while (!placed && attemptCount < 100) {
                attemptCount++;
                // Random start position
                const startIdx = Math.floor(rng() * (totalChars - WORD_LENGTH));
                // Ensure line wrapping doesn't break words
                const row = Math.floor(startIdx / COL_COUNT);
                const endRow = Math.floor((startIdx + WORD_LENGTH - 1) / COL_COUNT);

                if (row !== endRow) continue; // Skip if wraps line

                // Check overlap
                let overlap = false;
                for (let i = 0; i < WORD_LENGTH; i++) {
                    if (usedIndices.has(startIdx + i)) overlap = true;
                }

                if (!overlap) {
                    for (let i = 0; i < WORD_LENGTH; i++) {
                        newGrid[startIdx + i] = {
                            char: word[i],
                            isWord: true,
                            wordId: wordIdx,
                            index: startIdx + i
                        };
                        usedIndices.add(startIdx + i);
                    }
                    placed = true;
                }
            }
        });

        setGrid(newGrid);
    }, [evidence, resetCount]);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const getLikeness = (guess: string, target: string) => {
        let matches = 0;
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === target[i]) matches++;
        }
        return matches;
    };

    const handleWordClick = (word: string) => {
        if (gameState !== 'playing') return;

        if (word === password) {
            setGameState('won');
            setLogs(prev => [...prev, `> ${word}`, '> PASSWORD ACCEPTED', '> SYSTEM UNLOCKED']);
        } else {
            const likeness = getLikeness(word, password);
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);
            setLogs(prev => [...prev, `> ${word}`, `> ENTRY DENIED`, `> LIKENESS=${likeness}/${WORD_LENGTH}`]);

            if (newAttempts <= 0) {
                setGameState('lost');
                setLogs(prev => [...prev, '> LOCKOUT IMMINENT', '> TERMINATING SESSION']);
            }
        }
    };

    const resetGame = () => {
        setResetCount(prev => prev + 1);
    };

    const handleHelp = () => {
        setLogs(prev => [
            ...prev,
            '> --- HELP ---',
            '> GOAL: GUESS THE PASSWORD',
            '> LIKENESS: NUMBER OF CHARACTERS THAT MATCH THE PASSWORD AT THE EXACT SAME POSITION.',
            '> EXAMPLE: "ABCD" vs "AEBF" = LIKENESS 1 ("A" IS MATCH)'
        ]);
    };

    if (!evidence && !data) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-emerald-900 bg-slate-950 p-4">
                <Lock size={48} className="mb-4 opacity-50" />
                <p>NO TARGET LOCKED</p>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 font-mono p-2 select-none overflow-hidden relative">

            {/* Content Overlay when Won */}
            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="p-1 border border-emerald-500 rounded-full mb-4">
                        <Unlock size={48} className="text-emerald-500" />
                    </div>
                    <h2 className="text-xl text-emerald-400 font-bold mb-2 tracking-widest">ACCESS GRANTED</h2>
                    <div className="w-full max-w-md bg-black/50 border border-emerald-900 p-4 rounded text-xs sm:text-sm text-emerald-300 font-mono shadow-lg shadow-emerald-900/20">
                        <div className="border-b border-emerald-900 pb-2 mb-2 text-emerald-600 uppercase text-[10px]">
                            DECRYPTED FILE CONTENT: {evidence?.label || 'UNKNOWN_FILE'}
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed">
                            {evidence?.content || ">> EMPTY FILE BUFFER <<"}
                        </div>
                    </div>
                    <button
                        onClick={resetGame}
                        className="mt-6 text-xs flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded border border-slate-700 text-slate-400 font-bold transition-colors"
                    >
                        <RefreshCw size={14} /> RELOCK SYSTEM
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-emerald-900/50 mb-2 shrink-0">
                <div className="flex items-center gap-2 text-emerald-500 text-xs">
                    <Terminal size={14} />
                    <span>REMOTE_DEBUG_TOOL // TGT: {evidence?.label?.substring(0, 12) || 'UNKNOWN'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleHelp}
                        className="text-emerald-700 hover:text-emerald-400 transition-colors"
                        title="Display Help"
                    >
                        <HelpCircle size={14} />
                    </button>
                    <div className="flex gap-1">
                        {Array.from({ length: ATTEMPTS_ALLOWED }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 border border-emerald-500/50 ${i < attempts ? 'bg-emerald-500' : 'bg-transparent'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex min-h-0 gap-4 overflow-hidden relative">
                {/* Hex Grid Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/30 p-2 rounded border border-slate-800">
                    <div className="grid grid-cols-[auto_1fr] gap-4 text-xs sm:text-sm leading-relaxed">
                        {/* Hex Addresses */}
                        <div className="flex flex-col text-emerald-700/60 font-mono select-none">
                            {Array.from({ length: ROW_COUNT }).map((_, i) => (
                                <span key={i}>0x{((0xF2A0) + (i * COL_COUNT)).toString(16).toUpperCase()}</span>
                            ))}
                        </div>

                        {/* Character Grid */}
                        <div
                            className="flex flex-wrap content-start max-w-[24ch] font-mono tracking-[0.2em] text-emerald-500 cursor-pointer"
                            onMouseLeave={() => { setHoveredIndex(null); setHoveredWordId(null); }}
                        >
                            {grid.map((cell) => {
                                const isHovered = hoveredWordId !== null && defined(cell.wordId) && hoveredWordId === cell.wordId;
                                const isSingleHover = hoveredWordId === null && hoveredIndex === cell.index;

                                return (
                                    <span
                                        key={cell.index}
                                        className={`
                      inline-block w-[1ch] text-center transition-colors duration-75
                      ${(isHovered || isSingleHover) ? 'bg-emerald-500 text-slate-900 font-bold' : ''}
                      ${cell.isWord ? 'text-emerald-300' : 'text-emerald-700'}
                      ${gameState !== 'playing' ? 'opacity-50' : ''}
                    `}
                                        onMouseEnter={() => {
                                            setHoveredIndex(cell.index);
                                            if (cell.isWord && cell.wordId !== undefined) {
                                                setHoveredWordId(cell.wordId);
                                            } else {
                                                setHoveredWordId(null);
                                            }
                                        }}
                                        onClick={() => {
                                            if (cell.isWord && cell.wordId !== undefined) {
                                                const word = candidates[cell.wordId];
                                                handleWordClick(word);
                                            } else {
                                                // Flavor click for non-words
                                                setLogs(prev => [...prev, `> 0x${cell.char.charCodeAt(0).toString(16).toUpperCase()} ERROR`]);
                                            }
                                        }}
                                    >
                                        {cell.char}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Logs & Status */}
                <div className="w-1/3 min-w-[140px] flex flex-col gap-2 shrink-0">

                    {/* Status Display */}
                    <div className={`p-2 border rounded flex flex-col items-center justify-center gap-1 min-h-[80px] transition-colors
            ${gameState === 'won' ? 'bg-emerald-900/20 border-emerald-500' :
                            gameState === 'lost' ? 'bg-red-900/20 border-red-500' :
                                'bg-slate-800/20 border-emerald-900'}
          `}>
                        {gameState === 'playing' && <Lock size={24} className="text-emerald-600 animate-pulse" />}
                        {gameState === 'won' && <Unlock size={24} className="text-emerald-400" />}
                        {gameState === 'lost' && <Lock size={24} className="text-red-400" />}

                        <span className={`text-xs font-bold ${gameState === 'won' ? 'text-emerald-400' :
                                gameState === 'lost' ? 'text-red-400' : 'text-emerald-600'
                            }`}>
                            {gameState === 'playing' ? 'LOCKED' : gameState === 'won' ? 'UNLOCKED' : 'LOCKOUT'}
                        </span>

                        {gameState !== 'playing' && (
                            <div className="flex gap-1 flex-wrap justify-center">
                                <button
                                    onClick={resetGame}
                                    className="mt-2 text-[10px] flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-600 text-slate-300"
                                >
                                    <RefreshCw size={10} /> REBOOT
                                </button>
                                {gameState === 'won' && (
                                    <button
                                        onClick={handlePrintReport}
                                        className="mt-2 text-[10px] flex items-center gap-1 bg-emerald-900/50 hover:bg-emerald-800 px-2 py-1 rounded border border-emerald-700 text-emerald-300"
                                    >
                                        <Printer size={10} /> LOG
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Log Console */}
                    <div className="flex-1 bg-black/40 border border-slate-800 p-2 text-[10px] sm:text-xs font-mono text-emerald-400 overflow-y-auto custom-scrollbar flex flex-col">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 break-words leading-tight opacity-80">{log}</div>
                        ))}
                        <div ref={logsEndRef} />
                        {gameState === 'playing' && (
                            <div className="animate-pulse">_</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function defined<T>(val: T | undefined): val is T {
    return val !== undefined;
}
