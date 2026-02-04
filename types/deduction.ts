
export enum LinkType {
  MATCHES = 'MATCHES',           // "Is connected to", "Matches fingerprint", forensic match
  CONTRADICTS = 'CONTRADICTS',   // "Disproves", "Conflicts with", breaks alibi
  MOTIVATES = 'MOTIVATES',       // "Caused", "Reason for", shows motive
  LOCATES = 'LOCATES',           // "Places at scene", timeline/location evidence
  UNKNOWN = 'UNKNOWN'            // Pending selection
}

export type LinkStatus = 'UNCHECKED' | 'VALID' | 'INVALID';

export interface EvidenceLink {
  id: string;                    // Unique connection ID
  fromId: string;                // Item ID or Suspect ID
  toId: string;                  // Item ID or Suspect ID
  type: LinkType;
  status: LinkStatus;
  reasoning?: string;            // Why this link is valid/invalid
}

export interface InteractionState {
  linkingFromId: string | null;
  mouseWorldPos: [number, number, number];
  menuData: { x: number, y: number, z: number, connectionId: string } | null;
}

// ===== DEDUCTION RULES AND VALIDATION =====

export interface SolutionRule {
  id: string;
  source: string;                // Evidence/Suspect ID (from)
  target: string;                // Evidence/Suspect ID (to)
  type: LinkType;                // Expected connection type
  description: string;           // "DNA matches suspect's profile"
  weight: number;                // 1=critical (must include), 0.5=supporting
  reasoning: string;             // Why this connection is valid
  isRedHerring?: boolean;        // True if this is a deliberate false lead
}

export interface DeductionState {
  caseId: string;
  rules: SolutionRule[];
  criticalRuleIds: string[];     // IDs of must-include rules
  culpritId: string;
  weaponId: string;
  culpritProfileId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  weight: number;                // How important this connection is
}
