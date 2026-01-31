import { EvidenceItem } from '../types';
import { AVAILABLE_TEMPLATES } from './document-rendering/templateRegistry';

export const VALID_TEMPLATES = AVAILABLE_TEMPLATES;

export const getTemplateForEvidence = (item: EvidenceItem): string => {
    // 1. Trust explicit templateId (it might be a dynamic one in Supabase)
    if (item.metadata?.templateId) {
        return item.metadata.templateId;
    }

    // 2. Infer from Label/Content keywords
    const label = (item.label || "").toLowerCase();
    const content = (item.content || "").toLowerCase();

    if (label.includes('autopsy') || label.includes('medical examiner')) return 'autopsy-report';
    if (label.includes('bank') || label.includes('statement') || label.includes('financial')) return 'bank-statement';
    if (label.includes('warrant')) return 'search-warrant';
    if (label.includes('transcript') || label.includes('interview') || label.includes('interrogation')) return 'transcript-excerpt';
    if (label.includes('forensic') || label.includes('lab') || label.includes('dna') || label.includes('fingerprint')) return 'forensic-report';
    if (label.includes('email') || label.includes('message')) return 'email-printout';
    if (label.includes('news') || label.includes('clipping') || label.includes('article')) return 'news-clipping';
    if (label.includes('police report') || label.includes('incident')) return 'incident-report';
    if (label.includes('witness') || label.includes('statement')) return 'witness-statement';
    if (label.includes('server log') || content.includes('system activity log')) return 'server-log';

    return 'letterhead-page'; // Fallback
};
