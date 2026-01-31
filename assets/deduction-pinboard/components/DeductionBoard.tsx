
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Text, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { INITIAL_NODES, SOLUTION_PATH } from '../constants';
import { BoardNode, Connection, ConnectionType, InteractionState, EdgeSolution } from '../types';
import BoardNodeMesh from './BoardNode';
import ConnectionLayer from './ConnectionLayer';
import RadialMenu from './RadialMenu';
import VerifySwitch from './VerifySwitch';

interface Props {
  viewState: 'DESK' | 'BOARD';
  onLinkingStateChange?: (isLinking: boolean) => void;
}

const DeductionBoard: React.FC<Props> = ({ viewState, onLinkingStateChange }) => {
  const { camera } = useThree();
  
  // --- Game State ---
  const [nodes, setNodes] = useState<BoardNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [solved, setSolved] = useState(false);

  // --- UI State ---
  const [menuData, setMenuData] = useState<{ x: number, y: number, connectionId: string } | null>(null);

  // --- Interaction State ---
  const [interaction, setInteraction] = useState<InteractionState>({
    draggingNodeId: null,
    linkingFromId: null,
    hoveredPinId: null,
    mouseWorldPos: [0, 0, 0]
  });

  // Notify parent of linking state
  useEffect(() => {
    onLinkingStateChange?.(!!interaction.linkingFromId);
  }, [interaction.linkingFromId, onLinkingStateChange]);

  // --- Camera Animation ---
  const vec = useRef(new THREE.Vector3(0, 0, 0));
  useFrame((state, delta) => {
    // DESK: Adjusted to look down at the "desk" area rather than the board bottom
    // BOARD: Centered on the pinboard
    const targetPos = viewState === 'BOARD' ? new THREE.Vector3(0, 0, 10) : new THREE.Vector3(0, -4, 12);
    const targetLookAt = viewState === 'BOARD' ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(0, -5, 0);
    
    state.camera.position.lerp(targetPos, delta * 3);
    vec.current.lerp(targetLookAt, delta * 3);
    state.camera.lookAt(vec.current);
  });

  // --- Actions ---

  const handleDragStart = (id: string) => {
    setInteraction(prev => ({ ...prev, draggingNodeId: id }));
  };

  const handleDragEnd = (id: string, finalPos: [number, number, number]) => {
    setInteraction(prev => ({ ...prev, draggingNodeId: null }));
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position: finalPos } : n));
  };

  const handlePinClick = (id: string, pinWorldPos: THREE.Vector3) => {
    // If dragging node, ignore pin clicks
    if (interaction.draggingNodeId) return;

    if (interaction.linkingFromId === id) {
      // Cancel by clicking same pin
      setInteraction(prev => ({ ...prev, linkingFromId: null }));
    } else if (interaction.linkingFromId) {
      // COMPLETE LINK
      const newId = `conn-${Date.now()}`;
      const newConn: Connection = {
        id: newId,
        fromId: interaction.linkingFromId,
        toId: id,
        type: ConnectionType.UNKNOWN, // Needs selection
        status: 'UNCHECKED'
      };
      setConnections(prev => [...prev, newConn]);
      setInteraction(prev => ({ ...prev, linkingFromId: null }));
      
      // Open Menu
      setMenuData({ x: pinWorldPos.x, y: pinWorldPos.y, connectionId: newId });

    } else {
      // START LINK
      setInteraction(prev => ({ ...prev, linkingFromId: id }));
    }
  };

  const handleBoardPointerMove = (e: any) => {
    setInteraction(prev => ({ ...prev, mouseWorldPos: [e.point.x, e.point.y, e.point.z] }));
  };

  const handleBackgroundClick = (e: any) => {
      // Cancel linking if user clicks the corkboard background
      if (interaction.linkingFromId) {
          e.stopPropagation();
          setInteraction(prev => ({ ...prev, linkingFromId: null }));
      }
  };

  const handleTypeSelect = (type: ConnectionType) => {
      if (menuData) {
          setConnections(prev => prev.map(c => c.id === menuData.connectionId ? { ...c, type } : c));
          setMenuData(null);
      }
  };

  // --- The Logic Circuit Verification ---
  const verifyCircuit = useCallback(() => {
      // 1. Reset all statuses
      let tempConns: Connection[] = connections.map(c => ({ ...c, status: 'UNCHECKED' }));
      
      // 2. Start from Root
      const queue: string[] = ['root_crimescene'];
      const visited = new Set<string>();
      
      let allValid = true;
      let validCount = 0;

      // Simple BFS to validate edges against the Solution Path
      while(queue.length > 0) {
          const currNodeId = queue.shift()!;
          if(visited.has(currNodeId)) continue;
          visited.add(currNodeId);

          // Find outgoing connections from this active node
          const outgoing = tempConns.filter(c => c.fromId === currNodeId || c.toId === currNodeId);

          outgoing.forEach(conn => {
              // Determine target relative to current
              const targetId = conn.fromId === currNodeId ? conn.toId : conn.fromId;
              
              // Don't go backwards to visited nodes (acyclic check simplification)
              if (visited.has(targetId)) return;

              // Validate this specific edge
              const isCorrect = SOLUTION_PATH.some(sol => 
                  ((sol.source === currNodeId && sol.target === targetId) || 
                   (sol.source === targetId && sol.target === currNodeId)) && // bidirectional graph for ease
                  sol.type === conn.type
              );

              if (isCorrect) {
                  // Mark valid and add target to queue
                  conn.status = 'VALID';
                  queue.push(targetId);
                  validCount++;
              } else {
                  // Connection exists but is wrong type or wrong target
                  conn.status = 'INVALID';
                  allValid = false;
              }
          });
      }
      
      setConnections(tempConns);
      
      // Check Win Condition: Did we cover all required solution edges?
      const requiredEdges = SOLUTION_PATH.length;
      if (validCount >= requiredEdges && allValid) {
          setSolved(true);
      } else {
          setSolved(false);
      }
  }, [connections]);


  return (
    <>
      <ambientLight intensity={0.2} />
      <spotLight position={[0, 0, 15]} angle={0.5} penumbra={1} intensity={1.5} castShadow color="#fffaed" />
      <pointLight position={[-5, 5, 2]} intensity={0.5} color="#ffdcae" />
      
      <color attach="background" args={['#050505']} />
      <Environment preset="night" />

      <group>
        {/* The Corkboard */}
        <mesh 
            position={[0, 0, -0.1]} 
            receiveShadow 
            onPointerMove={handleBoardPointerMove}
            onPointerDown={handleBackgroundClick}
        >
          <boxGeometry args={[12, 8, 0.2]} />
          <meshStandardMaterial color="#3e2723" roughness={1} bumpScale={0.2} />
        </mesh>
        
        {/* Dark Frame */}
        <mesh position={[0, 0, -0.2]}>
             <boxGeometry args={[12.5, 8.5, 0.1]} />
             <meshStandardMaterial color="#1a120b" roughness={0.6} />
        </mesh>

        {/* The Verify Button (Bottom Frame) */}
        <VerifySwitch position={[0, -4.5, 0.2]} onVerify={verifyCircuit} solved={solved} />

        {/* Nodes */}
        {nodes.map(node => (
            <BoardNodeMesh 
                key={node.id} 
                node={node}
                isLinking={!!interaction.linkingFromId}
                onDragStart={() => handleDragStart(node.id)}
                onDragEnd={(pos) => handleDragEnd(node.id, pos)}
                onPinClick={(pos) => handlePinClick(node.id, pos)}
            />
        ))}

        {/* Connections Layer (Z-index handled inside) */}
        <ConnectionLayer 
            nodes={nodes}
            connections={connections}
            interaction={interaction}
        />

        {/* Context Menu for Link Definition */}
        {menuData && (
            <RadialMenu 
                position={[menuData.x, menuData.y, 1]} 
                onSelect={handleTypeSelect} 
                onClose={() => {
                    // Remove the unknown connection if cancelled
                    setConnections(prev => prev.filter(c => c.id !== menuData.connectionId));
                    setMenuData(null);
                }}
            />
        )}
        
        {/* Victory Text */}
        {solved && (
            <Text position={[0, 0, 2]} fontSize={1} color="#22c55e">
                CASE CLOSED
            </Text>
        )}

      </group>
    </>
  );
};

export default DeductionBoard;
