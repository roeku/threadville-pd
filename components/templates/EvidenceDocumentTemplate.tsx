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
  };
}

export default function EvidenceDocumentTemplate({ data }: EvidenceDocumentTemplateProps) {
  return (
    <div className="relative w-full h-full bg-white text-black font-mono p-8 overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 2px)',
          backgroundSize: '100% 24px'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative border-b-4 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">EVIDENCE RECORD</h1>
            <p className="text-sm mt-1 text-gray-600">Physical Evidence Documentation</p>
          </div>
          <div className="text-right text-xs">
            <div className="bg-black text-white px-3 py-1 font-bold">RESTRICTED</div>
            <div className="mt-1 text-gray-500">CHAIN OF CUSTODY REQUIRED</div>
          </div>
        </div>
      </div>

      {/* Evidence ID Badge */}
      <div className="relative mb-6 bg-yellow-100 border-2 border-yellow-600 p-4">
        <div className="flex items-center gap-4">
          <div className="text-6xl font-bold text-yellow-800">📦</div>
          <div className="flex-1">
            <div className="text-xs text-yellow-700 uppercase tracking-wider font-bold">Evidence ID</div>
            <div className="text-2xl font-bold text-yellow-900">{data.evidenceId || 'EVD-UNKNOWN'}</div>
            <div className="text-sm text-yellow-700 mt-1">{data.itemType || 'Physical Object'}</div>
          </div>
        </div>
      </div>

      {/* Item Description */}
      <div className="relative mb-6">
        <h2 className="text-lg font-bold uppercase border-b-2 border-gray-400 pb-2 mb-3">Item Description</h2>
        <div className="bg-gray-50 p-4 border-l-4 border-gray-700">
          <div className="font-bold text-xl mb-2">{data.label || 'Unidentified Evidence'}</div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.description || 'No description available.'}</p>
        </div>
      </div>

      {/* Collection Data Grid */}
      <div className="relative mb-6 grid grid-cols-2 gap-4">
        <div className="border-2 border-gray-300 p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Location Found</div>
          <div className="text-sm font-semibold">{data.location || 'Unknown'}</div>
        </div>
        <div className="border-2 border-gray-300 p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Date Collected</div>
          <div className="text-sm font-semibold">{data.dateCollected || 'Not Recorded'}</div>
        </div>
        <div className="border-2 border-gray-300 p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Collected By</div>
          <div className="text-sm font-semibold">{data.collectedBy || 'CSI Unit'}</div>
        </div>
        <div className="border-2 border-gray-300 p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Chain of Custody</div>
          <div className="text-sm font-semibold">{data.chainOfCustody || 'Intact'}</div>
        </div>
      </div>

      {/* Forensic Analysis */}
      {data.forensicAnalysis && (
        <div className="relative mb-6">
          <h2 className="text-lg font-bold uppercase border-b-2 border-gray-400 pb-2 mb-3">Forensic Analysis</h2>
          <div className="bg-blue-50 p-4 border-l-4 border-blue-700">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.forensicAnalysis}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="relative mb-6">
          <h2 className="text-lg font-bold uppercase border-b-2 border-gray-400 pb-2 mb-3">Field Notes</h2>
          <div className="bg-amber-50 p-4 border-l-4 border-amber-600">
            <p className="text-sm leading-relaxed whitespace-pre-wrap italic">{data.notes}</p>
          </div>
        </div>
      )}

      {/* Footer Stamp */}
      <div className="relative mt-8 pt-4 border-t-2 border-gray-300">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>FORENSIC EVIDENCE UNIT • CITY POLICE DEPARTMENT</div>
          <div>FORM EV-102 REV. 2024</div>
        </div>
      </div>
    </div>
  );
}
