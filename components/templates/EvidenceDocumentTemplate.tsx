import React from 'react';

interface EvidenceDocumentTemplateProps {
  data: {
    label?: string;
    evidenceId?: string;
    itemType?: string;
    description?: string;
    location?: string;
    collectedBy?: string;
    dateCollected?: string;
    chainOfCustody?: string;
    notes?: string;
    forensicAnalysis?: string;
    imageUrl?: string;
    __pageWidth?: number;
    __pageHeight?: number;
  };
}

export default function EvidenceDocumentTemplate({ data }: EvidenceDocumentTemplateProps) {
  const pageWidth = data.__pageWidth || 816;
  const pageHeight = data.__pageHeight || 1056;

  const fullText = [
    data.description || 'No description available.',
    data.notes ? `\n\nFIELD NOTES:\n${data.notes}` : ''
  ].join('');

  const splitText = (text: string, maxChars: number) => {
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    const chunks: string[] = [];
    let current = '';

    const pushChunk = () => {
      if (current.trim().length > 0) {
        chunks.push(current.trim());
        current = '';
      }
    };

    for (const paragraph of paragraphs) {
      if (paragraph.length > maxChars) {
        let start = 0;
        while (start < paragraph.length) {
          const slice = paragraph.slice(start, start + maxChars);
          if (current.length > 0) pushChunk();
          chunks.push(slice.trim());
          start += maxChars;
        }
        continue;
      }

      const next = current ? `${current}\n\n${paragraph}` : paragraph;
      if (next.length > maxChars && current) {
        pushChunk();
        current = paragraph;
      } else {
        current = next;
      }
    }

    pushChunk();
    return chunks.length > 0 ? chunks : [''];
  };

  const descriptionChunks = splitText(fullText, 1200);

  return (
    <>
      {descriptionChunks.map((chunk, index) => (
        <div key={index} className="document-page bg-white relative text-slate-900 font-mono p-6 overflow-hidden" style={{ width: `${pageWidth}px`, height: `${pageHeight}px`, flexShrink: 0 }}>
          {/* Background Texture */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 24px)',
              }}
            />
          </div>

          {/* Header */}
          <div className="relative mb-4 border-b-2 border-slate-900 pb-3">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl font-extrabold uppercase tracking-tight">EVIDENCE RECORD</h1>
                <p className="text-xs mt-1 text-slate-700">
                  Physical Evidence Documentation{index > 0 ? ' (Continued)' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-red-700/90 shadow-inner shadow-red-900/60" />
                <div className="text-right text-[10px] tracking-widest uppercase">
                  <div className="bg-slate-900 text-slate-100 px-2 py-1 font-bold">Restricted</div>
                  <div className="mt-1 text-slate-600">Chain of Custody Required</div>
                </div>
              </div>
            </div>
          </div>

          {index === 0 && (
            <>
              {/* Evidence ID Badge */}
              <div className="relative mb-4 bg-[#dbe2d0] border-2 border-slate-600 px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded bg-slate-600/80 border border-slate-700" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-700 uppercase tracking-widest font-bold">Evidence ID</div>
                    <div className="text-2xl font-bold text-slate-900">{data.evidenceId || 'EVD-UNKNOWN'}</div>
                    <div className="text-xs text-slate-700 mt-1 uppercase tracking-wider">{data.itemType || 'Physical Object'}</div>
                  </div>
                  {data.imageUrl && (
                    <div className="h-24 w-24 border border-slate-700 bg-slate-200 overflow-hidden flex-shrink-0">
                      <img
                        src={data.imageUrl}
                        alt={data.label || 'Evidence'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Collection Data Grid */}
              <div className="relative mb-4 grid grid-cols-2 gap-3">
                {/* <div className="border border-slate-500 bg-slate-200/40 p-3">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-1">Location Found</div>
                  <div className="text-sm font-semibold text-slate-900">{data.location || 'Unknown'}</div>
                </div>
                <div className="border border-slate-500 bg-slate-200/40 p-3">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-1">Date Collected</div>
                  <div className="text-sm font-semibold text-slate-900">{data.dateCollected || 'Not Recorded'}</div>
                </div> */}
                <div className="border border-slate-500 bg-slate-200/40 p-3">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-1">Collected By</div>
                  <div className="text-sm font-semibold text-slate-900">{data.collectedBy || 'CSI Unit'}</div>
                </div>
                <div className="border border-slate-500 bg-slate-200/40 p-3">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold mb-1">Chain of Custody</div>
                  <div className="text-sm font-semibold text-slate-900">{data.chainOfCustody || 'Intact'}</div>
                </div>
              </div>
            </>
          )}

          {/* Item Description */}
          <div className="relative mb-4">
            <h2 className="text-xs font-bold uppercase border-b border-slate-600 pb-2 mb-2 tracking-widest">
              Item Description{index > 0 ? ' (Continued)' : ''}
            </h2>
            <div className="p-3 border border-slate-500">
              <div className="font-bold text-base mb-2 text-slate-900">{data.label || 'Unidentified Evidence'}</div>
              <p className="text-[13px] leading-snug whitespace-pre-wrap text-slate-800">{chunk}</p>
            </div>
          </div>

          {/* Footer Stamp */}
          <div className="relative mt-4 pt-3 border-t border-slate-500">
            <div className="flex justify-between items-center text-[9px] text-slate-600 tracking-widest uppercase">
              <div>Forensic Evidence Unit • City Police Department</div>
              <div>Form EV-102 Rev. 2024</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
