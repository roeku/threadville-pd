import React from 'react';

interface ServerLogProps {
    data: {
        source: string;
        timestampRange: string;
        entries: string[];
    };
}

export const ServerLogTemplate: React.FC<ServerLogProps> = ({ data }) => {
    const ITEMS_PER_PAGE = 35;
    const pages = [];

    if (data.entries.length === 0) {
        pages.push([]);
    } else {
        for (let i = 0; i < data.entries.length; i += ITEMS_PER_PAGE) {
            pages.push(data.entries.slice(i, i + ITEMS_PER_PAGE));
        }
    }

    return (
        <>
            {pages.map((pageEntries, pageIndex) => (
                <div key={pageIndex} className="document-page w-[816px] h-[1056px] bg-white text-black font-mono relative overflow-hidden p-12 flex flex-col mb-8">
                    {/* Header */}
                    <div className="border-b-2 border-black mb-4 pb-2">
                        <div className="flex justify-between items-end">
                            <h1 className="text-2xl font-bold uppercase">System Activity Log</h1>
                            <span className="text-sm">Page {pageIndex + 1} of {pages.length}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span>SOURCE: {data.source}</span>
                            <span>RANGE: {data.timestampRange}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-sm leading-tight font-mono whitespace-pre-wrap">
                        {pageEntries.map((line, idx) => (
                            <div key={idx} className="mb-1 border-b border-gray-100 py-1">
                                {line}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="text-xs text-center border-t border-gray-300 pt-2 mt-4">
                        CONFIDENTIAL SYSTEM RECORD - DO NOT DISTRIBUTE
                    </div>
                </div>
            ))}
        </>
    );
};
