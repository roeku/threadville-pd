import React from 'react';

// News Clipping Template
// Style: Newspaper column, serif font, justified text, aging.

interface NewsClippingProps {
    data: {
        headline: string;
        subheadline?: string;
        byline: string;
        date: string;
        location?: string;
        lead?: string;
        body: string;
        photoCaption?: string;
        edition?: string;
    };
}

export const NewsClippingTemplate: React.FC<NewsClippingProps> = ({ data }) => {
    return (
        <div className="document-page w-[816px] h-[1056px] relative p-12 flex justify-center items-start bg-transparent">
            {/* Clipping Container */}
            <div className="w-[500px] min-h-[700px] bg-[#fdf6e3] text-black shadow-xl p-8 relative overflow-hidden transform rotate-1">

                {/* Texture: Newspaper dot matrix or grain */}
                <div className="absolute inset-0 pointer-events-none opacity-80 bg-[url('/textures/documents/newsprint.png')] bg-cover mix-blend-multiply"></div>
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-noise mix-blend-overlay"></div>

                {/* Header */}
                <div className="border-b-4 border-black pb-3 mb-4 text-center">
                    <h2 className="uppercase font-black text-xs tracking-[0.3em] text-gray-500 mb-1">The Threadville Daily Chronicle</h2>
                    <div className="border-t border-b border-gray-400 py-1 text-[10px] flex justify-between font-serif italic text-gray-600">
                        <span>{data.date}</span>
                        <span>{data.edition || 'Morning Edition'} • Price: 10p</span>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="font-serif font-black text-3xl leading-tight mb-2 text-center capitalize">
                    {data.headline}
                </h1>
                {data.subheadline && (
                    <h2 className="font-serif font-semibold text-lg leading-snug mb-4 text-center text-gray-700">
                        {data.subheadline}
                    </h2>
                )}

                {/* Byline */}
                <div className="flex items-center justify-center mb-6">
                    <div className="border-t border-black w-8 mr-2"></div>
                    <div className="font-sans font-bold text-xs uppercase tracking-wider">
                        {data.byline}
                        {data.location && <span className="font-normal text-gray-500 ml-1">— {data.location}</span>}
                    </div>
                    <div className="border-t border-black w-8 ml-2"></div>
                </div>

                {/* Lead Paragraph (if provided) */}
                {data.lead && (
                    <div className="font-serif text-base leading-snug text-justify mb-4 font-semibold">
                        <span className="float-left text-5xl mr-3 mt-[-8px] font-black leading-none">{data.lead.charAt(0)}</span>
                        {data.lead.substring(1)}
                    </div>
                )}

                {/* Body Columns */}
                <div className="font-serif text-sm leading-tight text-justify columns-2 gap-6">
                    {!data.lead && <span className="float-left text-5xl mr-3 mt-[-8px] font-black leading-none">{data.body.charAt(0)}</span>}
                    {data.lead ? data.body : data.body.substring(1)}
                </div>
                
                {data.photoCaption && (
                    <div className="mt-6 text-xs italic text-gray-600 border-t border-gray-400 pt-2">
                        <span className="font-bold">Photo:</span> {data.photoCaption}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="opacity-70 italic text-xs">
                        (Continued on Page 4)
                    </p>
                </div>
            </div>
        </div>
    );
};
