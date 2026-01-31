import React from 'react';

// Transcript Template
// Style: Screenplay/Script format.
// Used for: transcript-excerpt, interrogation logs

interface TranscriptProps {
    data: {
        source: string;
        timestampRange: string;
        speakers: Array<{ name: string; line: string }>;
    };
}

export const TranscriptTemplate: React.FC<TranscriptProps> = ({ data }) => {
    // Basic pagination logic
    // A4 page can hold roughly 25-30 lines of dialogue depending on spacing.
    // Let's assume 20 items per page for safety.
    const ITEMS_PER_PAGE = 8;
    const pages = [];

    if (data.speakers.length === 0) {
        pages.push([]);
    } else {
        for (let i = 0; i < data.speakers.length; i += ITEMS_PER_PAGE) {
            pages.push(data.speakers.slice(i, i + ITEMS_PER_PAGE));
        }
    }

    return (
        <>
            {pages.map((pageSpeakers, pageIndex) => (
                <div key={pageIndex} className="document-page w-[816px] h-[1056px] bg-[#fdfbf7] text-black font-courier relative overflow-hidden p-16 flex flex-col mb-8">
                    {/* Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/textures/documents/paper_plain_2.png')] bg-cover mix-blend-multiply"></div>

                    {/* Header - Only on Page 1? Or all? Let's do all for context */}
                    <div className="text-center mb-8">
                        <div className="uppercase tracking-widest text-sm underline decoration-2 underline-offset-4">Transcript of Audio Recording</div>
                        <div className="mt-4 text-sm font-bold">SOURCE: {data.source.toUpperCase()}</div>
                        <div className="text-sm">TIME INDEX: {data.timestampRange}</div>
                    </div>

                    {/* Script Content */}
                    <div className="flex-1 text-sm leading-relaxed space-y-4">
                        {pageSpeakers.length > 0 ? (
                            pageSpeakers.map((entry, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <div className="font-bold uppercase mb-1 w-full text-center tracking-wide text-gray-800">
                                        {entry.name}
                                    </div>
                                    <div className="px-12 text-justify">
                                        {entry.line}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center italic text-gray-400 mt-20">[ Audio Corrupted / No Data ]</div>
                        )}
                    </div>

                    {/* Page Number */}
                    <div className="text-center text-xs mt-8 text-gray-500">
                        Page {pageIndex + 1} of {pages.length}
                    </div>
                </div>
            ))}
        </>
    );
};
