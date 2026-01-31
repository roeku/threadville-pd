export enum DocumentType {
  // Case Files
  AUTOPSY_REPORT = 'AUTOPSY_REPORT',
  SEARCH_WARRANT = 'SEARCH_WARRANT',
  INVESTIGATION_SUMMARY = 'INVESTIGATION_SUMMARY',
  WITNESS_STATEMENT = 'WITNESS_STATEMENT',
  
  // Police & Ops
  INCIDENT_REPORT = 'INCIDENT_REPORT',
  ARREST_BOOKING = 'ARREST_BOOKING',
  EVIDENCE_TAG = 'EVIDENCE_TAG',
  
  // Forensics
  LAB_REPORT = 'LAB_REPORT',
  FINGERPRINT_CARD = 'FINGERPRINT_CARD',
  TOXICOLOGY_REPORT = 'TOXICOLOGY_REPORT',
  
  // Communications
  TRANSCRIPT_INTERVIEW = 'TRANSCRIPT_INTERVIEW',
  EMAIL_PRINTOUT = 'EMAIL_PRINTOUT',
  
  // Misc / Personal
  NEWSPAPER_CLIPPING = 'NEWSPAPER_CLIPPING',
  STICKY_NOTE = 'STICKY_NOTE',
  HANDWRITTEN_NOTE = 'HANDWRITTEN_NOTE',
  BANK_STATEMENT = 'BANK_STATEMENT'
}

export enum DocumentCategory {
  CASE_FILE = "Case File",
  LEGAL = "Legal",
  POLICE = "Police & Ops",
  FORENSICS = "Forensics",
  MEDICAL = "Medical",
  COMMUNICATIONS = "Communications",
  MEDIA = "Media & Public",
  PERSONAL = "Personal & Misc",
  FINANCIAL = "Financial"
}

// Universal Data Structure for Generic Templates
export interface UniversalDocumentData {
  title: string;
  subtitle?: string;
  headerMetadata: Record<string, string>; // e.g., "Date": "2023-01-01"
  bodySections: {
    title?: string;
    content: string; // Markdown supported
  }[];
  footerMetadata?: Record<string, string>;
  signatures?: string[];
}

export interface AutopsyReportData {
  caseNumber: string;
  decedentName: string;
  dateOfDeath: string;
  timeOfDeath: string;
  examinerName: string;
  externalFindings: string;
  internalFindings: string;
  causeOfDeath: string;
  mannerOfDeath: string;
  toxicologyNotes: string;
}

export interface SearchWarrantData {
  warrantId: string;
  judgeName: string;
  targetAddress: string;
  targetPerson: string;
  itemsToSeize: string[];
  probableCause: string;
  dateIssued: string;
  expiryDate?: string;
}

export interface BankStatementData {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  statementPeriod: string;
  startingBalance: string;
  endingBalance: string;
  transactions: {
    date: string;
    description: string;
    amount: string;
    type: 'DEBIT' | 'CREDIT';
  }[];
}

export interface TranscriptData {
  caseNumber: string;
  date: string;
  location: string;
  interviewers: string[];
  interviewees: string[];
  recordingDuration: string;
  dialogue: {
    speaker: string;
    timestamp?: string; // Optional "00:01:23"
    text: string;
    action?: string; // e.g., "(coughs)", "(slams table)"
  }[];
}

export type DocumentData = UniversalDocumentData | AutopsyReportData | SearchWarrantData | BankStatementData | TranscriptData | any;

export interface DocumentConfig {
  type: DocumentType;
  category: DocumentCategory;
  label: string;
  width: number; // in pixels for texture gen
  height: number; // in pixels for texture gen
  physicalSize: [number, number]; // in meters for 3D mesh [width, height]
  systemPrompt: string;
}

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  data: DocumentData;
  textureUrls: string[]; 
  aspectRatio: number;
  createdAt: number;
}