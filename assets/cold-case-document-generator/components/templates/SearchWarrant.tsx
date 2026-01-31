import React from 'react';
import { SearchWarrantData } from '../../types';

interface Props {
  data: SearchWarrantData;
}

export const SearchWarrantTemplate: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white text-black p-16 font-serif flex flex-col relative box-border">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 uppercase tracking-wide font-typewriter">Superior Court</h1>
        <h2 className="text-lg italic text-gray-600">State of San Andreas</h2>
        <div className="mt-6 border-b border-black w-1/2 mx-auto"></div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold underline mb-4">SEARCH WARRANT</h2>
        <p className="font-bold text-sm">Case No: <span className="font-typewriter text-lg ml-2">{data.warrantId}</span></p>
      </div>

      {/* Body */}
      <div className="space-y-6 text-sm leading-relaxed">
        <p>
            TO ANY SHERIFF, CONSTABLE, MARSHAL, OR POLICE OFFICER IN THE COUNTY OF LOS SANTOS:
        </p>

        <p>
            Proof, by affidavit, having been this day made before me by <span className="font-bold">Detective Dept.</span>, 
            that there is probable cause for believing that the following property describe below is located at:
        </p>

        <div className="bg-gray-100 p-4 border border-gray-300 font-typewriter text-base">
            <span className="block font-bold">ADDRESS:</span> {data.targetAddress}<br/>
            <span className="block font-bold mt-2">PERSON(S) OF INTEREST:</span> {data.targetPerson}
        </div>

        <p>
            YOU ARE THEREFORE COMMANDED to make immediate search of the premises described above for the following property:
        </p>

        <ul className="list-disc pl-8 font-typewriter text-sm space-y-1">
            {data.itemsToSeize.map((item, idx) => (
                <li key={idx}>{item}</li>
            ))}
        </ul>

        <p className="mt-4">
            AND IF YOU FIND THE SAME or any part thereof, to bring it forthwith before me at the Superior Court.
        </p>
        
        <div className="my-6">
            <h3 className="font-bold underline mb-2">PROBABLE CAUSE SUMMARY:</h3>
            <p className="font-typewriter text-xs text-justify border-l-4 border-black pl-4 py-2 bg-gray-50">
                {data.probableCause}
            </p>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-auto pt-8 flex justify-between items-end">
        <div className="text-center w-1/3">
            <div className="border-b border-black mb-2 pb-1 font-typewriter">{data.dateIssued}</div>
            <span className="text-xs uppercase font-bold">Date Issued</span>
        </div>

        <div className="text-center w-1/2 relative">
             {/* Signature Simulation */}
            <div className="absolute bottom-6 left-0 right-0 font-stamp text-3xl text-blue-800 -rotate-3 opacity-90">
                Judge {data.judgeName.split(' ').pop()}
            </div>
            <div className="border-b border-black mb-2 h-12"></div>
            <span className="text-xs uppercase font-bold">Magistrate / Judge of Superior Court</span>
        </div>
      </div>
      
       {/* Seal */}
       <div className="absolute top-12 left-12 opacity-20 border-4 border-gray-800 rounded-full w-24 h-24 flex items-center justify-center rotate-12">
          <span className="text-[0.6rem] font-black uppercase text-center">Official<br/>Court<br/>Seal</span>
      </div>
    </div>
  );
};
