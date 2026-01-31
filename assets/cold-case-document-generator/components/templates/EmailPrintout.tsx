import React from 'react';
import { UniversalDocumentData } from '../../types';

interface Props {
  data: UniversalDocumentData;
}

export const EmailPrintoutTemplate: React.FC<Props> = ({ data }) => {
  // Extract standard email fields from metadata case-insensitively
  const getMeta = (key: string) => {
    const found = Object.keys(data.headerMetadata || {}).find(k => k.toLowerCase() === key.toLowerCase());
    return found ? data.headerMetadata[found] : '';
  };

  const from = getMeta('from') || 'Unknown Sender';
  const to = getMeta('to') || 'Unknown Recipient';
  const date = getMeta('date') || 'Unknown Date';
  const subject = data.title || getMeta('subject') || 'No Subject';

  return (
    <div className="w-full h-full bg-white text-black p-12 font-digital flex flex-col relative box-border overflow-hidden">
      
      {/* Header Block */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                M
            </div>
            <h1 className="text-3xl font-light text-gray-800">Mail</h1>
        </div>

        <div className="space-y-3 text-lg border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold mb-4">{subject}</h2>
            
            <div className="flex gap-2">
                <span className="font-bold text-gray-500 w-16">From:</span>
                <span className="font-medium text-blue-800 underline decoration-blue-800/30">{from}</span>
            </div>
            <div className="flex gap-2">
                <span className="font-bold text-gray-500 w-16">Sent:</span>
                <span>{date}</span>
            </div>
            <div className="flex gap-2">
                <span className="font-bold text-gray-500 w-16">To:</span>
                <span className="font-medium text-blue-800 underline decoration-blue-800/30">{to}</span>
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-6 font-normal text-xl leading-relaxed text-gray-800">
        {data.bodySections.map((sec, i) => (
             <div key={i} className="whitespace-pre-wrap">
                 {sec.content}
             </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-300 pt-2 flex justify-between text-xs text-gray-400 font-mono-tech">
        <span>https://mail.google.com/mail/u/0/?ik=...</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
};