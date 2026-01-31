import React from 'react';
import { Html } from '@react-three/drei';
import { LinkType } from '../../types/deduction';
import { Target, XCircle, Link, MessageSquare } from 'lucide-react';

interface Props {
    position: [number, number, number];
    onSelect: (type: LinkType) => void;
    onClose: () => void;
}

const RadialMenu: React.FC<Props> = ({ position, onSelect, onClose }) => {

    const options = [
        { type: LinkType.MATCHES, label: 'MATCHES', color: 'bg-red-500', icon: <Link size={16} /> },
        { type: LinkType.CONTRADICTS, label: 'CONTRADICTS', color: 'bg-blue-500', icon: <XCircle size={16} /> },
        { type: LinkType.MOTIVATES, label: 'MOTIVATES', color: 'bg-purple-500', icon: <Target size={16} /> },
        { type: LinkType.LOCATES, label: 'LOCATES', color: 'bg-green-500', icon: <MessageSquare size={16} /> },
    ];

    return (
        <Html position={position} center zIndexRange={[100, 0]}>
            <div className="relative w-48 h-48 flex items-center justify-center animate-in fade-in zoom-in duration-200 pointer-events-none select-none">
                {/* Pointer events auto on children */}
                <div className="pointer-events-auto">
                    {/* Center Cancel */}
                    <button
                        onClick={onClose}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border-2 border-white/20 text-white flex items-center justify-center hover:bg-gray-700 z-20"
                    >
                        <XCircle size={24} />
                    </button>

                    {/* Radial Options */}
                    {options.map((opt, i) => {
                        const angle = (i * 90) * (Math.PI / 180);
                        const radius = 80; // px
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;

                        return (
                            <button
                                key={opt.type}
                                onClick={(e) => { e.stopPropagation(); onSelect(opt.type); }}
                                style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`, left: '50%', top: '50%' }}
                                className={`absolute w-16 h-16 rounded-full ${opt.color} border-2 border-white shadow-lg flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 hover:scale-110 transition pointer-events-auto`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </Html>
    );
};

export default RadialMenu;
