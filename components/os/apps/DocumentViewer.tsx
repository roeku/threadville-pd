import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useOS } from '../context/OSContext';
import { FileText, Printer, Search, AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { AutopsyReportTemplate } from '../../templates/AutopsyReportTemplate';
import { BankStatementTemplate } from '../../templates/BankStatementTemplate';
import { SearchWarrantTemplate } from '../../templates/SearchWarrantTemplate';
import { RailTimetableTemplate } from '../../templates/RailTimetableTemplate';
import { WitnessStatementTemplate } from '../../templates/WitnessStatementTemplate';
import { TranscriptTemplate } from '../../templates/TranscriptTemplate';
import { IncidentReportTemplate } from '../../templates/IncidentReportTemplate';
import { CaseFileCoverTemplate } from '../../templates/CaseFileCoverTemplate';
import { LabSubmissionFormTemplate } from '../../templates/LabSubmissionFormTemplate';
import { EmailPrintoutTemplate } from '../../templates/EmailPrintoutTemplate';
import { BoardingPassTemplate } from '../../templates/BoardingPassTemplate';
import { NewsClippingTemplate } from '../../templates/NewsClippingTemplate';
import { CrimeSceneSketchTemplate } from '../../templates/CrimeSceneSketchTemplate';
import { HandwrittenNoteTemplate } from '../../templates/HandwrittenNoteTemplate';
import { InternalMemoTemplate } from '../../templates/InternalMemoTemplate';
import { LetterheadPageTemplate } from '../../templates/LetterheadPageTemplate';
import { ForensicReportTemplate } from '../../templates/ForensicReportTemplate';

interface DocumentViewerProps {
    data?: {
        entityId: string;
    };
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ data }) => {
    const { currentCase, onPrint } = useOS();
    const [zoom, setZoom] = useState(0.8);

    const evidence = useMemo(() => {
        if (!data?.entityId || !currentCase) return null;
        return currentCase.entities.find(e => e.id === data.entityId);
    }, [data, currentCase]);

    const DocumentContent = useMemo(() => {
        if (!evidence || !evidence.metadata) return null;

        const templateId = evidence.metadata.type || evidence.metadata.templateId;
        const meta = evidence.metadata;

        const getValue = (key: string, fallback: any = '') => {
            if (meta[key] !== undefined) return meta[key];
            if (meta.fields && meta.fields[key] !== undefined) return meta.fields[key];
            return fallback;
        };

        switch (templateId) {
            case 'autopsy-report':
                return <AutopsyReportTemplate data={{
                    caseNumber: getValue('caseNumber', "UNKNOWN"),
                    decedentName: getValue('decedentName', getValue('decedent', "John Doe")),
                    dateOfDeath: getValue('dateOfDeath', getValue('date', "Unknown")),
                    timeOfDeath: getValue('timeOfDeath', getValue('time', "Unknown")),
                    examinerName: getValue('examinerName', getValue('examiner', "Dr. Medical")),
                    externalFindings: getValue('externalFindings', "None noted."),
                    internalFindings: getValue('internalFindings', "None noted."),
                    causeOfDeath: getValue('causeOfDeath', getValue('cause', "Pending")),
                    mannerOfDeath: getValue('mannerOfDeath', getValue('manner', "Pending")),
                    toxicologyNotes: getValue('toxicologyNotes', getValue('toxicology', "Pending")),
                }} />;

            case 'bank-statement':
                const rawTransactions = getValue('transactions', []);
                const transactions: { date: string; description: string; amount: string; type: 'DEBIT' | 'CREDIT' }[] = (Array.isArray(rawTransactions) ? rawTransactions : []).map((t: any) => {
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
                    }
                    if (typeof t === 'object' && t) {
                        return {
                            date: t.date,
                            description: t.description,
                            amount: String(Math.abs(t.amount ?? t.amountValue ?? 0)),
                            type: t.amount < 0 || t.type === 'DEBIT' ? 'DEBIT' : 'CREDIT' as 'DEBIT' | 'CREDIT'
                        };
                    }
                    return { date: 'Unknown', description: 'Invalid Transaction Data', amount: '0', type: 'DEBIT' };
                });
                let endingBalance = "120.00";
                if (transactions.length > 0) {
                    const origLast = rawTransactions[rawTransactions.length - 1];
                    if (origLast && (origLast as any).balance !== undefined) endingBalance = String((origLast as any).balance);
                }

                return <BankStatementTemplate data={{
                    bankName: getValue('bankName', "Bank"),
                    accountHolder: getValue('accountHolder', getValue('accountName', "Account Holder")),
                    accountNumber: getValue('accountNumber', "0000"),
                    statementPeriod: getValue('statementPeriod', getValue('period', "Current Month")),
                    startingBalance: getValue('startingBalance', "750.00"),
                    endingBalance: endingBalance,
                    transactions: transactions
                }} />;

            case 'search-warrant':
                return <SearchWarrantTemplate data={{
                    warrantId: getValue('caseNumber', "SW-000"),
                    judgeName: getValue('judge', "Hon. Judge"),
                    targetAddress: getValue('address', "Unknown Address"),
                    targetPerson: getValue('targetPerson', "Occupant"),
                    itemsToSeize: getValue('properties', []),
                    probableCause: getValue('probableCause', "Based on affidavit submitted herewith."),
                    dateIssued: getValue('dateIssued', "2023-01-01"),
                    expiryDate: getValue('validUntil', "48 HOURS")
                }} />;

            case 'rail-timetable':
                return <RailTimetableTemplate data={{
                    header: getValue('header', "RAILWAY TIMETABLE"),
                    station: getValue('station', "Unknown Station"),
                    departures: getValue('departures', [])
                }} />;

            case 'witness-statement':
                return <WitnessStatementTemplate data={{
                    header: getValue('header', "WITNESS STATEMENT"),
                    name: getValue('name', "Unknown"),
                    timestamp: getValue('timestamp', "Unknown Date"),
                    officer: getValue('officer', "Unknown Officer"),
                    body: getValue('body', evidence.content || "")
                }} />;

            case 'transcript-excerpt':
            case 'transcript':
            case 'interview-transcript':
                return <TranscriptTemplate data={{
                    source: getValue('source', "Unknown Source"),
                    timestampRange: getValue('timestampRange', "00:00 - 00:00"),
                    speakers: getValue('speakers', [])
                }} />;

            case 'incident-report':
                return <IncidentReportTemplate data={{
                    header: getValue('header', "POLICE DEPARTMENT"),
                    subtitle: getValue('subtitle', "INCIDENT REPORT"),
                    reportNumber: getValue('reportNumber', "000000"),
                    officer: getValue('officer', "Unknown"),
                    badge: getValue('badge', "000"),
                    incidentType: getValue('incidentType', "Unknown"),
                    location: getValue('location', "Unknown"),
                    datetime: getValue('datetime', "Unknown"),
                    narrative: getValue('narrative', evidence.content || ""),
                    supervisor: getValue('supervisor', undefined)
                }} />;

            case 'case-file-cover':
                return <CaseFileCoverTemplate data={{
                    caseNumber: getValue('caseNumber', "COLD-000"),
                    title: getValue('title', "Unknown Case"),
                    leadInvestigator: getValue('leadInvestigator', "Det. Unknown"),
                    assignedTeam: getValue('assignedTeam', []),
                    startDate: getValue('startDate', "Unknown Date")
                }} />;

            case 'lab-submission-form':
                return <LabSubmissionFormTemplate data={{
                    caseNumber: getValue('caseNumber', "000"),
                    submitter: getValue('submitter', "Unknown"),
                    date: getValue('date', "Unknown"),
                    items: getValue('items', [])
                }} />;

            case 'email-printout':
                return <EmailPrintoutTemplate data={{
                    from: getValue('from', "sender@email.com"),
                    to: getValue('to', "recipient@email.com"),
                    subject: getValue('subject', "No Subject"),
                    date: getValue('date', "Unknown Date"),
                    body: getValue('body', evidence.content || ""),
                    attachments: getValue('attachments', [])
                }} />;

            case 'boarding-pass':
                return <BoardingPassTemplate data={{
                    airline: getValue('airline', "Airline"),
                    passenger: getValue('passenger', "PASSENGER NAME"),
                    flight: getValue('flight', "FL000"),
                    date: getValue('date', "00/00/00"),
                    from: getValue('from', "ORIGIN"),
                    to: getValue('to', "DEST"),
                    seat: getValue('seat', "00A"),
                    boardingTime: getValue('boardingTime', "00:00")
                }} />;

            case 'news-clipping':
                return <NewsClippingTemplate data={{
                    headline: getValue('headline', "Breaking News"),
                    byline: getValue('byline', "Staff Writer"),
                    date: getValue('date', "Today"),
                    body: getValue('body', evidence.content || "No content available.")
                }} />;

            case 'crime-scene-sketch':
                return <CrimeSceneSketchTemplate data={{
                    location: getValue('location', "Unknown Location"),
                    sketchNotes: getValue('sketchNotes', ""),
                    legend: getValue('legend', []),
                    measurements: getValue('measurements', [])
                }} />;

            case 'handwritten-note':
                return <HandwrittenNoteTemplate data={{
                    author: getValue('author', "Unknown"),
                    body: getValue('body', evidence.content || ""),
                    date: getValue('date', undefined)
                }} />;

            case 'internal-memo':
                return <InternalMemoTemplate data={{
                    from: getValue('from', "Unknown"),
                    to: getValue('to', "Unknown"),
                    date: getValue('date', "Unknown"),
                    subject: getValue('subject', "Memo"),
                    body: getValue('body', evidence.content || ""),
                    watermark: getValue('watermark', undefined)
                }} />;

            case 'letterhead-page':
                return <LetterheadPageTemplate data={{
                    headerStr: getValue('header', "Organization"),
                    body: getValue('body', evidence.content || "No content."),
                    sender: getValue('sender', "Sender"),
                    recipient: getValue('recipient', "Recipient"),
                    date: getValue('date', undefined),
                    footer: getValue('footer', undefined)
                }} />;

            case 'forensic-report':
                return <ForensicReportTemplate data={{
                    caseNumber: getValue('caseNumber', "COLD-000"),
                    reportType: getValue('reportType', "DNA ANALYSIS"),
                    analyst: getValue('analyst', "System"),
                    date: getValue('date', new Date().toLocaleDateString()),
                    subject: getValue('subject', undefined),
                    evidenceId: getValue('evidenceId', undefined),
                    findings: getValue('findings', "No findings generated."),
                    matchProbability: getValue('matchProbability', undefined),
                    imageUrl: getValue('imageUrl', undefined),
                    status: getValue('status', "PENDING")
                }} />;

            default:
                return null;
        }

    }, [evidence]);

    if (!evidence) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                <FileText size={48} className="mb-4 opacity-50" />
                <p>No Document Loaded</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-100 text-slate-900 font-sans">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-slate-200 border-b border-slate-300 shrink-0 select-none">
                <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
                    <FileText size={16} />
                    <span className="hidden sm:inline">DOC_VIEWER_V1.2.exe</span>
                    <span className="text-slate-500 font-normal ml-2 truncate max-w-[200px]">{evidence.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
                        className="p-1.5 hover:bg-slate-300 rounded text-slate-600 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-mono w-10 text-center">{(zoom * 100).toFixed(0)}%</span>
                    <button
                        onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                        className="p-1.5 hover:bg-slate-300 rounded text-slate-600 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-400 mx-1"></div>
                    <button
                        onClick={() => {
                            if (evidence) {
                                onPrint(evidence.content || "", evidence.label, evidence.metadata);
                            }
                        }}
                        className="p-1.5 hover:bg-slate-300 rounded text-slate-600 transition-colors"
                        title="Print"
                    >
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* Document Surface */}
            <div className="flex-1 overflow-auto bg-[#525659] flex justify-center p-4">
                {/* 
                   Wrapper manages spacing. 
                   We hardcode the standard "Letter/A4" base size: 816px x 1056px 
                   Scaling is applied via transform, but we size the wrapper to match the scaled dimensions 
                   so the flex parent treats it correctly (no ghost whitespace).
                 */}
                <div
                    className="relative transition-all duration-200 ease-out origin-top shadow-2xl bg-white"
                    style={{
                        width: 816 * zoom,
                        height: 1056 * zoom, // Approximate height adjustment, though overflow is usually fine
                        // We don't really need fixed height if we want to allow pages to grow, 
                        // but for 'paper' simulation fixed height is common. Let's assume dynamic height support? 
                        // The template might expand. 
                        minHeight: 1056 * zoom
                    }}
                >
                    {/* The scaled content container */}
                    <div
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            width: 816, // Base width
                            // Height can be auto to let content expand? Or fixed? 
                            // Templates usually are full page but text might overflow.
                            // Let's set minHeight.
                            minHeight: 1056
                        }}
                    >
                        {DocumentContent ? (
                            <div className="print-content bg-white h-full relative">
                                {DocumentContent}
                            </div>
                        ) : (
                            // Fallback Raw View
                            <div className="p-12 h-full bg-white relative">
                                <div className="absolute top-0 right-0 p-4 opacity-50">
                                    <AlertTriangle size={64} className="text-amber-200" />
                                </div>
                                <div className="flex items-center gap-2 text-amber-600 mb-6 p-4 bg-amber-50 border border-amber-200 rounded relative z-10">
                                    <AlertTriangle size={20} />
                                    <span className="text-sm font-bold">RAW TEXT MODE</span>
                                </div>
                                <h1 className="text-2xl font-bold mb-6 border-b pb-4 font-serif relative z-10">{evidence.label}</h1>
                                <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-slate-800 relative z-10">
                                    {evidence.content || ">> No text content found."}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-slate-200 p-1 text-[10px] text-slate-500 border-t border-slate-300 px-2 flex justify-between shrink-0 select-none">
                <span>Page 1 of 1</span>
                <span>{DocumentContent ? 'RENDER_MODE: TEMPLATE' : 'RENDER_MODE: RAW'}</span>
            </div>
        </div>
    );
};
