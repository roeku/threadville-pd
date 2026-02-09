import React from 'react';
import { useGameStore } from '../stores/useGameStore';

export const TextureLoadingOverlay: React.FC = () => {
    const texturesLoadingCount = useGameStore((state) => state.texturesLoadingCount);

    // Only show if there are textures loading
    if (texturesLoadingCount === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4 pointer-events-none">
                <div className="relative w-12 h-12">
                    {/* Spinner */}
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full animate-spin border-t-amber-500"></div>
                </div>
                <div className="text-center">
                    <p className="text-amber-500 font-mono text-sm uppercase tracking-widest">
                        Gathering Case Files
                    </p>
                    <p className="text-slate-400 text-xs font-mono mt-1">
                        {texturesLoadingCount} document{texturesLoadingCount !== 1 ? 's' : ''} printing...
                    </p>
                </div>
            </div>
        </div>
    );
};
