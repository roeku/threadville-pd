import React from 'react';
import { DocumentType, DocumentCategory, DocumentConfig } from '../types';
import { AutopsyReportTemplate } from '../components/templates/AutopsyReport';
import { SearchWarrantTemplate } from '../components/templates/SearchWarrant';
import { GenericReportTemplate } from '../components/templates/GenericReport';
import { StickyNoteTemplate } from '../components/templates/StickyNote';
import { NewspaperTemplate } from '../components/templates/Newspaper';
import { HandwrittenLetterTemplate } from '../components/templates/HandwrittenLetter';
import { EmailPrintoutTemplate } from '../components/templates/EmailPrintout';
import { BankStatementTemplate } from '../components/templates/BankStatement';
import { TranscriptTemplate } from '../components/templates/Transcript';

// Standard Dimensions
const DIMS_A4_PORTRAIT = { w: 816, h: 1056, phys: [0.21, 0.297] as [number, number] };
const DIMS_SQUARE_NOTE = { w: 400, h: 400, phys: [0.076, 0.076] as [number, number] }; // 3x3 inches
const DIMS_NEWSPAPER_CLIP = { w: 600, h: 800, phys: [0.15, 0.20] as [number, number] };

export const DOCUMENT_REGISTRY: Record<DocumentType, DocumentConfig> = {
  [DocumentType.AUTOPSY_REPORT]: {
    type: DocumentType.AUTOPSY_REPORT,
    category: DocumentCategory.MEDICAL,
    label: "Autopsy Report",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Forensic pathologist report. Clinical, detached, precise medical terminology."
  },
  [DocumentType.SEARCH_WARRANT]: {
    type: DocumentType.SEARCH_WARRANT,
    category: DocumentCategory.LEGAL,
    label: "Search Warrant",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Legal search warrant. Formal, strict formatting, legalese."
  },
  [DocumentType.INVESTIGATION_SUMMARY]: {
    type: DocumentType.INVESTIGATION_SUMMARY,
    category: DocumentCategory.CASE_FILE,
    label: "Investigation Summary",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Police investigation summary. Narrative style. Use exactly 2 large sections: 'Case Overview' and 'Current Status'."
  },
  [DocumentType.WITNESS_STATEMENT]: {
    type: DocumentType.WITNESS_STATEMENT,
    category: DocumentCategory.CASE_FILE,
    label: "Witness Statement",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Official witness statement form. First person perspective. Use 4-5 short paragraphs describing the event chronologically."
  },
  [DocumentType.INCIDENT_REPORT]: {
    type: DocumentType.INCIDENT_REPORT,
    category: DocumentCategory.POLICE,
    label: "Incident Report",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Police incident report. Use bullet points for observed items. Use 'Narrative' for the main description. Keep it concise/telegraphic style."
  },
  [DocumentType.ARREST_BOOKING]: {
    type: DocumentType.ARREST_BOOKING,
    category: DocumentCategory.POLICE,
    label: "Arrest/Booking Sheet",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Jail booking sheet. List charges as bullet points. Physical description in metadata. Short remarks section."
  },
  [DocumentType.EVIDENCE_TAG]: {
    type: DocumentType.EVIDENCE_TAG,
    category: DocumentCategory.POLICE,
    label: "Evidence Tag Log",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "List of evidence items collected. Use a bulleted list format in the body content. Extremely concise."
  },
  [DocumentType.LAB_REPORT]: {
    type: DocumentType.LAB_REPORT,
    category: DocumentCategory.FORENSICS,
    label: "Crime Lab Report",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Scientific crime lab analysis. Use 3 distinct sections: 'Methodology', 'Results' (use data/percentages), and 'Conclusion'."
  },
  [DocumentType.FINGERPRINT_CARD]: {
    type: DocumentType.FINGERPRINT_CARD,
    category: DocumentCategory.FORENSICS,
    label: "Fingerprint Analysis",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "AFIS match summary. Technical jargon. Short, single paragraph analysis."
  },
  [DocumentType.TOXICOLOGY_REPORT]: {
    type: DocumentType.TOXICOLOGY_REPORT,
    category: DocumentCategory.FORENSICS,
    label: "Toxicology Screen",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Toxicology lab results. List substances and levels using bullet points or a list format."
  },
  [DocumentType.TRANSCRIPT_INTERVIEW]: {
    type: DocumentType.TRANSCRIPT_INTERVIEW,
    category: DocumentCategory.COMMUNICATIONS,
    label: "Interview Transcript",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Verbatim transcript of police interview. Dialogue heavy. Include non-verbal cues in parentheses."
  },
  [DocumentType.EMAIL_PRINTOUT]: {
    type: DocumentType.EMAIL_PRINTOUT,
    category: DocumentCategory.COMMUNICATIONS,
    label: "Email Printout",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Printed email thread. Casual or corporate tone depending on context. Single body section usually."
  },
  [DocumentType.NEWSPAPER_CLIPPING]: {
    type: DocumentType.NEWSPAPER_CLIPPING,
    category: DocumentCategory.MEDIA,
    label: "Newspaper Clipping",
    width: DIMS_NEWSPAPER_CLIP.w,
    height: DIMS_NEWSPAPER_CLIP.h,
    physicalSize: DIMS_NEWSPAPER_CLIP.phys,
    systemPrompt: "Sensationalist crime news article. Use 'inverted pyramid' style. One long column of text."
  },
  [DocumentType.STICKY_NOTE]: {
    type: DocumentType.STICKY_NOTE,
    category: DocumentCategory.PERSONAL,
    label: "Sticky Note",
    width: DIMS_SQUARE_NOTE.w,
    height: DIMS_SQUARE_NOTE.h,
    physicalSize: DIMS_SQUARE_NOTE.phys,
    systemPrompt: "Handwritten quick note. Informal, scrawled. One or two short sentences."
  },
  [DocumentType.HANDWRITTEN_NOTE]: {
    type: DocumentType.HANDWRITTEN_NOTE,
    category: DocumentCategory.PERSONAL,
    label: "Handwritten Letter",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Personal handwritten letter. Stream of consciousness or structured letter. 2-4 paragraphs."
  },
  [DocumentType.BANK_STATEMENT]: {
    type: DocumentType.BANK_STATEMENT,
    category: DocumentCategory.FINANCIAL,
    label: "Bank Statement",
    width: DIMS_A4_PORTRAIT.w,
    height: DIMS_A4_PORTRAIT.h,
    physicalSize: DIMS_A4_PORTRAIT.phys,
    systemPrompt: "Monthly bank statement transaction list. Include suspect transactions."
  },
};

export const getDocumentComponent = (type: DocumentType, data: any) => {
  // Specific Templates
  switch (type) {
    case DocumentType.AUTOPSY_REPORT: return <AutopsyReportTemplate data={data} />;
    case DocumentType.SEARCH_WARRANT: return <SearchWarrantTemplate data={data} />;
    case DocumentType.STICKY_NOTE: return <StickyNoteTemplate data={data} />;
    case DocumentType.NEWSPAPER_CLIPPING: return <NewspaperTemplate data={data} />;
    case DocumentType.HANDWRITTEN_NOTE: return <HandwrittenLetterTemplate data={data} />;
    case DocumentType.EMAIL_PRINTOUT: return <EmailPrintoutTemplate data={data} />;
    case DocumentType.BANK_STATEMENT: return <BankStatementTemplate data={data} />;
    case DocumentType.TRANSCRIPT_INTERVIEW: return <TranscriptTemplate data={data} />;
    default: return <GenericReportTemplate type={type} data={data} />;
  }
};