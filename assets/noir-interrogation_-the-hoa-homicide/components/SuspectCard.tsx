import React from 'react';
import { Suspect } from '../types';

interface SuspectCardProps {
  suspect: Suspect;
  isSelected: boolean;
  onSelect: (suspect: Suspect) => void;
}

export const SuspectCard: React.FC<SuspectCardProps> = ({ suspect, isSelected, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(suspect)}
      className={`
        relative cursor-pointer transition-all duration-300 group
        ${isSelected ? 'ring-2 ring-noir-accent scale-105 z-10' : 'hover:scale-105 opacity-80 hover:opacity-100'}
      `}
    >
      {/* Photo Frame */}
      <div className="relative bg-noir-paper p-2 shadow-xl rotate-1 group-hover:rotate-0 transition-transform">
        <div className="aspect-[4/5] overflow-hidden grayscale contrast-125 border border-noir-800">
          <img 
            src={suspect.photoUrl} 
            alt={suspect.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Tape Label */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-100/90 text-noir-900 px-4 py-1 shadow-md transform -rotate-2">
           <span className="font-display font-bold text-sm tracking-widest text-red-900">SUSPECT</span>
        </div>

        <div className="mt-3 text-center">
          <h3 className="font-mono font-bold text-noir-900 text-lg uppercase tracking-tighter">{suspect.name}</h3>
          <p className="font-mono text-xs text-noir-700 leading-tight mt-1 line-clamp-2">{suspect.notes}</p>
        </div>
      </div>
    </div>
  );
};