import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai"; // Removed Modality as it might not be exported or needed if we don't use TTS or use string 'AUDIO'
import { CaseFile, EvidenceType, EvidenceItem, Suspect, CaseScenario, CaseNarrative, EvidenceManifest, SuspectSkeleton } from "../types";
type CaseEntity = EvidenceItem | Suspect;
const EntityType = {
   SUSPECT: 'SUSPECT',
   ...EvidenceType
};
import { NARRATIVE_ARCHETYPES } from "./promptTemplates";
import { supabase } from "./supabase";
import { AVAILABLE_TEMPLATES } from "./document-rendering/templateRegistry";
import { getTemplateForEvidence } from "./templateManager";
import { TEMPLATE_SCHEMAS, UNIVERSAL_SCHEMA, getTemplateSchema } from "./document-rendering/templateSchemas";

// 1. STYLE CONSTANTS - The "Unreal Engine" Look
export const UE5_STYLE_PREFIX = "A photorealistic Unreal Engine 5 asset render of";
export const UE5_STYLE_SUFFIX = "8k resolution, cinematic lighting, raytracing, highly detailed textures, quixel megascans, modern crime drama atmosphere, depth of field, clinical sharpness.";
export const NEGATIVE_PROMPTS = "cartoon, illustration, drawing, painting, low poly, anime, distorted text, watermark, UI, HUD, vintage, sepia, black and white, noir, 1940s, 1950s";

// 2. SCHEMA REFINEMENT - Forcing Structure
const caseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    caseId: { type: Type.STRING },
    title: { type: Type.STRING },
    briefing: { type: Type.STRING, description: "Detailed 3-paragraph intro." },
    difficulty: { type: Type.STRING, enum: ["Hard"] },
    visualTheme: { type: Type.STRING, description: "Keywords for the case atmosphere (e.g. 'Rainy Neon', 'Dusty Office')" },
    suspects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          bio: { type: Type.STRING },
          visualTags: { type: Type.STRING, description: "Comma separated physical traits for image gen (e.g. 'scarred face, wet raincoat')" },
          notes: { type: Type.STRING },
          dnaSequence: { type: Type.STRING },
          fingerprintPattern: { type: Type.STRING }
        },
        required: ["id", "name", "visualTags"]
      }
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["PAPER", "PHOTO", "OBJECT", "FORENSIC_SAMPLE", "AUDIO"] },
          label: { type: Type.STRING },
          description: { type: Type.STRING, description: "Visual description for the 3D artist/Image Gen" },
          content: { type: Type.STRING, description: "Summary of content. Will be expanded later." },
          transcript: { type: Type.STRING, description: "Decoded text content for AUDIO or isLocked items." },
          isLocked: { type: Type.BOOLEAN, description: "True if this item requires decryption (e.g. phone, laptop)." },
          clues: { type: Type.ARRAY, items: { type: Type.STRING } },
          metadata: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              templateId: { type: Type.STRING, description: "MUST be one of: 'autopsy-report', 'bank-statement', 'search-warrant', 'rail-timetable', 'witness-statement', 'transcript', 'incident-report', 'forensic-report', 'case-file-cover', 'lab-submission-form', 'email-printout', 'boarding-pass', 'news-clipping', 'crime-scene-sketch', 'handwritten-note', 'internal-memo', 'letterhead-page', 'server-log'" },
              fields: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["key", "value"]
                },
                description: "Key-value pairs for the template as list of {key, value}" 
              }
            }
          },
          forensicData: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              value: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        required: ["id", "type", "label", "metadata"]
      }
    },
    solution: {
      type: Type.OBJECT,
      properties: {
        culpritId: { type: Type.STRING },
        weaponId: { type: Type.STRING },
        motive: { type: Type.STRING },
        reasoning: { type: Type.STRING }
      },
      required: ["culpritId", "weaponId"]
    }
  },
  required: ["caseId", "suspects", "entities", "solution"]
};

// 3. THE BLUEPRINT PROMPT
const SYSTEM_INSTRUCTION = `
You are the Lead Narrative Designer for a high-fidelity modern detective game (Unreal Engine 5).
Your goal is to generate a 'Case Blueprint' that is logically sound, visually distinct, and mentally challenging.

CORE DESIGN PILLARS:
1. **The "Boring List" Mechanic**: You MUST create at least one document (Bank Statement, Call Log, Train Schedule) that is tedious to read but contains ONE critical contradiction (e.g., a missing payment, a call made after death). Use 'templateId' from: 'bank-statement', 'rail-timetable', 'server-log', 'email-printout'.
2. **Visual Storytelling**: Every suspect and object needs specific 'Visual Tags' that the Art Department will use to render the assets.
3. **Forensic Validity**: The solution must rely on HARD evidence (Ballistics, DNA, Fingerprints, Autopsy Temp), not just confessions.
4. **Complexity**: Generate exactly 6 Suspects and 12 Evidence Entities.
5. **Name Variety**: Use diverse, contemporary names from various backgrounds. Avoid generic or old-fashioned detective tropes (e.g., no "Thatcher", "Sterling", "Holloway"). 
6. **Digital Forensics**: You MAY create Locked Devices or Audio Recordings if they fit the narrative, but do not force them.
   - **Locked Device** (e.g., 'Encrypted Phone') with 'isLocked': true and 'transcript': "The secret content revealed after decryption".
   - **Audio Recording** (e.g., 'Wiretap', 'Voicemail') with type 'AUDIO' and 'transcript': "The dialogue spoken in the recording".

VALID TEMPLATES: 'autopsy-report', 'bank-statement', 'search-warrant', 'rail-timetable', 'witness-statement', 'transcript', 'incident-report', 'forensic-report', 'case-file-cover', 'lab-submission-form', 'email-printout', 'boarding-pass', 'news-clipping', 'crime-scene-sketch', 'handwritten-note', 'internal-memo', 'letterhead-page', 'server-log'.

THE CRIME:
Create a modern-day mystery (post-2020 setting). It should feel mature, gritty, and grounded.
Avoid supernatural elements. Focus on greed, jealousy, and cold-blooded calculation.

OUTPUT:
Return ONLY valid JSON matching the provided schema.
`;

const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    // In production, throw. In dev we might want to warn or mock.
    // throw new Error("API_KEY is missing");
    console.warn("API_KEY is missing");
    return "MOCK_KEY";
  }
  return key;
};

// --- SPECIFIC SCHEMAS ---
// Centralized in services/document-rendering/templateSchemas.ts

// Helper to get AI instance safely
const getAI = () => {
  const apiKey = getApiKey(); // Use new helper
  return new GoogleGenAI({ apiKey });
};

// Fallback case used when generation fails
const MOCK_CASE: CaseFile = {
  caseId: "CASE-MOCK",
  title: "Untitled Case",
  briefing: "Case generation failed. Please try again.",
  difficulty: "Hard",
  entities: [],
  suspects: [],
  solution: {
    culpritId: "",
    weaponId: "",
    motive: "",
    reasoning: ""
  },
  status: "draft"
};


// =============================================================================
// MAIN APP FUNCTIONS - Used by components/admin/CaseEditor.tsx
// =============================================================================

// Internal helper for image generation prompts (not exported to CaseEditor)
// CaseEditor uses constructEvidencePrompt from assetPrompts.ts instead
export const constructPrompt = (entity: CaseEntity, visualTags?: string): string => {
  // Base details
  const specificDetails = visualTags ? `Visual details: ${visualTags}.` : ""; 
  
  // Type Guard / Manual Check
  const anyEntity = entity as any;
  const entityType = anyEntity.type || EntityType.SUSPECT;
  const description = anyEntity.description || anyEntity.bio || "";
  const label = anyEntity.label || anyEntity.name || "";
  
  switch (entityType) {
    case EntityType.SUSPECT:
      return `${UE5_STYLE_PREFIX} a police booking photo of ${label}. 
      ${description}. ${specificDetails} 
      The subject looks tired, stressed, or defiant. 
      Lighting is harsh overhead fluorescent or dramatic interrogation lamp.
      Skin texture is hyper-realistic with pores and imperfections.
      ${UE5_STYLE_SUFFIX} 
      --no ${NEGATIVE_PROMPTS}`;

    case EntityType.PHOTO:
      // Crime Scene - First Person View
      return `${UE5_STYLE_PREFIX} a crime scene photo of ${description}.
      ${specificDetails} 
      The angle is eye-level, handheld camera style.
      The room is dark, illuminated by flash or street lights outside.
      Atmosphere is realistic, cold, professional.
      Visible evidence markers (yellow cards).
      ${UE5_STYLE_SUFFIX} 
      --no ${NEGATIVE_PROMPTS}`;

    case EntityType.OBJECT:
    case EntityType.FORENSIC_SAMPLE:
      // Inspection View
      return `${UE5_STYLE_PREFIX} an isolated asset render of ${label}.
      ${description}. ${specificDetails} 
      The object is on a neutral dark surface.
      Lighting is 'Rembrandt' style with strong rim light to show silhouette.
      Focus is sharp on the object, blurred background.
      ${UE5_STYLE_SUFFIX} 
      --no ${NEGATIVE_PROMPTS}`;

    case EntityType.AUDIO:
      return `${UE5_STYLE_PREFIX} a voice recorder, cassette tape, or USB drive labeled '${label}'.
      ${description}. ${specificDetails}
      The object is on an evidence desk.
      ${UE5_STYLE_SUFFIX}
      --no ${NEGATIVE_PROMPTS}`;

    case EntityType.PAPER:
    default:
      return "Error: Unknown Type";
  }
};

// Helper to safely get text from Gemini response (handles SDK differences)
const getResponseText = (response: any): string => {
    let text = "";
    if (response.text) {
        text = typeof response.text === 'function' ? response.text() : response.text;
    }
    // Fallback for candidates
    else if (response.candidates && response.candidates.length > 0) {
       const part = response.candidates[0].content?.parts?.[0];
       if (part && part.text) text = part.text;
    }
    
    if (!text) throw new Error("No text found in Gemini response");

    // Clean Markdown code blocks if present
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    return cleanText;
};

// =============================================================================
// SUB-APP FUNCTIONS - Used by standalone apps in assets/ folder
// =============================================================================

export const generateCaseBlueprint = async (): Promise<CaseFile> => {
   const ai = getAI();
   // Using Pro model for logic
   const modelName = "gemini-3-pro-preview"; 

   const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: "Generate a new Hard difficulty murder case blueprint." }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: caseSchema
    }
  });

  const text = getResponseText(response);
  const rawData = JSON.parse(text);

  // Map schema response to app types
  const entities: CaseEntity[] = [];
  const suspects: CaseEntity[] = [];

    // Map Suspects
  if (rawData.suspects) {
    rawData.suspects.forEach((s: any) => {
      suspects.push({
        id: s.id,
        type: EntityType.SUSPECT,
        name: s.name,
         bio: s.bio,
         notes: s.notes,
         visualTags: s.visualTags,
         bloodType: s.bloodType,
         dnaSequence: s.dnaSequence,
         fingerprintPattern: s.fingerprintPattern
      } as any); 
    });
  }

  // Map Evidence
  if (rawData.entities) {
    rawData.entities.forEach((e: any) => {
        // Map string type to Enum
        let type = EntityType.OBJECT;
        if (e.type === 'PHOTO') type = EntityType.PHOTO;
        if (e.type === 'PAPER') type = EntityType.PAPER;
        if (e.type === 'FORENSIC_SAMPLE') type = EntityType.FORENSIC_SAMPLE;
        
        entities.push({
            id: e.id,
            type: type,
            label: e.label,
            description: e.description, // Added in step 1
            content: e.content,
            clues: e.clues,
            metadata: {
              ...e.metadata,
              // Transform array of {key, value} back to object for the app
              fields: Array.isArray(e.metadata?.fields) 
                ? e.metadata.fields.reduce((acc: any, item: any) => ({ ...acc, [item.key]: item.value }), {}) 
                : {}
            },
            forensicData: e.forensicData,
        } as any);
    });
  }
  
  return {
    caseId: rawData.caseId,
    title: rawData.title,
    briefing: rawData.briefing,
    difficulty: rawData.difficulty,
    // description removed as it is not in CaseFile type
    visualTheme: rawData.visualTheme,
    suspects: suspects as any, // Cast to Suspect[]
    entities: entities as any, // Cast to EvidenceItem[] (NOW ONLY EVIDENCE)
    solution: rawData.solution,
    status: 'draft'
  };
};

export const generateHighVolumeData = async (templateId: string, context: string): Promise<any> => {
  const ai = getAI();
  const modelName = "gemini-3-flash-preview"; // Flash is great for high-volume text. Using latest flash.

  let prompt = "";
  
  if (templateId === 'bank-statement') {
    prompt = `
      Context: ${context}
      Task: Generate a JSON object for a bank statement.
      Requirement: 
      1. Create an array of exactly 25 transactions.
      2. 24 transactions must be mundane, daily life items (coffee, groceries, rent, utilities) consistent with the character's bio.
      3. ONE transaction must be the 'Clue' (e.g., a large withdrawal, a purchase of a weapon, a cancelled subscription).
      4. Dates must be consistent with the month of the murder.
      
      Output Schema: { bankName: string, accountHolder: string, accountNumber: string, transactions: { date: string, description: string, amount: number, type: "DEBIT"|"CREDIT" }[] }
    `;
  } else if (templateId === 'call-log') {
     prompt = `
      Context: ${context}
      Task: Generate a JSON object for a phone call log.
      Requirement:
      1. Create an array of 20 calls.
      2. Most are random numbers or known safe contacts.
      3. One call is suspicious (timing or recipient).
      
      Output Schema: { deviceOwner: string, phoneNumber: string, logs: { timestamp: string, contactName: string, number: string, duration: string, type: "INCOMING"|"OUTGOING"|"MISSED" }[] }
     `;
  } else if (templateId === 'rail-timetable') {
      prompt = `
      Context: ${context}
      Task: Generate a JSON object for a train schedule.
      Requirement:
      1. List 15 departures.
      2. Most are on time.
      3. One specific train (relevant to alibi) is Cancelled or Delayed.
      
      Output Schema: { header: string, station: string, departures: string[] }
      `
  } else {
    // If not a boring list type, return null so we don't overwrite anything
    return null;
  }

  try {
     const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
     });

     const text = getResponseText(response);
     return JSON.parse(text);

  } catch (e) {
      console.warn("High volume data generation failed", e);
      return null;
  }
}

// Helper to generate random DNA/Fingerprints
const generateForensicProfile = () => {
  const bases = ['A', 'T', 'C', 'G'];
  // Generate 4 groups of 4 blocks
  const dna = Array(4).fill(0).map(() => 
     Array(4).fill(0).map(() => bases[Math.floor(Math.random() * 4)]).join('')
  ).join('-');

  const patterns = ['LOOP', 'WHORL', 'ARCH'];
  // Generate 3 patterns
  const fingerprint = Array(3).fill(0).map(() => patterns[Math.floor(Math.random() * 3)]).join('-');

  return { dna, fingerprint };
};

// =============================================================================
// CASE VALIDATION - Ensures cases are playable before returning
// =============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

import { generateDeductionRules, isCaseSolved, createDeductionState } from "./deductionService"; // Check imports

export const validateCasePlayability = (caseFile: CaseFile): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check Logical Solvability via Deduction System
  try {
     const deductionState = createDeductionState(caseFile);
     if (deductionState.criticalRuleIds.length === 0) {
        warnings.push("Deduction System Logic: No critical rules generated. Case might be too disconnected.");
     } else {
        // Simulate a "perfect game" where all links are found
        const perfectLinks = deductionState.rules.map(r => ({
           fromId: r.source,
           toId: r.target,
           type: r.type
        }) as any);
        
        const solvedCheck = isCaseSolved(perfectLinks, deductionState);
        if (!solvedCheck.solved) {
           errors.push(`Deduction System Logic: Case creates insoluble graph. Missing: ${solvedCheck.missing.join(', ')}`);
        }
     }
  } catch (e: any) {
     console.error("Deduction validation failed", e);
     warnings.push("Could not validate logic graph: " + e.message);
  }

  // 1. Suspect validation - all must have biometric data
  caseFile.suspects.forEach(s => {
    if (!s.dnaSequence || s.dnaSequence === "PENDING" || s.dnaSequence.trim() === "") {
      errors.push(`Suspect "${s.name}" (${s.id}) missing DNA sequence`);
    }
    if (!s.fingerprintPattern || s.fingerprintPattern === "PENDING" || s.fingerprintPattern.trim() === "") {
      errors.push(`Suspect "${s.name}" (${s.id}) missing fingerprint pattern`);
    }
    if (!s.bloodType || s.bloodType === "PENDING" || s.bloodType.trim() === "") {
      warnings.push(`Suspect "${s.name}" (${s.id}) missing blood type`);
    }
  });

  // 2. Forensic evidence validation
  caseFile.entities
    .filter(e => e.type === EvidenceType.FORENSIC_SAMPLE)
    .forEach(e => {
      if (!e.forensicData?.value || e.forensicData.value === "PENDING" || e.forensicData.value.trim() === "") {
        errors.push(`Forensic evidence "${e.label}" (${e.id}) has PENDING or empty value`);
      }
      if (!e.forensicData?.type) {
        errors.push(`Forensic evidence "${e.label}" (${e.id}) missing type (DNA/FINGERPRINT/BLOOD)`);
      }
    });

  // 3. Document field validation
  caseFile.entities
    .filter(e => e.type === EvidenceType.PAPER && e.metadata?.templateId)
    .forEach(e => {
      const fields = e.metadata.fields as any;
      if (!fields || (typeof fields === 'object' && Object.keys(fields).length === 0)) {
        errors.push(`Paper evidence "${e.label}" (${e.id}) has no structured fields for template "${e.metadata.templateId}"`);
      }
    });

  // 4. Solution validation
  const culpritExists = caseFile.suspects.some(s => s.id === caseFile.solution.culpritId);
  const weaponExists = caseFile.entities.some(e => e.id === caseFile.solution.weaponId);
  
  if (!culpritExists) {
    errors.push(`Solution references non-existent suspect ${caseFile.solution.culpritId}`);
  }
  if (!weaponExists) {
    errors.push(`Solution references non-existent weapon ${caseFile.solution.weaponId}`);
  }

  // 5. Ensure culprit has forensic evidence pointing to them
  const culprit = caseFile.suspects.find(s => s.id === caseFile.solution.culpritId);
  if (culprit) {
    const forensicMatches = caseFile.entities.filter(e => 
      e.type === EvidenceType.FORENSIC_SAMPLE && (
        e.forensicData?.value === culprit.dnaSequence || 
        e.forensicData?.value === culprit.fingerprintPattern ||
        e.forensicData?.value === culprit.bloodType
      )
    );
    
    if (forensicMatches.length === 0) {
      warnings.push(`No forensic evidence currently links to culprit "${culprit.name}" - case may be unsolvable by forensics`);
    }
  }

  // 6. Digital Forensics Validation
  // Validate locked items have transcript/content IF they exist
  caseFile.entities.filter(e => e.isLocked).forEach(e => {
     if (!e.transcript && !e.content) {
       errors.push(`Locked evidence "${e.label}" (${e.id}) missing transcript/content for decryption result`);
     }
  });

  // Validate audio items have transcript IF they exist
  caseFile.entities.filter(e => e.type === EvidenceType.AUDIO || e.type === 'AUDIO').forEach(e => {
    if (!e.transcript && !e.content) {
        errors.push(`Audio evidence "${e.label}" (${e.id}) missing transcript/content`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};


// --- DYNAMIC TEMPLATE GENERATION SYSTEM ---

// 1. Generate a Visual Layout Schema for a new template type
const generateDynamicTemplateSchema = async (templateId: string, context?: string): Promise<any> => {
  const ai = getAI();
  const prompt = `
    You are a UI/UX Designer for a document generation system.
    Create a JSON Layout Schema for a document of type: "${templateId}".
    Context/Description: "${context || 'Standard official document'}".

    The schema defines absolute positioning (x,y) for elements on a page (default 816x1056).
    
    Element Types:
    - 'text': Static title or label (e.g. "PARKING TICKET").
    - 'field': Dynamic value with a key (e.g. key: "licensePlate").
    - 'line': Separator line.
    - 'image': Logo or barcode.
    - 'paragraph': Long text body.

    Output must optionally include 'width' and 'height' if different from A4.
    Ensure "fields" have Descriptive Keys (camelCase) that we can generate data for later.
  `;

  const schemaSpec: Schema = {
    type: Type.OBJECT,
    properties: {
      width: { type: Type.INTEGER },
      height: { type: Type.INTEGER },
      elements: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['text', 'field', 'paragraph', 'image', 'line'] },
            x: { type: Type.INTEGER },
            y: { type: Type.INTEGER },
            width: { type: Type.INTEGER },
            height: { type: Type.INTEGER },
            text: { type: Type.STRING },
            key: { type: Type.STRING },
            label: { type: Type.STRING },
            fontSize: { type: Type.INTEGER },
            fontWeight: { type: Type.STRING, enum: ['normal', 'bold'] }
          },
          required: ["type", "x", "y"]
        }
      }
    },
    required: ["elements"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", responseJsonSchema: schemaSpec }
    });
    return JSON.parse(getResponseText(response));
  } catch (e) {
    console.error("Failed to generate template schema", e);
    return null;
  }
};

// 2. Ensure Template Exists (Check Registry -> Check DB -> Generate & Save)
const ensureDynamicTemplate = async (templateId: string, description: string = "") => {
  // A. Registry (Hardcoded)
  if (AVAILABLE_TEMPLATES.includes(templateId)) return null; // Exists natively, no schema needed

  // B. Database
  const { data: existing } = await supabase.from('document_templates').select('layout_schema').eq('id', templateId).single();
  if (existing) return existing.layout_schema;

  // C. Generate New
  console.log(`[Gemini] Generating NEW Dynamic Template: ${templateId}`);
  const schema = await generateDynamicTemplateSchema(templateId, description);
  
  if (schema) {
    // Save to DB
    await supabase.from('document_templates').insert({
      id: templateId,
      name: templateId,
      description: description,
      layout_schema: schema,
      width: schema.width || 816,
      height: schema.height || 1056
    });
  }
  return schema;
};

// 3. Generate Data for a Dynamic Schema
const generateDynamicData = async (templateId: string, layoutSchema: any, caseContext: any) => {
  const fieldsNeeded = layoutSchema.elements
    .filter((el: any) => (el.type === 'field' || el.type === 'paragraph' || el.type === 'image') && el.key)
    .map((el: any) => el.key);

  if (fieldsNeeded.length === 0) return {};

  const ai = getAI();
  const prompt = `
    Generate data for a "${templateId}" document.
    CASE CONTEXT: ${JSON.stringify(caseContext)}
    
    Fill the following fields:
    ${fieldsNeeded.join(', ')}

    Return a JSON object where keys match the requested fields.
  `;

  // Dynamic Schema for the data itself
  const dataSchema: Schema = {
    type: Type.OBJECT,
    properties: fieldsNeeded.reduce((acc: any, key: string) => ({ ...acc, [key]: { type: Type.STRING } }), {}),
    required: fieldsNeeded
  };

  try {
     const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json", responseJsonSchema: dataSchema }
    });
    return JSON.parse(getResponseText(response));
  } catch (e) {
    console.warn("Failed to generate dynamic data", e);
    return {};
  }
};

export const generateCase = async (): Promise<CaseFile> => {
  // 1. Generate the Blueprint
  let fullCase: CaseFile;
  try {
      fullCase = await generateCaseBlueprint();
  } catch (e) {
      console.error("Blueprint generation failed, falling back to mock", e);
      return JSON.parse(JSON.stringify(MOCK_CASE));
  }

  // 1a. Hydrate Suspect Forensics (CRITICAL FIX)
  fullCase.suspects.forEach(suspect => {
     if (!suspect.dnaSequence || suspect.dnaSequence === "PENDING") {
         const profile = generateForensicProfile();
         suspect.dnaSequence = profile.dna;
         suspect.fingerprintPattern = profile.fingerprint;
     }
  });

  // 2. Parallel Processing: Hydrate the Evidence
  // We process entities to generate boring lists and images
  await Promise.all(fullCase.entities.map(async (entity) => {
      
      // A. Hydrate Documents & High Volume Data
      if (entity.metadata?.templateId) {
          const tid = entity.metadata.templateId;
          
          // Check for High Volume Types first
          // CHANGED: Moved bank-statement to use Complex Document Schema (generateDocumentContent) for better reliability
          if (['call-log', 'rail-timetable'].includes(tid)) {
             const highVolumeData = await generateHighVolumeData(tid, fullCase.briefing);
             if (highVolumeData) {
                 entity.metadata.fields = { ...entity.metadata.fields, ...highVolumeData };
             }
          } 
          // Check for Complex Document Types (Autopsy, Warrant, Bank Statement etc)
          // We invoke generateDocumentContent here to fill the fields
          else {
              try {
                  // Integrated Dynamic Template System
                  // 1. Check if we need to generate/fetch a Dynamic Schema
                  const dynamicSchema = await ensureDynamicTemplate(tid, entity.description || entity.label);
                  
                  let docData = {};
                  if (dynamicSchema) {
                      // It's a dynamic template, so we generate data based on the schema keys
                      docData = await generateDynamicData(tid, dynamicSchema, fullCase);
                  } else {
                      // It's a standard Native Template (in Registry), use hardcoded prompt
                      docData = await generateDocumentContent(tid, fullCase);
                  }

                  if (docData) {
                      // We assume docData matches the Schema (Props)
                      // We merge it into fields so renderDocument can find it
                      entity.metadata.fields = { ...entity.metadata.fields, ...docData };
                  }
              } catch (e) {
                  console.warn(`Failed to hydrate complex document ${tid}`, e);
              }
          }
      }

      // B. Hydrate Forensic Samples with INTELLIGENT LINKING
      if (entity.type === EntityType.FORENSIC_SAMPLE && entity.metadata?.forensicType) {
          // INTELLIGENT LOGIC: Determine if this evidence should point to culprit or be a red herring
          // Strategy:
          // 1. Check if the description/clues mention specific suspect names
          // 2. If description mentions weapon/crime scene, prioritize culprit
          // 3. For pure forensics, 70% chance it's culprit evidence, 30% red herring
          
          const culprit = fullCase.suspects.find(s => s.id === fullCase.solution.culpritId);
          const innocents = fullCase.suspects.filter(s => s.id !== fullCase.solution.culpritId);
          
          let matchedSuspect: Suspect | undefined;
          
          // Check if description explicitly mentions a suspect name
          const mentionedSuspect = fullCase.suspects.find(s => 
            entity.description?.toLowerCase().includes(s.name.toLowerCase()) || 
            entity.label?.toLowerCase().includes(s.name.toLowerCase())
          );
          
          if (mentionedSuspect) {
            // Use the explicitly mentioned suspect
            matchedSuspect = mentionedSuspect;
          } else {
            // Intelligent assignment: weapon evidence should point to culprit
            const isWeaponEvidence = entity.id === fullCase.solution.weaponId || 
                                    entity.label?.toLowerCase().includes('weapon') ||
                                    entity.label?.toLowerCase().includes('murder weapon');
            
            if (isWeaponEvidence && culprit) {
              // Weapon forensics always point to culprit
              matchedSuspect = culprit;
            } else {
              // For other forensics: 70% culprit, 30% red herring
              const matchCulprit = Math.random() > 0.3;
              if (matchCulprit && culprit) {
                matchedSuspect = culprit;
              } else if (innocents.length > 0) {
                matchedSuspect = innocents[Math.floor(Math.random() * innocents.length)];
              } else {
                matchedSuspect = culprit;
              }
            }
          }
          
          // Fallback (should not happen after hydration)
          if (!matchedSuspect) {
            matchedSuspect = fullCase.suspects[0];
          }

          // Assign forensic data based on type
          if (entity.metadata.forensicType === 'DNA') {
               entity.forensicData = {
                   type: 'DNA',
                   value: matchedSuspect.dnaSequence,
                   description: `DNA profile: ${matchedSuspect.dnaSequence}`
               };
          } else if (entity.metadata.forensicType === 'FINGERPRINT') {
               entity.forensicData = {
                   type: 'FINGERPRINT',
                   value: matchedSuspect.fingerprintPattern,
                   description: `Fingerprint: ${matchedSuspect.fingerprintPattern}`
               };
          } else if (entity.metadata.forensicType === 'BLOOD') {
                entity.forensicData = {
                   type: 'BLOOD',
                   value: matchedSuspect.bloodType,
                   description: `Blood Type: ${matchedSuspect.bloodType}`
               };
          }
      }
      
      // C. If it's a visual asset, generate the Image URL
      // Suspects are in a different array, so we handle entities here (PHOTO, OBJECT)
      if (entity.type === EntityType.PHOTO || entity.type === EntityType.OBJECT) {
          // Use 'description' as the base, and maybe expand with visual details if available
          // Note: Our schema mapping put 'description' in entity.description
          const prompt = constructPrompt(entity as any, entity.description); 
          try {
            const b64Image = await generateAssetImage(prompt);
            entity.imageUrl = b64Image;
          } catch (err) {
              console.warn(`Failed to generate image for ${entity.id}`, err);
          }
      }
  }));

  // 3. Hydrate Suspects (Images)
  await Promise.all(fullCase.suspects.map(async (suspect) => {
      // Construct a temporary entity-like object for the prompt helper
      const tempEntity = {
          type: EntityType.SUSPECT,
          name: suspect.name,
          description: suspect.bio,
          notes: suspect.notes, 
          // visualTags is on suspect
          metadata: { location: "Police Station" }
      };
      
      const prompt = constructPrompt(tempEntity as any, suspect.visualTags);
      try {
        const b64Image = await generateAssetImage(prompt);
        suspect.photoUrl = b64Image;
      } catch (err) {
          console.warn(`Failed to generate image for suspect ${suspect.id}`, err);
      }
  }));
  
  // Post-process positions (Legacy logic to place items on desk)
  fullCase.entities = fullCase.entities.map((e, i) => ({
    ...e,
    position: [
      (Math.random() - 0.5) * 0.8, 
      0.9 + (i * 0.08),            
      (Math.random() - 0.5) * 0.5 
    ],
    rotation: [0, (Math.random() - 0.5) * Math.PI, 0] 
  }));

  // VALIDATION: Check case playability before returning
  const validation = validateCasePlayability(fullCase);
  if (!validation.isValid) {
    console.error("❌ Generated case has validation errors:");
    validation.errors.forEach(e => console.error(`   - ${e}`));
    throw new Error(`Case generation failed validation: ${validation.errors.join(', ')}`);
  }
  if (validation.warnings.length > 0) {
    console.warn("⚠️  Generated case warnings:");
    validation.warnings.forEach(w => console.warn(`   - ${w}`));
  }

  return fullCase;
};


export const generateTTS = async (text: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts", 
      contents: [{ parts: [{ text }] }],
      config: {
        responseMimeType: "audio/mp3" // Requesting audio mime type if supported by SDK config, or just relying on model default
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
     if (parts) {
       for (const part of parts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
         }
       }
     }
     console.warn("TTS: No inline audio data found.");
     return "";

  } catch (e) {
    console.error("TTS Generation failed", e);
    return "";
  }
};

export const generateDocumentContent = async (
  templateId: string,
  caseContext: any
): Promise<any> => {
  const ai = getAI();
  const modelName = "gemini-3-pro-preview"; // Corrected from gemini-3

  let schema: Schema = UNIVERSAL_SCHEMA;
  let prompt = "";

  // Select schema and prompt based on templateId
  switch (templateId) {
    case "autopsy-report":
      schema = TEMPLATE_SCHEMAS["autopsy-report"];
      prompt = `Generate a forensically accurate autopsy report for the victim in this case.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Ensure the findings align with the generated 'causeOfDeath' and 'weapon'.
      Use medical terminology.`;
      break;

    case "search-warrant":
      schema = TEMPLATE_SCHEMAS["search-warrant"];
      prompt = `Generate a judicial search warrant schema.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      The warrant should authorize the search of a suspect's property or the crime scene.
      Make up a judge and court details if not provided.`;
      break;

    case "bank-statement":
      schema = TEMPLATE_SCHEMAS["bank-statement"];
      prompt = `Generate a bank statement showing suspicious financial activity.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Include regular transactions mixed with 1 or 2 large unusual withdrawals or deposits that hint at the motive.
      Dates should be leading up to the murder date.`;
      break;

    case "incident-report":
      schema = TEMPLATE_SCHEMAS["incident-report"];
      prompt = `Generate a police incident report.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Describe the initial response to the crime scene or a related prior incident.`;
      break;

    case "email-printout":
      schema = TEMPLATE_SCHEMAS["email-printout"];
      prompt = `Generate an email thread printout relevant to the investigation.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      The email should reveal a motive, a connection between suspects, or a hidden secret.`;
      break;

    case "news-clipping":
      schema = TEMPLATE_SCHEMAS["news-clipping"];
      prompt = `Generate a newspaper clipping about the crime or a related event.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Write in a journalistic style. It could be about the murder itself, or a past scandal involving the victim.`;
      break;

    case "forensic-report":
      schema = TEMPLATE_SCHEMAS["forensic-report"];
      prompt = `Generate a detailed forensic lab report.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      This report analyzes a specific piece of evidence (DNA, Blood, Fingerprint, etc) found at the scene.
      The result should match the 'forensicData' if known, otherwise invent plausible findings.`;
      break;

    case "lab-submission-form":
      schema = TEMPLATE_SCHEMAS["lab-submission-form"];
      prompt = `Generate a chain of custody lab submission form.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      List items being sent from the crime scene to the lab.`;
      break;
    
    // START NEW TYPES
    case "witness-statement":
      schema = TEMPLATE_SCHEMAS["witness-statement"];
      prompt = `Generate a handwritten witness statement form.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      The statement should provide a clue or an alibi.`;
      break;

    case "handwritten-note":
      schema = TEMPLATE_SCHEMAS["handwritten-note"];
      prompt = `Generate a loose handwritten note.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      This could be a suicide note, a hurried scribble, or a reminder found in a pocket.`;
      break;

    case "internal-memo":
      schema = TEMPLATE_SCHEMAS["internal-memo"];
      prompt = `Generate a corporate or government internal memo.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Use formal language but imply hidden agendas.`;
      break;

    case "boarding-pass":
      schema = TEMPLATE_SCHEMAS["boarding-pass"];
      prompt = `Generate data for an airline boarding pass.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      The date and flight should be relevant to a suspect's movement.`;
      break;

    case "case-file-cover":
      schema = TEMPLATE_SCHEMAS["case-file-cover"];
      prompt = `Generate the cover sheet data for this case file.
      CASE CONTEXT: ${JSON.stringify(caseContext)}`;
      break;

    case "crime-scene-sketch":
      schema = TEMPLATE_SCHEMAS["crime-scene-sketch"];
      prompt = `Generate the metadata for a crime scene sketch.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Describe the location and list items found in the legend.`;
      break;
    // END NEW TYPES

    case "transcript":
    case "transcript-excerpt":
    case "interview-transcript":
      schema = TEMPLATE_SCHEMAS["transcript"];
      prompt = `Generate a dialogue transcript.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Create a realistic interrogation or wiretap log.`;
      break;

    default:
      // Generic fallback
      schema = UNIVERSAL_SCHEMA;
      prompt = `Generate document content for a document titled '${templateId}'.
      CASE CONTEXT: ${JSON.stringify(caseContext)}
      
      Create realistic sections and metadata suitable for a modern professional investigation.`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: schema, // <--- Explicitly enforcing schema here
      },
    });

    const text = getResponseText(response);
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error(`Failed to parse document JSON for template "${templateId}":`, e);
      console.error("Response text:", text);
      throw new Error(`Document JSON parse error for ${templateId}: ${e}`);
    }
  } catch (error: any) {
    console.error(`generateDocumentContent failed for template "${templateId}":`, error);
    if (error?.message?.includes("nesting depth")) {
      throw new Error(`Schema too complex for template "${templateId}". Gemini API rejected it due to nesting depth.`);
    }
    throw error;
  }
};

// =============================================================================
// IMAGE STORAGE - Upload helper for Supabase bucket storage
// =============================================================================

/**
 * Upload a base64 image to Supabase bucket and return the public URL
 * @param base64Image - Base64 encoded image with or without data URI prefix
 * @param filename - Filename for the uploaded image (without path)
 * @returns Public URL of the uploaded image
 */
const uploadImageToSupabase = async (base64Image: string, filename: string): Promise<string> => {
  try {
    // Strip the data URI prefix if present (e.g. "data:image/png;base64,")
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    // Convert base64 to Blob
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    // Upload to Supabase bucket
    const filepath = `case-assets/${filename}`;
    const { data, error } = await supabase.storage
      .from('case-assets')
      .upload(filepath, blob, { upsert: true });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from Supabase upload');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('case-assets')
      .getPublicUrl(filepath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to get public URL from Supabase');
    }

    console.log(`✓ Image uploaded to: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

// =============================================================================
// IMAGE GENERATION - Used by both main app and sub-apps
// =============================================================================

// Restored the Unreal Engine 5 Game Art style as requested, but added "forensic aesthetic"
export const STYLE_SUFFIX = "Rendered in Unreal Engine 5, high fidelity 3D game art, cinematic lighting, volumetric fog, detailed textures, realistic atmosphere, clinical lighting, forensic aesthetic.";

// Aggressive Negative Prompts to ensure NO UI appears in the game art
export const NEGATIVE_PROMPT_COMMON = "UI, HUD, interface, text, watermark, health bar, minimap, crosshair, icons, menu, subtitles, game overlay, button prompt, cartoon, low poly, drawing, anime, sketch, painting, 2D, a placard, board";

export const NEGATIVE_PROMPT_SCENE = `--no ${NEGATIVE_PROMPT_COMMON}, bright daylight, flat lighting, blur`;
export const NEGATIVE_PROMPT_CHARACTER = `--no ${NEGATIVE_PROMPT_COMMON}, smiling, posing, perfect skin, makeup, symmetrical face, fashion model`;
export const NEGATIVE_PROMPT_OBJECT = `--no ${NEGATIVE_PROMPT_COMMON}, floating object, white background, vector art`;

export const generateAssetImage = async (prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "MOCK_KEY") throw new Error("API Key not found or is mock");
  
  const ai = new GoogleGenAI({ apiKey });

  // Use the constants to enhance the prompt if it doesn't already have them
  // We identify the type of prompt by simple keyword matching since we don't have the entity type passed here directly
  // This is a partial workaround. Ideally generateAssetImage should take an entity type.
  
  let enhancedPrompt = prompt;
  if (!prompt.includes("Unreal Engine 5")) {
      if (prompt.includes("person") || prompt.includes("suspect") || prompt.includes("portrait")) {
          enhancedPrompt = `A cinematic Unreal Engine 5 character shot of ${prompt}. Moody, dramatic lighting. ${STYLE_SUFFIX} ${NEGATIVE_PROMPT_CHARACTER}`;
      } else if (prompt.includes("scene") || prompt.includes("room") || prompt.includes("place")) {
          enhancedPrompt = `A first-person detective game screenshot looking at ${prompt}. Atmospheric. ${STYLE_SUFFIX} ${NEGATIVE_PROMPT_SCENE}`;
      } else {
         enhancedPrompt = `A highly detailed close-up 3D render of ${prompt}. In-game asset inspection view. Dramatic rim lighting. ${STYLE_SUFFIX} ${NEGATIVE_PROMPT_OBJECT}`;
      }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Corrected from gemini-2.5-flash-image
      contents: [
        {
          text: enhancedPrompt
        }
      ],
      config: {
        // safetySettings...
      }
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    let textResponse = "";
    let base64Image: string | null = null;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
        if (part.text) {
            textResponse += part.text;
        }
      }
    }
    
    if (!base64Image) {
      console.log("Full Gemini Response for Image Gen Error:", JSON.stringify(response, null, 2));
      if (textResponse) {
          throw new Error("Gemini returned text instead of image: " + textResponse.substring(0, 200) + "...");
      }
      throw new Error("No image data received from Gemini. Check console for full response object.");
    }

    // Upload to Supabase and get public URL
    const timestamp = Date.now();
    const filename = `asset-${timestamp}-${Math.random().toString(36).substring(7)}.png`;
    const publicUrl = await uploadImageToSupabase(base64Image, filename);
    
    return publicUrl;

  } catch (error) {
    console.error("Error generating asset:", error);
    throw error;
  }
};

export const editAssetImage = async (base64Image: string, instruction: string): Promise<string> => {
   const apiKey = getApiKey();
  if (!apiKey || apiKey === "MOCK_KEY") throw new Error("API Key not found or is mock");

  const ai = new GoogleGenAI({ apiKey });

  // Strip the prefix if present (e.g. "data:image/png;base64,")
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image; 
  // Naive mime type extraction, usually safe to assume standard types or pass 'image/png' if unsure
  const mimeType = base64Image.includes(':') ? base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';')) : 'image/png';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'image/png',
            },
          },
          {
            text: instruction, 
          },
        ]
      },
      config: {
        // safetySettings...
      }
    });

     // Iterate through parts to find the image
     const parts = response.candidates?.[0]?.content?.parts;
     let editedBase64: string | null = null;
     
     if (parts) {
       for (const part of parts) {
         if (part.inlineData && part.inlineData.data) {
           editedBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
           break;
         }
       }
     }
     
     if (!editedBase64) {
       throw new Error("No image data received from Gemini after edit.");
     }

     // Upload edited image to Supabase and return URL
     const timestamp = Date.now();
     const filename = `asset-edited-${timestamp}-${Math.random().toString(36).substring(7)}.png`;
     const publicUrl = await uploadImageToSupabase(editedBase64, filename);
     
     return publicUrl;

  } catch (error) {
    console.error("Error editing asset:", error);
    throw error;
  }
};

const enrichmentResultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    content: { type: Type.STRING },
    metadata: { 
        type: Type.OBJECT,
        properties: {
             // We allow typical metadata fields used in our app
             location: { type: Type.STRING },
             author: { type: Type.STRING },
             date: { type: Type.STRING },
             notes: { type: Type.STRING },
             fields: {
                type: Type.OBJECT,
                description: "Dynamic fields for templates. Use string values for keys.",
                nullable: true
             }
        }
    }
  },
  required: ["content", "metadata"]
};

// =============================================================================
// EVIDENCE ENRICHMENT - Used by main app (CaseEditor wizard)
// Optimized to use targeted schemas instead of sending all template metadata
// =============================================================================

export const enrichEvidenceItem = async (item: EvidenceItem, caseContext: CaseFile): Promise<EvidenceItem> => {
    const ai = getAI();
    const modelName = "gemini-3-pro-preview";

    // SIMPLIFIED APPROACH: Use basic schema for enrichment, then generate complex fields separately
    // This avoids Gemini's "maximum nesting depth" error with complex template schemas
    const tid = item.metadata?.templateId;
    const resolvedTemplateId = tid || (item.type === EvidenceType.PAPER ? getTemplateForEvidence(item) : undefined);

    // For PAPER items with templates, use generateDocumentContent directly (avoids nesting)
    if (resolvedTemplateId && item.type === EvidenceType.PAPER) {
        try {
            console.log(`Generating document content for "${item.label}" (template: ${resolvedTemplateId})`);
            const fields = await generateDocumentContent(resolvedTemplateId, caseContext);
            console.log(`✓ Successfully generated fields for "${item.label}"`);
            return {
                ...item,
                content: item.content || item.description || `Content for ${item.label}`,
                metadata: {
                    ...item.metadata,
                    templateId: resolvedTemplateId,
                    fields: fields,
                    location: item.metadata?.location || "Evidence Locker"
                }
            };
        } catch (error: any) {
            console.error(`✗ Document content generation failed for "${item.label}" (template: ${resolvedTemplateId}):`, error?.message || error);
            // Fallback: return with minimal metadata
            return {
                ...item,
                metadata: {
                    ...item.metadata,
                    templateId: resolvedTemplateId,
                    fields: {}, // Empty fields will fail validation
                    location: item.metadata?.location || "Evidence Locker"
                }
            };
        }
    }

    // For FORENSIC items, use simple schema
    let schema = enrichmentResultSchema;
    if (item.type === 'FORENSIC_SAMPLE' || item.metadata?.forensicType) {
         schema = { 
            type: Type.OBJECT, 
            properties: { 
                content: {type: Type.STRING}, 
                metadata: { 
                    type: Type.OBJECT, 
                    properties: { 
                        forensicType: { type: Type.STRING },
                        forensicData: { 
                            type: Type.OBJECT, 
                            properties: { 
                                type: {type: Type.STRING}, 
                                value: {type: Type.STRING}, 
                                description: {type: Type.STRING} 
                            } 
                        } 
                    } 
                } 
            }, 
            required: ["content", "metadata"] 
        };
    }

    const systemInstruction = `
You are a Forensic Author for a detective game set in the present day.
Your task is to EXPAND a brief evidence summary into a fully realized, detailed artifact.

For FORENSICS (DNA, Fingerprints):
- If forensic data values are NOT provided in the input, generate realistic raw data values.
- If they ARE provided (e.g. from suspect matching), PRESERVE THEM EXACTLY.

CRITICAL:
- PRESERVE the original clues and contradictions exactly.
- Do NOT change the facts content, only expand the format.
`;

    const promptItem = item;

    const prompt = `
Evidence Item to Enrich:
  ${JSON.stringify(promptItem)}

Case Context:
Title: ${caseContext.title}
Summary: ${caseContext.briefing}
`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseJsonSchema: schema
            }
        });

        const text = getResponseText(response);
        const result = JSON.parse(text);

        // Extract forensicData if it was generated inside metadata
        let forensicData = item.forensicData;
        if (result.metadata && result.metadata.forensicData) {
            const newForensics = result.metadata.forensicData;
            // Only overwrite if we don't already have valid forensic data (preserves suspect matching)
            if (!forensicData?.value || forensicData.value === "PENDING") {
                forensicData = newForensics;
            }
            delete result.metadata.forensicData;
        }

        const mergedMetadata = {
          ...item.metadata,
          ...result.metadata
        } as any;

        return {
          ...item,
          content: result.content || item.content,
          forensicData: forensicData,
          metadata: mergedMetadata
        };

    } catch (error) {
        console.error("Enrichment failed:", error);
        // Fallback: return original item
        return item;
    }
};

// --- Staged Generation Pipelines ---

// =============================================================================
// WIZARD GENERATION PIPELINE - Used by main app (CaseEditor wizard steps)
// Step 1: Generate Narrative → Step 2: Generate Evidence Manifest → Step 3: Enrich Items
// =============================================================================

const narrativeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    briefing: { type: Type.STRING },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING },
          event: { type: Type.STRING }
        },
        required: ["time", "event"]
      }
    },
    suspects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          motive: { type: Type.STRING },
          alibi: { type: Type.STRING },
          isCulprit: { type: Type.BOOLEAN }
        },
        required: ["id", "name", "role", "motive", "alibi", "isCulprit"]
      }
    },
    victim: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        background: { type: Type.STRING },
        causeOfDeath: { type: Type.STRING }
      },
      required: ["name", "background", "causeOfDeath"]
    },
    solution: {
      type: Type.OBJECT,
      properties: {
        culpritId: { type: Type.STRING },
        weaponId: { type: Type.STRING },
        motive: { type: Type.STRING },
        reasoning: { type: Type.STRING }
      },
      required: ["culpritId", "weaponId", "motive", "reasoning"]
    }
  },
  required: ["title", "briefing", "timeline", "suspects", "victim", "solution"]
};

// =============================================================================
// WIZARD GENERATION PIPELINE - Used by main app (CaseEditor wizard steps)
// =============================================================================

export async function generateNarrative(scenario: CaseScenario): Promise<CaseNarrative> {
  const genAI = getAI();
  const prompt = `
    Generate a Case Narrative based on this scenario:
    Theme: ${scenario.theme}
    Difficulty: ${scenario.difficulty}
    Focus: ${scenario.focus}
    Constraints: ${scenario.constraints ? scenario.constraints.join(', ') : 'None'}

    Create a compelling, modern-day mystery.
    Use diverse, contemporary names. Avoid clichéd detective fiction names.
    Ensure there are at least 5 suspects.
    One suspect MUST be the culprit (isCulprit: true).
    The briefing should be 2-3 paragraphs.
  `;

  const response = await genAI.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: narrativeSchema
    }
  });

  const text = getResponseText(response);
  const narrative = JSON.parse(text) as CaseNarrative;
  
  // HYDRATE: Generate forensic profiles for all suspects so they're available for evidence linking
  // This ensures wizard-generated suspects have biometric data from step 1 onwards
  narrative.suspects.forEach(suspect => {
    if (!suspect.dnaSequence || suspect.dnaSequence === "PENDING") {
      const profile = generateForensicProfile();
      suspect.dnaSequence = profile.dna;
    }
    if (!suspect.fingerprintPattern || suspect.fingerprintPattern === "PENDING") {
      const profile = generateForensicProfile();
      suspect.fingerprintPattern = profile.fingerprint;
    }
    if (!suspect.bloodType || suspect.bloodType === "PENDING") {
      const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
      suspect.bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    }
  });
  
  return narrative;
}

const evidenceManifestSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["PAPER", "PHOTO", "OBJECT", "FORENSIC_SAMPLE", "AUDIO"] },
            label: { type: Type.STRING },
            description: { type: Type.STRING },
            intendedClue: { type: Type.STRING },
            templateId: { type: Type.STRING, enum: AVAILABLE_TEMPLATES },
            transcript: { type: Type.STRING },
            isLocked: { type: Type.BOOLEAN },
            forensicType: { type: Type.STRING, enum: ["DNA", "FINGERPRINT", "BLOOD"] },
            // ADDED: Forensic Data Structure
            forensicData: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ["DNA", "FINGERPRINT", "BLOOD"] },
                    value: { type: Type.STRING, description: "The DNA sequence, print pattern, or blood type" },
                    description: { type: Type.STRING, description: "Scientific interpretation" }
                },
                nullable: true
            },
            imageUrl: { type: Type.STRING, nullable: true }
        },
        required: ["id", "type", "label", "description", "intendedClue"]
      }
    }
  },
  required: ["items"]
};

export async function generateEvidenceManifest(narrative: CaseNarrative): Promise<EvidenceManifest> {
  const genAI = getAI();
  
  // Get culprit for intelligent forensic linking
  const culprit = narrative.suspects.find(s => s.isCulprit);
  const innocents = narrative.suspects.filter(s => !s.isCulprit);
  
  const prompt = `
    Based on the following case narrative, generate a list of 12-15 evidence items.
    
    Title: ${narrative.title}
    Briefing: ${narrative.briefing}
    Victim: ${narrative.victim.name} (${narrative.victim.causeOfDeath})
    Solution: ${JSON.stringify(narrative.solution)}
    
    CULPRIT DETAILS (For intelligent forensic linking):
    - Name: ${culprit?.name}
    - DNA: ${culprit?.dnaSequence}
    - Fingerprint: ${culprit?.fingerprintPattern}
    - Blood Type: ${culprit?.bloodType}
    
    OTHER SUSPECTS (For red herring evidence):
    ${innocents.map(s => `- ${s.name}: DNA=${s.dnaSequence}, Fingerprint=${s.fingerprintPattern}, Blood=${s.bloodType}`).join('\n')}

    VALID TEMPLATE IDS: ${AVAILABLE_TEMPLATES.join(', ')}

    Ensure a mix of evidence types that make sense for this specific story:
    - PAPER: Documents, letters, notes. (MUST include templateId from the valid list.)
    - PHOTO: Crime scene photos. (Set imageUrl to "PENDING".)
    - OBJECT: Physical items (weapons, personal effects).
    - FORENSIC_SAMPLE: DNA, blood, fingerprints. (MUST include forensicType and forensicData with value + description.)
    
    DIGITAL & AUDIO EVIDENCE (Use where appropriate for the plot):
    - AUDIO: Voicemails, wiretaps, recorded confessions. Must include a 'transcript'.
    - LOCKED DEVICES: Phones, laptops, encrypted drives. Must set 'isLocked': true and provide 'transcript/content' for the unlocked data.

    CRITICAL FORENSIC INSTRUCTIONS:
    1. NEVER use "PENDING" for forensicData.value - always provide a real value
    2. For forensic samples: forensicData.value MUST be exactly one of:
       - A DNA sequence (e.g., "ATGC-TATA-CGAT-GGTA")
       - A fingerprint pattern (e.g., "Loop-Arch-Whorl")
       - A blood type (e.g., "O+", "AB-")
    3. Include 3-4 forensic samples that DIRECTLY match the culprit's DNA/fingerprint/blood
    4. Include 2-3 red herring forensics that match innocent suspects
    5. The Murder Weapon MUST have forensic evidence (blood or fingerprints from culprit)

    Crucial:
    1. Include the "Boring List": A long document hiding a small anomaly.
    2. Include "Red Herrings": Evidence pointing to innocent suspects with strong motives.
    3. Ensure the Murder Weapon is present or implied.
    4. MATCH IDs: If the narrative mentions a weapon, ensure one item represents it.
  `;


  const response = await genAI.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: evidenceManifestSchema
    }
  });

  const text = getResponseText(response);
  const manifest = JSON.parse(text) as EvidenceManifest;

  // Post-process: ensure PAPER items have a templateId, FORENSIC_SAMPLE has forensicType,
  // and most importantly, validate forensicData values are non-PENDING
  manifest.items = manifest.items.map((item) => {
    const normalizedType = (item.type || "").toUpperCase();
    const isPaper = normalizedType === EvidenceType.PAPER;
    const isForensic = normalizedType === EvidenceType.FORENSIC_SAMPLE;

    let templateId = item.templateId;
    if (isPaper && !templateId) {
      templateId = getTemplateForEvidence({
        id: item.id,
        type: EvidenceType.PAPER,
        label: item.label,
        content: item.description || "",
        metadata: {}
      } as EvidenceItem);
    }

    let forensicType = item.forensicType;
    if (isForensic && !forensicType) {
      forensicType = "DNA";
    }

    // VALIDATION: If forensic value is PENDING or missing, generate one based on suspect data
    if (isForensic && (!item.forensicData?.value || item.forensicData.value === "PENDING")) {
      // Decide: should this match culprit or be a red herring?
      const isCulpritMatch = Math.random() > 0.4; // 60% chance this matches culprit
      const targetSuspect = isCulpritMatch ? culprit : innocents[Math.floor(Math.random() * innocents.length)];
      
      if (targetSuspect) {
        if (forensicType === "DNA") {
          item.forensicData = {
            type: "DNA",
            value: targetSuspect.dnaSequence,
            description: `DNA profile matches ${targetSuspect.name}`
          };
        } else if (forensicType === "FINGERPRINT") {
          item.forensicData = {
            type: "FINGERPRINT",
            value: targetSuspect.fingerprintPattern,
            description: `Fingerprint pattern: ${targetSuspect.fingerprintPattern}`
          };
        } else if (forensicType === "BLOOD") {
          item.forensicData = {
            type: "BLOOD",
            value: targetSuspect.bloodType,
            description: `Blood type: ${targetSuspect.bloodType}`
          };
        }
      }
    }

    return {
      ...item,
      templateId,
      forensicType
    };
  });

  return manifest;
}
