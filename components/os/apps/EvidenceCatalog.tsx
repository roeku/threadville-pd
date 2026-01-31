import React, { useMemo, useState } from 'react';
import { useOS } from '../context/OSContext';
import { Search, Package } from 'lucide-react';
import { EvidenceItem } from '../../../types';

interface EvidenceCatalogProps {
    data?: {
        focusItemId?: string;
    };
}

export const EvidenceCatalog: React.FC<EvidenceCatalogProps> = ({ data }) => {
    const { currentCase } = useOS();
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedId, setFocusedId] = useState<string | null>(data?.focusItemId ?? null);

    const filteredEvidence = useMemo(() => {
        if (!currentCase?.entities) return [];

        // Only show OBJECT type evidence (collected physical objects)
        let filtered = currentCase.entities.filter(e => e.type?.toUpperCase() === 'OBJECT');

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.label?.toLowerCase().includes(query) ||
                e.description?.toLowerCase().includes(query) ||
                e.content?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [currentCase?.entities, searchQuery]);

    const focusedItem = focusedId ? currentCase?.entities.find(e => e.id === focusedId) : null;

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 bg-slate-900 border-b border-slate-700">
                <Search size={16} className="text-slate-500" />
                <input
                    type="text"
                    placeholder="Search collected objects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <div className="text-xs text-slate-500 font-mono px-2">
                    {filteredEvidence.length} object{filteredEvidence.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-3 overflow-hidden p-3">
                {/* Grid View */}
                <div className="flex-1 overflow-y-auto">
                    {filteredEvidence.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            <div className="text-center">
                                <p className="text-sm font-mono">NO EVIDENCE FOUND</p>
                                <p className="text-xs mt-1 opacity-50">Try a different search or filter</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                            {filteredEvidence.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setFocusedId(item.id)}
                                    className={`aspect-square flex flex-col items-center justify-center p-2 rounded border-2 transition-all cursor-pointer group ${focusedId === item.id
                                            ? 'bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/70'
                                        }`}
                                >
                                    {/* Image Thumbnail */}
                                    {item.imageUrl && item.imageUrl !== 'PENDING' ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.label}
                                            className="w-full h-full object-cover rounded"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded">
                                            <Package size={28} className="text-slate-600 mb-1" />
                                            <span className="text-[10px] text-center text-slate-500 line-clamp-2 px-1">
                                                {item.label}
                                            </span>
                                        </div>
                                    )}
                                    {/* Badge */}
                                    <div className="absolute top-1 right-1 bg-slate-900/80 text-[10px] px-1.5 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                        {(item.type ?? 'OBJECT').charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                {focusedItem && (
                    <div className="w-64 flex-shrink-0 bg-slate-900 border border-slate-700 rounded overflow-y-auto p-3 flex flex-col gap-3">
                        {/* Thumbnail */}
                        {focusedItem.imageUrl && focusedItem.imageUrl !== 'PENDING' ? (
                            <img
                                src={focusedItem.imageUrl}
                                alt={focusedItem.label}
                                className="w-full aspect-square object-cover rounded border border-slate-700"
                            />
                        ) : (
                            <div className="w-full aspect-square bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
                                <Package size={48} className="text-slate-600" />
                            </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm truncate text-white">{focusedItem.label}</h3>
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <Package size={12} />
                                <span>Physical Object</span>
                            </div>
                        </div>

                        {/* Description */}
                        {focusedItem.description && (
                            <div className="text-xs text-slate-400 leading-tight line-clamp-3">
                                {focusedItem.description}
                            </div>
                        )}

                        {/* Clues */}
                        {focusedItem.clues && focusedItem.clues.length > 0 && (
                            <div className="border-t border-slate-700 pt-2">
                                <p className="text-xs font-semibold text-slate-300 mb-2">Key Clues</p>
                                <ul className="space-y-1">
                                    {focusedItem.clues.map((clue, i) => (
                                        <li key={i} className="text-xs text-amber-300 flex gap-1">
                                            <span>💡</span>
                                            <span className="flex-1">{clue}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Forensic Data */}
                        {focusedItem.forensicData && (
                            <div className="border-t border-slate-700 pt-2">
                                <p className="text-xs font-semibold text-slate-300 mb-2">Forensic Data</p>
                                <div className="text-xs text-slate-400 space-y-1 font-mono">
                                    <div>Type: {focusedItem.forensicData.type}</div>
                                    {focusedItem.forensicData.confidence && (
                                        <div>Confidence: {(focusedItem.forensicData.confidence * 100).toFixed(0)}%</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Content Preview */}
                        {focusedItem.content && (
                            <div className="border-t border-slate-700 pt-2">
                                <p className="text-xs font-semibold text-slate-300 mb-2">Content</p>
                                <p className="text-xs text-slate-400 leading-tight line-clamp-4">
                                    {focusedItem.content}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className="px-3 py-2 bg-slate-900 border-t border-slate-700 text-xs text-slate-500 font-mono">
                {filteredEvidence.length} collected object{filteredEvidence.length !== 1 ? 's' : ''} • Evidence Catalog v2.1
            </div>
        </div>
    );
};
