import React, { useState } from 'react';
import { GeneratedDocument, DocumentType } from './types';
import { generateDocumentContent } from './services/geminiService';
import { documentRenderer } from './services/documentRenderer';
import { getDocumentComponent, DOCUMENT_REGISTRY } from './services/documentRegistry';
import { DocumentForm } from './components/DocumentForm';
import { ThreeScene } from './components/ThreeScene';

const App: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<GeneratedDocument | null>(null);
  const [history, setHistory] = useState<GeneratedDocument[]>([]);

  const handleGenerate = async (type: DocumentType, context: string) => {
    setIsGenerating(true);
    try {
      // 1. Get Config
      const config = DOCUMENT_REGISTRY[type];
      
      // 2. Generate Content via Gemini
      const data = await generateDocumentContent(type, context);
      
      // 3. Render content to Texture (Image Data URL)
      // Use registry to get the correct component
      const template = getDocumentComponent(type, data);
      
      // Pass the specific dimensions from config
      // Now returns an Array of strings (pages)
      const textureUrls = await documentRenderer.renderToTextures(
          template, 
          config.width, 
          config.height
      );

      const newDoc: GeneratedDocument = {
        id: crypto.randomUUID(),
        type,
        data,
        textureUrls, // Array
        aspectRatio: config.width / config.height,
        createdAt: Date.now(),
      };

      setCurrentDoc(newDoc);
      setHistory(prev => [newDoc, ...prev]);

    } catch (error) {
      console.error("Failed to generate document:", error);
      alert("Failed to generate document. Please check console and API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHistorySelect = (doc: GeneratedDocument) => {
    setCurrentDoc(doc);
  };

  // Helper to get display name from history data (handles different schemas)
  const getDocDisplayName = (doc: GeneratedDocument) => {
      const data = doc.data as any;
      if (data.title) return data.title;
      if (data.decedentName) return `Autopsy: ${data.decedentName}`;
      if (data.targetAddress) return `Warrant: ${data.targetAddress}`;
      return DOCUMENT_REGISTRY[doc.type]?.label || doc.type;
  };

  return (
    <div className="flex h-screen w-full bg-[#121212] text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar: Controls & History */}
      <aside className="w-96 flex flex-col border-r border-gray-800 bg-[#1a1a1a]">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Cold Case<span className="text-blue-500">Gen</span></h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Procedural Document System</p>
        </div>

        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <DocumentForm onGenerate={handleGenerate} isGenerating={isGenerating} />

          <div className="mt-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 px-1">Recent Documents</h3>
            <div className="space-y-2">
              {history.length === 0 && (
                <p className="text-sm text-gray-600 italic px-2">No documents generated yet.</p>
              )}
              {history.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => handleHistorySelect(doc)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-sm group
                    ${currentDoc?.id === doc.id 
                      ? 'bg-blue-900/30 border-blue-500 text-blue-100' 
                      : 'bg-gray-800/50 border-transparent text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs uppercase tracking-wide bg-black/30 px-1.5 py-0.5 rounded">
                      {DOCUMENT_REGISTRY[doc.type]?.label || 'DOC'}
                    </span>
                    <span className="text-[10px] opacity-50">
                      {new Date(doc.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="truncate font-medium">
                    {getDocDisplayName(doc)}
                  </div>
                  {doc.textureUrls.length > 1 && (
                     <div className="text-[10px] text-blue-400 mt-1">{doc.textureUrls.length} Pages</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content: 3D Preview */}
      <main className="flex-1 relative flex flex-col h-full">
        {/* Toolbar / Header for Main View */}
        <div className="h-16 border-b border-gray-800 bg-[#121212] flex items-center justify-between px-6">
           <div className="flex items-center gap-3">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-sm font-medium text-gray-300">Live 3D Preview</span>
           </div>
           {currentDoc && (
             <div className="flex gap-2">
                 {currentDoc.textureUrls.map((url, i) => (
                    <a 
                    key={i}
                    href={url} 
                    download={`document-${currentDoc.id}-page${i+1}.png`}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Pg {i+1}
                    </a>
                 ))}
             </div>
           )}
        </div>

        {/* 3D Canvas Container */}
        <div className="flex-1 bg-black p-4 relative">
            <ThreeScene 
                textureUrls={currentDoc?.textureUrls || null} 
                aspectRatio={currentDoc?.aspectRatio || (816/1056)}
            />
        </div>
      </main>
    </div>
  );
};

export default App;