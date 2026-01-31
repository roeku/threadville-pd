
export enum LinkType {
    MATCHES = 'MATCHES',           // "Is connected to", "Matches fingerprint"
    CONTRADICTS = 'CONTRADICTS',   // "Disproves", "Conflicts with"
    MOTIVATES = 'MOTIVATES',       // "Caused", "Reason for"
    LOCATES = 'LOCATES',           // "Places at scene"
    UNKNOWN = 'UNKNOWN'            // Pending selection
  }
  
  export interface EvidenceLink {
    id: string; // Unique connection ID
    fromId: string; // Item ID
    toId: string;   // Item ID
    type: LinkType;
    status: 'UNCHECKED' | 'VALID' | 'INVALID'; 
  }
  
  export interface InteractionState {
    linkingFromId: string | null;
    mouseWorldPos: [number, number, number];
    menuData: { x: number, y: number, z: number, connectionId: string } | null;
  }
