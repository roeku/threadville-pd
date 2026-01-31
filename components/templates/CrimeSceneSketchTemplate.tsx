import React from 'react';

// Crime Scene Sketch Template
// Style: Graph paper background, simple SVG or lines, architectural look.

interface CrimeSceneSketchProps {
    data: {
        location: string;
        sketchNotes: string;
        legend: string[];
        measurements: string[];
    };
}

export const CrimeSceneSketchTemplate: React.FC<CrimeSceneSketchProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] relative bg-white text-black p-12 flex flex-col">
            {/* Graph Paper Grid */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/textures/documents/grid_paper.png')] bg-cover opacity-50 mix-blend-multiply"></div>

            {/* Header */}
            <div className="relative z-10 border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold uppercase">Crime Scene Sketch</h1>
                    <div className="text-sm font-mono">{data.location}</div>
                </div>
                <div className="text-right text-xs">
                    <div>Scale: 1:50</div>
                    <div>Ref: SK-74-09</div>
                </div>
            </div>

            {/* Sketch Area (Placeholder Visualization) */}
            <div className="flex-1 relative border-2 border-black bg-white bg-opacity-50 m-4 shadow-sm">
                {/* Room Outline */}
                <div className="absolute top-[10%] left-[10%] w-[80%] h-[60%] border-4 border-black"></div>

                {/* Door */}
                <div className="absolute top-[70%] left-[40%] w-[20%] h-4 bg-white border-l-4 border-r-4 border-black"></div>
                <div className="absolute top-[72%] left-[40%] w-[10%] h-[15%] border-r-2 border-dashed border-black rounded-tr-full transform origin-bottom-left"></div>

                {/* Window */}
                <div className="absolute top-[10%] left-[30%] w-[40%] h-2 bg-white -mt-1 border-2 border-black"></div>

                {/* Objects (Rough Representations) */}
                {/* Desk */}
                <div className="absolute top-[25%] left-[35%] w-[30%] h-[20%] border-2 border-gray-600 bg-gray-100 flex items-center justify-center font-bold">DESK</div>

                {/* Body Marker */}
                <div className="absolute top-[50%] left-[50%] w-16 h-8 border-2 border-red-500 rounded-full flex items-center justify-center text-red-600 text-xs font-bold transform rotate-45">
                    BODY (A)
                </div>

                {/* Safe */}
                <div className="absolute top-[15%] left-[85%] w-8 h-8 bg-gray-300 border border-black flex items-center justify-center text-[10px]">SAFE</div>
            </div>

            {/* Footer Info: Legend & Measurements */}
            <div className="relative z-10 grid grid-cols-2 gap-8 border-t-2 border-black pt-4 h-[250px]">
                <div className="bg-gray-50 border border-gray-300 p-4">
                    <h3 className="font-bold underline mb-2 uppercase text-xs">Legend</h3>
                    <ul className="text-sm font-handwriting list-disc pl-4">
                        {data.legend.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div className="bg-gray-50 border border-gray-300 p-4">
                    <h3 className="font-bold underline mb-2 uppercase text-xs">Measurements / Notes</h3>
                    <div className="text-sm font-handwriting mb-2">{data.sketchNotes}</div>
                    <ul className="text-sm font-mono list-decimal pl-4">
                        {data.measurements.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};
