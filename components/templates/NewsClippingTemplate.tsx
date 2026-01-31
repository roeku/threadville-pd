import React from 'react';

// News Clipping Template
// Style: Newspaper column, serif font, justified text, aging.

interface NewsClippingProps {
    data: {
        headline: string;
        byline: string;
        date: string;
        body: string;
    };
}

export const NewsClippingTemplate: React.FC<NewsClippingProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] relative p-16 flex justify-center items-start bg-transparent">
            {/* Clipping Container */}
            <div className="w-[400px] min-h-[600px] bg-[#fdf6e3] text-black shadow-xl p-6 relative overflow-hidden transform rotate-1">

                {/* Texture: Newspaper dot matrix or grain */}
                <div className="absolute inset-0 pointer-events-none opacity-80 bg-[url('/textures/documents/newsprint.png')] bg-cover mix-blend-multiply"></div>
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-noise mix-blend-overlay"></div>

                {/* Header */}
                <div className="border-b-4 border-black pb-2 mb-2 text-center">
                    <h2 className="uppercase font-black text-xs tracking-widest text-gray-500 mb-1">The Threadville Daily Chronicle</h2>
                    <div className="border-t border-b border-gray-400 py-1 text-[10px] flex justify-between font-serif italic text-gray-600">
                        <span>{data.date}</span>
                        <span>Price: 10p</span>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="font-serif font-black text-3xl leading-tight mb-4 text-center capitalize">
                    {data.headline}
                </h1>

                {/* Byline */}
                <div className="flex items-center justify-center mb-6">
                    <div className="border-t border-black w-8 mr-2"></div>
                    <div className="font-sans font-bold text-xs uppercase tracking-wider">{data.byline}</div>
                    <div className="border-t border-black w-8 ml-2"></div>
                </div>

                {/* Columns */}
                <div className="font-serif text-sm leading-tight text-justify columns-1 gap-4">
                    <span className="float-left text-4xl mr-2 mt-[-6px] font-black">{data.body.charAt(0)}</span>
                    {data.body.substring(1)}

                    {/* Filler text to look like a full article if body is short */}
                    <br /><br />
                    <p className="opacity-80 italic">
                        (Continued on Page 4)
                    </p>
                </div>

                {/* Torn Edge Effect (Visual Only) - would need alpha mask for real non-rect */}
                {/* For now, just a border effect */}
            </div>
        </div>
    );
};
