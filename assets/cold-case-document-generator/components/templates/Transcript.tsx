import React from 'react';
import { TranscriptData } from '../../types';

interface Props {
  data: TranscriptData;
}

export const TranscriptTemplate: React.FC<Props> = ({ data }) => {
  // Pagination Config
  const ITEMS_PER_PAGE = 11;
  const chunks = [];
  
  for (let i = 0; i < data.dialogue.length; i += ITEMS_PER_PAGE) {
    chunks.push(data.dialogue.slice(i, i + ITEMS_PER_PAGE));
  }
  
  // If empty, at least one page
  if (chunks.length === 0) chunks.push([]);

  return (
    <>
      {chunks.map((chunk, pageIndex) => (
        <div 
          key={pageIndex} 
          className="document-page w-[816px] h-[1056px] bg-white text-black p-12 font-typewriter flex flex-col relative box-border overflow-hidden shrink-0"
        >
          {/* Background Effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Header (Repeated on every page for context, or simplified on sub-pages) */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-widest">Recorded Interview</h1>
                    <h2 className="text-sm font-bold uppercase text-gray-500">PD - Detective Bureau</h2>
                </div>
                <div className="border border-black px-2 py-1 text-xs font-bold bg-gray-100">
                    EVIDENCE # {data.caseNumber}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-2 text-xs font-bold uppercase text-gray-700">
                <div><span className="text-gray-400 mr-2">DATE:</span> {data.date}</div>
                <div><span className="text-gray-400 mr-2">SUBJECT:</span> {data.interviewees[0]}</div>
                <div><span className="text-gray-400 mr-2">PAGE:</span> {pageIndex + 1} of {chunks.length}</div>
            </div>
          </div>

          {/* Transcript Body */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200"></div>
            
            <div className="space-y-6 text-sm leading-relaxed pl-2">
                {chunk.map((entry, index) => {
                    const globalIndex = pageIndex * ITEMS_PER_PAGE + index;
                    return (
                        <div key={index} className="flex relative group">
                            {/* Line Number */}
                            <div className="w-8 text-[10px] text-gray-300 text-right pr-2 select-none pt-1 font-mono-tech">
                                {((globalIndex + 1) * 10).toString().padStart(3, '0')}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 pl-4">
                                <div className="mb-1">
                                    <span className="font-bold uppercase bg-gray-100 px-1 text-xs tracking-wider border border-gray-200 rounded">
                                        {entry.speaker}
                                    </span>
                                    {entry.timestamp && (
                                        <span className="text-[10px] text-gray-400 ml-2 font-mono-tech">[{entry.timestamp}]</span>
                                    )}
                                </div>
                                <div className="pl-0">
                                    {entry.action && (
                                        <span className="italic text-gray-500 block mb-1">{entry.action}</span>
                                    )}
                                    <span className="text-gray-900">{entry.text}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto border-t-2 border-black pt-2 flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold">
            <span>Transcribed by Unit 4</span>
            <span>Ref: {data.caseNumber}</span>
            <span>CONFIDENTIAL</span>
          </div>
          
          {/* Footer Stamp - Only on first page usually, but maybe last page? Let's put on all for style, or just first */}
          {pageIndex === 0 && (
            <div className="absolute bottom-12 right-12 border-4 border-red-900/30 text-red-900/30 font-black text-4xl p-2 -rotate-12 pointer-events-none rounded">
              VERIFIED
            </div>
          )}
        </div>
      ))}
    </>
  );
};