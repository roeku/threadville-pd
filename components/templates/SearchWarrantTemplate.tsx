import React from 'react';
import { SearchWarrantData } from '../../services/document-rendering/types';

interface Props {
    data: SearchWarrantData;
}

export const SearchWarrantTemplate: React.FC<Props> = ({ data }) => {
    console.log("SearchWarrantTemplate mounting with data:", data);
    return (
        <div className="document-page w-full h-full bg-[#fcfcfc] text-black p-16 font-typewriter flex flex-col relative box-border bg-[url('/textures/documents/paper_plain_2.png')] bg-cover">

            {/* Court Header */}
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-4xl font-bold uppercase mb-2 font-stamp">Search Warrant</h1>
                <h2 className="text-xl font-bold uppercase mb-1">State of Hounslow</h2>
                <p className="text-sm">In the Circuit Court for the County of Hounslow</p>
            </div>

            {/* Warrant ID / Meta */}
            <div className="flex justify-between mb-8 text-sm">
                <div>
                    <span className="font-bold">Warrant ID:</span> {data.warrantId}
                </div>
                <div>
                    <span className="font-bold">Date Issued:</span> {data.dateIssued}
                </div>
                <div>
                    <span className="font-bold">Judge:</span> {data.judgeName}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="bg-gray-100 p-4 border border-gray-300">
                    <h3 className="font-bold uppercase text-xs text-gray-500 mb-1">Target Premises</h3>
                    <p className="text-lg leading-tight">{data.targetAddress}</p>
                </div>

                <div className="bg-gray-100 p-4 border border-gray-300">
                    <h3 className="font-bold uppercase text-xs text-gray-500 mb-1">Target Person(s)</h3>
                    <p className="text-lg leading-tight">{data.targetPerson}</p>
                </div>

                <div>
                    <h3 className="font-bold uppercase bg-black text-white px-2 py-1 inline-block mb-3">Items to be Seized</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        {data.itemsToSeize.map((item, i) => (
                            <li key={i} className="text-base">{item}</li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="font-bold uppercase bg-black text-white px-2 py-1 inline-block mb-3">Probable Cause Summary</h3>
                    <p className="text-sm text-justify leading-relaxed border-l-4 border-gray-400 pl-4 italic">
                        {data.probableCause}
                    </p>
                </div>
            </div>

            {/* Execution Footer */}
            <div className="mt-auto pt-10 grid grid-cols-2 gap-12">
                <div className="border-t border-black pt-2">
                    <p className="text-xs uppercase font-bold text-gray-500">Issuing Judge Signature</p>
                    <div className="font-handwriting text-3xl mt-2 text-blue-900 transform -rotate-2">{data.judgeName}</div>
                </div>
                <div className="border-t border-black pt-2">
                    <p className="text-xs uppercase font-bold text-gray-500">Clerk of Court Seal</p>
                    <div className="w-24 h-24 border-4 border-double border-red-900 rounded-full flex items-center justify-center transform rotate-12 opacity-80 mt-2">
                        <span className="text-red-900 text-[0.6rem] font-bold text-center leading-tight">
                            CIRCUIT COURT<br />
                            HOUNSLOW<br />
                            OFFICIAL
                        </span>
                    </div>
                </div>
            </div>

            {/* Expiry Warning */}
            <div className="absolute top-12 right-12 border-2 border-red-600 p-2 transform rotate-12 opacity-90">
                <p className="text-red-600 font-bold text-xs uppercase text-center leading-none">
                    Void After<br />
                    <span className="text-lg">{data.expiryDate || "48 HRS"}</span>
                </p>
            </div>
        </div>
    );
};
