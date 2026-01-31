import React from 'react';

// Letterhead Template
// Style: Professional, Logo placeholder, Formal

interface LetterheadPageProps {
    data: {
        headerStr?: string; // Fallback if no specific format
        sender?: string;
        recipient?: string;
        date?: string;
        body: string;
        footer?: string;
    };
}

export const LetterheadPageTemplate: React.FC<LetterheadPageProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] relative bg-[#fdfbf7] text-black font-serif p-20 flex flex-col">
            {/* Paper Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('/textures/documents/paper_plain_1.png')] bg-cover mix-blend-multiply"></div>

            {/* Letterhead Header */}
            <div className="text-center mb-16 relative">
                <div className="inline-block border-b-2 border-black pb-2 px-8">
                    <h1 className="text-2xl font-bold uppercase tracking-widest">{data.headerStr || "STERLING MANOR"}</h1>
                    <div className="text-xs uppercase mt-1 tracking-wider text-gray-600">Established 1892</div>
                </div>
            </div>

            {/* Date */}
            <div className="text-right mb-12 font-typewriter">
                {data.date || "Unknown Date"}
            </div>

            {/* Salutation / Recipient */}
            <div className="mb-8 font-bold">
                {data.recipient && (
                    <div className="mb-4">
                        TO: {data.recipient}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 text-lg leading-relaxed whitespace-pre-wrap text-justify relative z-10">
                {data.body}
            </div>

            {/* Sign off */}
            <div className="mt-16 mb-12 ml-48">
                <div className="mb-4">Sincerely,</div>
                <div className="font-script text-4xl text-blue-900 transform -rotate-3 mb-2 opacity-90">
                    {data.sender || "The Management"}
                </div>
                <div className="uppercase text-xs tracking-widest border-t border-black pt-2 inline-block">
                    {data.sender || "The Management"}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto text-center text-xs text-gray-500 uppercase tracking-widest">
                {data.footer || "14 Old Quarry Rd • Threaville"}
            </div>
        </div>
    );
};
