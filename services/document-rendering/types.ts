export enum DocumentType {
  AUTOPSY_REPORT = 'autopsy-report',
  BANK_STATEMENT = 'bank-statement',
  SEARCH_WARRANT = 'search-warrant',
  RAIL_TIMETABLE = 'rail-timetable',
  WITNESS_STATEMENT = 'witness-statement',
  TRANSCRIPT = 'transcript-excerpt',
  INCIDENT_REPORT = 'incident-report',
  FORENSIC_REPORT = 'forensic-report'
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

export interface RailTimetableData {
  header: string;
  station: string;
  departures: string[];
}

export interface WitnessStatementData {
  header: string;
  name: string;
  timestamp: string;
  officer: string;
  body: string;
}

export interface TranscriptData {
  source: string;
  timestampRange: string;
  speakers: { name: string; line: string }[];
}

export interface ServerLogData {
  source: string;
  timestampRange: string;
  entries: string[];
}

export interface IncidentReportData {
  header: string;
  subtitle: string;
  reportNumber: string;
  officer: string;
  badge: string;
  incidentType: string;
  location: string;
  datetime: string;
  narrative: string;
  supervisor?: string;
}

export interface CaseFileCoverData {
  caseNumber: string;
  title: string;
  leadInvestigator: string;
  assignedTeam: string[];
  startDate: string;
}

export interface LabSubmissionFormData {
  caseNumber: string;
  submitter: string;
  date: string;
  items: Array<{ itemId: string; description: string; requestedTests: string }>;
}

export interface EmailPrintoutData {
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  attachments: string[];
}

export interface BoardingPassData {
  airline: string;
  passenger: string;
  flight: string;
  date: string;
  from: string;
  to: string;
  seat: string;
  boardingTime: string;
}

export interface NewsClippingData {
  headline: string;
  byline: string;
  date: string;
  body: string;
}

export interface CrimeSceneSketchData {
  location: string;
  sketchNotes: string;
  legend: string[];
  measurements: string[];
}

export interface HandwrittenNoteData {
  author: string;
  body: string;
  date?: string;
}

export interface InternalMemoData {
  from: string;
  to: string;
  date: string;
  subject: string;
  body: string;
  watermark?: string;
}


export interface ForensicReportData {
  caseNumber: string;
  reportType: 'DNA ANALYSIS' | 'FINGERPRINT MATCH' | 'SPECTROGRAPHIC ANALYSIS' | 'DECRYPTION LOG';
  analyst: string;
  date: string;
  subject?: string;
  evidenceId?: string;
  findings: string;
  matchProbability?: string;
  imageUrl?: string;
  status: 'CONCLUSIVE' | 'INCONCLUSIVE' | 'PENDING' | 'MATCH FOUND';
}
