import React, { useState } from 'react';
import { DocumentType, DocumentCategory } from '../types';
import { DOCUMENT_REGISTRY } from '../services/documentRegistry';

interface Props {
  onGenerate: (type: DocumentType, context: string) => void;
  isGenerating: boolean;
}

export const DocumentForm: React.FC<Props> = ({ onGenerate, isGenerating }) => {
  const [selectedType, setSelectedType] = useState<DocumentType>(DocumentType.AUTOPSY_REPORT);
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!context.trim()) return;
    onGenerate(selectedType, context);
  };

  // Group types by category
  const groupedTypes = Object.values(DOCUMENT_REGISTRY).reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<DocumentCategory, typeof DOCUMENT_REGISTRY[DocumentType][]>);

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <span className="text-blue-400">⚡</span> Generator Control
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Document Type</label>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocumentType)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none custom-scrollbar"
            disabled={isGenerating}
          >
            {Object.entries(groupedTypes).map(([category, configs]) => (
                <optgroup key={category} label={category}>
                    {configs.map(config => (
                        <option key={config.type} value={config.type}>
                            {config.label}
                        </option>
                    ))}
                </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Context / Prompt</label>
          <textarea 
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe the crime scene, suspect, evidence, or specific details for this document..."
            className="w-full h-32 bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            disabled={isGenerating}
          />
        </div>

        <button 
          type="submit"
          disabled={isGenerating || !context.trim()}
          className={`w-full py-3 px-4 rounded font-bold text-white transition-all
            ${isGenerating 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 shadow-lg shadow-blue-900/50'
            }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : 'Generate Document'}
        </button>
      </form>
    </div>
  );
};
