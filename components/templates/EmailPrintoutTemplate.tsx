import React from 'react';

// Email Printout Template
// Style: Web browser print header, clean body

interface EmailPrintoutProps {
    data: {
        from: string;
        to: string;
        subject: string;
        date: string;
        body: string;
        attachments: string[];
    };
}

export const EmailPrintoutTemplate: React.FC<EmailPrintoutProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] bg-white text-black font-sans text-sm p-12 flex flex-col">
            {/* Metadata Header */}
            <div className="border-b mb-6 pb-4">
                <div className="font-bold text-2xl mb-4">{data.subject}</div>
                <div className="grid grid-cols-[80px_1fr] gap-y-1 text-gray-800">
                    <div className="font-bold text-gray-500 text-right pr-4">From:</div>
                    <div>{data.from}</div>

                    <div className="font-bold text-gray-500 text-right pr-4">To:</div>
                    <div>{data.to}</div>

                    <div className="font-bold text-gray-500 text-right pr-4">Date:</div>
                    <div>{data.date}</div>
                </div>
            </div>

            {/* Attachments */}
            {data.attachments.length > 0 && (
                <div className="mb-6 p-3 bg-gray-100 rounded border border-gray-300 flex items-center gap-2">
                    <span className="font-bold text-gray-500 text-xs uppercase">Attachments:</span>
                    {data.attachments.map((att, i) => (
                        <span key={i} className="bg-white px-2 py-1 rounded border text-xs font-mono">{att}</span>
                    ))}
                </div>
            )}

            {/* Body */}
            <div className="whitespace-pre-wrap leading-relaxed font-serif text-base">
                {data.body}
            </div>

            {/* Footer / URL artifact */}
            <div className="mt-auto pt-8 border-t text-xs text-gray-400 flex justify-between">
                <span>Page 1 of 1</span>
                <span>https://mail.protonmail.com/inbox/view/msg112938</span>
            </div>
        </div>
    );
};
