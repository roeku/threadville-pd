import React from 'react';

// Case File Cover Template
// Style: Folder cover, Manila aesthetics (simulated), big stamps

interface CaseFileCoverProps {
    data: {
        caseNumber: string;
        title: string;
        leadInvestigator: string;
        assignedTeam: string[];
        startDate: string;
    };
}

export const CaseFileCoverTemplate: React.FC<CaseFileCoverProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] bg-[#e3d0a6] text-black font-sans relative overflow-hidden p-0 flex flex-col items-center justify-center">
            {/* Texture Layer */}
            <div className="absolute inset-0 pointer-events-none opacity-50 bg-[url('/textures/documents/paper_plain_2.png')] bg-cover mix-blend-multiply"></div>

            {/* Binder Tab visual at top */}
            <div className="absolute top-0 right-0 w-1/3 h-12 bg-[#dcb97a] shadow-md border-b border-[#bfa36a] transform skew-x-12 origin-top-left rounded-bl-xl flex items-center justify-center">
                <span className="font-bold text-xl uppercase tracking-widest opacity-70 transform -skew-x-12">{data.caseNumber}</span>
            </div>

            <div className="border-4 border-black w-3/4 h-3/4 flex flex-col items-center justify-start p-12 bg-opacity-10 bg-white relative shadow-inner">

                <div className="w-full text-center border-b-4 border-black pb-8 mb-12">
                    <h1 className="text-6xl font-black uppercase tracking-tighter">CASE FILE</h1>
                    <div className="text-xl uppercase tracking-widest mt-2">{data.title}</div>
                </div>

                <div className="w-full grid grid-cols-1 gap-12">
                    <div className="text-center">
                        <label className="block text-sm font-bold uppercase tracking-widest text-[#5c4d32] mb-2">Case Number</label>
                        <div className="text-5xl font-mono font-bold">{data.caseNumber}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-t-2 border-[#8c7a59] pt-8">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c4d32] mb-1">Lead Investigator</label>
                            <div className="text-2xl font-typewriter">{data.leadInvestigator}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-[#5c4d32] mb-1">Start Date</label>
                            <div className="text-2xl font-typewriter">{data.startDate}</div>
                        </div>
                    </div>

                    <div className="border-t-2 border-[#8c7a59] pt-8">
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#5c4d32] mb-2">Assigned Team</label>
                        <ul className="text-xl font-typewriter list-disc pl-8">
                            {data.assignedTeam.map((member, i) => (
                                <li key={i} className="mb-1">{member}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Stamp */}
                <div className="absolute bottom-12 right-12 border-8 border-red-900 text-red-900 p-4 transform -rotate-12 font-black text-4xl uppercase opacity-80 mix-blend-multiply rounded-lg">
                    CONFIDENTIAL
                </div>
            </div>
        </div>
    );
};
