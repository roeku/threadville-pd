import React from 'react';
import { AutopsyReportData } from '../../types';

interface Props {
  data: AutopsyReportData;
}

export const AutopsyReportTemplate: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-full bg-[#fdfbf7] text-black p-12 font-typewriter flex flex-col relative box-border selection:bg-none">
      {/* Background stain effect (simulated with CSS gradients) */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_30%_20%,#d4c4a8_0%,transparent_40%),radial-gradient(circle_at_80%_80%,#d4c4a8_0%,transparent_30%)]" />

      {/* Header */}
      <div className="border-b-4 border-black pb-4 mb-6 text-center z-10">
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Office of the Medical Examiner</h1>
        <h2 className="text-xl font-bold uppercase text-gray-700">Confidential Autopsy Report</h2>
        <div className="flex justify-between mt-4 text-sm font-bold">
            <span>STATE FORM 10-A</span>
            <span>RESTRICTED ACCESS</span>
        </div>
      </div>

      {/* Meta Data Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 border-b-2 border-gray-300 pb-6 z-10">
        <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase">Case Number</span>
            <span className="text-xl font-bold">{data.caseNumber}</span>
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase">Examiner</span>
            <span className="text-lg">{data.examinerName}</span>
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase">Decedent</span>
            <span className="text-lg">{data.decedentName}</span>
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase">Date/Time</span>
            <span className="text-lg">{data.dateOfDeath} @ {data.timeOfDeath}</span>
        </div>
      </div>

      {/* Findings Sections */}
      <div className="flex-1 flex flex-col gap-6 z-10">
        <section>
            <h3 className="text-sm font-bold uppercase bg-gray-200 inline-block px-2 py-1 mb-2">External Findings</h3>
            <p className="text-sm leading-relaxed text-justify">{data.externalFindings}</p>
        </section>

        <section>
            <h3 className="text-sm font-bold uppercase bg-gray-200 inline-block px-2 py-1 mb-2">Internal Examination</h3>
            <p className="text-sm leading-relaxed text-justify">{data.internalFindings}</p>
        </section>

        <section>
            <h3 className="text-sm font-bold uppercase bg-gray-200 inline-block px-2 py-1 mb-2">Toxicology</h3>
            <p className="text-sm leading-relaxed text-justify italic">{data.toxicologyNotes}</p>
        </section>
      </div>

      {/* Conclusion Footer */}
      <div className="mt-auto border-t-4 border-double border-black pt-6 z-10">
         <div className="grid grid-cols-2 gap-8">
            <div className="border border-black p-4 bg-white/50">
                <span className="block text-xs font-bold uppercase text-gray-500 mb-1">Manner of Death</span>
                <span className="block text-2xl font-bold font-stamp text-red-900 rotate-[-2deg]">{data.mannerOfDeath}</span>
            </div>
            <div className="border border-black p-4 bg-white/50">
                <span className="block text-xs font-bold uppercase text-gray-500 mb-1">Cause of Death</span>
                <span className="block text-lg font-bold leading-tight">{data.causeOfDeath}</span>
            </div>
         </div>
      </div>

      {/* Stamp */}
      <div className="absolute bottom-16 right-12 opacity-80 rotate-[-15deg] pointer-events-none border-4 border-blue-900 rounded-full w-32 h-32 flex items-center justify-center">
          <div className="text-center text-blue-900 font-stamp text-xs font-bold p-2 leading-tight">
              OFFICIAL RECORD<br/>
              DO NOT COPY<br/>
              <span className="text-[0.6rem] block mt-1">CNTY. MED. EXAM.</span>
          </div>
      </div>
    </div>
  );
};
