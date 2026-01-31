import React from 'react';

// Boarding Pass Template
// Style: Cardstock, Perforated stub, Barcode

interface BoardingPassProps {
    data: {
        airline: string;
        passenger: string;
        flight: string;
        date: string;
        from: string;
        to: string;
        seat: string;
        boardingTime: string;
    };
}

export const BoardingPassTemplate: React.FC<BoardingPassProps> = ({ data }) => {
    // Using w-full h-full to adapt to the container size set by renderDocument
    return (
        <div className="document-page w-full h-full relative p-4 flex items-center justify-center bg-transparent">

            <div className="document-page w-full h-full bg-white border-2 border-black rounded-lg flex overflow-hidden shadow-lg relative">
                <div className="absolute inset-0 bg-[url('/textures/documents/ticket_paper.png')] bg-cover opacity-50 pointer-events-none mix-blend-multiply"></div>

                {/* Main Section */}
                <div className="flex-1 p-6 relative">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-2xl font-black italic uppercase tracking-widest text-blue-900">{data.airline}</h1>
                        <div className="text-xs font-bold border border-black px-2 rounded">ECONOMY</div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block">Passenger Name</label>
                            <div className="font-mono text-lg font-bold">{data.passenger}</div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block">Flight</label>
                            <div className="font-mono text-xl font-bold">{data.flight}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block">From</label>
                            <div className="text-2xl font-black">{data.from}</div>
                        </div>
                        <div className="flex items-center justify-center opacity-30">✈</div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block">To</label>
                            <div className="text-2xl font-black">{data.to}</div>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-8">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block">Date</label>
                            <div>{data.date}</div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold block">Time</label>
                            <div>{data.boardingTime}</div>
                        </div>
                        <div> // Gate not passed, mock
                            <label className="text-[10px] text-gray-500 uppercase font-bold block">Gate</label>
                            <div>--</div>
                        </div>
                    </div>
                </div>

                {/* Stub Section (Perforated) */}
                <div className="w-24 border-l-2 border-dashed border-gray-400 bg-gray-50 p-4 flex flex-col justify-center items-center relative">
                    {/* Holes */}
                    <div className="absolute -left-1.5 top-0 bottom-0 w-3 flex flex-col justify-between py-2 pointer-events-none">
                        {[...Array(10)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-white mb-2"></div>)}
                    </div>

                    <div className="rotate-90 whitespace-nowrap font-bold text-2xl tracking-widest text-gray-800 origin-center translate-y-12">
                        {data.seat}
                    </div>
                    <label className="absolute bottom-4 text-xs font-bold">SEAT</label>

                    {/* Barcode Mock */}
                    <div className="absolute top-4 w-16 h-48 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/UPC-A-036000291452.svg/1200px-UPC-A-036000291452.svg.png')] bg-cover opacity-80 mix-blend-multiply rotate-180"></div>
                </div>
            </div>
        </div>
    );
};
