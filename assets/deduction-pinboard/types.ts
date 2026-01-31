
export type NodeId = string;
export type SlotId = 'suspect' | 'means' | 'motive' | 'opportunity';

export enum NodeType {
  EVIDENCE = 'EVIDENCE',
  NOTE = 'NOTE',
  START = 'START', // The "Crime Scene" or Root node
}

export enum ConnectionType {
  MATCHES = 'MATCHES',           // "Is connected to", "Matches fingerprint"
  CONTRADICTS = 'CONTRADICTS',   // "Disproves", "Conflicts with"
  MOTIVATES = 'MOTIVATES',       // "Caused", "Reason for"
  LOCATES = 'LOCATES',           // "Places at scene"
  UNKNOWN = 'UNKNOWN'            // Pending selection
}

// [x, y, z]
export type Vector3Array = [number, number, number];

export interface BoardNode {
  id: NodeId;
  type: NodeType;
  title: string;
  description?: string;
  image?: string; 
  position: Vector3Array;
  rotation: number; 
  scale?: number;
}

export interface Connection {
  id: string;
  fromId: NodeId;
  toId: NodeId;
  type: ConnectionType;
  status: 'UNCHECKED' | 'VALID' | 'INVALID'; // For the circuit visualization
}

// The solution is now a set of specific valid edges
export interface EdgeSolution {
    source: string;
    target: string;
    type: ConnectionType;
}

export interface InteractionState {
  draggingNodeId: string | null;
  linkingFromId: string | null;
  hoveredPinId: string | null;
  mouseWorldPos: Vector3Array;
}

export interface IndictmentState {
  suspect: BoardNode | null;
  means: BoardNode | null;
  motive: BoardNode | null;
  opportunity: BoardNode | null;
  signed: boolean;
  stamped: boolean;
}
