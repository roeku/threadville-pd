import React from 'react';
import { Activity, Dna, Fingerprint, FolderSearch, Settings, Smartphone } from 'lucide-react';
import { AppConfig, AppId } from './types';
import { DnaSequencer } from './components/apps/DnaSequencer';
import { FingerprintScanner } from './components/apps/FingerprintScanner';
import { Spectrograph } from './components/apps/Spectrograph';
import { EvidenceBoard } from './components/apps/EvidenceBoard';
import { Decryptor } from './components/apps/Decryptor';

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
    icon: <Smartphone className="w-full h-full" />,
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
  settings: {
    id: 'settings',
    name: 'SysConfig',
    icon: <Settings className="w-full h-full" />,
    defaultW: 30,
    defaultH: 40,
    component: () => <div className="p-4 text-emerald-400 font-mono">System Integrity: 98%<br/>Kernel v4.1.2<br/>Secure Connection: ESTABLISHED</div>,
  },
};

export const INITIAL_WINDOWS = [];