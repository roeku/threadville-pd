export enum EvidenceType {
  PAPER = 'PAPER',
  PHOTO = 'PHOTO',
  OBJECT = 'OBJECT',
  FORENSIC_SAMPLE = 'FORENSIC_SAMPLE',
  AUDIO = 'AUDIO'
}

export interface Suspect {
  id: string;
  name: string;
  bio: string;
  notes: string;
  visualTags?: string; // Physical traits for image gen (e.g. "scarred face, wet raincoat")
  bloodType: string;
  dnaSequence: string; // e.g. "ATGC..."
  fingerprintPattern: string; // e.g. "Loop-Whorl-Arch"
  photoUrl?: string; // Optional generated face
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  label: string;
  description?: string; // Visual description for the 3D artist/Image Gen
  visualTags?: string; // Specific visual tags
  content: string; // Text for papers, Description for objects
  imageUrl?: string; // For photos
  position?: [number, number, number];
  rotation?: [number, number, number];
  clues?: string[];
  forensicData?: {
    type: 'DNA' | 'FINGERPRINT' | 'BLOOD';
    value: string; // The sequence or pattern
    description: string; // e.g. "Trace amount of blood"
  };
  metadata?: any; // For structured data like lists, transcripts, etc.
  comparisonImage?: string; // URL for the "original" or "archived" photo for comparison (Negative Clue)
  isLocked?: boolean; // For devices requiring decryption
}

export interface CaseSolution {
  culpritId: string;
  weaponId: string;
  motive: string;
  reasoning: string;
}

export interface CaseFile {
  caseId: string;
  title: string;
  briefing: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  entities: EvidenceItem[];
  suspects: Suspect[];
  solution: CaseSolution;
  visualTheme?: string;
  status: 'draft' | 'published';
}

// --- Generation Wizard Types ---

export interface CaseScenario {
  theme: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  focus: 'Motive' | 'Forensics' | 'Alibi';
  constraints?: string[];
}

export interface SuspectSkeleton {
  id: string;
  name: string;
  role: string;
  motive: string;
  alibi: string;
  isCulprit: boolean;
  photoUrl?: string;
  // Forensic fields (added during wizard step 1 hydration)
  bloodType?: string;
  dnaSequence?: string;
  fingerprintPattern?: string;
}

export interface CaseNarrative {
  title: string;
  briefing: string;
  timeline: { time: string; event: string }[];
  suspects: SuspectSkeleton[];
  victim: { name: string; background: string; causeOfDeath: string };
  solution: CaseSolution;
}

export interface EvidenceManifestItem {
  id: string;
  type: EvidenceType;
  label: string;
  description: string;
  intendedClue: string;
  templateId?: string;
  forensicType?: 'DNA' | 'FINGERPRINT' | 'BLOOD';
  forensicData?: {
     type: 'DNA' | 'FINGERPRINT' | 'BLOOD';
     value: string;
     description: string;
  };
  imageUrl?: string;
}

export interface EvidenceManifest {
  items: EvidenceManifestItem[];
}

export interface GameState {
  currentCase: CaseFile | null;
  status: 'briefing' | 'investigating' | 'solving' | 'success' | 'failure';
  focusedItemId: string | null;
  loading: boolean;
  error: string | null;
}