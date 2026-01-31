import React from 'react';
import { UniversalDocumentData } from '../../types';

interface Props {
  data: UniversalDocumentData;
}

export const HandwrittenLetterTemplate: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-full bg-[#fdfbf7] text-[#1a1a1a] p-0 font-handwriting flex flex-col relative box-border overflow-hidden">
      
      {/* Lined Paper Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #a8a29e 39px, #a8a29e 40px)',
        backgroundAttachment: 'local'
      }} />
      
      {/* Margin Line */}
      <div className="absolute top-0 bottom-0 left-24 w-0.5 bg-red-300/60 z-10" />

      {/* Content Container - Offset to align with lines */}
      <div className="relative z-20 p-24 pt-32 h-full flex flex-col">
        
        {/* Date/Header Area */}
        <div className="flex justify-end mb-8 text-2xl text-blue-900/80 -rotate-1">
             {data.headerMetadata['Date'] || data.headerMetadata['date']}
        </div>

        {/* Salutation / Title */}
        {data.title && (
            <div className="text-3xl mb-1 leading-[40px] text-blue-900 font-bold ml-4">
                {data.title}
            </div>
        )}

        {/* Body Text */}
        <div className="flex-1 space-y-10">
            {data.bodySections.map((sec, i) => (
                <p key={i} className="text-3xl leading-[40px] text-blue-900/90 whitespace-pre-wrap">
                    {sec.content}
                </p>
            ))}
        </div>

        {/* Signatures */}
        {data.signatures && (
            <div className="mt-12 ml-auto w-1/3 text-center">
                <div className="text-4xl text-blue-900 rotate-[-2deg]">
                    {data.signatures[0]}
                </div>
            </div>
        )}
      </div>

      {/* Paper texture overlay for realism */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper.png')] mix-blend-multiply" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-yellow-500/5 to-transparent mix-blend-multiply" />
    </div>
  );
};