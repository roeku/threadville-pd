import React from 'react';
import { Activity, Dna, Fingerprint, FolderSearch, Settings, Image, FileText, Archive } from 'lucide-react';
import { AppConfig, AppId } from './types';
import { DnaSequencer } from './apps/DnaSequencer';
import { FingerprintScanner } from './apps/FingerprintScanner';
import { Spectrograph } from './apps/Spectrograph';
import { EvidenceBoard } from './apps/EvidenceBoard';
import { Decryptor } from './apps/Decryptor';
import { ImageViewer } from './apps/ImageViewer';
import { DocumentViewer } from './apps/DocumentViewer';
import { EvidenceCatalog } from './apps/EvidenceCatalog';

export const APPS: Record<AppId, AppConfig> = {
    dna: {
        id: 'dna',
        name: 'Helix Sequencer',
        icon: <Dna className="w-full h-full" />,
        defaultW: 40,
        defaultH: 60,
        component: DnaSequencer,
    },
    fingerprint: {
        id: 'fingerprint',
        name: 'Minutiae Mapper',
        icon: <Fingerprint className="w-full h-full" />,
        defaultW: 50,
        defaultH: 70,
        component: FingerprintScanner,
    },
    spectrograph: {
        id: 'spectrograph',
        name: 'SpecTuner 2000',
        icon: <Activity className="w-full h-full" />,
        defaultW: 45,
        defaultH: 55,
        component: Spectrograph,
    },
    decryptor: {
        id: 'decryptor',
        name: 'Decryptor v3',
        icon: <Activity className="w-full h-full" />,
        defaultW: 55,
        defaultH: 55,
        component: Decryptor,
    },
    evidence: {
        id: 'evidence',
        name: 'Case Files',
        icon: <FolderSearch className="w-full h-full" />,
        defaultW: 60,
        defaultH: 50,
        component: EvidenceBoard,
    },
    image_viewer: {
        id: 'image_viewer',
        name: 'Image Viewer',
        icon: <Image className="w-full h-full" />,
        defaultW: 50,
        defaultH: 60,
        component: ImageViewer,
    },
    document_viewer: {
        id: 'document_viewer',
        name: 'DocuRead',
        icon: <FileText className="w-full h-full" />,
        defaultW: 40,
        defaultH: 70,
        component: DocumentViewer,
    },
    evidence_catalog: {
        id: 'evidence_catalog',
        name: 'Evidence Catalog',
        icon: <Archive className="w-full h-full" />,
        defaultW: 70,
        defaultH: 75,
        component: EvidenceCatalog,
    },
    settings: {
        id: 'settings',
        name: 'SysConfig',
        icon: <Settings className="w-full h-full" />,
        defaultW: 30,
        defaultH: 40,
        component: () => <div className="p-4 text-emerald-400 font-mono">System Integrity: 98%<br />Kernel v4.1.2<br />Secure Connection: ESTABLISHED</div>,
    },
};

export const INITIAL_WINDOWS = [];
