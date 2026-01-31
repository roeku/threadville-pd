import React, { useState } from 'react';
import { CaseFile, EntityType, CaseEntity } from './types';
import EntityCard from './components/EntityCard';
import { generateCaseBlueprint, generateHighVolumeData, generateAssetImage } from './services/geminiService';
import { constructPrompt } from './constants';
import { ArchiveBoxIcon, FolderOpenIcon, ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Initial Mock Data from Spec
const INITIAL_CASE: CaseFile = {
  id: 'CF-2025-001',
  title: 'The Midnight Paradox',
  briefing: 'A prominent doctor found dead in his private library. The room was locked from the inside. No weapon found, but strange traces of residue.',
  entities: [
    {
      id: 'suspect-1',
      type: EntityType.SUSPECT,
      name: 'Godfrey Holloway',
      description: "The victim's personal physician. Known history of gambling debts.",
      notes: "His hands are shaking. There is a smudge of ink on his left cuff.",
      visualTags: "middle aged, nervous sweat, tweed suit, ink stain on cuff",
      metadata: { location: "Library Holding Area" }
    },
    {
      id: 'obj-1',
      type: EntityType.EVIDENCE_OBJECT,
      name: 'Bronze Paperweight',
      description: "A heavy, spherical object found buried in the snow outside the window.",
      visualTags: "bronze, heavy, spherical, snowy, fingerprint smudges",
      metadata: { location: "Manor Garden (Buried)" }
    },
    {
      id: 'photo-1',
      type: EntityType.EVIDENCE_PHOTO,
      name: 'Crime Scene Overview',
      description: "The victim's desk, scattered with papers. A spilled glass of brandy on the corner.",
      visualTags: "messy desk, spilled brandy, scattered papers, blood droplets",
      metadata: { location: "Private Library" }
    },
    {
      id: 'doc-1',
      type: EntityType.EVIDENCE_PAPER,
      name: 'Patient Log',
      description: "A list of appointments from the day of the murder. Several names are redacted.",
      metadata: { location: "Desk Drawer" }
    }
  ]
};

const App: React.FC = () => {
  const [caseFile, setCaseFile] = useState<CaseFile>(INITIAL_CASE);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  const handleUpdateEntity = (updatedEntity: CaseEntity) => {
    setCaseFile(prev => ({
      ...prev,
      entities: prev.entities.map(e => e.id === updatedEntity.id ? updatedEntity : e)
    }));
  };

  const handleGenerateFullCase = async () => {
    setIsGeneratingCase(true);
    setGenerationStep('Constructing Case Blueprint (Logic & Narrative)...');
    
    try {
      // 1. Generate Blueprint
      const blueprint = await generateCaseBlueprint();
      setCaseFile(blueprint);
      
      // 2. Hydrate & Generate Assets
      const totalEntities = blueprint.entities.length;
      let processed = 0;

      // Create a mutable copy to update iteratively
      let currentEntities = [...blueprint.entities];

      // Process entities in parallel but with limits or just simple mapping
      // We'll update state as we go to show progress
      const promises = currentEntities.map(async (entity) => {
        let updatedEntity = { ...entity };

        // A. Generate High Volume Data (Text)
        if (entity.metadata.templateId && ['bank-statement', 'call-log'].includes(entity.metadata.templateId)) {
             try {
                setGenerationStep(`Generating Evidence Data: ${entity.name}...`);
                const data = await generateHighVolumeData(entity.metadata.templateId, blueprint.briefing);
                updatedEntity.metadata.fields = data;
                updatedEntity.content = "Detailed record generated. Check metadata.";
             } catch (e) {
                 console.error(`Failed to generate text data for ${entity.name}`, e);
             }
        }

        // B. Generate Image (Visuals)
        // Auto-generate images for Suspects and Objects/Photos
        if ([EntityType.SUSPECT, EntityType.EVIDENCE_OBJECT, EntityType.EVIDENCE_PHOTO, EntityType.FORENSIC_SAMPLE].includes(entity.type)) {
            try {
                // Determine step message
                setGenerationStep(`Rendering Asset: ${entity.name}...`);
                const prompt = constructPrompt(updatedEntity);
                if (prompt) {
                    updatedEntity.isGenerating = true;
                    // Trigger state update to show spinner on card
                    setCaseFile(prev => ({
                        ...prev,
                        entities: prev.entities.map(e => e.id === updatedEntity.id ? updatedEntity : e)
                    }));

                    const imageUrl = await generateAssetImage(prompt);
                    updatedEntity.imageUrl = imageUrl;
                    updatedEntity.isGenerating = false;
                }
            } catch (e) {
                console.error(`Failed to generate image for ${entity.name}`, e);
                updatedEntity.isGenerating = false;
            }
        }
        
        // Update the main state with the fully processed entity
        setCaseFile(prev => ({
            ...prev,
            entities: prev.entities.map(e => e.id === updatedEntity.id ? updatedEntity : e)
        }));
        
        processed++;
      });

      await Promise.all(promises);
      setGenerationStep('Case Generation Complete.');

    } catch (error) {
      console.error("Critical failure in case generation", error);
      alert("Failed to generate case. Please check API Key and limits.");
    } finally {
      setIsGeneratingCase(false);
      setGenerationStep('');
    }
  };

  const suspects = caseFile.entities.filter(e => e.type === EntityType.SUSPECT);
  const evidence = caseFile.entities.filter(e => e.type !== EntityType.SUSPECT);

  return (
    <div className="min-h-screen bg-noir-900 text-noir-paper font-sans selection:bg-noir-accent selection:text-white">
        
        {/* Navigation / Header */}
        <header className="border-b border-noir-700 bg-noir-900 sticky top-0 z-50 shadow-2xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-noir-accent w-10 h-10 flex items-center justify-center rounded-sm text-white font-bold text-lg shadow-glow">
                        CF
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">{caseFile.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-noir-600 font-mono">
                            <span>CASE ID: {caseFile.id}</span>
                            <span>•</span>
                            <span className="text-green-500 uppercase tracking-wider">Active Investigation</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {isGeneratingCase ? (
                        <div className="flex items-center gap-3 text-noir-accent animate-pulse font-mono text-xs">
                             <ArrowPathIcon className="w-4 h-4 animate-spin" />
                             {generationStep}
                        </div>
                    ) : (
                        <button 
                            onClick={handleGenerateFullCase}
                            className="bg-noir-800 hover:bg-noir-700 border border-noir-600 hover:border-noir-accent text-white px-4 py-2 rounded-sm text-sm font-mono flex items-center gap-2 transition-all"
                        >
                            <SparklesIcon className="w-4 h-4 text-noir-accent" />
                            GENERATE NEW CASE
                        </button>
                    )}
                </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
            
            {/* Briefing Section */}
            <section className="mb-12 bg-gradient-to-r from-noir-800 to-transparent p-6 border-l-4 border-noir-accent rounded-r-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ArchiveBoxIcon className="w-24 h-24 text-noir-accent" />
                </div>
                <h2 className="text-xs font-mono text-noir-accent mb-2 uppercase tracking-widest">Case Briefing</h2>
                <p className="text-lg leading-relaxed text-gray-300 max-w-4xl font-light">
                    {caseFile.briefing}
                </p>
                {caseFile.visualTheme && (
                     <div className="mt-4 flex gap-2">
                        <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-gray-500 border border-noir-700">
                            THEME: {caseFile.visualTheme}
                        </span>
                     </div>
                )}
            </section>

            {/* Suspects Grid */}
            <section className="mb-12">
                <div className="flex items-center gap-3 mb-6 border-b border-noir-700 pb-2">
                    <h2 className="text-xl font-bold text-white tracking-wide">Suspects</h2>
                    <span className="bg-noir-700 px-2 py-0.5 rounded-full text-xs font-mono text-gray-400">{suspects.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suspects.map(entity => (
                        <EntityCard 
                            key={entity.id} 
                            entity={entity} 
                            onUpdate={handleUpdateEntity} 
                        />
                    ))}
                </div>
            </section>

            {/* Evidence Grid */}
            <section className="mb-12">
                <div className="flex items-center gap-3 mb-6 border-b border-noir-700 pb-2">
                    <h2 className="text-xl font-bold text-white tracking-wide">Evidence & Objects</h2>
                    <span className="bg-noir-700 px-2 py-0.5 rounded-full text-xs font-mono text-gray-400">{evidence.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {evidence.map(entity => (
                        <EntityCard 
                            key={entity.id} 
                            entity={entity} 
                            onUpdate={handleUpdateEntity} 
                        />
                    ))}
                </div>
            </section>

            {/* Solution (Hidden usually, but visible for debug/admin) */}
            {caseFile.solution && (
                 <section className="mt-20 border-t border-red-900/30 pt-8 opacity-50 hover:opacity-100 transition-opacity">
                     <h3 className="text-red-900 text-xs font-mono mb-4 uppercase tracking-[0.2em] text-center">Admin: Case Solution</h3>
                     <div className="max-w-2xl mx-auto bg-black/40 border border-red-900/20 p-6 rounded text-xs font-mono text-red-800/60 blur-sm hover:blur-none transition-all duration-500">
                         <p>CULPRIT: {caseFile.solution.culpritId}</p>
                         <p>MOTIVE: {caseFile.solution.motive}</p>
                         <p>REASONING: {caseFile.solution.reasoning}</p>
                     </div>
                 </section>
            )}
        </main>

        <footer className="border-t border-noir-800 py-8 text-center text-xs text-noir-600 font-mono">
            <p>CASEFILES INTERNAL SYSTEM v2.5 // AUTHORIZED PERSONNEL ONLY</p>
            <p className="mt-2">POWERED BY GEMINI 3.0 PRO & 2.5 FLASH IMAGE</p>
        </footer>
    </div>
  );
};

export default App;