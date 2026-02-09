import { Schema, Type } from "@google/genai";

// Centralized Gemini JSON schemas for document templates.
// These are used to generate structured metadata.fields for rendering.

export const TEMPLATE_SCHEMAS: Record<string, Schema> = {
  "autopsy-report": {
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
      toxicologyNotes: { type: Type.STRING }
    },
    required: ["caseNumber", "decedentName"]
  },
  "search-warrant": {
    type: Type.OBJECT,
    properties: {
      warrantId: { type: Type.STRING },
      judgeName: { type: Type.STRING },
      targetAddress: { type: Type.STRING },
      targetPerson: { type: Type.STRING },
      itemsToSeize: { type: Type.ARRAY, items: { type: Type.STRING } },
      probableCause: { type: Type.STRING },
      dateIssued: { type: Type.STRING },
      expiryDate: { type: Type.STRING }
    },
    required: ["warrantId", "targetAddress"]
  },
  "bank-statement": {
    type: Type.OBJECT,
    properties: {
      bankName: { type: Type.STRING },
      accountHolder: { type: Type.STRING },
      accountNumber: { type: Type.STRING },
      statementPeriod: { type: Type.STRING },
      startingBalance: { type: Type.STRING },
      endingBalance: { type: Type.STRING },
      // Flattened to string array to prevent "max nesting depth" API error
      // Instruction: "YYYY-MM-DD | Description | Amount | TYPE"
      transactions: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["bankName", "transactions", "startingBalance", "endingBalance"]
  },
  "server-log": {
    type: Type.OBJECT,
    properties: {
      source: { type: Type.STRING },
      timestampRange: { type: Type.STRING },
      entries: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Log lines format: [TIMESTAMP] [USER] Command/Output"
      }
    },
    required: ["source", "entries"]
  },
  "incident-report": {
    type: Type.OBJECT,
    properties: {
      header: { type: Type.STRING },
      subtitle: { type: Type.STRING },
      reportNumber: { type: Type.STRING },
      officer: { type: Type.STRING },
      badge: { type: Type.STRING },
      incidentType: { type: Type.STRING },
      location: { type: Type.STRING },
      datetime: { type: Type.STRING },
      narrative: { type: Type.STRING },
      supervisor: { type: Type.STRING }
    },
    required: ["header", "reportNumber", "narrative"]
  },
  "transcript-excerpt": {
    type: Type.OBJECT,
    properties: {
      source: { type: Type.STRING },
      timestampRange: { type: Type.STRING },
      speakers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            line: { type: Type.STRING }
          },
          required: ["name", "line"]
        }
      }
    },
    required: ["source", "speakers"]
  },
  "transcript": {
    type: Type.OBJECT,
    properties: {
      source: { type: Type.STRING },
      timestampRange: { type: Type.STRING },
      speakers: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            line: { type: Type.STRING }
          },
          required: ["name", "line"]
        }
      }
    },
    required: ["source", "speakers"]
  },
  "email-printout": {
    type: Type.OBJECT,
    properties: {
      from: { type: Type.STRING, description: "Sender email address including name" },
      to: { type: Type.STRING, description: "Recipient email address" },
      subject: { type: Type.STRING },
      date: { type: Type.STRING },
      body: { type: Type.STRING, description: "The email content. Should be conversational or professional depending on context." },
      attachments: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of filenames attached to the email"
      }
    },
    required: ["from", "to", "subject", "body"]
  },
  "news-clipping": {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING, description: "Catchy newspaper headline" },
      subheadline: { type: Type.STRING, description: "Secondary headline providing additional context" },
      byline: { type: Type.STRING, description: "Journalist name" },
      date: { type: Type.STRING },
      location: { type: Type.STRING, description: "Dateline location where the story originates" },
      edition: { type: Type.STRING, description: "Edition name (e.g., 'Morning Edition', 'Evening Edition')" },
      lead: { type: Type.STRING, description: "Opening paragraph (lede) summarizing the most important information" },
      body: { type: Type.STRING, description: "The article text. Should be written in journalistic style." },
      photoCaption: { type: Type.STRING, description: "Caption for accompanying photo" }
    },
    required: ["headline", "date", "body"]
  },
  "forensic-report": {
    type: Type.OBJECT,
    properties: {
      caseNumber: { type: Type.STRING },
      reportType: { type: Type.STRING, enum: ["DNA ANALYSIS", "TOXICOLOGY", "FINGERPRINT", "BALLISTICS", "AUTOPSY"] },
      analyst: { type: Type.STRING },
      date: { type: Type.STRING },
      subject: { type: Type.STRING, description: "Name of person or object analyzed" },
      evidenceId: { type: Type.STRING, description: "Chain of custody ID" },
      findings: { type: Type.STRING, description: "Detailed scientific findings" },
      matchProbability: { type: Type.STRING, description: "Statistical probability if applicable (e.g. 99.9%)" },
      status: { type: Type.STRING, enum: ["CONCLUSIVE", "INCONCLUSIVE", "PENDING"] }
    },
    required: ["reportType", "findings", "status"]
  },
  "lab-submission-form": {
    type: Type.OBJECT,
    properties: {
      caseNumber: { type: Type.STRING },
      submitter: { type: Type.STRING },
      date: { type: Type.STRING },
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            itemId: { type: Type.STRING },
            description: { type: Type.STRING },
            analysisRequested: { type: Type.STRING }
          }
        }
      }
    },
    required: ["submitter", "items"]
  },
  "witness-statement": {
    type: Type.OBJECT,
    properties: {
      header: { type: Type.STRING },
      name: { type: Type.STRING },
      timestamp: { type: Type.STRING },
      officer: { type: Type.STRING },
      body: { type: Type.STRING, description: "The witness's account of events. First person perspective." }
    },
    required: ["name", "body"]
  },
  "handwritten-note": {
    type: Type.OBJECT,
    properties: {
      author: { type: Type.STRING },
      date: { type: Type.STRING },
      body: { type: Type.STRING, description: "Informal note content. Can be cryptic or emotional." }
    },
    required: ["body"]
  },
  "internal-memo": {
    type: Type.OBJECT,
    properties: {
      organization: { type: Type.STRING, description: "Organization or department name (e.g., 'Metro Police Department')" },
      department: { type: Type.STRING, description: "Sub-department or division name" },
      memoId: { type: Type.STRING, description: "Memo reference number (e.g., 'MEM-2023-1145')" },
      from: { type: Type.STRING },
      to: { type: Type.STRING },
      date: { type: Type.STRING },
      subject: { type: Type.STRING },
      body: { type: Type.STRING, description: "Professional or secretive internal communication." },
      watermark: { type: Type.STRING, enum: ["CONFIDENTIAL", "DRAFT", "URGENT", "TOP SECRET"] },
      cc: { type: Type.STRING, description: "Carbon copy recipients (comma-separated names)" },
      attachments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of attached document names" }
    },
    required: ["from", "to", "body"]
  },
  "boarding-pass": {
    type: Type.OBJECT,
    properties: {
      airline: { type: Type.STRING },
      passenger: { type: Type.STRING },
      flight: { type: Type.STRING },
      date: { type: Type.STRING },
      from: { type: Type.STRING },
      to: { type: Type.STRING },
      seat: { type: Type.STRING },
      boardingTime: { type: Type.STRING }
    },
    required: ["passenger", "flight", "date", "from", "to"]
  },
  "case-file-cover": {
    type: Type.OBJECT,
    properties: {
      caseNumber: { type: Type.STRING },
      title: { type: Type.STRING },
      leadInvestigator: { type: Type.STRING },
      startDate: { type: Type.STRING },
      assignedTeam: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["caseNumber", "title"]
  },
  "letterhead-page": {
    type: Type.OBJECT,
    properties: {
      headerStr: { type: Type.STRING, description: "Organization name for letterhead" },
      subheader: { type: Type.STRING, description: "Tagline or establishment date" },
      sender: { type: Type.STRING, description: "Person sending the letter" },
      recipient: { type: Type.STRING, description: "Primary recipient name" },
      recipientLines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Additional recipient lines (title, address)" },
      date: { type: Type.STRING },
      subject: { type: Type.STRING, description: "Letter subject line" },
      reference: { type: Type.STRING, description: "Reference number or contract ID" },
      body: { type: Type.STRING, description: "Main letter content in formal business style" },
      enclosures: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of enclosed documents" },
      contactLine: { type: Type.STRING, description: "Contact information line" },
      footer: { type: Type.STRING, description: "Footer text with address or company info" }
    },
    required: ["body"]
  },
  "crime-scene-sketch": {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING },
      sketchNotes: { type: Type.STRING },
      legend: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      },
      measurements: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["location"]
  }
};

// Generic fallback schema for dynamic templates
export const UNIVERSAL_SCHEMA: Schema = {
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

export const getTemplateSchema = (templateId: string): Schema | undefined => TEMPLATE_SCHEMAS[templateId];
