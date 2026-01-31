import React from 'react';
import { FileText, Image as ImageIcon, Music, Film, Fingerprint, Dna, FileQuestion } from 'lucide-react';
import { useOS } from '../context/OSContext';
import { EvidenceItem } from '../../types';

export const EvidenceBoard: React.FC = () => {
    const { openApp, currentCase } = useOS();

    const getIconForType = (type: string, forensicType?: string) => {
        const t = (type || "").toUpperCase();
        if (forensicType === 'DNA') return <Dna className="text-blue-400" />;
        if (forensicType === 'FINGERPRINT') return <Fingerprint className="text-purple-400" />;
        if (t === 'AUDIO') return <Music className="text-green-400" />;
        if (t === 'VIDEO') return <Film className="text-red-400" />;
        if (t === 'PHOTO') return <ImageIcon className="text-amber-400" />;
        return <FileText className="text-slate-400" />;
    };

    const getAppForType = (type: string, forensicType?: string) => {
        const t = (type || "").toUpperCase();
        if (forensicType === 'DNA') return 'dna';
        if (forensicType === 'FINGERPRINT') return 'fingerprint';
        if (t === 'AUDIO' || forensicType === 'AUDIO') return 'spectrograph';
        if (t === 'PHOTO') return 'image_viewer';
        if (t === 'PAPER') return 'document_viewer';
        // Check for encrypted files potentially?
        if (t === 'OBJECT' && type.includes('encrypted')) return 'decryptor';
        return null;
    };

    const files = (currentCase?.entities ?? []).map(entity => ({
        entity,
        name: entity.label,
        icon: getIconForType(entity.type, entity.forensicData?.type),
        app: getAppForType(entity.type, entity.forensicData?.type)
    }));

    // Add some dummy files if empty for testing
    if (files.length === 0) {
        files.push({
            entity: { id: 'dummy', label: 'System_Check.log', type: 'paper', content: '' } as EvidenceItem,
            name: 'System_Check.log',
            icon: <FileText className="text-slate-400" />,
            app: null
        });
    }

    const handleOpen = (file: typeof files[0]) => {
        if (file.app) {
            openApp(file.app as any, { entityId: file.entity.id });
        }
    };

    return (
        <div className="h-full p-4 overflow-y-auto">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4">
                {files.map((file, i) => (
                    <div
                        key={i}
                        onDoubleClick={() => handleOpen(file)}
                        className="flex flex-col items-center p-2 hover:bg-slate-700/50 rounded cursor-pointer border border-transparent hover:border-slate-600 transition-colors group"
                    >
                        <div className="w-10 h-10 mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {React.cloneElement(file.icon as React.ReactElement<any>, { size: 32 })}
                        </div>
                        <span className="text-[11px] text-center leading-tight w-full break-words line-clamp-2 text-slate-300 font-sans group-hover:text-white">
                            {file.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
