import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DocumentType } from "../types";
import { DOCUMENT_REGISTRY } from "./documentRegistry";

const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY is missing");
  }
  return key;
};

// --- SPECIFIC SCHEMAS --- 
// Kept for high-fidelity templates (Autopsy, Warrant)
const autopsySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    caseNumber: { type: Type.STRING },
    decedentName: { type: Type.STRING },
    dateOfDeath: { type: Type.STRING },
    timeOfDeath: { type: Type.STRING },
    examinerName: { type: Type.STRING },
    externalFindings: { type: Type.STRING },
    internalFindings: { type: Type.STRING },
    causeOfDeath: { type: Type.STRING },
    mannerOfDeath: { type: Type.STRING },
    toxicologyNotes: { type: Type.STRING },
  },
  required: ["caseNumber", "decedentName"],
};

const warrantSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    warrantId: { type: Type.STRING },
    judgeName: { type: Type.STRING },
    targetAddress: { type: Type.STRING },
    targetPerson: { type: Type.STRING },
    itemsToSeize: { type: Type.ARRAY, items: { type: Type.STRING } },
    probableCause: { type: Type.STRING },
    dateIssued: { type: Type.STRING },
    expiryDate: { type: Type.STRING },
  },
  required: ["warrantId", "targetAddress"],
};

const bankStatementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bankName: { type: Type.STRING },
    accountHolder: { type: Type.STRING },
    accountNumber: { type: Type.STRING },
    statementPeriod: { type: Type.STRING },
    startingBalance: { type: Type.STRING },
    endingBalance: { type: Type.STRING },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          amount: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['DEBIT', 'CREDIT'] }
        },
        required: ["date", "description", "amount"]
      }
    }
  },
  required: ["bankName", "transactions", "startingBalance", "endingBalance"]
};

const transcriptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    caseNumber: { type: Type.STRING },
    date: { type: Type.STRING },
    location: { type: Type.STRING },
    interviewers: { type: Type.ARRAY, items: { type: Type.STRING } },
    interviewees: { type: Type.ARRAY, items: { type: Type.STRING } },
    recordingDuration: { type: Type.STRING },
    dialogue: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: { type: Type.STRING },
          timestamp: { type: Type.STRING },
          text: { type: Type.STRING },
          action: { type: Type.STRING, description: "Non-verbal actions like (coughs), (sighs)" }
        },
        required: ["speaker", "text"]
      }
    }
  },
  required: ["interviewers", "interviewees", "dialogue"]
};

// --- UNIVERSAL SCHEMA ---
// Used for the Generic Report Template
// NOTE: properties cannot be empty for OBJECT type in Gemini API.
// We use arrays of key-value pairs for metadata and transform them back to objects.
const universalSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Main title of the document" },
    subtitle: { type: Type.STRING, description: "Secondary title or form name" },
    headerMetadata: { 
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING }
        },
        required: ["key", "value"]
      },
      description: "List of key-value pairs for top of document (Date, To, From, Case #)" 
    },
    bodySections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Section header (optional)" },
          content: { type: Type.STRING, description: "Paragraph text. VARY LENGTHS. Can be Markdown." }
        },
        required: ["content"]
      }
    },
    footerMetadata: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING }
        },
        required: ["key", "value"]
      },
      description: "List of key-value pairs for footer (System ID, Page #)"
    },
    signatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Names of people signing the doc"
    }
  },
  required: ["title", "bodySections"]
};

export const generateDocumentContent = async (
  type: DocumentType,
  context: string
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const config = DOCUMENT_REGISTRY[type];
  
  // Select Schema based on Type
  let schema: Schema;
  if (type === DocumentType.AUTOPSY_REPORT) schema = autopsySchema;
  else if (type === DocumentType.SEARCH_WARRANT) schema = warrantSchema;
  else if (type === DocumentType.BANK_STATEMENT) schema = bankStatementSchema;
  else if (type === DocumentType.TRANSCRIPT_INTERVIEW) schema = transcriptSchema;
  else schema = universalSchema;

  let systemInstruction = config 
    ? config.systemPrompt 
    : "Generate a realistic official document based on the request.";

  // Append strict formatting instruction to prevent "3-paragraph" uniformity
  if (schema === universalSchema) {
    systemInstruction += `
    CRITICAL STRUCTURE INSTRUCTIONS:
    - Avoid uniform 3-paragraph structures.
    - Vary the number of bodySections. Some documents need 1 large section, others need 5 short ones.
    - Use bullet points (markdown) within content for lists.
    - For forms, use multiple short sections.
    - For narratives, use longer paragraphs.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a ${config?.label || type} based on this context: ${context}. 
                 Ensure the tone is authentic to the document type.
                 For dates, use realistic past dates relative to 'now'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini");
    
    let result = JSON.parse(text);

    // Transform array-based metadata back to objects for the UniversalDocumentData interface
    if (schema === universalSchema) {
      if (Array.isArray(result.headerMetadata)) {
        result.headerMetadata = result.headerMetadata.reduce((acc: Record<string, string>, item: any) => {
          if (item.key && item.value) acc[item.key] = item.value;
          return acc;
        }, {});
      }
      
      if (Array.isArray(result.footerMetadata)) {
        result.footerMetadata = result.footerMetadata.reduce((acc: Record<string, string>, item: any) => {
          if (item.key && item.value) acc[item.key] = item.value;
          return acc;
        }, {});
      }
    }
    
    return result;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};