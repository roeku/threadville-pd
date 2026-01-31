import React from 'react';
import { UniversalDocumentData } from '../../types';

interface Props {
  data: UniversalDocumentData;
}

export const NewspaperTemplate: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-full bg-[#e3dac9] text-[#1a1a1a] p-8 font-serif flex flex-col relative box-border overflow-hidden">
        {/* Paper texture */}
        <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />
        
        {/* Newspaper Header */}
        <div className="border-b-4 border-black mb-4 pb-2 text-center">
            <h1 className="font-black text-5xl uppercase tracking-tighter mb-2">The Daily Chronicle</h1>
            <div className="flex justify-between border-t border-b border-black py-1 text-xs font-bold uppercase">
                <span>Vol. XCVII No. 342</span>
                <span>{data.headerMetadata['Date'] || 'Late Edition'}</span>
                <span>Price 50¢</span>
            </div>
        </div>

        {/* Headline */}
        <h2 className="text-4xl font-black leading-tight mb-4 text-center font-sans uppercase">
            {data.title}
        </h2>

        {/* Byline */}
        <div className="text-center italic text-sm mb-6 border-b border-black pb-4 w-1/2 mx-auto">
            By {data.headerMetadata['Author'] || 'Staff Writer'}
        </div>

        {/* Columns Content */}
        <div className="columns-2 gap-6 text-sm text-justify leading-snug flex-1">
             <span className="float-left text-4xl font-black mr-2 bg-black text-white px-2 leading-none mt-1">
                {data.bodySections[0]?.content.charAt(0) || 'T'}
             </span>
             {data.bodySections.map((sec, i) => (
                 <p key={i} className="mb-4">
                    {i === 0 ? sec.content.substring(1) : sec.content}
                 </p>
             ))}
        </div>

        {/* Torn Edge Effect Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-white" style={{clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)'}}></div>
    </div>
  );
};
