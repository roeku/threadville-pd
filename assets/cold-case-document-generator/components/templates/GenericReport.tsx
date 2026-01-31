import React from 'react';
import { UniversalDocumentData, DocumentType } from '../../types';

interface Props {
  type: DocumentType;
  data: UniversalDocumentData;
}

export const GenericReportTemplate: React.FC<Props> = ({ type, data }) => {
  
  // Determine style based on type text
  const isFinancial = type.includes('BANK') || type.includes('TRANSACTION');
  const isLab = type.includes('LAB') || type.includes('TOX');
  
  return (
    <div className="w-full h-full bg-white text-black p-12 font-typewriter flex flex-col relative box-border overflow-hidden">
      
      {/* Texture Overlays */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
      
      {/* Header Area */}
      <div className="mb-8 border-b-2 border-black pb-4">
        <div className="flex justify-between items-end mb-4">
            <div>
                <h1 className="text-3xl font-bold uppercase tracking-tighter">{data.title}</h1>
                {data.subtitle && <h2 className="text-lg text-gray-600 font-bold uppercase">{data.subtitle}</h2>}
            </div>
            <div className="text-right">
                <div className="border-4 border-black px-2 py-1 inline-block font-bold text-xl rotate-[-2deg] opacity-80">
                    {isLab ? 'CONFIDENTIAL' : 'OFFICIAL COPY'}
                </div>
            </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm bg-gray-100 p-4 border border-gray-300">
            {Object.entries(data.headerMetadata || {}).map(([key, value]) => (
                <div key={key} className="flex border-b border-gray-300 border-dashed justify-between">
                    <span className="font-bold uppercase text-gray-600">{key}:</span>
                    <span className="font-mono">{value}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="flex-1 space-y-6">
        {data.bodySections?.map((section, idx) => (
            <div key={idx}>
                {section.title && (
                    <h3 className="font-bold uppercase border-b border-black mb-2 text-sm">{section.title}</h3>
                )}
                {/* Simple Markdown-ish rendering */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif">
                    {section.content}
                </div>
            </div>
        ))}
      </div>

      {/* Footer / Signatures */}
      <div className="mt-auto pt-8 border-t border-black">
        {data.footerMetadata && (
            <div className="flex justify-between text-xs text-gray-500 mb-6">
                {Object.entries(data.footerMetadata).map(([key, value]) => (
                    <span key={key} className="uppercase">{key}: {value}</span>
                ))}
            </div>
        )}
        
        {data.signatures && (
            <div className="flex gap-8 mt-4">
                {data.signatures.map((sig, idx) => (
                    <div key={idx} className="flex-1">
                        <div className="h-12 border-b border-black mb-1 relative">
                             <span className="absolute bottom-2 left-2 font-handwriting text-2xl text-blue-900 rotate-[-5deg] font-stamp opacity-80">
                                {sig}
                             </span>
                        </div>
                        <span className="text-xs font-bold uppercase">Signature</span>
                    </div>
                ))}
            </div>
        )}
        
        <div className="text-center mt-4 text-[10px] text-gray-400">
            GENERATED RECORD - {new Date().getFullYear()} - SYSTEM ID: {Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </div>

      {/* Watermarks based on context */}
      {isFinancial && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-9xl font-bold -rotate-45">VOID</span>
          </div>
      )}
    </div>
  );
};
