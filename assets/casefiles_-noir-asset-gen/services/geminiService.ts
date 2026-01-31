import { GoogleGenAI, Schema, Type } from "@google/genai";
import { CaseFile, EntityType, CaseEntity } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

// Models
const MODEL_IMAGE = 'gemini-2.5-flash-image';
const MODEL_LOGIC = 'gemini-3-pro-preview';
const MODEL_TEXT_FAST = 'gemini-3-flash-preview';

// --- IMAGE GENERATION ---

export const generateAssetImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: [
        {
          text: prompt
        }
      ],
      config: {
        // Nano banana models do not support responseMimeType or responseSchema
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
    
    throw new Error("No image data received from Gemini.");

  } catch (error) {
    console.error("Error generating asset:", error);
    throw error;
  }
};

export const editAssetImage = async (base64Image: string, instruction: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  const base64Data = base64Image.split(',')[1]; 
  const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';'));

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
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
        ],
      },
    });

     const parts = response.candidates?.[0]?.content?.parts;
     if (parts) {
       for (const part of parts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
         }
       }
     }
     
     throw new Error("No image data received from Gemini after edit.");

  } catch (error) {
    console.error("Error editing asset:", error);
    throw error;
  }
};

// --- CASE BLUEPRINT GENERATION ---

const caseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    caseId: { type: Type.STRING },
    title: { type: Type.STRING },
    briefing: { type: Type.STRING, description: "Detailed 3-paragraph intro." },
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
          type: { type: Type.STRING, enum: ["PAPER", "PHOTO", "OBJECT", "FORENSIC_SAMPLE"] },
          label: { type: Type.STRING },
          description: { type: Type.STRING, description: "Visual description for the 3D artist/Image Gen" },
          content: { type: Type.STRING, description: "Summary of content." },
          metadata: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              templateId: { type: Type.STRING, description: "MUST be one of: bank-statement, call-log, generic" },
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

const SYSTEM_INSTRUCTION = `
You are the Lead Narrative Designer for a high-fidelity detective game (Unreal Engine 5).
Your goal is to generate a 'Case Blueprint' that is logically sound, visually distinct, and mentally challenging.

CORE DESIGN PILLARS:
1. **The "Boring List" Mechanic**: You MUST create at least one document (Bank Statement, Call Log, Train Schedule) that is tedious to read but contains ONE critical contradiction.
2. **Visual Storytelling**: Every suspect and object needs specific 'Visual Tags' that the Art Department will use to render the assets.
3. **Forensic Validity**: The solution must rely on HARD evidence (Ballistics, DNA, Fingerprints, Autopsy Temp), not just confessions.
4. **Complexity**: Generate exactly 4 Suspects and 6-8 Evidence Entities.

THE CRIME:
Create a Noir/Tech-Noir mystery. It should feel mature, gritty, and grounded.
Avoid supernatural elements. Focus on greed, jealousy, and cold-blooded calculation.

OUTPUT:
Return ONLY valid JSON matching the provided schema.
`;

export const generateCaseBlueprint = async (): Promise<CaseFile> => {
  if (!apiKey) throw new Error("API Key not found");

  const response = await ai.models.generateContent({
    model: MODEL_LOGIC,
    contents: [{ role: "user", parts: [{ text: "Generate a new Hard difficulty murder case blueprint." }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: caseSchema
    }
  });

  const rawData = JSON.parse(response.text || "{}");
  
  // Map schema response to app types
  const entities: CaseEntity[] = [];

  // Map Suspects
  if (rawData.suspects) {
    rawData.suspects.forEach((s: any) => {
      entities.push({
        id: s.id,
        type: EntityType.SUSPECT,
        name: s.name,
        description: s.bio,
        notes: s.notes,
        visualTags: s.visualTags,
        metadata: { location: "Unknown" }
      });
    });
  }

  // Map Evidence
  if (rawData.entities) {
    rawData.entities.forEach((e: any) => {
      let type = EntityType.EVIDENCE_OBJECT;
      if (e.type === 'PHOTO') type = EntityType.EVIDENCE_PHOTO;
      if (e.type === 'PAPER') type = EntityType.EVIDENCE_PAPER;
      if (e.type === 'FORENSIC_SAMPLE') type = EntityType.FORENSIC_SAMPLE;

      entities.push({
        id: e.id,
        type: type,
        name: e.label,
        description: e.description,
        content: e.content,
        metadata: {
          location: e.metadata?.location,
          templateId: e.metadata?.templateId,
          fields: e.metadata?.fields
        },
        forensicData: e.forensicData
      });
    });
  }

  return {
    id: rawData.caseId,
    title: rawData.title,
    briefing: rawData.briefing,
    visualTheme: rawData.visualTheme,
    solution: rawData.solution,
    entities: entities
  };
};

// --- DATA GENERATION (Boring Lists) ---

export const generateHighVolumeData = async (templateId: string, context: string): Promise<any> => {
  if (!apiKey) throw new Error("API Key not found");

  let prompt = "";
  
  if (templateId === 'bank-statement') {
    prompt = `
      Context: ${context}
      Task: Generate a JSON object for a bank statement.
      Requirement: 
      1. Create an array of exactly 20 transactions.
      2. 19 transactions must be mundane, daily life items consistent with a noir setting.
      3. ONE transaction must be the 'Clue' (e.g., large withdrawal, weapon purchase).
      4. Dates must be consistent.
      
      Output Schema: { bankName: string, accountHolder: string, transactions: { date: string, description: string, amount: number, type: "DEBIT"|"CREDIT" }[] }
    `;
  } else if (templateId === 'call-log') {
     prompt = `
      Context: ${context}
      Task: Generate a JSON object for a phone call log.
      Requirement:
      1. Create an array of 15 calls.
      2. Most are random numbers or known safe contacts.
      3. One call is suspicious (timing or recipient).
      
      Output Schema: { deviceOwner: string, phoneNumber: string, logs: { timestamp: string, contactName: string, number: string, duration: string, type: "INCOMING"|"OUTGOING"|"MISSED" }[] }
     `;
  } else {
    return null;
  }

  const response = await ai.models.generateContent({
    model: MODEL_TEXT_FAST,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "{}");
}
