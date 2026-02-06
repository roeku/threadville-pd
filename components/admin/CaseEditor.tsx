import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { generateCase, generateAssetImage, enrichEvidenceItem, generateNarrative, generateEvidenceManifest, validateCasePlayability } from '../../services/geminiService';
import { constructEvidencePrompt } from '../../services/assetPrompts';
import { CaseFile, EvidenceItem, EvidenceType, CaseScenario, CaseNarrative, EvidenceManifest } from '../../types';
import { Save, Wand2, ArrowLeft, Loader2, Image as ImageIcon, Sparkles, CheckCircle, ChevronRight, FileText, Fingerprint } from 'lucide-react';

interface CaseEditorProps {
    mode: 'create' | 'edit';
    caseId?: string;
    onSave: () => void;
}

export default function CaseEditor({ mode, caseId, onSave }: CaseEditorProps) {
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [enrichmentProgress, setEnrichmentProgress] = useState<{ current: number, total: number, label: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [caseData, setCaseData] = useState<CaseFile | null>(null);
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');

    // Wizard State
    const [wizardStep, setWizardStep] = useState(0);
    const [scenario, setScenario] = useState<CaseScenario>({
        theme: 'Noir',
        difficulty: 'Medium',
        focus: 'Motive',
        constraints: []
    });
    const [narrative, setNarrative] = useState<CaseNarrative | null>(null);
    const [manifest, setManifest] = useState<EvidenceManifest | null>(null);
    const [creationLog, setCreationLog] = useState<string[]>([]);

    const runCaseValidation = (caseFile: CaseFile): { isValid: boolean; message?: string } => {
        const result = validateCasePlayability(caseFile);
        if (!result.isValid) {
            const message = `Case validation failed:\n${result.errors.join('\n')}`;
            return { isValid: false, message };
        }
        if (result.warnings.length > 0) {
            console.warn("Case validation warnings:", result.warnings);
            setCreationLog(prev => [...prev, ...result.warnings.map(w => `⚠️ ${w}`)]);
        }
        return { isValid: true };
    };

    useEffect(() => {
        if (mode === 'edit' && caseId) {
            loadCase(caseId);
        }
    }, [mode, caseId]);

    const loadCase = async (id: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            setError(error.message);
        } else if (data) {
            setCaseData(data.content);
            setTitle(data.title);
            setStatus(data.status);
        }
        setLoading(false);
    };

    const uploadBase64Asset = async (base64: string, path: string): Promise<string | null> => {
        try {
            const res = await fetch(base64);
            const blob = await res.blob();
            // Simple mime extraction
            const mimeType = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';
            const ext = mimeType.split('/')[1] || 'png';
            const fullPath = `${path}.${ext}`;

            const { error } = await supabase.storage
                .from('case-assets')
                .upload(fullPath, blob, { upsert: true });

            if (error) {
                console.error("Upload failed", error);
                return null;
            }

            const { data } = supabase.storage
                .from('case-assets')
                .getPublicUrl(fullPath);

            return data.publicUrl;
        } catch (e) {
            console.error("Asset processing failed", e);
            return null;
        }
    };

    const handleStep1_Narrative = async () => {
        setGenerating(true);
        setError(null);
        try {
            const result = await generateNarrative(scenario);
            setNarrative(result);
            setWizardStep(1);
        } catch (e: any) {
            setError(e.message);
        }
        setGenerating(false);
    };

    const handleStep2_Manifest = async () => {
        if (!narrative) return;
        setGenerating(true);
        setError(null);
        try {
            const result = await generateEvidenceManifest(narrative);
            setManifest(result);
            setWizardStep(2);
        } catch (e: any) {
            setError(e.message);
        }
        setGenerating(false);
    };

    const handleStep3_Finalize = async () => {
        if (!narrative || !manifest) return;
        setGenerating(true);
        setError(null);
        try {
            // Construct the final CaseFile
            const rawEntities: EvidenceItem[] = manifest.items.map((m, i) => ({
                id: m.id,
                type: m.type,
                label: m.label,
                content: m.description, // Placeholder
                description: m.description,
                clues: [m.intendedClue],
                imageUrl: m.imageUrl,
                metadata: {
                    templateId: m.templateId,
                    forensicType: m.forensicType
                },
                forensicData: m.forensicData,
                position: [
                    (Math.random() - 0.5) * 0.8,
                    0.9 + (i * 0.08),
                    (Math.random() - 0.5) * 0.5
                ],
                rotation: [0, (Math.random() - 0.5) * Math.PI, 0]
            }));

            // CRITICAL INTEGRATION: Enrich content with specific schemas (SEQUENTIAL WITH PROGRESS)
            const enrichedEntities: EvidenceItem[] = [];
            setEnrichmentProgress({ current: 0, total: rawEntities.length, label: 'Starting enrichment...' });

            // Build more complete context for document generation
            const partialCase: any = {
                title: narrative.title,
                briefing: narrative.briefing,
                suspects: narrative.suspects,
                solution: narrative.solution
            };

            for (let i = 0; i < rawEntities.length; i++) {
                const item = rawEntities[i];
                setEnrichmentProgress({
                    current: i + 1,
                    total: rawEntities.length,
                    label: `Generating content for: ${item.label}`
                });

                // Sequential await to prevent rate limiting and timeouts
                // Also allows us to fail gracefully per item without crashing the whole batch
                try {
                    let enriched = await enrichEvidenceItem(item, partialCase);

                    // NEW: Generate Image if needed (Sequential)
                    if ((enriched.type === 'PHOTO' || enriched.type === 'OBJECT' || enriched.type === 'FORENSIC_SAMPLE') && (!enriched.imageUrl || enriched.imageUrl === 'PENDING')) {
                        setEnrichmentProgress({
                            current: i + 1,
                            total: rawEntities.length,
                            label: `Rendering image for: ${item.label}`
                        });
                        try {
                            const prompt = constructEvidencePrompt(enriched);
                            const b64 = await generateAssetImage(prompt);
                            enriched.imageUrl = b64;
                        } catch (imgErr) {
                            console.warn("Image Gen Failed", imgErr);
                        }
                    }

                    enrichedEntities.push(enriched);
                } catch (err) {
                    console.error(`Failed to enrich item ${item.id}`, err);
                    enrichedEntities.push(item); // Fallback to raw item
                }
            }
            setEnrichmentProgress(null);


            // Reconcile Weapon ID (Text -> ID)
            let reconciledWeaponId = narrative.solution.weaponId;
            // 1. Try fuzzy match on label
            const textMatch = enrichedEntities.find(e =>
                e.label.toLowerCase().includes(narrative.solution.weaponId.toLowerCase()) ||
                narrative.solution.weaponId.toLowerCase().includes(e.label.toLowerCase())
            );
            if (textMatch) reconciledWeaponId = textMatch.id;

            // 2. Try clue match if failed
            if (!textMatch) {
                const clueMatch = enrichedEntities.find(e =>
                    e.clues?.some(c => c.toLowerCase().includes("weapon") || c.toLowerCase().includes("murder"))
                );
                if (clueMatch) reconciledWeaponId = clueMatch.id;
            }

            // Generate Suspects with Images (Sequential)
            const suspects: any[] = [];
            for (let i = 0; i < narrative.suspects.length; i++) {
                const s = narrative.suspects[i];
                setEnrichmentProgress({
                    current: i + 1,
                    total: narrative.suspects.length,
                    label: `Generating mugshot for: ${s.name}`
                });

                let photoUrl = undefined;
                try {
                    // Mock entity for prompt construction
                    const tempEntity = { type: 'SUSPECT', name: s.name, description: s.role, visualTags: "Detailed mugshot, cinematic lighting" };
                    const prompt = constructEvidencePrompt(tempEntity as any);
                    photoUrl = await generateAssetImage(prompt);
                } catch (e) {
                    console.warn("Mugshot failed for " + s.name, e);
                }

                suspects.push({
                    id: s.id,
                    name: s.name,
                    bio: `${s.role}. ${s.motive}. Alibi: ${s.alibi}`,
                    notes: s.role,
                    bloodType: s.bloodType || "O+",
                    dnaSequence: s.dnaSequence || "PENDING",
                    fingerprintPattern: s.fingerprintPattern || "PENDING",
                    photoUrl: photoUrl
                });
            }

            const finalCase: CaseFile = {
                caseId: `CASE-${Date.now()}`,
                title: narrative.title,
                briefing: narrative.briefing,
                difficulty: 'Hard',
                suspects: suspects,
                entities: enrichedEntities,
                solution: {
                    ...narrative.solution,
                    weaponId: reconciledWeaponId
                },
                status: 'draft'
            };

            const validation = runCaseValidation(finalCase);
            
            // Allow loading even if invalid, but show error
            if (!validation.isValid) {
                console.error("Case validation failed", validation.message);
                setError(`Case generated with issues: ${validation.message}`); 
                // Don't return, allow user to save/fix manually
            }

            setCaseData(finalCase);
            setTitle(finalCase.title);
            // Move to standard editor view
        } catch (e: any) {
            setError(e.message || "Failed to finalize case");
        } finally {
            setGenerating(false);
            setEnrichmentProgress(null);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const result = await generateCase();

            // Post-processing: Upload all generated base64 images to Supabase to prevent JSON bloat
            // 1. Upload Evidence Images
            const updatedEntities = await Promise.all(result.entities.map(async (entity) => {
                if (entity.imageUrl && entity.imageUrl.startsWith('data:image')) {
                    const path = `${result.caseId || 'gen'}/evidence/${entity.id}_${Date.now()}`;
                    const url = await uploadBase64Asset(entity.imageUrl, path);
                    if (url) return { ...entity, imageUrl: url };
                }
                return entity;
            }));

            // 2. Upload Suspect Photos
            const updatedSuspects = await Promise.all(result.suspects.map(async (suspect) => {
                if (suspect.photoUrl && suspect.photoUrl.startsWith('data:image')) {
                    const path = `${result.caseId || 'gen'}/suspects/${suspect.id}_${Date.now()}`;
                    const url = await uploadBase64Asset(suspect.photoUrl, path);
                    if (url) return { ...suspect, photoUrl: url };
                }
                return suspect;
            }));

            const finalCase = {
                ...result,
                entities: updatedEntities,
                suspects: updatedSuspects
            };

            setCaseData(finalCase);
            setTitle(finalCase.title);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate case");
        }
        setGenerating(false);
    };

    const handleSave = async () => {
        if (!caseData || !title) return;
        const validation = runCaseValidation(caseData);
        if (!validation.isValid) {
            setError(validation.message || "Case validation failed");
            // return;
        }
        setLoading(true);

        const payload = {
            title: title,
            content: caseData,
            status: status,
            updated_at: new Date().toISOString(),
        };

        let error;

        if (mode === 'create') {
            const res = await supabase.from('cases').insert([payload]);
            error = res.error;
        } else {
            const res = await supabase.from('cases').update(payload).eq('id', caseId);
            error = res.error;
        }

        setLoading(false);
        if (error) setError(error.message);
        else onSave();
    };

    const handleGenerateAsset = async (evidence: EvidenceItem, index: number) => {
        if (!caseData) return;

        setLoading(true);

        try {
            const prompt = constructEvidencePrompt(evidence);
            const base64 = await generateAssetImage(prompt);

            // Upload to Supabase Storage
            const res = await fetch(base64);
            const blob = await res.blob();
            // Extract extension
            const mimeType = base64.substring(base64.indexOf(':') + 1, base64.indexOf(';')) || 'image/png';
            const ext = mimeType.split('/')[1] || 'png';

            const fileName = `${caseData.caseId || 'draft'}/${evidence.id}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('case-assets')
                .upload(fileName, blob, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('case-assets')
                .getPublicUrl(fileName);

            // Update the case data
            const newEntities = [...caseData.entities];
            newEntities[index] = {
                ...evidence,
                imageUrl: publicUrl
            };

            setCaseData({
                ...caseData,
                entities: newEntities
            });

        } catch (err: any) {
            console.error(err);
            alert("Failed to generate/upload asset: " + err.message);
        }
        setLoading(false);
    };

    const handleEnrich = async (evidence: EvidenceItem, index: number) => {
        if (!caseData) return;
        setLoading(true);
        try {
            const enrichedItem = await enrichEvidenceItem(evidence, caseData);
            const newEntities = [...caseData.entities];
            newEntities[index] = enrichedItem;
            setCaseData({ ...caseData, entities: newEntities });
        } catch (err: any) {
            console.error(err);
            alert("Failed to enrich content: " + err.message);
        }
        setLoading(false);
    };

    if (loading && !caseData && mode === 'edit') return <div className="p-8 text-amber-500">Loading case data...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onSave} className="text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-100">
                        {mode === 'create' ? 'Generate New Case' : 'Edit Case File'}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-amber-500"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={!caseData || loading}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-950 px-4 py-2 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Case</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-950/50 border border-red-500/50 text-red-200 p-4 rounded">
                    {error}
                </div>
            )}

            {/* Wizard Mode */}
            {(mode === 'create' && !caseData) && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                    {/* Progress Bar */}
                    <div className="flex border-b border-slate-800">
                        {['Scenario', 'Narrative', 'Evidence', 'Finalize'].map((step, i) => (
                            <div key={step} className={`flex-1 py-3 text-center text-sm font-bold ${wizardStep === i ? 'bg-amber-500 text-slate-950' :
                                wizardStep > i ? 'text-amber-500 bg-slate-900' : 'text-slate-600 bg-slate-950'
                                }`}>
                                {i + 1}. {step}
                            </div>
                        ))}
                    </div>

                    <div className="p-8 space-y-6">
                        {/* ENRICHMENT PROGRESS OVERLAY */}
                        {enrichmentProgress && (
                            <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                                <div className="text-xl font-bold text-amber-500">Generative AI enrichment in progress...</div>
                                <div className="text-slate-300">{enrichmentProgress.label}</div>
                                <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 transition-all duration-300"
                                        style={{ width: `${(enrichmentProgress.current / enrichmentProgress.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                    {enrichmentProgress.current} / {enrichmentProgress.total} Items
                                </div>
                            </div>
                        )}

                        {wizardStep === 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-200">Set the Stage</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500 mb-1">Theme</label>
                                        <input
                                            value={scenario.theme}
                                            onChange={e => setScenario({ ...scenario, theme: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500 mb-1">Focus</label>
                                        <select
                                            value={scenario.focus}
                                            onChange={e => setScenario({ ...scenario, focus: e.target.value as any })}
                                            className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 outline-none focus:border-amber-500"
                                        >
                                            <option value="Motive">Motive & Psychology</option>
                                            <option value="Forensics">Forensics & Science</option>
                                            <option value="Alibi">Alibis & Timelines</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-slate-500 mb-1">Difficulty</label>
                                        <select
                                            value={scenario.difficulty}
                                            onChange={e => setScenario({ ...scenario, difficulty: e.target.value as any })}
                                            className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 outline-none focus:border-amber-500"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={handleStep1_Narrative}
                                    disabled={generating}
                                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex justify-center items-center gap-2 transition-transform active:scale-95"
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    Generate Narrative
                                </button>
                            </div>
                        )}

                        {wizardStep === 1 && narrative && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-200">{narrative.title}</h3>
                                <div className="p-4 bg-slate-950 rounded text-slate-400 text-sm italic">
                                    {narrative.briefing}
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-slate-500 text-xs uppercase">Suspects</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {narrative.suspects.map(s => (
                                            <div key={s.id} className={`p-2 rounded border ${s.isCulprit ? 'border-amber-900/50 bg-amber-900/10' : 'border-slate-800 bg-slate-800/50'}`}>
                                                <div className="font-bold text-slate-300 flex justify-between">
                                                    {s.name}
                                                    {s.isCulprit && <span className="text-red-500 text-[10px] uppercase">Culprit</span>}
                                                </div>
                                                <div className="text-xs text-slate-500">{s.role} - {s.motive}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={handleStep2_Manifest}
                                    disabled={generating}
                                    className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex justify-center items-center gap-2 transition-transform active:scale-95"
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : <FileText />}
                                    Generate Evidence Plan
                                </button>
                            </div>
                        )}

                        {wizardStep === 2 && manifest && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-slate-200">Evidence Manifest</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    {manifest.items.map(item => (
                                        <div key={item.id} className="flex gap-4 p-3 bg-slate-950 border border-slate-800 rounded items-start">
                                            <div className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded w-20 text-center shrink-0">{item.type}</div>
                                            <div>
                                                <div className="font-bold text-slate-300">{item.label}</div>
                                                <div className="text-xs text-slate-500">{item.description}</div>
                                                {item.templateId && <div className="text-xs text-amber-500 mt-1 font-mono">Template: {item.templateId}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleStep3_Finalize}
                                    disabled={generating}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex justify-center items-center gap-2 transition-transform active:scale-95"
                                >
                                    {generating ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                                    Finalize & Build Case
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Editor Form */}
            {caseData && (
                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 foocus:border-amber-500 outline-none font-bold text-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1">Briefing</label>
                            <textarea
                                value={caseData.briefing}
                                onChange={e => setCaseData({ ...caseData, briefing: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 foocus:border-amber-500 outline-none h-24"
                            />
                        </div>
                    </div>

                    {/* Evidence & Assets */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-300 border-b border-slate-800 pb-2">Evidence & Assets</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {caseData.entities.map((item, idx) => (
                                <div key={item.id} className="bg-slate-900 border border-slate-700 p-4 rounded flex gap-4">
                                    {/* Image Preview / Gen Button */}
                                    <div className="w-32 h-32 flex-shrink-0 bg-slate-950 border border-slate-800 rounded flex items-center justify-center relative overflow-hidden group">
                                        {item.imageUrl ? (
                                            <>
                                                <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleGenerateAsset(item, idx)}
                                                        className="text-xs bg-slate-800 text-white px-2 py-1 rounded border border-slate-600 hover:bg-amber-600"
                                                    >
                                                        Regen
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleGenerateAsset(item, idx)}
                                                className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-500 transition-colors"
                                            >
                                                <ImageIcon className="w-6 h-6" />
                                                <span className="text-[10px] uppercase font-bold">Gen Asset</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between">
                                            <input
                                                value={item.label}
                                                onChange={(e) => {
                                                    const newEnts = [...caseData.entities];
                                                    newEnts[idx].label = e.target.value;
                                                    setCaseData({ ...caseData, entities: newEnts });
                                                }}
                                                className="bg-transparent text-amber-500 font-bold outline-none border-b border-transparent focus:border-amber-500"
                                            />
                                            <div className="flex gap-2 items-center">
                                                <button
                                                    onClick={() => handleEnrich(item, idx)}
                                                    className="text-xs flex items-center gap-1 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 px-2 py-1 rounded transition-colors"
                                                    title="Enrich content with AI"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    Enrich
                                                </button>
                                                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{item.type}</span>
                                            </div>
                                        </div>
                                        <textarea
                                            value={item.content}
                                            onChange={(e) => {
                                                const newEnts = [...caseData.entities];
                                                newEnts[idx].content = e.target.value;
                                                setCaseData({ ...caseData, entities: newEnts });
                                            }}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded p-2 text-xs text-slate-400 outline-none focus:border-amber-500 h-16"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suspects */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-300 border-b border-slate-800 pb-2">Suspects</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {caseData.suspects.map((suspect, idx) => (
                                <div key={suspect.id} className="bg-slate-900 border border-slate-700 p-4 rounded">
                                    <input
                                        value={suspect.name}
                                        onChange={(e) => {
                                            const newSus = [...caseData.suspects];
                                            newSus[idx].name = e.target.value;
                                            setCaseData({ ...caseData, suspects: newSus });
                                        }}
                                        className="bg-transparent text-slate-200 font-bold w-full mb-2 outline-none border-b border-transparent focus:border-amber-500"
                                    />
                                    <textarea
                                        value={suspect.bio}
                                        onChange={(e) => {
                                            const newSus = [...caseData.suspects];
                                            newSus[idx].bio = e.target.value;
                                            setCaseData({ ...caseData, suspects: newSus });
                                        }}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded p-2 text-xs text-slate-400 h-20 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded text-center text-xs text-slate-500">
                        JSON Editor coming soon. For now, use the fields above.
                    </div>
                </div>
            )}
        </div>
    );
}
