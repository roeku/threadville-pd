// Copied from assets/skeuomorphic-forensic-os/App.tsx
import React, { useEffect } from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { Desktop } from './system/Desktop';
import { Taskbar } from './system/Taskbar';
import { CaseFile } from '../../types';
import { useGameStore } from '../../stores/useGameStore';

interface ForensicDesktopProps {
    currentCase: CaseFile | null;
    onPrint: (content: string, title?: string, metadata?: any) => void;
    onLogOut: () => void;
    startApp?: string;
}

const OSIntegration: React.FC<{ startApp?: string }> = ({ startApp }) => {
    const { focusedItemId } = useGameStore();
    const { openApp, currentCase } = useOS();

    // Open specified app on mount if provided
    useEffect(() => {
        if (startApp) {
            openApp(startApp as any);
        }
    }, [startApp, openApp]);

    useEffect(() => {
        if (!focusedItemId || !currentCase) return;

        const entity = currentCase.entities.find(e => e.id === focusedItemId);
        if (entity?.forensicData) {
            // Determine app type based on logic similar to EvidenceBoard
            let appId = null;
            if (entity.forensicData.type === 'DNA') appId = 'dna';
            if (entity.forensicData.type === 'FINGERPRINT') appId = 'fingerprint';
            if (entity.forensicData.type === 'AUDIO') appId = 'spectrograph';

            if (appId) {
                openApp(appId as any, { entityId: focusedItemId });
            }
        } else if (entity?.type === 'photo' || entity?.type === 'PHOTO') {
            openApp('image_viewer', { entityId: focusedItemId });
        } else if (entity?.type === 'paper' || entity?.type === 'PAPER') {
            openApp('document_viewer', { entityId: focusedItemId });
        } else if ((entity?.type === 'object' || entity?.type === 'OBJECT') && entity.forensicData?.type === 'AUDIO') {
            // If it's an object acting as audio source (e.g. tape recorder)
            openApp('spectrograph', { entityId: focusedItemId });
        }
    }, [focusedItemId, currentCase, openApp]);

    return null;
};

export const ForensicDesktop: React.FC<ForensicDesktopProps> = ({ currentCase, onPrint, onLogOut, startApp }) => {
    return (
        <div className="w-full h-full bg-[#050505] flex items-center justify-center font-sans select-none relative">
            <OSProvider currentCase={currentCase} onPrint={onPrint} onLogOut={onLogOut}>
                <OSIntegration startApp={startApp} />
                <div className="absolute inset-0 bg-slate-900 overflow-hidden flex flex-col">

                    {/* Screen Effects Layer (Over everything) - Optional, maybe tone it down? */}
                    <div className="absolute inset-0 z-[9999] pointer-events-none overflow-hidden rounded-lg">
                        {/* Scanlines */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                            backgroundSize: '100% 4px, 6px 100%'
                        }} />

                        {/* Vignette */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />

                        {/* Screen Gloss/Reflection */}
                        <div className="absolute top-0 right-0 w-2/3 h-1/3 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-[100px] pointer-events-none" />
                    </div>

                    {/* Wallpaper */}
                    <div className="absolute inset-0 z-0 bg-slate-950">
                        {/* Abstract Grid Wallpaper */}
                        <div className="w-full h-full opacity-20" style={{
                            backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-transparent to-slate-900" />

                        {/* Logo Watermark */}
                        <div className="absolute bottom-20 right-20 text-slate-800 font-black text-9xl tracking-tighter opacity-10 select-none">
                            PD-OS
                        </div>
                    </div>

                    {/* OS Logic */}
                    <Desktop />
                    <Taskbar />

                </div>
            </OSProvider>
        </div>
    );
};
