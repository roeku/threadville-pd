import React from 'react';
import { FileText, Image as ImageIcon, Music, Film } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const EvidenceBoard: React.FC = () => {
  const { openApp } = useOS();

  const files = [
    { name: 'DNA_Sample_049.seq', type: 'dna', icon: <FileText className="text-blue-400" /> },
    { name: 'Print_Lift_Kitchen.img', type: 'fingerprint', icon: <ImageIcon className="text-purple-400" /> },
    { name: 'Tox_Report_Vial_B.wav', type: 'spectrograph', icon: <Music className="text-green-400" /> },
    { name: 'CCTV_Lobby.mp4', type: 'video', icon: <Film className="text-red-400" /> },
    { name: 'Suspect_Profile.txt', type: 'text', icon: <FileText className="text-slate-400" /> },
  ];

  const handleOpen = (type: string) => {
    if (type === 'dna') openApp('dna');
    if (type === 'fingerprint') openApp('fingerprint');
    if (type === 'spectrograph') openApp('spectrograph');
  };

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4">
        {files.map((file, i) => (
          <div 
            key={i}
            onDoubleClick={() => handleOpen(file.type)}
            className="flex flex-col items-center p-2 hover:bg-slate-700/50 rounded cursor-pointer border border-transparent hover:border-slate-600 transition-colors group"
          >
            <div className="w-10 h-10 mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
              {React.cloneElement(file.icon as React.ReactElement<any>, { size: 32 })}
            </div>
            <span className="text-[11px] text-center leading-tight w-full break-words line-clamp-2 text-slate-300 font-sans group-hover:text-white">
              {file.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};