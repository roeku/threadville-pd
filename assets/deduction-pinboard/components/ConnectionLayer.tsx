
import React, { useMemo } from 'react';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { BoardNode, Connection, ConnectionType, InteractionState } from '../types';

interface Props {
  nodes: BoardNode[];
  connections: Connection[];
  interaction: InteractionState;
}

const ConnectionLayer: React.FC<Props> = ({ nodes, connections, interaction }) => {
  
  const getPinPos = (nodeId: string): [number, number, number] | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // Pin local position relative to node center
    const isEvidence = node.type !== 'NOTE';
    const height = isEvidence ? 1.8 : 1.2;
    const pinLocalY = height / 2 - 0.15;
    
    // Transform to world space
    const angle = node.rotation;
    const x = node.position[0] - Math.sin(angle) * pinLocalY;
    const y = node.position[1] + Math.cos(angle) * pinLocalY;
    
    // Z-Position: 
    // Cork is 0. 
    // Paper is 0.02 + 0.02. 
    // String should be 0.08. 
    // Pin Head is 0.1.
    const z = node.position[2] + 0.08; 

    return [x, y, z];
  };

  const getLineProps = (conn: Connection) => {
      let color = '#ef4444'; // Default Red
      let opacity = 0.8;
      let width = 2;
      let dash = false;

      if (conn.status === 'VALID') {
          color = '#fbbf24'; // Gold
          width = 4;
          opacity = 1;
      } else if (conn.status === 'INVALID') {
          color = '#525252'; // Charred Grey
          width = 1;
          opacity = 0.5;
      } else {
          // Normal State based on Type
          switch (conn.type) {
              case ConnectionType.MATCHES: color = '#ef4444'; break; // Red Thread
              case ConnectionType.CONTRADICTS: color = '#3b82f6'; break; // Blue
              case ConnectionType.MOTIVATES: color = '#a855f7'; break; // Purple
              case ConnectionType.LOCATES: color = '#22c55e'; break; // Green
              case ConnectionType.UNKNOWN: color = '#ffffff'; dash = true; break;
          }
      }
      return { color, width, opacity, dash };
  };

  return (
    <group>
      {connections.map(conn => {
        const start = getPinPos(conn.fromId);
        const end = getPinPos(conn.toId);

        if (!start || !end) return null;

        // Physics: Catenary droop
        const dist = Math.hypot(start[0] - end[0], start[1] - end[1]);
        const droop = Math.min(dist * 0.2, 0.8); 
        
        const mid = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 - droop,
            (start[2] + end[2]) / 2 + 0.1 // Pull away from board slightly
        ] as [number, number, number];

        const { color, width, opacity, dash } = getLineProps(conn);

        return (
            <group key={conn.id}>
                {/* Core String */}
                <QuadraticBezierLine
                    start={start}
                    end={end}
                    mid={mid}
                    color={color}
                    lineWidth={width}
                    dashed={dash}
                    dashScale={10}
                    opacity={opacity}
                    transparent
                />
                {/* Glow Effect for Valid Connections */}
                {conn.status === 'VALID' && (
                    <QuadraticBezierLine
                        start={start}
                        end={end}
                        mid={mid}
                        color="#fcd34d"
                        lineWidth={width * 2}
                        opacity={0.3}
                        transparent
                    />
                )}
            </group>
        );
      })}

      {/* Drawing Line */}
      {interaction.linkingFromId && (
          <ActiveLine 
            startPos={getPinPos(interaction.linkingFromId)!}
            mousePos={interaction.mouseWorldPos}
          />
      )}
    </group>
  );
};

const ActiveLine = ({ startPos, mousePos }: { startPos: [number, number, number], mousePos: [number, number, number] }) => {
    // Snap end point
    const end: [number, number, number] = [mousePos[0], mousePos[1], mousePos[2] + 0.1];
    
    return (
        <QuadraticBezierLine
            start={startPos}
            end={end}
            mid={[(startPos[0] + end[0])/2, (startPos[1] + end[1])/2 - 0.2, startPos[2] + 0.2]}
            color="#ef4444"
            lineWidth={2}
            dashed
        />
    )
}

export default ConnectionLayer;
