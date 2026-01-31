import React from 'react';

// Railway Timetable Template
// Style: Utilitarian, Tabular, Industrial/Mid-century
// Uses 'Share Tech Mono' or 'Courier Prime' for monospaced look.

interface RailTimetableProps {
    data: {
        header: string;
        station: string;
        departures: string[]; // e.g., "08:00 PM - On Time"
    };
}

export const RailTimetableTemplate: React.FC<RailTimetableProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] bg-[#fdfbf7] text-black font-mono relative overflow-hidden p-16 flex flex-col">
            {/* Background/Texture effects */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('/textures/documents/paper_plain_1.png')] bg-cover mix-blend-multiply"></div>

            {/* Header Section */}
            <div className="border-b-4 border-black pb-4 mb-8">
                <h1 className="text-4xl font-bold tracking-widest text-center uppercase">{data.header}</h1>
                <div className="flex justify-between mt-2 text-xl">
                    <span>SOUTHERN REGION</span>
                    <span>P.09</span>
                </div>
            </div>

            {/* Station Info */}
            <div className="mb-8 border-2 border-black p-4 bg-gray-100/50">
                <div className="text-sm uppercase tracking-wider text-gray-600 mb-1">Station</div>
                <div className="text-3xl font-bold uppercase">{data.station}</div>
            </div>

            {/* Timetable Grid */}
            <div className="flex-1 w-full">
                <div className="grid grid-cols-1 border-2 border-black">
                    {/* Table Header */}
                    <div className="bg-black text-white p-3 font-bold text-xl uppercase tracking-wider">
                        Departures / Status
                    </div>

                    {/* Rows */}
                    {data.departures.length > 0 ? (
                        data.departures.map((dep, idx) => (
                            <div key={idx} className={`p-4 text-2xl border-b border-black font-semibold flex items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                {/* Add a bullet or icon */}
                                <span className="mr-4 text-3xl">›</span>
                                {dep}
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center italic text-gray-500">No departures listed.</div>
                    )}
                </div>
            </div>

            {/* Footer / Disclaimer */}
            <div className="mt-8 text-xs text-center text-gray-500 uppercase">
                Southern Rail Co. • Not responsible for delays due to weather or force majeure.
            </div>

            {/* Stamping area */}
            <div className="absolute bottom-20 right-20 opacity-40 rotate-12 border-4 border-red-800 text-red-800 p-2 font-black text-2xl uppercase rounded">
                Checked
            </div>
        </div>
    );
};
