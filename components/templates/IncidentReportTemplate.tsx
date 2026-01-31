import React from 'react';

// Incident Report Template
// Style: Official Form, Boxes, Grid.

interface IncidentReportProps {
    data: {
        header: string;
        subtitle: string;
        reportNumber: string;
        officer: string;
        badge: string;
        incidentType: string;
        location: string;
        datetime: string;
        narrative: string;
        supervisor?: string;
    };
}

export const IncidentReportTemplate: React.FC<IncidentReportProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] bg-white text-black font-sans relative overflow-hidden flex flex-col items-stretch">
            {/* Header Block */}
            <div className="bg-black text-white p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tighter">{data.header}</h1>
                    <h2 className="text-xl uppercase tracking-widest text-gray-300">{data.subtitle}</h2>
                </div>
                <div className="text-right border-l-2 border-white pl-4">
                    <div className="text-xs uppercase opacity-70">Report No.</div>
                    <div className="text-2xl font-mono font-bold">{data.reportNumber}</div>
                </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
                {/* Meta Data Grid */}
                <div className="grid grid-cols-3 gap-0 border-2 border-black mb-8">
                    {/* Row 1 */}
                    <div className="border-r border-b border-black p-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Reporting Officer</label>
                        <div className="font-bold">{data.officer}</div>
                    </div>
                    <div className="border-r border-b border-black p-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Badge No.</label>
                        <div className="font-mono">{data.badge}</div>
                    </div>
                    <div className="border-b border-black p-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Date/Time</label>
                        <div className="font-mono">{data.datetime}</div>
                    </div>

                    {/* Row 2 */}
                    <div className="col-span-2 border-r border-black p-2 bg-gray-50">
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Incident Type</label>
                        <div className="text-lg font-bold">{data.incidentType}</div>
                    </div>
                    <div className="p-2 bg-gray-50">
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Code</label>
                        <div className="font-mono">187-PC</div>
                    </div>

                    {/* Row 3 */}
                    <div className="col-span-3 border-t border-black p-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-600">Location of Incident</label>
                        <div className="text-lg">{data.location}</div>
                    </div>
                </div>

                {/* Narrative */}
                <div className="flex-1 flex flex-col mb-4">
                    <div className="bg-black text-white px-2 py-1 text-sm font-bold uppercase w-full">Narrative of Incident</div>
                    <div className="border-2 border-black border-t-0 p-4 flex-1 text-justify leading-relaxed font-typewriter text-lg whitespace-pre-wrap">
                        {data.narrative}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex mt-4 pt-4 border-t-4 border-double border-gray-300">
                    <div className="flex-1">
                        <label className="block text-xs uppercase font-bold text-gray-500 mb-6">Reporting Officer Signature</label>
                        <div className="border-b border-black w-3/4"></div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs uppercase font-bold text-gray-500 mb-6">Supervisor Review</label>
                        <div className="border-b border-black w-3/4"></div>
                        <div className="text-sm mt-1">{data.supervisor || "________________"}</div>
                    </div>
                </div>
            </div>

            {/* Stamp */}
            <div className="absolute top-32 right-12 opacity-80 border-4 border-blue-900 text-blue-900 px-4 py-2 font-black text-3xl uppercase -rotate-12 rounded-lg mix-blend-multiply">
                FILED
            </div>
        </div>
    );
};
