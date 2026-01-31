import React, { useMemo, useState } from 'react';
import { useOS } from '../context/OSContext';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageViewerProps {
    data?: {
        entityId: string;
    };
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ data }) => {
    const { currentCase } = useOS();
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);

    const evidence = useMemo(() => {
        if (!data?.entityId || !currentCase) return null;
        return currentCase.entities.find(e => e.id === data.entityId);
    }, [data, currentCase]);

    if (!evidence) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <p>No Image Loaded</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-slate-700">
                <button
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Zoom Out"
                >
                    <ZoomOut size={16} />
                </button>
                <div className="text-xs font-mono w-16 text-center">{(zoom * 100).toFixed(0)}%</div>
                <button
                    onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Zoom In"
                >
                    <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-slate-700 mx-2" />
                <button
                    onClick={() => setRotation(r => (r - 90) % 360)}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    title="Rotate"
                >
                    <RotateCcw size={16} />
                </button>
                <div className="flex-1" />
                <div className="text-xs text-slate-500 font-mono truncate max-w-[200px]">
                    {evidence.label}
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#101010]">
                {evidence.imageUrl ? (
                    <div
                        className="transition-transform duration-200 ease-out origin-center shadow-2xl"
                        style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`
                        }}
                    >
                        <img
                            src={evidence.imageUrl}
                            alt={evidence.label}
                            className="max-w-full max-h-[80vh] object-contain border border-slate-800"
                            draggable={false}
                        />
                    </div>
                ) : (
                    <div className="text-center text-slate-600">
                        <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                        <p>IMAGE CORRUPTED OR MISSING</p>
                    </div>
                )}
            </div>
        </div>
    );
};
