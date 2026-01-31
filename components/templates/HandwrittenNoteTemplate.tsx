import React from 'react';

// Handwritten Note Template
// Style: Lined paper or notepad, handwriting font.

interface HandwrittenNoteProps {
    data: {
        author: string;
        body: string;
        date?: string;
    };
}

export const HandwrittenNoteTemplate: React.FC<HandwrittenNoteProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] relative bg-[#fefcea] text-blue-900 font-handwriting p-0 flex flex-col">
            {/* Background: Lined Paper */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/textures/documents/lined_paper.png')] bg-cover opacity-60 mix-blend-multiply"></div>

            {/* Margin Line */}
            <div className="absolute top-0 bottom-0 left-[80px] w-0.5 bg-red-300 opacity-60"></div>

            {/* Holes */}
            <div className="absolute top-0 bottom-0 left-[20px] w-[40px] flex flex-col justify-evenly py-8">
                <div className="w-4 h-4 rounded-full bg-gray-800 opacity-10"></div>
                <div className="w-4 h-4 rounded-full bg-gray-800 opacity-10"></div>
                <div className="w-4 h-4 rounded-full bg-gray-800 opacity-10"></div>
            </div>

            {/* Content Container (respecting lines) */}
            <div className="relative z-10 pl-[100px] pr-[50px] pt-[45px] text-2xl leading-[32px]">
                {data.date && (
                    <div className="text-right mb-4 opacity-80">{data.date}</div>
                )}
                <div className="whitespace-pre-wrap">
                    {data.body}
                </div>

                <div className="mt-8 text-right pr-12">
                    - {data.author}
                </div>
            </div>

            {/* Stains/Wrinkles */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('/textures/documents/paper_plain_2.png')] bg-cover mix-blend-multiply"></div>
        </div>
    );
};
