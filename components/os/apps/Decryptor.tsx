import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, HelpCircle, RotateCcw, Printer } from 'lucide-react';
import { useOS } from '../context/OSContext';

const POSSIBLE_WORDS = [
    'ACCESS', 'BRIDGE', 'CIPHER', 'DEVICE', 'ENERGY', 'FILTER',
    'GLOBAL', 'HACKER', 'INPUTS', 'JUMPER', 'KERNEL', 'LOCKED',
    'MATRIX', 'NUMBER', 'OUTPUT', 'PACKET', 'QUASAR', 'ROUTER',
    'SIGNAL', 'TARGET', 'UNLOCK', 'VECTOR', 'WIDGET', 'ZIGZAG',
    'SYSTEM', 'SECURE', 'MEMORY', 'BUFFER', 'SERVER', 'UPLOAD',
    'PLAYER', 'KEEPER', 'READER', 'LEADER', 'SEARCH', 'DETECT',
    'COMBAT', 'CUSTOM', 'FORMAL', 'MARKET', 'EXPORT', 'IMPACT'
];

const SYMBOLS = '!@#$%^&*()_+{}[]<>?,./;:=|\\~`';
const WORD_LENGTH = 6;
const ROW_COUNT = 16;
const COL_COUNT = 12;
const ATTEMPTS_ALLOWED = 4;
const TOTAL_CHARS = ROW_COUNT * COL_COUNT;
const NUM_WORDS = 8;

type GameState = 'playing' | 'won' | 'lost';

interface GridCell {
    char: string;
    isWord: boolean;
    wordIndex: number | null;
}

interface DecryptorProps {
    data?: {
        entityId: string;
    };
}

// Seeded random number generator
class SeededRandom {
    private seed: number;

    constructor(seed: string) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        this.seed = Math.abs(hash);
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }

    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

export const Decryptor: React.FC<DecryptorProps> = ({ data }) => {
    const { currentCase, onPrint } = useOS();
    const evidence = currentCase?.entities.find(e => e.id === data?.entityId);

    const [grid, setGrid] = useState<GridCell[]>([]);
    const [words, setWords] = useState<string[]>([]);
    const [password, setPassword] = useState<string>('');
    const [gameState, setGameState] = useState<GameState>('playing');
    const [attempts, setAttempts] = useState(ATTEMPTS_ALLOWED);
    const [logs, setLogs] = useState<string[]>([]);
    const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
    const [resetCount, setResetCount] = useState(0);
    const [showOverlay, setShowOverlay] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);

    // Initialize game
    useEffect(() => {
        if (!evidence) return;

        const seedStr = `${evidence.id}-${resetCount}`;
        const rng = new SeededRandom(seedStr);

        // Select 8 random words
        const selectedWords = rng.shuffle(POSSIBLE_WORDS).slice(0, NUM_WORDS);
        const passwordWord = selectedWords[rng.nextInt(selectedWords.length)];

        setWords(selectedWords);
        setPassword(passwordWord);
        setGameState('playing');
        setAttempts(ATTEMPTS_ALLOWED);
        setLogs([
            '> DEVICE_LOCK_V3.0',
            '> DEVICE_LOCK_V3.0',
            '> CONNECTED TO TARGET',
            '> AUTHENTICATION REQUIRED',
            '> GUIDE: LIKENESS = MATCHING CHAR AT CORRECT POS'
        ]);

        // Build grid
        const newGrid: GridCell[] = [];

        // Initialize with random symbols
        for (let i = 0; i < TOTAL_CHARS; i++) {
            newGrid.push({
                char: SYMBOLS[rng.nextInt(SYMBOLS.length)],
                isWord: false,
                wordIndex: null
            });
        }

        // Insert words at random positions
        const usedPositions = new Set<number>();

        selectedWords.forEach((word, wordIdx) => {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 100) {
                const row = rng.nextInt(ROW_COUNT);
                const startCol = rng.nextInt(COL_COUNT - WORD_LENGTH + 1);
                const startPos = row * COL_COUNT + startCol;

                // Check if position is available (no overlap)
                let canPlace = true;
                for (let i = 0; i < WORD_LENGTH; i++) {
                    if (usedPositions.has(startPos + i)) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    // Place the word
                    for (let i = 0; i < WORD_LENGTH; i++) {
                        const pos = startPos + i;
                        newGrid[pos] = {
                            char: word[i],
                            isWord: true,
                            wordIndex: wordIdx
                        };
                        usedPositions.add(pos);
                    }
                    placed = true;
                }

                attempts++;
            }
        });

        setGrid(newGrid);
    }, [evidence, resetCount]);

    // Auto-scroll logs
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, message]);
    };

    const calculateLikeness = (guess: string, target: string): number => {
        let count = 0;
        for (let i = 0; i < Math.min(guess.length, target.length); i++) {
            if (guess[i] === target[i]) count++;
        }
        return count;
    };

    const handleCellClick = (index: number) => {
        if (gameState !== 'playing') return;

        const cell = grid[index];

        if (!cell.isWord) {
            // Clicked on symbol
            const row = Math.floor(index / COL_COUNT);
            const hexAddr = (0xF2A0 + (row * 0x0C)).toString(16).toUpperCase();
            addLog(`> 0x${hexAddr} ERROR`);
            return;
        }

        // Find the complete word
        const wordIdx = cell.wordIndex;
        if (wordIdx === null) return;

        const clickedWord = words[wordIdx];
        handleWordClick(clickedWord);
    };

    const handleWordClick = (word: string) => {
        if (gameState !== 'playing') return;

        if (word === password) {
            // Win!
            addLog(`> ${word}`);
            addLog('> PASSWORD ACCEPTED');
            addLog('> SYSTEM UNLOCKED');
            setGameState('won');
            // Smooth reveal with delay
            setTimeout(() => setShowOverlay(true), 800);
        } else {
            // Wrong guess
            const likeness = calculateLikeness(word, password);
            const newAttempts = attempts - 1;
            setAttempts(newAttempts);

            addLog(`> ${word}`);
            addLog('> ENTRY DENIED');
            addLog(`> LIKENESS=${likeness}/${WORD_LENGTH}`);

            if (newAttempts === 0) {
                setGameState('lost');
                addLog('> LOCKOUT INITIATED');
                addLog('> SYSTEM LOCKED');
                addLog('> CONTACT ADMINISTRATOR');
            }
        }
    };

    const handleHelp = () => {
        addLog('> --- HELP ---');
        addLog('> GOAL: GUESS THE PASSWORD');
        addLog('> LIKENESS: NUMBER OF CHARACTERS THAT MATCH THE PASSWORD AT THE EXACT SAME POSITION.');
        addLog('> EXAMPLE: "ABCD" vs "AEBF" = LIKENESS 1 ("A" IS MATCH)');
    };

    const handleReboot = () => {
        setShowOverlay(false);
        setResetCount(prev => prev + 1);
    };

    const handlePrint = () => {
        if (!evidence || gameState !== 'won') return;

        const timestamp = new Date().toLocaleString();

        // Format content properly for server-log template
        const content = evidence.transcript || evidence.content || 'No decrypted data available';

        // ServerLogTemplate expects 'entries' as string[] in metadata.fields
        const logEntries = content.split('\n');

        onPrint?.(content, `${evidence.label} - Decrypted`, {
            type: 'server-log',
            templateId: 'server-log',
            evidenceId: evidence.id,
            date: timestamp,
            source: evidence.label,
            timestampRange: timestamp,
            entries: logEntries, // Add at top level for getValue to find
            fields: {
                'Device': evidence.label,
                'Evidence ID': evidence.id,
                'Status': 'UNLOCKED',
                'Method': 'Brute Force Authentication Bypass',
                'Password': password,
                'Timestamp': timestamp,
                entries: logEntries // CRITICAL: Also add inside fields for template compatibility
            }
        }, `DECRYPT-${evidence.id}-${Date.now()}`);

        addLog('> REPORT GENERATED');
        addLog('> DATA LOGGED TO PRINTER');
    };

    const handleMouseEnter = (index: number) => {
        const cell = grid[index];
        if (cell.isWord) {
            setHoveredWordIndex(cell.wordIndex);
        }
    };

    const handleMouseLeave = () => {
        setHoveredWordIndex(null);
    };

    if (!evidence) {
        return (
            <div className="w-full h-full flex items-center justify-center text-emerald-500">
                <p>No evidence loaded</p>
            </div>
        );
    }

    const targetLabel = (evidence.label || '').slice(0, 12).toUpperCase();

    return (
        <div className="w-full h-full bg-slate-950 text-emerald-500 flex flex-col font-mono">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-emerald-800/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold tracking-wider">
                        REMOTE_DEBUG_TOOL // TGT: {targetLabel}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleHelp}
                        className="p-1 hover:bg-emerald-900/30 rounded transition-colors"
                        title="Help"
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1">
                        {[...Array(ATTEMPTS_ALLOWED)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 border transition-all ${i < attempts
                                    ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/50'
                                    : 'bg-transparent border-emerald-800/50'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Column: Hex Grid */}
                <div className="flex-[65] p-3 flex flex-col overflow-hidden bg-black/10">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex gap-2 relative">
                            {/* Hex Addresses */}
                            <div className="flex flex-col gap-0 text-emerald-700/70 text-[10px] leading-[1.35] flex-shrink-0 select-none">
                                {[...Array(ROW_COUNT)].map((_, i) => {
                                    const addr = (0xF2A0 + (i * 0x0C)).toString(16).toUpperCase();
                                    return (
                                        <div key={i} className="h-[1.35em] font-mono">
                                            0x{addr}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Character Grid */}
                            <div className={`flex flex-col gap-0 transition-opacity duration-300 ${gameState !== 'playing' ? 'opacity-40' : ''}`}>
                                {[...Array(ROW_COUNT)].map((_, rowIdx) => (
                                    <div key={rowIdx} className="flex gap-0 h-[1.35em] leading-[1.35]">
                                        {[...Array(COL_COUNT)].map((_, colIdx) => {
                                            const index = rowIdx * COL_COUNT + colIdx;
                                            const cell = grid[index];
                                            if (!cell) return null;

                                            const isHovered = cell.isWord && cell.wordIndex === hoveredWordIndex;

                                            return (
                                                <span
                                                    key={colIdx}
                                                    onClick={() => handleCellClick(index)}
                                                    onMouseEnter={() => handleMouseEnter(index)}
                                                    onMouseLeave={handleMouseLeave}
                                                    className={`
                                                        text-[10px] cursor-pointer transition-all duration-75 select-none font-mono tracking-wider px-[1px]
                                                        ${cell.isWord ? 'text-emerald-300' : 'text-emerald-700/60'}
                                                        ${isHovered ? 'bg-emerald-500 text-slate-900 font-bold scale-105 shadow-sm shadow-emerald-500/50 relative z-10' : ''}
                                                        ${gameState !== 'playing' ? 'cursor-not-allowed' : 'hover:text-emerald-200'}
                                                    `}
                                                >
                                                    {cell.char}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Status & Logs */}
                <div className="flex-[35] border-l border-emerald-800/50 flex flex-col min-h-0 bg-black/20">
                    {/* Status Panel */}
                    <div className="p-3 border-b border-emerald-800/50 flex flex-col items-center gap-2 flex-shrink-0">
                        {gameState === 'playing' && (
                            <>
                                <Lock className="w-6 h-6 text-emerald-600 animate-pulse" />
                                <div className="text-emerald-600 font-bold text-xs tracking-wider">LOCKED</div>
                            </>
                        )}
                        {gameState === 'won' && (
                            <>
                                <Unlock className="w-6 h-6 text-emerald-400" />
                                <div className="text-emerald-400 font-bold text-xs tracking-wider">UNLOCKED</div>
                                <div className="flex flex-col gap-1.5 mt-2 w-full">
                                    <button
                                        onClick={handleReboot}
                                        className="w-full px-2 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 text-[10px] rounded transition-all flex items-center justify-center gap-1.5 font-bold tracking-wide"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        REBOOT
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="w-full px-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/60 text-emerald-200 text-[10px] rounded transition-all flex items-center justify-center gap-1.5 font-bold tracking-wide"
                                    >
                                        <Printer className="w-3 h-3" />
                                        PRINT
                                    </button>
                                </div>
                            </>
                        )}
                        {gameState === 'lost' && (
                            <>
                                <Lock className="w-6 h-6 text-red-400" />
                                <div className="text-red-400 font-bold text-xs tracking-wider">LOCKOUT</div>
                                <button
                                    onClick={handleReboot}
                                    className="w-full px-2 py-1.5 mt-2 bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 text-[10px] rounded transition-all flex items-center justify-center gap-1.5 font-bold tracking-wide"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    REBOOT
                                </button>
                            </>
                        )}
                    </div>

                    {/* Log Console */}
                    <div
                        ref={logRef}
                        className="flex-1 p-2 bg-black/60 overflow-y-auto text-emerald-400 text-[10px] font-mono leading-relaxed min-h-0"
                    >
                        {logs.map((log, i) => (
                            <div key={i} className="mb-0.5">{log}</div>
                        ))}
                        {gameState === 'playing' && (
                            <div className="inline-block animate-pulse">_</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Win State Overlay */}
            {false && (
                <div
                    className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6"
                    style={{
                        animation: 'fadeIn 0.5s ease-out',
                    }}
                >
                    <div
                        className="bg-slate-900/95 border-2 border-emerald-500 rounded-lg p-6 max-w-3xl max-h-[90%] w-full shadow-2xl shadow-emerald-500/30"
                        style={{
                            animation: 'zoomIn 0.3s ease-out 0.3s both',
                        }}
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex flex-col items-center gap-3 flex-shrink-0">
                                <Unlock className="w-12 h-12 text-emerald-400 animate-pulse" />
                                <h2 className="text-xl font-bold text-emerald-400 tracking-widest">
                                    ACCESS GRANTED
                                </h2>
                                <p className="text-emerald-500/80 text-xs font-mono">
                                    TARGET DEVICE: {targetLabel}
                                </p>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
                                <div className="text-center space-y-2">
                                    <div className="text-emerald-200 text-sm font-bold">
                                        AUTHORIZATION LEVEL: ADMINISTRATOR
                                    </div>
                                    <div className="text-emerald-500/60 text-xs max-w-md mx-auto">
                                        Secure data partition has been mounted. Contents are ready for extraction and logging to the central evidence database.
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-4 flex-shrink-0">
                                <button
                                    onClick={handleReboot}
                                    className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-emerald-600/50 text-emerald-300 rounded transition-all flex items-center justify-center gap-2 font-bold text-sm tracking-wide group"
                                >
                                    <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                    RELOCK SYSTEM
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex-[2] px-4 py-3 bg-emerald-900 hover:bg-emerald-800 border border-emerald-500 text-emerald-100 rounded transition-all flex items-center justify-center gap-2 font-bold text-sm tracking-wide shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/20 group"
                                >
                                    <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    EXTRACT & LOG DATA
                                </button>
                            </div>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes zoomIn {
                            from { transform: scale(0.95); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                        }
                    `}} />
                </div>
            )}
        </div>
    );
};
