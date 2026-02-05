import React from 'react';
import { Html } from '@react-three/drei';
import { LinkType } from '../../types/deduction';
import { X } from 'lucide-react';

interface Props {
    position: [number, number, number];
    onSelect: (type: LinkType) => void;
    onClose: () => void;
}

const RadialMenu: React.FC<Props> = ({ position, onSelect, onClose }) => {

    const options = [
        { type: LinkType.MATCHES, label: 'MATCH', sub: 'Confirm Connection', color: '#b91c1c', bg: '#fee2e2', rotate: '-2deg', translate: 'translate(0, -90px)' }, // Top
        { type: LinkType.CONTRADICTS, label: 'CLASH', sub: 'Mark Contradiction', color: '#1d4ed8', bg: '#dbeafe', rotate: '2deg', translate: 'translate(90px, 0)' },   // Right
        { type: LinkType.MOTIVATES, label: 'MOTIVE', sub: 'Indicate Motive', color: '#7e22ce', bg: '#f3e8ff', rotate: '-1deg', translate: 'translate(0, 90px)' },  // Bottom
        { type: LinkType.LOCATES, label: 'PLACE', sub: 'Track Location', color: '#15803d', bg: '#dcfce7', rotate: '3deg', translate: 'translate(-90px, 0)' },  // Left
    ];

    return (
        <Html position={position} center zIndexRange={[100, 0]} className="pointer-events-none">

            <div className="relative w-[300px] h-[300px] flex items-center justify-center pointer-events-none select-none">
                <div className="pointer-events-auto relative w-full h-full flex items-center justify-center">

                    {/* Instructions - Diegetic "Thought" */}
                    <div className="absolute -top-16 text-center w-64 opacity-90">
                        <span className="text-white px-2 py-1 font-typewriter text-xs tracking-widest uppercase">Select Connection Type</span>
                    </div>

                    {/* Center Cancel - Styled as a Scribble */}
                    <button
                        onClick={onClose}
                        className="absolute z-20 w-12 h-12 flex items-center justify-center group transition-transform duration-200 hover:scale-110 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-[#f2efe7] rounded-full shadow-md border border-[#d6d3cb]" />
                        <X size={24} className="relative text-gray-800 opacity-60 group-hover:opacity-100 group-hover:text-red-900" strokeWidth={3} />
                    </button>

                    {/* Radial Paper Scraps */}
                    {options.map((opt, i) => {
                        return (
                            <button
                                key={opt.type}
                                onClick={(e) => { e.stopPropagation(); onSelect(opt.type); }}
                                style={{
                                    transform: opt.translate,
                                }}
                                className="absolute group flex flex-col items-center justify-center transition-all duration-300 hover:z-50 hover:scale-110"
                            >
                                {/* The "Paper" visual */}
                                <div
                                    className="w-24 h-20 shadow-lg border border-gray-300 bg-[#fbfbf8] flex flex-col items-center justify-center p-2 relative overflow-hidden transition-colors"
                                    style={{
                                        transform: `rotate(${opt.rotate})`,
                                        clipPath: 'polygon(2% 2%, 98% 0%, 100% 95%, 0% 100%)' // Subtle irregularity
                                    }}
                                >
                                    {/* Colored "Tape" or "Marker" header */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1 opacity-80"
                                        style={{ backgroundColor: opt.color }}
                                    />

                                    {/* Ink Stamp Text */}
                                    <span
                                        className="font-black text-xl tracking-tighter uppercase"
                                        style={{
                                            color: opt.color,
                                            fontFamily: '"Courier New", Courier, monospace',
                                            transform: 'rotate(-1deg)'
                                        }}
                                    >
                                        {opt.label}
                                    </span>

                                    {/* Subtitle */}
                                    <span className="text-[9px] text-gray-500 font-sans uppercase tracking-wide mt-1 text-center leading-tight">
                                        {opt.sub}
                                    </span>

                                    {/* Paper Texture Overlay */}
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-30 mix-blend-multiply pointer-events-none" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </Html>
    );
};

export default React.memo(RadialMenu);
