import React from 'react';

// Lab Submission Form Template
// Style: Clinical, Grid-heavy, Official

interface LabSubmissionFormProps {
    data: {
        caseNumber: string;
        submitter: string;
        date: string;
        items: Array<{ itemId: string; description: string; requestedTests: string }>;
    };
}

export const LabSubmissionFormTemplate: React.FC<LabSubmissionFormProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] bg-white text-black font-sans relative overflow-hidden p-8 flex flex-col">
            <div className="border-2 border-black h-full flex flex-col">

                {/* Header */}
                <div className="bg-gray-200 border-b-2 border-black p-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold uppercase">Forensic Lab Submission</h1>
                        <div className="text-xs uppercase">Chain of Custody Form A-113</div>
                    </div>
                    <div className="text-right">
                        <div className="font-mono text-xl">{data.caseNumber}</div>
                    </div>
                </div>

                {/* Submitter Info */}
                <div className="grid grid-cols-3 border-b-2 border-black">
                    <div className="border-r border-black p-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-500">Submitter</label>
                        <div>{data.submitter}</div>
                    </div>
                    <div className="border-r border-black p-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-500">Date</label>
                        <div>{data.date}</div>
                    </div>
                    <div className="p-2 bg-gray-50">
                        <label className="block text-[10px] uppercase font-bold text-gray-500">Lab Tech Sig.</label>
                        <div className="h-6"></div>
                    </div>
                </div>

                {/* Evidence List Header */}
                <div className="grid grid-cols-12 bg-black text-white text-xs font-bold uppercase py-1 border-b border-black">
                    <div className="col-span-1 text-center border-r border-white">Item #</div>
                    <div className="col-span-2 px-2 border-r border-white">ID</div>
                    <div className="col-span-6 px-2 border-r border-white">Description</div>
                    <div className="col-span-3 px-2">Requested Tests</div>
                </div>

                {/* Rows */}
                <div className="flex-1 bg-[url('/textures/documents/paper_plain_1.png')] bg-cover">
                    {data.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 border-b border-gray-400 text-sm">
                            <div className="col-span-1 text-center py-2 border-r border-gray-400 font-bold">{idx + 1}</div>
                            <div className="col-span-2 px-2 py-2 border-r border-gray-400 font-mono text-xs">{item.itemId}</div>
                            <div className="col-span-6 px-2 py-2 border-r border-gray-400 font-typewriter">{item.description}</div>
                            <div className="col-span-3 px-2 py-2 font-mono text-xs bg-yellow-50">{item.requestedTests}</div>
                        </div>
                    ))}
                    {/* Empty rows to fill space */}
                    {[...Array(5)].map((_, i) => (
                        <div key={`empty-${i}`} className="grid grid-cols-12 border-b border-gray-200 text-sm h-12 opacity-50">
                            <div className="col-span-1 border-r border-gray-200"></div>
                            <div className="col-span-2 border-r border-gray-200"></div>
                            <div className="col-span-6 border-r border-gray-200"></div>
                            <div className="col-span-3"></div>
                        </div>
                    ))}
                </div>

                {/* Footer Warning */}
                <div className="p-4 bg-gray-100 border-t-2 border-black text-xs text-center font-bold uppercase">
                    Evidence seals must be intact upon receipt. Report broken seals immediately.
                </div>
            </div>
        </div>
    );
};
