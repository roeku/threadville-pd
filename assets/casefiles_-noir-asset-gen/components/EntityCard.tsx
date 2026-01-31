import React, { useState } from 'react';
import { CaseEntity, EntityType } from '../types';
import { constructPrompt } from '../constants';
import { generateAssetImage, editAssetImage } from '../services/geminiService';
import { 
  CameraIcon, 
  PencilIcon, 
  ArrowPathIcon, 
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

interface EntityCardProps {
  entity: CaseEntity;
  onUpdate: (updatedEntity: CaseEntity) => void;
}

const EntityCard: React.FC<EntityCardProps> = ({ entity, onUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canGenerate = entity.type !== EntityType.EVIDENCE_PAPER;

  const handleGenerate = async () => {
    const prompt = constructPrompt(entity);
    if (!prompt) return;

    setIsProcessing(true);
    setError(null);
    try {
      const imageUrl = await generateAssetImage(prompt);
      onUpdate({ ...entity, imageUrl });
    } catch (err: any) {
      setError("Failed to generate asset. Check API Key.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!entity.imageUrl || !editPrompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      const newImageUrl = await editAssetImage(entity.imageUrl, editPrompt);
      onUpdate({ ...entity, imageUrl: newImageUrl });
      setEditMode(false);
      setEditPrompt('');
    } catch (err: any) {
      setError("Failed to edit asset.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-noir-800 border border-noir-600 p-4 rounded-sm shadow-lg flex flex-col gap-4 relative overflow-hidden group hover:border-noir-accent transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-mono text-noir-accent uppercase tracking-widest opacity-80">
            {entity.type.replace('EVIDENCE_', '')}
          </span>
          <h3 className="text-xl font-bold font-sans text-noir-paper">{entity.name}</h3>
        </div>
        <div className="text-noir-600">
            {entity.type === EntityType.SUSPECT && <span className="text-2xl">👤</span>}
            {entity.type === EntityType.EVIDENCE_OBJECT && <span className="text-2xl">📦</span>}
            {entity.type === EntityType.EVIDENCE_PHOTO && <PhotoIcon className="w-6 h-6" />}
            {entity.type === EntityType.EVIDENCE_PAPER && <DocumentIcon className="w-6 h-6" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <p className="text-sm text-gray-400 leading-relaxed font-mono">{entity.description}</p>
        {entity.notes && (
            <div className="bg-noir-900/50 p-2 text-xs border-l-2 border-noir-600 text-gray-500 font-mono">
                NOTES: {entity.notes}
            </div>
        )}
         {entity.metadata.location && (
            <div className="text-xs text-noir-accent/80 font-mono mt-2">
                LOC: {entity.metadata.location}
            </div>
        )}
      </div>

      {/* Image Area */}
      <div className="relative mt-4 bg-noir-900 w-full aspect-video rounded-sm border border-noir-700 flex items-center justify-center overflow-hidden">
        {entity.imageUrl ? (
          <>
            <img 
                src={entity.imageUrl} 
                alt={entity.name} 
                className="w-full h-full object-cover"
            />
            {/* Edit Overlay */}
            {!editMode && !isProcessing && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                    <button 
                        onClick={() => setEditMode(true)}
                        className="bg-noir-paper text-noir-900 px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-white"
                    >
                        <PencilIcon className="w-4 h-4" /> Edit Image
                    </button>
                </div>
            )}
          </>
        ) : (
            <div className="text-center p-6 opacity-40">
                {canGenerate ? (
                   <div className="flex flex-col items-center">
                        <PhotoIcon className="w-12 h-12 mb-2" />
                        <span className="text-xs font-mono">NO ASSET FOUND</span>
                   </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <DocumentIcon className="w-12 h-12 mb-2" />
                        <span className="text-xs font-mono">DOCUMENT ONLY</span>
                    </div>
                )}
            </div>
        )}

        {/* Loading Overlay */}
        {isProcessing && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-noir-accent"></div>
            </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-2 min-h-[40px]">
        {error && <p className="text-xs text-red-500 mb-2 font-mono">{error}</p>}
        
        {editMode ? (
            <div className="flex flex-col gap-2 animate-fadeIn">
                <input 
                    type="text" 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="E.g., 'Make it snow', 'Add bloodstain'..."
                    className="w-full bg-noir-900 border border-noir-600 rounded px-3 py-2 text-sm focus:border-noir-accent focus:outline-none text-white font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                />
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => setEditMode(false)}
                        className="text-xs text-gray-400 hover:text-white"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handleEdit}
                        disabled={!editPrompt.trim()}
                        className="text-xs bg-noir-accent text-white px-3 py-1 rounded hover:bg-orange-600 disabled:opacity-50"
                    >
                        GENERATE EDIT
                    </button>
                </div>
            </div>
        ) : (
             canGenerate && !entity.imageUrl && (
                <button 
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="w-full py-2 border border-noir-600 hover:border-noir-accent hover:text-noir-accent text-gray-400 text-sm font-mono tracking-wider transition-all flex items-center justify-center gap-2"
                >
                    {isProcessing ? 'GENERATING...' : (
                        <>
                            <CameraIcon className="w-4 h-4" /> GENERATE ASSET
                        </>
                    )}
                </button>
            )
        )}
      </div>
    </div>
  );
};

export default EntityCard;