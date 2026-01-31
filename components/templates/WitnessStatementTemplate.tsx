import React from 'react';

// Witness Statement Template
// Style: Official Police Form, Typewriter font, Lined or Boxes

interface WitnessStatementProps {
    data: {
        header?: string;
        name: string;
        timestamp: string;
        officer: string;
        body: string;
    };
}

export const WitnessStatementTemplate: React.FC<WitnessStatementProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] bg-[#fdfbf7] text-black font-typewriter relative overflow-hidden p-12 flex flex-col">
            {/* Background Noise */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/textures/documents/paper_plain_2.png')] bg-cover mix-blend-multiply"></div>

            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
                <div>
                    <div className="text-xs uppercase tracking-widest mb-1">Threadville Police Dept.</div>
                    <h1 className="text-3xl font-bold uppercase tracking-wide">{data.header || "WITNESS STATEMENT"}</h1>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold border border-black px-2 py-1 inline-block">CONFIDENTIAL</div>
                </div>
            </div>

            {/* Meta Fields Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 bg-gray-50 p-6 border border-gray-300">
                <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Witness Name</label>
                    <div className="text-xl border-b border-black border-dashed pb-1">{data.name}</div>
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Date / Time</label>
                    <div className="text-xl border-b border-black border-dashed pb-1">{data.timestamp}</div>
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Recording Officer</label>
                    <div className="text-xl border-b border-black border-dashed pb-1">{data.officer}</div>
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Location</label>
                    <div className="text-xl border-b border-black border-dashed pb-1">Precinct 1 - Interview Room B</div>
                </div>
            </div>

            {/* Body Text */}
            <div className="flex-1 relative">
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, #000 32px)',
                    backgroundPosition: '0 8px' // Align lines
                }}></div>

                <div className="relative z-10 text-lg leading-[32px] pt-2 px-2 whitespace-pre-wrap text-justify">
                    {data.body}
                </div>
            </div>

            {/* Signature Area */}
            <div className="mt-8 flex justify-between items-end pt-12">
                <div className="flex-1 mr-12">
                    <div className="border-b border-black h-8"></div>
                    <div className="text-xs uppercase mt-1 text-gray-500">Signature of Witness</div>
                </div>
                <div className="flex-1 ml-12">
                    <div className="border-b border-black h-8"></div>
                    <div className="text-xs uppercase mt-1 text-gray-500">Signature of Officer</div>
                </div>
            </div>
        </div>
    );
};
