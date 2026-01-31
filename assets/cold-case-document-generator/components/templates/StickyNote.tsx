import React from 'react';
import { UniversalDocumentData } from '../../types';

interface Props {
  data: UniversalDocumentData;
}

export const StickyNoteTemplate: React.FC<Props> = ({ data }) => {
  // Combine all content into one body for the note
  const fullText = data.bodySections.map(s => s.content).join('\n\n');

  return (
    <div className="w-full h-full bg-[#fef08a] text-blue-900 p-8 flex flex-col relative box-border overflow-hidden shadow-inner">
      {/* Sticky residue visual at top */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-black/5 blur-sm" />

      {/* Content */}
      <div className="mt-4 flex-1">
        <h2 className="font-handwriting font-stamp text-2xl mb-4 opacity-90 underline decoration-wavy">
            {data.title}
        </h2>
        
        <p className="font-handwriting font-stamp text-xl leading-loose">
            {fullText}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 text-right">
         <span className="text-sm font-handwriting font-stamp opacity-60">
            - {data.signatures?.[0] || 'Unknown'}
         </span>
      </div>

      {/* Coffee ring for flavor */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 border-8 border-[#5c4033]/10 rounded-full blur-sm pointer-events-none" />
    </div>
  );
};
