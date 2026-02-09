import React from 'react';
import { AutopsyReportTemplate } from '../../components/templates/AutopsyReportTemplate';
import { BankStatementTemplate } from '../../components/templates/BankStatementTemplate';
import { ServerLogTemplate } from '../../components/templates/ServerLogTemplate';
import { SearchWarrantTemplate } from '../../components/templates/SearchWarrantTemplate';
import { RailTimetableTemplate } from '../../components/templates/RailTimetableTemplate';
import { WitnessStatementTemplate } from '../../components/templates/WitnessStatementTemplate';
import { TranscriptTemplate } from '../../components/templates/TranscriptTemplate';
import { IncidentReportTemplate } from '../../components/templates/IncidentReportTemplate';
import { CaseFileCoverTemplate } from '../../components/templates/CaseFileCoverTemplate';
import { LabSubmissionFormTemplate } from '../../components/templates/LabSubmissionFormTemplate';
import { EmailPrintoutTemplate } from '../../components/templates/EmailPrintoutTemplate';
import { BoardingPassTemplate } from '../../components/templates/BoardingPassTemplate';
import { NewsClippingTemplate } from '../../components/templates/NewsClippingTemplate';
import { CrimeSceneSketchTemplate } from '../../components/templates/CrimeSceneSketchTemplate';
import { HandwrittenNoteTemplate } from '../../components/templates/HandwrittenNoteTemplate';
import { InternalMemoTemplate } from '../../components/templates/InternalMemoTemplate';
import { LetterheadPageTemplate } from '../../components/templates/LetterheadPageTemplate';
import { ForensicReportTemplate } from '../../components/templates/ForensicReportTemplate';
import { CaseCompletionTemplate } from '../../components/templates/CaseCompletionTemplate';
import EvidenceDocumentTemplate from '../../components/templates/EvidenceDocumentTemplate';
import {
    AutopsyReportData,
    BankStatementData,
    SearchWarrantData,
    RailTimetableData,
    WitnessStatementData,
    TranscriptData,
    IncidentReportData,
    CaseFileCoverData,
    LabSubmissionFormData,
    EmailPrintoutData,
    BoardingPassData,
    NewsClippingData,
    CrimeSceneSketchData,
    HandwrittenNoteData,
    InternalMemoData,
    LetterheadPageData,
    ForensicReportData,
    ServerLogData,
    CaseCompletionData
} from './types';

export interface TemplateContext {
    getValue: (key: string, fallback?: any) => any;
    getBodyFallback: () => string;
    getTitleFallback: () => string;
}

export interface TemplateDefinition {
    render: (context: TemplateContext) => React.ReactNode;
    width?: number;
    height?: number;
}

export const TEMPLATE_REGISTRY: Record<string, TemplateDefinition> = {
    'autopsy-report': {
        render: ({ getValue, getBodyFallback, getTitleFallback }) => {
            const autopsyData: AutopsyReportData = {
                caseNumber: getValue('caseNumber', "UNKNOWN"),
                decedentName: getValue('decedent', getValue('decedentName', getTitleFallback().replace('Autopsy Report: ', ''))),
                dateOfDeath: getValue('dateOfDeath', getValue('date', "Unknown")),
                timeOfDeath: getValue('timeOfDeath', getValue('time', "Unknown")),
                examinerName: getValue('examinerName', getValue('examiner', "Dr. Medi")),
                externalFindings: getValue('externalFindings', getBodyFallback()),
                internalFindings: getValue('internalFindings', "See External Findings."),
                causeOfDeath: getValue('causeOfDeath', getValue('cause', "Pending Analysis")),
                mannerOfDeath: getValue('mannerOfDeath', getValue('manner', "Pending")),
                toxicologyNotes: getValue('toxicologyNotes', getValue('toxicology', "Pending")),
            };
            return <AutopsyReportTemplate data={autopsyData} />;
        }
    },
    'server-log': {
        render: ({ getValue }) => {
            const logEntries = getValue('entries', []);
            const serverData: ServerLogData = {
                source: getValue('source', "Server Log"),
                timestampRange: getValue('timestampRange', "Unknown"),
                entries: Array.isArray(logEntries) ? logEntries : []
            };
            return <ServerLogTemplate data={serverData} />;
        }
    },
    'bank-statement': {
        render: ({ getValue }) => {
            const rawTransactions = getValue('transactions', []);
            const transactions = (Array.isArray(rawTransactions) ? rawTransactions : []).map((t: any) => {
                if (typeof t === 'string') {
                    const parts = t.split('|').map((s: string) => s.trim());
                    if (parts.length >= 4) {
                        return {
                            date: parts[0],
                            description: parts[1],
                            amount: parts[2].replace('$', ''),
                            type: parts[3] === 'DEBIT' ? 'DEBIT' : 'CREDIT'
                        };
                    }
                    return { date: 'Error', description: t, amount: '0', type: 'DEBIT' };
                } else if (typeof t === 'object') {
                    return {
                        date: t.date,
                        description: t.description,
                        amount: String(Math.abs(t.amount)),
                        type: t.amount < 0 || t.type === 'DEBIT' ? 'DEBIT' : 'CREDIT'
                    };
                }
                return { date: 'Unknown', description: 'Invalid Transaction Data', amount: '0', type: 'DEBIT' };
            });

            const bankData: BankStatementData = {
                bankName: getValue('bankName', "Bank"),
                accountHolder: getValue('accountHolder', getValue('accountName', "Account Holder")),
                accountNumber: getValue('accountNumber', "0000"),
                statementPeriod: getValue('statementPeriod', getValue('period', "Current Month")),
                startingBalance: getValue('startingBalance', "0.00"),
                endingBalance: getValue('endingBalance', "0.00"),
                transactions: transactions as any
            };

            if (transactions.length > 0) {
                const lastTx = Array.isArray(rawTransactions) ? rawTransactions[rawTransactions.length - 1] : null;
                if (lastTx && lastTx.balance !== undefined) {
                    bankData.endingBalance = String(lastTx.balance);
                }
            }

            return <BankStatementTemplate data={bankData} />;
        }
    },
    'search-warrant': {
        render: ({ getValue }) => {
            const warrantData: SearchWarrantData = {
                warrantId: getValue('caseNumber', "SW-000"),
                judgeName: getValue('judge', "Hon. Judge"),
                targetAddress: getValue('address', "Unknown Address"),
                targetPerson: getValue('targetPerson', "Occupant"),
                itemsToSeize: getValue('properties', []),
                probableCause: getValue('probableCause', "Based on affidavit submitted herewith."),
                dateIssued: getValue('dateIssued', "2023-01-01"),
                expiryDate: getValue('validUntil', "48 HOURS")
            };
            return <SearchWarrantTemplate data={warrantData} />;
        }
    },
    'rail-timetable': {
        width: 400,
        height: 800,
        render: ({ getValue }) => {
            const railData: RailTimetableData = {
                header: getValue('header', "RAILWAY TIMETABLE"),
                station: getValue('station', "Unknown Station"),
                departures: getValue('departures', [])
            };
            return <RailTimetableTemplate data={railData} />;
        }
    },
    'witness-statement': {
        render: ({ getValue, getBodyFallback }) => {
            const witnessData: WitnessStatementData = {
                header: getValue('header', "WITNESS STATEMENT"),
                name: getValue('name', "Unknown"),
                timestamp: getValue('timestamp', "Unknown Date"),
                officer: getValue('officer', "Unknown Officer"),
                body: getValue('body', getBodyFallback())
            };
            return <WitnessStatementTemplate data={witnessData} />;
        }
    },
    'transcript-excerpt': {
        render: ({ getValue }) => {
            const transcriptData: TranscriptData = {
                source: getValue('source', "Unknown Source"),
                timestampRange: getValue('timestampRange', "00:00 - 00:00"),
                speakers: getValue('speakers', [])
            };
            return <TranscriptTemplate data={transcriptData} />;
        }
    },
    'transcript': {
        render: ({ getValue }) => {
            const transcriptData: TranscriptData = {
                source: getValue('source', "Unknown Source"),
                timestampRange: getValue('timestampRange', "00:00 - 00:00"),
                speakers: getValue('speakers', [])
            };
            return <TranscriptTemplate data={transcriptData} />;
        }
    },
    'incident-report': {
        render: ({ getValue, getBodyFallback }) => {
            const incidentData: IncidentReportData = {
                header: getValue('header', "POLICE DEPARTMENT"),
                subtitle: getValue('subtitle', "INCIDENT REPORT"),
                reportNumber: getValue('reportNumber', "000000"),
                officer: getValue('officer', "Unknown"),
                badge: getValue('badge', "000"),
                incidentType: getValue('incidentType', "Unknown"),
                location: getValue('location', "Unknown"),
                datetime: getValue('datetime', "Unknown"),
                narrative: getValue('narrative', getBodyFallback()),
                supervisor: getValue('supervisor', undefined)
            };
            return <IncidentReportTemplate data={incidentData} />;
        }
    },
    'case-file-cover': {
        render: ({ getValue }) => {
            const caseCoverData: CaseFileCoverData = {
                caseNumber: getValue('caseNumber', "COLD-000"),
                title: getValue('title', "Unknown Case"),
                leadInvestigator: getValue('leadInvestigator', "Det. Unknown"),
                assignedTeam: getValue('assignedTeam', []),
                startDate: getValue('startDate', "Unknown Date")
            };
            return <CaseFileCoverTemplate data={caseCoverData} />;
        }
    },
    'lab-submission-form': {
        render: ({ getValue }) => {
            const labData: LabSubmissionFormData = {
                caseNumber: getValue('caseNumber', "000"),
                submitter: getValue('submitter', "Unknown"),
                date: getValue('date', "Unknown"),
                items: getValue('items', [])
            };
            return <LabSubmissionFormTemplate data={labData} />;
        }
    },
    'email-printout': {
        render: ({ getValue, getTitleFallback, getBodyFallback }) => {
            const emailData: EmailPrintoutData = {
                from: getValue('from', "sender@email.com"),
                to: getValue('to', "recipient@email.com"),
                subject: getValue('subject', getTitleFallback()),
                date: getValue('date', "Unknown Date"),
                body: getValue('body', getBodyFallback()),
                attachments: getValue('attachments', [])
            };
            return <EmailPrintoutTemplate data={emailData} />;
        }
    },
    'boarding-pass': {
        width: 800,
        height: 400,
        render: ({ getValue }) => {
            const passData: BoardingPassData = {
                airline: getValue('airline', "Airline"),
                passenger: getValue('passenger', "PASSENGER NAME"),
                flight: getValue('flight', "FL000"),
                date: getValue('date', "00/00/00"),
                from: getValue('from', "ORIGIN"),
                to: getValue('to', "DEST"),
                seat: getValue('seat', "00A"),
                boardingTime: getValue('boardingTime', "00:00")
            };
            return <BoardingPassTemplate data={passData} />;
        }
    },
    'news-clipping': {
        // Correcting the ambiguity from old file: likely intended portrait or landscape?
        // Old file had `renderWidth = 600` in dead code, and `renderWidth = 1056` after break in next case.
        // I'll stick to default 816x1056 for now or maybe slightly custom.
        render: ({ getValue, getTitleFallback, getBodyFallback }) => {
            const newsData: NewsClippingData = {
                headline: getValue('headline', getTitleFallback()),
                subheadline: getValue('subheadline', undefined),
                byline: getValue('byline', "Staff Writer"),
                date: getValue('date', "Today"),
                location: getValue('location', undefined),
                edition: getValue('edition', undefined),
                lead: getValue('lead', undefined),
                body: getValue('body', getBodyFallback()),
                photoCaption: getValue('photoCaption', undefined)
            };
            return <NewsClippingTemplate data={newsData} />;
        }
    },
    'crime-scene-sketch': {
        // Keeping logic: "renderWidth = 1056; renderHeight = 816;" which implies Landscape?
        // But the variables are renderWidth=816 default.
        // In old file, `case 'news-clipping'` was followed by `renderWidth=1056`, but `case 'crime-scene-sketch'` was checking it?
        // Wait, `case 'crime-scene-sketch'` in old file:
        /*
        case 'crime-scene-sketch':
            const sketchData...
            break;
            renderWidth = 600;
        */
        // It seems `renderWidth` assignments in old file were largely unreachable or misplaced.
        // Validating standard sizes:
        // A4 Portrait = 816 x 1056
        // A4 Landscape = 1056 x 816
        // I will trust the components to handle their layout.
        render: ({ getValue }) => {
            const sketchData: CrimeSceneSketchData = {
                location: getValue('location', "Unknown Location"),
                sketchNotes: getValue('sketchNotes', ""),
                legend: getValue('legend', []),
                measurements: getValue('measurements', [])
            };
            return <CrimeSceneSketchTemplate data={sketchData} />;
        }
    },
    'handwritten-note': {
        width: 600,
        height: 800,
        render: ({ getValue, getBodyFallback }) => {
            const noteData: HandwrittenNoteData = {
                author: getValue('author', "Unknown"),
                body: getValue('body', getBodyFallback()),
                date: getValue('date', undefined)
            };
            return <HandwrittenNoteTemplate data={noteData} />;
        }
    },
    'internal-memo': {
        render: ({ getValue, getTitleFallback, getBodyFallback }) => {
            const memoData: InternalMemoData = {
                organization: getValue('organization', undefined),
                department: getValue('department', undefined),
                memoId: getValue('memoId', undefined),
                from: getValue('from', "Unknown"),
                to: getValue('to', "Unknown"),
                date: getValue('date', "Unknown"),
                subject: getValue('subject', getTitleFallback()),
                body: getValue('body', getBodyFallback()),
                watermark: getValue('watermark', undefined),
                cc: getValue('cc', undefined),
                attachments: getValue('attachments', undefined)
            };
            return <InternalMemoTemplate data={memoData} />;
        }
    },
    'letterhead-page': {
        render: ({ getValue, getBodyFallback }) => {
            return <LetterheadPageTemplate data={{
                headerStr: getValue('headerStr', getValue('header', "Organization")),
                subheader: getValue('subheader', undefined),
                body: getValue('body', getBodyFallback()),
                sender: getValue('sender', "Sender"),
                recipient: getValue('recipient', undefined),
                recipientLines: getValue('recipientLines', undefined),
                date: getValue('date', undefined),
                subject: getValue('subject', undefined),
                reference: getValue('reference', undefined),
                enclosures: getValue('enclosures', undefined),
                contactLine: getValue('contactLine', undefined),
                footer: getValue('footer', undefined)
            }} />;
        }
    },
    'interview-transcript': {
        render: ({ getValue }) => {
            const interviewData: TranscriptData = {
                source: getValue('source', "Interview Recording"),
                timestampRange: getValue('timestampRange', "00:00 - End"),
                speakers: getValue('speakers', [])
            };
            return <TranscriptTemplate data={interviewData} />;
        }
    },
    'forensic-report': {
        render: ({ getValue, getBodyFallback }) => {
            const forensicData: ForensicReportData = {
                caseNumber: getValue('caseNumber', "COLD-000"),
                reportType: getValue('reportType', "DNA ANALYSIS"),
                analyst: getValue('analyst', "System"),
                date: getValue('date', new Date().toLocaleDateString()),
                subject: getValue('subject', undefined),
                evidenceId: getValue('evidenceId', undefined),
                findings: getValue('findings', getBodyFallback()),
                matchProbability: getValue('matchProbability', undefined),
                imageUrl: getValue('imageUrl', undefined),
                status: getValue('status', "PENDING")
            };
            return <ForensicReportTemplate data={forensicData} />;
        }
    },
    'case-completion': {
        render: ({ getValue }) => {
            const completionData: CaseCompletionData = {
                caseTitle: getValue('caseTitle', "Unknown Case"),
                caseStatus: getValue('caseStatus', "UNSOLVED"),
                timeToComplete: getValue('timeToComplete', "0m 0s"),
                confirmedLinks: getValue('confirmedLinks', 0),
                criticalLinks: getValue('criticalLinks', 0),
                disputedLinks: getValue('disputedLinks', 0),
                documentsFiled: getValue('documentsFiled', 0),
                forensicTasksCompleted: getValue('forensicTasksCompleted', "0/0"),
                dateFiled: getValue('dateFiled', new Date().toLocaleDateString()),
                investigatorId: getValue('investigatorId', "DET-UNKNOWN"),
                solutionReasoning: getValue('solutionReasoning', undefined),
                averageCompletionTime: getValue('averageCompletionTime', undefined)
            };
            return <CaseCompletionTemplate data={completionData} />;
        }
    },
    'evidence-document': {
        width: 816,
        height: 1056,
        render: ({ getValue, getBodyFallback, getTitleFallback }) => {
            const evidenceData = {
                label: getTitleFallback(),
                evidenceId: getValue('evidenceId', 'EVD-UNKNOWN'),
                itemType: getValue('itemType', 'Physical Object'),
                description: getBodyFallback(),
                location: getValue('location', 'Unknown'),
                collectedBy: getValue('collectedBy', getValue('author', 'CSI Unit')),
                dateCollected: getValue('dateCollected', getValue('date', 'Not Recorded')),
                chainOfCustody: getValue('chainOfCustody', 'Intact'),
                notes: getValue('notes', undefined),
                forensicAnalysis: getValue('forensicAnalysis', undefined),
                imageUrl: getValue('imageUrl', undefined),
                __pageWidth: 816,
                __pageHeight: 1056
            };
            return <EvidenceDocumentTemplate data={evidenceData} />;
        }
    },
    'suspect-profile': {
        render: ({ getValue, getBodyFallback, getTitleFallback }) => {
            const profileData = {
                label: getTitleFallback(),
                evidenceId: getValue('suspectId', getValue('id', 'SUSPECT-UNKNOWN')),
                itemType: 'Suspect Profile',
                description: getBodyFallback(),
                location: getValue('location', 'Case Files - Suspect Profiles'),
                collectedBy: getValue('investigator', 'Detective Unit'),
                dateCollected: getValue('date', new Date().toLocaleDateString()),
                chainOfCustody: 'Case File',
                notes: getValue('notes', undefined),
                forensicAnalysis: getValue('forensicProfile', undefined)
            };
            return <EvidenceDocumentTemplate data={profileData} />;
        }
    }
};

export const AVAILABLE_TEMPLATES = Object.keys(TEMPLATE_REGISTRY);