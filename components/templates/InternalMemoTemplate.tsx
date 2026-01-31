import React from 'react';

// Internal Memo Template
// Style: Corporate, Typewritten, Watermark option

interface InternalMemoProps {
    data: {
        from: string;
        to: string;
        date: string;
        subject: string;
        body: string;
        watermark?: string;
    };
}

export const InternalMemoTemplate: React.FC<InternalMemoProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] relative bg-white text-black p-16 font-typewriter flex flex-col">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('/textures/documents/paper_plain_1.png')] bg-cover mix-blend-multiply"></div>

            {/* Optional Watermark */}
            {data.watermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] transform -rotate-45">
                    <span className="text-9xl font-black uppercase text-black">{data.watermark}</span>
                </div>
            )}

            {/* Header */}
            <div className="text-center border-b-4 border-black pb-4 mb-8">
                <h1 className="text-4xl font-bold uppercase tracking-widest">Memorandum</h1>
                <div className="text-sm mt-2 uppercase tracking-wide">Internal Use Only</div>
            </div>

            {/* To/From Block */}
            <div className="mb-12 space-y-4 text-lg">
                <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold uppercase">To:</span>
                    <span>{data.to}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold uppercase">From:</span>
                    <span>{data.from}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold uppercase">Date:</span>
                    <span>{data.date}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr]">
                    <span className="font-bold uppercase">Re:</span>
                    <span className="underline decoration-dotted underline-offset-4">{data.subject}</span>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 text-justify leading-loose whitespace-pre-wrap">
                {data.body}
            </div>

            {/* Initials */}
            <div className="mt-12 font-script text-3xl opacity-80 text-blue-900 transform -rotate-6 w-32 ml-auto mr-12 text-center">
                {data.from.split(' ').map(n => n[0]).join('')}
            </div>
        </div>
    );
};
