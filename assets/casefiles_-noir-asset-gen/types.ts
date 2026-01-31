export enum EntityType {
  SUSPECT = 'SUSPECT',
  EVIDENCE_PHOTO = 'EVIDENCE_PHOTO',
  EVIDENCE_OBJECT = 'EVIDENCE_OBJECT',
  EVIDENCE_PAPER = 'EVIDENCE_PAPER',
  FORENSIC_SAMPLE = 'FORENSIC_SAMPLE'
}

export interface EntityMetadata {
  location?: string;
  timestamp?: string;
  foundBy?: string;
  templateId?: string;
  fields?: any; // For structured data like bank statements
}

export interface CaseEntity {
  id: string;
  type: EntityType;
  name: string; // Label for objects, Name for suspects
  description: string; // Content/Bio
  notes?: string; // Visual cues
  visualTags?: string; // Specific tags for image generation
  metadata: EntityMetadata;
  imageUrl?: string; // The generated or edited asset
  isGenerating?: boolean;
  content?: string; // Expanded text content
  forensicData?: {
    type: string;
    value: string;
    description: string;
  };
}

export interface CaseFile {
  id: string;
  title: string;
  briefing: string;
  entities: CaseEntity[];
  solution?: {
    culpritId: string;
    weaponId: string;
    motive: string;
    reasoning: string;
  };
  visualTheme?: string;
}

export type GenerationRequest = {
  prompt: string;
  entityId: string;
};