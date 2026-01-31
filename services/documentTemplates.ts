// Document templates and generation schema for evidence papers
// Minimal integration: returns EvidenceItem with PAPER type and structured metadata

import { EvidenceItem, EvidenceType } from '../types';

export type FieldType =
  | 'string'
  | 'multiline'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'boolean'
  | 'list'
  | 'table'
  | 'image'
  | 'signature';

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  // For table/list
  columns?: { key: string; label: string; type: FieldType }[];
}

export interface LayoutBlock {
  id: string;
  label?: string;
  // Relative positions on the paper (meters in scene units) for future 3D rendering
  // origin: top-left. width/height to aid positioning in Three.js Text/Image
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number; // scene units
  bold?: boolean;
}

export interface TextureRequirement {
  id: string;
  description: string;
  // Example path under assets/textures/documents
  suggestedPath: string;
  type?: string;
  position?: [number, number, number];
  scale?: [number, number];
  opacity?: number;
}

export interface DocumentTemplateSpec {
  id: string;
  name: string;
  category:
    | 'Case Files'
    | 'Law & Legal'
    | 'Police & Operations'
    | 'Forensics & Lab'
    | 'Medical & EMS'
    | 'Financial & Records'
    | 'Communications & Digital'
    | 'Travel & Logistics'
    | 'Media & Public'
    | 'Maps & Scene Artifacts'
    | 'Personal & Misc'
    | 'Administrative & Corporate'
    | 'Audio & Transcripts'
    | 'Template/Texture Bases';
  description: string;
  fields: FieldSpec[];
  layout: LayoutBlock[];
  textures: TextureRequirement[];
  // Optional helper to derive label/content
  makeLabel?: (data: Record<string, any>) => string;
  makeContentPreview?: (data: Record<string, any>) => string;
}

// Utility to create a PAPER EvidenceItem from template + data
export function generateDocumentEvidence(
  template: DocumentTemplateSpec,
  data: Record<string, any>,
  options?: { id?: string; position?: [number, number, number]; rotation?: [number, number, number] }
): EvidenceItem {
  const label = template.makeLabel?.(data) || template.name;
  const contentPreview = template.makeContentPreview?.(data) || '';
  const id = options?.id || `${template.id}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    type: EvidenceType.PAPER,
    label,
    content: contentPreview,
    position: options?.position,
    rotation: options?.rotation,
    metadata: {
      templateId: template.id,
      fields: data,
      layout: template.layout,
      textures: template.textures,
      category: template.category,
      name: template.name,
    },
  };
}

// ---------- FIRST TEMPLATE PER CATEGORY ---------- //

export const templates: DocumentTemplateSpec[] = [
  {
    id: 'case-file-cover',
    name: 'Case File Cover',
    category: 'Case Files',
    description: 'Front cover with title, case number, investigators, and date.',
    fields: [
      { key: 'caseNumber', label: 'Case Number', type: 'string', required: true },
      { key: 'title', label: 'Case Title', type: 'string', required: true },
      { key: 'leadInvestigator', label: 'Lead Investigator', type: 'string', required: true },
      { key: 'assignedTeam', label: 'Assigned Team', type: 'list' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
    ],
    layout: [
      { id: 'header', label: 'DEPARTMENT OF INVESTIGATION', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.012, bold: true },
      { id: 'title', x: 0.02, y: 0.07, width: 0.17, fontSize: 0.016, bold: true },
      { id: 'caseNumber', x: 0.02, y: 0.11, width: 0.17, fontSize: 0.012 },
      { id: 'leadInvestigator', x: 0.02, y: 0.15, width: 0.17, fontSize: 0.012 },
      { id: 'assignedTeam', x: 0.02, y: 0.19, width: 0.17, fontSize: 0.01 },
      { id: 'startDate', x: 0.02, y: 0.23, width: 0.17, fontSize: 0.01 },
    ],
    textures: [
      { id: 'paper_plain_1', description: 'Slightly aged plain paper texture (PNG for defined edges)', suggestedPath: 'public/textures/documents/paper_plain_1.png' },
      { id: 'letterhead_dept', description: 'Agency letterhead top banner', suggestedPath: 'public/textures/documents/letterhead_dept.png' },
    ],
    makeLabel: (d) => `CASE ${d.caseNumber || 'UNKNOWN'}`,
    makeContentPreview: (d) => `${d.title || ''} — Lead: ${d.leadInvestigator || 'TBD'}`,
  },
  {
    id: 'search-warrant',
    name: 'Search Warrant',
    category: 'Law & Legal',
    description: 'Court-issued warrant with affidavit and property list.',
    fields: [
      { key: 'court', label: 'Court', type: 'string', required: true },
      { key: 'judge', label: 'Judge', type: 'string', required: true },
      { key: 'affiant', label: 'Affiant', type: 'string', required: true },
      { key: 'address', label: 'Premises Address', type: 'string', required: true },
      { key: 'properties', label: 'Property to be Seized', type: 'list' },
      { key: 'dateIssued', label: 'Date Issued', type: 'date' },
      { key: 'caseNumber', label: 'Case No.', type: 'string' },
      { key: 'validUntil', label: 'Valid Until', type: 'date' },
    ],
    layout: [
      { id: 'header', label: 'SEARCH WARRANT', x: 0.02, y: 0.06, width: 0.12, fontSize: 0.013, bold: true },
      { id: 'caseNumber', x: 0.15, y: 0.06, width: 0.04, fontSize: 0.0075 },
      { id: 'court', x: 0.02, y: 0.085, width: 0.17, fontSize: 0.009, bold: true },
      { id: 'separator1', label: '───────────────────────', x: 0.02, y: 0.10, width: 0.17, fontSize: 0.007 },
      { id: 'judge', x: 0.02, y: 0.115, width: 0.17, fontSize: 0.0085 },
      { id: 'affiant', x: 0.02, y: 0.13, width: 0.17, fontSize: 0.0085 },
      { id: 'dateIssued', x: 0.02, y: 0.145, width: 0.08, fontSize: 0.0085 },
      { id: 'validUntil', x: 0.11, y: 0.145, width: 0.08, fontSize: 0.0085 },
      { id: 'separator2', label: '───────────────────────', x: 0.02, y: 0.16, width: 0.17, fontSize: 0.007 },
      { id: 'address', x: 0.02, y: 0.175, width: 0.17, fontSize: 0.0085 },
      { id: 'separator3', label: '───────────────────────', x: 0.02, y: 0.19, width: 0.17, fontSize: 0.007 },
      { id: 'properties', x: 0.02, y: 0.205, width: 0.17, fontSize: 0.0075 },
      { id: 'separator4', label: '───────────────────────', x: 0.02, y: 0.245, width: 0.17, fontSize: 0.007 },
      { id: 'signatureLabel', label: 'JUDGE SIGNATURE:', x: 0.02, y: 0.26, width: 0.06, fontSize: 0.007 },
    ],
    textures: [
      { id: 'paper_plain_1', description: 'Base paper', suggestedPath: 'public/textures/documents/paper_plain_1.png', type: 'base' },
      { id: 'letterhead_generic', description: 'Court letterhead banner at top', suggestedPath: 'public/textures/documents/letterhead_generic.png', type: 'overlay', position: [0, 0.0025, -0.135], scale: [0.21, 0.04], opacity: 0.75 },
      { id: 'notary_stamp', description: 'Court seal stamp', suggestedPath: 'public/textures/documents/notary_stamp.png', type: 'overlay', position: [0.065, 0.0025, 0.11], scale: [0.05, 0.05], opacity: 0.65 },
    ],
    makeLabel: (d) => `WARRANT: ${d.address || 'Premises'}`,
    makeContentPreview: (d) => `Issued by ${d.judge || 'Judge'} — ${d.court || ''}`,
  },
  {
    id: 'incident-report',
    name: 'Incident Report',
    category: 'Police & Operations',
    description: 'Standard field report with incident details and narrative.',
    fields: [
      { key: 'reportNumber', label: 'Report No.', type: 'string', required: true },
      { key: 'officer', label: 'Reporting Officer', type: 'string', required: true },
      { key: 'badge', label: 'Badge No.', type: 'string' },
      { key: 'incidentType', label: 'Incident Type', type: 'string', required: true },
      { key: 'location', label: 'Location', type: 'string', required: true },
      { key: 'datetime', label: 'Date/Time', type: 'datetime', required: true },
      { key: 'narrative', label: 'Narrative', type: 'multiline' },
      { key: 'supervisor', label: 'Supervisor', type: 'string' },
    ],
    layout: [
      { id: 'header', label: 'POLICE DEPARTMENT', x: 0.02, y: 0.065, width: 0.17, fontSize: 0.0085, bold: true },
      { id: 'subtitle', label: 'INCIDENT REPORT', x: 0.02, y: 0.08, width: 0.10, fontSize: 0.012, bold: true },
      { id: 'reportNumber', x: 0.14, y: 0.08, width: 0.05, fontSize: 0.0075 },
      { id: 'separator1', label: '═══════════════════════', x: 0.02, y: 0.098, width: 0.17, fontSize: 0.007 },
      { id: 'officer', x: 0.02, y: 0.11, width: 0.10, fontSize: 0.0085 },
      { id: 'badge', x: 0.13, y: 0.11, width: 0.06, fontSize: 0.0085 },
      { id: 'datetime', x: 0.02, y: 0.125, width: 0.17, fontSize: 0.0085 },
      { id: 'separator2', label: '───────────────────────', x: 0.02, y: 0.14, width: 0.17, fontSize: 0.007 },
      { id: 'incidentType', x: 0.02, y: 0.155, width: 0.17, fontSize: 0.009, bold: true },
      { id: 'location', x: 0.02, y: 0.17, width: 0.17, fontSize: 0.0085 },
      { id: 'separator3', label: '───────────────────────', x: 0.02, y: 0.185, width: 0.17, fontSize: 0.007 },
      { id: 'narrative', x: 0.02, y: 0.20, width: 0.17, fontSize: 0.0075 },
      { id: 'separator4', label: '───────────────────────', x: 0.02, y: 0.245, width: 0.17, fontSize: 0.007 },
      { id: 'supervisor', x: 0.02, y: 0.26, width: 0.08, fontSize: 0.0075 },
    ],
    textures: [
      { id: 'paper_plain_2', description: 'Base paper', suggestedPath: 'public/textures/documents/paper_plain_2.png', type: 'base' },
      { id: 'letterhead_dept', description: 'PD letterhead', suggestedPath: 'public/textures/documents/letterhead_dept.png', type: 'overlay', position: [0, 0.0025, -0.135], scale: [0.21, 0.045], opacity: 0.7 },
    ],
    makeLabel: (d) => `IR ${d.reportNumber || ''}`,
    makeContentPreview: (d) => `${d.incidentType || ''} at ${d.location || ''}`,
  },
  {
    id: 'lab-submission-form',
    name: 'Lab Submission Form',
    category: 'Forensics & Lab',
    description: 'Form to submit evidence for analysis with chain start.',
    fields: [
      { key: 'caseNumber', label: 'Case Number', type: 'string', required: true },
      { key: 'submitter', label: 'Submitter', type: 'string', required: true },
      { key: 'items', label: 'Items Submitted', type: 'table', columns: [
        { key: 'itemId', label: 'Item ID', type: 'string' },
        { key: 'description', label: 'Description', type: 'string' },
        { key: 'requestedTests', label: 'Requested Tests', type: 'string' },
      ] },
      { key: 'date', label: 'Date', type: 'date' },
    ],
    layout: [
      { id: 'header', label: 'LAB SUBMISSION FORM', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'caseNumber', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.011 },
      { id: 'submitter', x: 0.02, y: 0.09, width: 0.17, fontSize: 0.011 },
      { id: 'items', x: 0.02, y: 0.13, width: 0.17, height: 0.10, fontSize: 0.01 },
      { id: 'date', x: 0.02, y: 0.24, width: 0.17, fontSize: 0.01 },
      { id: 'signature', label: 'Submitter Signature', x: 0.12, y: 0.26, width: 0.07, fontSize: 0.01 },
    ],
    textures: [
      { id: 'form_grid', description: 'Light grid lines for tables', suggestedPath: 'public/textures/documents/form_grid.png' },
      { id: 'paper_plain_1', description: 'Plain paper (PNG)', suggestedPath: 'public/textures/documents/paper_plain_1.png' },
    ],
    makeLabel: (d) => `Lab Submission — ${d.caseNumber || ''}`,
    makeContentPreview: (d) => `${(d.items?.length || 0)} items submitted by ${d.submitter || ''}`,
  },
  {
    id: 'autopsy-report',
    name: 'Autopsy Report',
    category: 'Medical & EMS',
    description: 'Report detailing findings, cause, and manner of death.',
    fields: [
      { key: 'decedent', label: 'Decedent', type: 'string', required: true },
      { key: 'examiner', label: 'Medical Examiner', type: 'string', required: true },
      { key: 'date', label: 'Date of Examination', type: 'date', required: true },
      { key: 'caseNumber', label: 'Case No.', type: 'string' },
      { key: 'externalFindings', label: 'External Findings', type: 'multiline' },
      { key: 'internalFindings', label: 'Internal Findings', type: 'multiline' },
      { key: 'toxicology', label: 'Toxicology', type: 'multiline' },
      { key: 'cause', label: 'Cause of Death', type: 'string' },
      { key: 'manner', label: 'Manner of Death', type: 'string' },
    ],
    layout: [
      { id: 'header', label: 'OFFICE OF THE MEDICAL EXAMINER', x: 0.02, y: 0.065, width: 0.17, fontSize: 0.0085, bold: true },
      { id: 'subtitle', label: 'AUTOPSY REPORT', x: 0.02, y: 0.08, width: 0.10, fontSize: 0.012, bold: true },
      { id: 'caseNumber', x: 0.14, y: 0.08, width: 0.05, fontSize: 0.008 },
      { id: 'separator1', label: '═══════════════════════', x: 0.02, y: 0.098, width: 0.17, fontSize: 0.007 },
      { id: 'decedent', x: 0.02, y: 0.11, width: 0.17, fontSize: 0.009 },
      { id: 'date', x: 0.02, y: 0.125, width: 0.17, fontSize: 0.0085 },
      { id: 'examiner', x: 0.02, y: 0.14, width: 0.17, fontSize: 0.0085 },
      { id: 'separator2', label: '───────────────────────', x: 0.02, y: 0.155, width: 0.17, fontSize: 0.007 },
      { id: 'externalFindings', x: 0.02, y: 0.17, width: 0.17, fontSize: 0.0075 },
      { id: 'internalFindings', x: 0.02, y: 0.20, width: 0.17, fontSize: 0.0075 },
      { id: 'toxicology', x: 0.02, y: 0.225, width: 0.17, fontSize: 0.0075 },
      { id: 'separator3', label: '═══════════════════════', x: 0.02, y: 0.245, width: 0.17, fontSize: 0.007 },
      { id: 'cause', x: 0.02, y: 0.26, width: 0.10, fontSize: 0.0085, bold: true },
      { id: 'manner', x: 0.13, y: 0.26, width: 0.06, fontSize: 0.0085, bold: true },
    ],
    textures: [
      { id: 'paper_plain_2', description: 'Base paper', suggestedPath: 'public/textures/documents/paper_plain_2.png', type: 'base' },
      { id: 'letterhead_dept', description: 'ME letterhead', suggestedPath: 'public/textures/documents/letterhead_dept.png', type: 'overlay', position: [0, 0.0025, -0.135], scale: [0.21, 0.045], opacity: 0.7 },
    ],
    makeLabel: (d) => `Autopsy: ${d.decedent || ''}`,
    makeContentPreview: (d) => `Cause: ${d.cause || 'TBD'}; Manner: ${d.manner || 'TBD'}`,
  },
  {
    id: 'bank-statement',
    name: 'Bank Statement',
    category: 'Financial & Records',
    description: 'Monthly statement with transactions and balances.',
    fields: [
      { key: 'bankName', label: 'Bank', type: 'string', required: true },
      { key: 'accountName', label: 'Account Name', type: 'string', required: true },
      { key: 'accountNumber', label: 'Account Number', type: 'string', required: true },
      { key: 'period', label: 'Statement Period', type: 'string', required: true },
      { key: 'transactions', label: 'Transactions', type: 'table', columns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'description', label: 'Description', type: 'string' },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'balance', label: 'Balance', type: 'number' },
      ] },
    ],
    layout: [
      { id: 'header', label: 'BANK STATEMENT', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'bankName', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.011 },
      { id: 'accountName', x: 0.02, y: 0.09, width: 0.17, fontSize: 0.011 },
      { id: 'accountNumber', x: 0.02, y: 0.12, width: 0.17, fontSize: 0.011 },
      { id: 'period', x: 0.02, y: 0.15, width: 0.17, fontSize: 0.011 },
      { id: 'transactions', x: 0.02, y: 0.19, width: 0.17, height: 0.08, fontSize: 0.01 },
    ],
    textures: [
      { id: 'paper_plain_2', description: 'Plain paper', suggestedPath: 'public/textures/documents/paper_plain_2.png' },
      { id: 'logo_placeholder', description: 'Bank logo placeholder', suggestedPath: 'public/textures/documents/logo_placeholder.png' },
    ],
    makeLabel: (d) => `${d.bankName || 'Bank'} — ${d.period || ''}`,
    makeContentPreview: (d) => `${d.accountName || ''} • ${d.accountNumber || ''}`,
  },
  {
    id: 'email-printout',
    name: 'Email Printout',
    category: 'Communications & Digital',
    description: 'Printed email with headers, body, and attachments list.',
    fields: [
      { key: 'from', label: 'From', type: 'string', required: true },
      { key: 'to', label: 'To', type: 'string', required: true },
      { key: 'subject', label: 'Subject', type: 'string', required: true },
      { key: 'date', label: 'Date', type: 'datetime', required: true },
      { key: 'body', label: 'Body', type: 'multiline' },
      { key: 'attachments', label: 'Attachments', type: 'list' },
    ],
    layout: [
      { id: 'header', label: 'EMAIL', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'from', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.011 },
      { id: 'to', x: 0.02, y: 0.09, width: 0.17, fontSize: 0.011 },
      { id: 'subject', x: 0.02, y: 0.12, width: 0.17, fontSize: 0.011 },
      { id: 'date', x: 0.02, y: 0.15, width: 0.17, fontSize: 0.011 },
      { id: 'body', x: 0.02, y: 0.19, width: 0.17, fontSize: 0.01 },
      { id: 'attachments', x: 0.02, y: 0.25, width: 0.17, fontSize: 0.01 },
    ],
    textures: [
      { id: 'paper_plain_1', description: 'Plain paper (PNG)', suggestedPath: 'public/textures/documents/paper_plain_1.png' },
    ],
    makeLabel: (d) => `Email: ${d.subject || ''}`,
    makeContentPreview: (d) => `From ${d.from || ''} to ${d.to || ''}`,
  },
  {
    id: 'boarding-pass',
    name: 'Airline Boarding Pass',
    category: 'Travel & Logistics',
    description: 'Flight segment with passenger details and barcode area.',
    fields: [
      { key: 'airline', label: 'Airline', type: 'string', required: true },
      { key: 'passenger', label: 'Passenger', type: 'string', required: true },
      { key: 'flight', label: 'Flight', type: 'string', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'from', label: 'From', type: 'string', required: true },
      { key: 'to', label: 'To', type: 'string', required: true },
      { key: 'seat', label: 'Seat', type: 'string' },
      { key: 'boardingTime', label: 'Boarding Time', type: 'time' },
    ],
    layout: [
      { id: 'header', label: 'BOARDING PASS', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'airline', x: 0.02, y: 0.06, width: 0.10, fontSize: 0.011 },
      { id: 'passenger', x: 0.12, y: 0.06, width: 0.07, fontSize: 0.011 },
      { id: 'flight', x: 0.02, y: 0.09, width: 0.10, fontSize: 0.011 },
      { id: 'date', x: 0.12, y: 0.09, width: 0.07, fontSize: 0.011 },
      { id: 'from', x: 0.02, y: 0.12, width: 0.08, fontSize: 0.011 },
      { id: 'to', x: 0.11, y: 0.12, width: 0.08, fontSize: 0.011 },
      { id: 'seat', x: 0.02, y: 0.15, width: 0.08, fontSize: 0.011 },
      { id: 'boardingTime', x: 0.11, y: 0.15, width: 0.08, fontSize: 0.011 },
    ],
    textures: [
      { id: 'ticket_paper', description: 'Thicker ticket stock', suggestedPath: 'public/textures/documents/ticket_paper.png' },
      { id: 'barcode_area', description: 'Barcode/QR placeholder strip', suggestedPath: 'public/textures/documents/barcode_area.png' },
    ],
    makeLabel: (d) => `${d.airline || ''} ${d.flight || ''}`,
    makeContentPreview: (d) => `${d.from || ''} → ${d.to || ''} • ${d.passenger || ''}`,
  },
  {
    id: 'news-clipping',
    name: 'News Article Clipping',
    category: 'Media & Public',
    description: 'Newspaper-style column layout with headline and byline.',
    fields: [
      { key: 'headline', label: 'Headline', type: 'string', required: true },
      { key: 'byline', label: 'Byline', type: 'string' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'body', label: 'Body', type: 'multiline' },
    ],
    layout: [
      { id: 'headline', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.014, bold: true },
      { id: 'byline', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.01 },
      { id: 'date', x: 0.12, y: 0.06, width: 0.07, fontSize: 0.01 },
      { id: 'body', x: 0.02, y: 0.09, width: 0.17, fontSize: 0.009 },
    ],
    textures: [
      { id: 'newsprint', description: 'Greyish newsprint texture', suggestedPath: 'public/textures/documents/newsprint.png' },
      { id: 'torn_edge', description: 'Torn/rough edge mask', suggestedPath: 'public/textures/documents/torn_edge.png' },
    ],
    makeLabel: (d) => d.headline || 'NEWS',
    makeContentPreview: (d) => `${d.byline || ''} — ${d.date || ''}`,
  },
  {
    id: 'crime-scene-sketch',
    name: 'Crime Scene Sketch',
    category: 'Maps & Scene Artifacts',
    description: 'Simple plan with legend and key measurements.',
    fields: [
      { key: 'location', label: 'Location', type: 'string', required: true },
      { key: 'sketchNotes', label: 'Notes', type: 'multiline' },
      { key: 'legend', label: 'Legend', type: 'list' },
      { key: 'measurements', label: 'Measurements', type: 'list' },
    ],
    layout: [
      { id: 'header', label: 'CRIME SCENE SKETCH', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'location', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.011 },
      { id: 'sketchArea', label: 'Sketch Area', x: 0.02, y: 0.09, width: 0.17, height: 0.10 },
      { id: 'legend', x: 0.02, y: 0.20, width: 0.17, fontSize: 0.01 },
      { id: 'measurements', x: 0.02, y: 0.24, width: 0.17, fontSize: 0.01 },
    ],
    textures: [
      { id: 'grid_paper', description: 'Light grid background', suggestedPath: 'public/textures/documents/grid_paper.png' },
      { id: 'pencil_marks', description: 'Pencil stroke overlays', suggestedPath: 'public/textures/documents/pencil_marks.png' },
    ],
    makeLabel: (d) => `Sketch: ${d.location || ''}`,
    makeContentPreview: (d) => `${(d.legend?.length || 0)} legend items`,
  },
  {
    id: 'handwritten-note',
    name: 'Handwritten Note',
    category: 'Personal & Misc',
    description: 'Lined or plain paper with handwriting-style rendering.',
    fields: [
      { key: 'author', label: 'Author', type: 'string' },
      { key: 'body', label: 'Note', type: 'multiline', required: true },
      { key: 'date', label: 'Date', type: 'date' },
    ],
    layout: [
      { id: 'header', label: 'NOTE', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.012, bold: true },
      { id: 'body', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.011 },
      { id: 'author', x: 0.02, y: 0.25, width: 0.10, fontSize: 0.01 },
      { id: 'date', x: 0.12, y: 0.25, width: 0.07, fontSize: 0.01 },
    ],
    textures: [
      { id: 'lined_paper', description: 'Blue ruled lines', suggestedPath: 'public/textures/documents/lined_paper.png' },
      { id: 'ink_bleed', description: 'Ink bleed overlay', suggestedPath: 'public/textures/documents/ink_bleed.png' },
    ],
    makeLabel: (d) => `Note by ${d.author || 'Unknown'}`,
    makeContentPreview: (d) => (d.body || '').slice(0, 60),
  },
  {
    id: 'internal-memo',
    name: 'Internal Memo',
    category: 'Administrative & Corporate',
    description: 'Memo with from/to/subject and body.',
    fields: [
      { key: 'from', label: 'From', type: 'string', required: true },
      { key: 'to', label: 'To', type: 'string', required: true },
      { key: 'subject', label: 'Subject', type: 'string', required: true },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'body', label: 'Body', type: 'multiline' },
    ],
    layout: [
      { id: 'header', label: 'INTERNAL MEMO', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'from', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.011 },
      { id: 'to', x: 0.02, y: 0.09, width: 0.17, fontSize: 0.011 },
      { id: 'subject', x: 0.02, y: 0.12, width: 0.17, fontSize: 0.011 },
      { id: 'date', x: 0.02, y: 0.15, width: 0.17, fontSize: 0.011 },
      { id: 'body', x: 0.02, y: 0.19, width: 0.17, fontSize: 0.01 },
    ],
    textures: [
      { id: 'letterhead_corp', description: 'Company letterhead', suggestedPath: 'public/textures/documents/letterhead_corp.png' },
      { id: 'paper_plain_1', description: 'Plain paper (PNG)', suggestedPath: 'public/textures/documents/paper_plain_1.png' },
    ],
    makeLabel: (d) => `Memo: ${d.subject || ''}`,
    makeContentPreview: (d) => `From ${d.from || ''} to ${d.to || ''}`,
  },
  {
    id: 'bank-statement',
    name: 'Bank Statement',
    category: 'Financial & Records',
    description: 'Transaction history for finding anomalies.',
    fields: [
      { key: 'bankName', label: 'Bank Name', type: 'string', required: true },
      { key: 'accountHolder', label: 'Holder', type: 'string' },
      { key: 'accountNumber', label: 'Account No.', type: 'string' },
      { key: 'period', label: 'Statement Period', type: 'string' },
      { key: 'transactions', label: 'Transactions', type: 'table', columns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'desc', label: 'Description', type: 'string' },
        { key: 'amount', label: 'Amount', type: 'number' },
        { key: 'balance', label: 'Balance', type: 'number' },
      ]},
    ],
    layout: [
      { id: 'header', label: 'BANK STATEMENT', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'bankName', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.012, bold: true },
      { id: 'details', x: 0.02, y: 0.09, width: 0.17, fontSize: 0.01 },
      { id: 'transactions', x: 0.02, y: 0.14, width: 0.17, height: 0.15, fontSize: 0.009 },
      { id: 'footer', label: 'Page 1 of 1', x: 0.09, y: 0.28, width: 0.03, fontSize: 0.008 },
    ],
    textures: [
      { id: 'paper_plain_1', description: 'Standard Bank Paper', suggestedPath: 'public/textures/documents/paper_plain_1.png' },
      { id: 'grid_lines', description: 'Faint lines', suggestedPath: 'public/textures/documents/form_grid.png', opacity: 0.3 },
    ],
    makeLabel: (d) => `Statement: ${d.bankName}`,
  },
  {
    id: 'digital-trace-log',
    name: 'Digital Trace Log',
    category: 'Communications & Digital',
    description: 'Server access logs or device forensics.',
    fields: [
      { key: 'deviceId', label: 'Device ID', type: 'string', required: true },
      { key: 'target', label: 'Target System', type: 'string' },
      { key: 'timestamp', label: 'Extraction Time', type: 'datetime' },
      { key: 'entries', label: 'Log Entries', type: 'table', columns: [
        { key: 'time', label: 'Timestamp', type: 'time' },
        { key: 'event', label: 'Event Type', type: 'string' },
        { key: 'data', label: 'Data/IP', type: 'string' },
        { key: 'status', label: 'Status', type: 'string' },
      ]},
    ],
    layout: [
      { id: 'header', label: 'CYBER-FORENSICS UNIT', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.01, bold: true },
      { id: 'title', label: 'DEVICE EXTRACTION LOG', x: 0.02, y: 0.05, width: 0.17, fontSize: 0.014, bold: true },
      { id: 'meta', x: 0.02, y: 0.08, width: 0.17, fontSize: 0.009 },
      { id: 'entries', x: 0.02, y: 0.12, width: 0.17, height: 0.16, fontSize: 0.008 },
    ],
    textures: [
      { id: 'paper_plain_2', description: 'Printer Paper', suggestedPath: 'public/textures/documents/paper_plain_2.png' },
      { id: 'fax_header', description: 'Digital Header', suggestedPath: 'public/textures/documents/fax_header.png', opacity: 0.8 },
    ],
    makeLabel: (d) => `Log: ${d.deviceId}`,
  },
  {
    id: 'interview-transcript',
    name: 'Interview Transcript',
    category: 'Audio & Transcripts',
    description: 'Q/A formatting with speaker labels and timestamps.',
    fields: [
      { key: 'subject', label: 'Subject', type: 'string', required: true },
      { key: 'interviewer', label: 'Interviewer', type: 'string' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'lines', label: 'Transcript Lines', type: 'table', columns: [
        { key: 'time', label: 'Time', type: 'time' },
        { key: 'speaker', label: 'Speaker', type: 'string' },
        { key: 'text', label: 'Text', type: 'string' },
      ] },
    ],
    layout: [
      { id: 'header', label: 'INTERVIEW TRANSCRIPT', x: 0.02, y: 0.03, width: 0.17, fontSize: 0.013, bold: true },
      { id: 'subject', x: 0.02, y: 0.06, width: 0.17, fontSize: 0.011 },
      { id: 'interviewer', x: 0.02, y: 0.09, width: 0.17, fontSize: 0.011 },
      { id: 'date', x: 0.02, y: 0.12, width: 0.17, fontSize: 0.011 },
      { id: 'lines', x: 0.02, y: 0.16, width: 0.17, height: 0.10, fontSize: 0.009 },
    ],
    textures: [
      { id: 'paper_plain_2', description: 'Plain paper', suggestedPath: 'public/textures/documents/paper_plain_2.png' },
    ],
    makeLabel: (d) => `Transcript: ${d.subject || ''}`,
    makeContentPreview: (d) => `${(d.lines?.length || 0)} lines recorded`,
  },
  {
    id: 'letterhead-page',
    name: 'Letterhead Page',
    category: 'Template/Texture Bases',
    description: 'Base letterhead elements for official documents.',
    fields: [
      { key: 'organization', label: 'Organization', type: 'string' },
      { key: 'address', label: 'Address', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'string' },
      { key: 'logo', label: 'Logo', type: 'image' },
    ],
    layout: [
      { id: 'logo', label: 'Logo', x: 0.02, y: 0.02, width: 0.04, height: 0.04 },
      { id: 'org', label: 'Organization', x: 0.07, y: 0.03, width: 0.12, fontSize: 0.012, bold: true },
      { id: 'address', x: 0.07, y: 0.05, width: 0.12, fontSize: 0.01 },
      { id: 'phone', x: 0.07, y: 0.07, width: 0.12, fontSize: 0.01 },
      { id: 'footer', label: 'Footer Line', x: 0.02, y: 0.28, width: 0.17 },
    ],
    textures: [
      { id: 'letterhead_generic', description: 'Generic header strip', suggestedPath: 'public/textures/documents/letterhead_generic.png' },
      { id: 'paper_plain_1', description: 'Plain paper', suggestedPath: 'public/textures/documents/paper_plain_1.png' },
    ],
    makeLabel: (d) => d.organization || 'Letterhead',
    makeContentPreview: (d) => d.address || '',
  },
];

export function getTemplateById(id: string): DocumentTemplateSpec | undefined {
  return templates.find((t) => t.id === id);
}
