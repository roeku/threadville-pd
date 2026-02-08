export interface Suspect {
  id: string;
  name: string;
  bio: string;
  notes: string;
  bloodType: string;
  dnaSequence: string;
  fingerprintPattern: string;
  photoUrl: string;
}

export interface ClueEntity {
  id: string;
  type: string;
  label: string;
  content: string;
  description: string;
  clues: string[];
  imageUrl?: string;
}

export interface CaseData {
  caseId: string;
  title: string;
  briefing: string;
  difficulty: string;
  suspects: Suspect[];
  entities: ClueEntity[];
  solution: {
    culpritId: string;
    weaponId: string;
    motive: string;
    reasoning: string;
  };
}

export interface Wrapper {
  title: string;
  content: CaseData;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  suspectId: string;
  messages: Message[];
}