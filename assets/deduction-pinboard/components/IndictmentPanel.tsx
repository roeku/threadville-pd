import React, { useRef, useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { IndictmentState, BoardNode, SlotId } from '../types';
import BoardNodeMesh from './BoardNode';

interface Props {
  position: [number, number, number];
  state: IndictmentState;
  draggingNodeId: string | null;
  nodes: BoardNode[];
  onDrop: (slot: SlotId, node: BoardNode) => void;
  onReturn: (node: BoardNode) => void;
  onSign: () => void;
  onStamp: () => void;
}

const IndictmentClipboard: React.FC<Props> = ({ position, state, draggingNodeId, nodes, onDrop, onReturn, onSign, onStamp }) => {
  
  const slotConfig = [
      { id: 'suspect', label: 'SUSPECT', y: 2 },
      { id: 'means', label: 'MEANS', y: 0.5 },
      { id: 'motive', label: 'MOTIVE', y: -1 },
      { id: 'opportunity', label: 'OPPORTUNITY', y: -2.5 },
  ];

  // Reuse geometry instead of creating new instances every render
  const slotGeometry = useMemo(() => new THREE.PlaneGeometry(3, 1.2), []);

  const handlePointerUpOnSlot = (e: any, slotId: string) => {
      e.stopPropagation();
      if (draggingNodeId && !state[slotId as SlotId]) {
          const node = nodes.find(n => n.id === draggingNodeId);
          if (node) onDrop(slotId as SlotId, node);
      }
  };

  return (
    <group position={position} rotation={[0, -0.2, 0]}>
        {/* The Clipboard Mesh */}
        <mesh receiveShadow>
            <boxGeometry args={[3.5, 7, 0.1]} />
            <meshStandardMaterial color="#d4c5a9" roughness={0.8} />
        </mesh>
        
        {/* Clip */}
        <mesh position={[0, 3.2, 0.1]}>
            <boxGeometry args={[2, 0.5, 0.1]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
        </mesh>

        <Text position={[0, 2.8, 0.06]} fontSize={0.2} color="black">
            ARREST WARRANT
        </Text>

        {/* Slots */}
        {slotConfig.map(slot => {
            const filledNode = state[slot.id as SlotId];
            return (
                <group key={slot.id} position={[0, slot.y, 0.06]}>
                    <Text position={[-1.4, 0.4, 0]} fontSize={0.1} color="#666" anchorX="left">
                        {slot.label}
                    </Text>
                    
                    {/* Drop Zone Box */}
                    <mesh 
                        onPointerUp={(e) => handlePointerUpOnSlot(e, slot.id)}
                        onPointerOver={() => document.body.style.cursor = draggingNodeId ? 'copy' : 'default'}
                        onPointerOut={() => document.body.style.cursor = 'auto'}
                    >
                        <planeGeometry args={[3, 1.2]} />
                        <meshBasicMaterial color="#000" wireframe opacity={0.1} transparent />
                    </mesh>

                    {/* Dashed Outline Visual */}
                    {!filledNode && (
                        <lineSegments>
                            <edgesGeometry args={[slotGeometry]} />
                            <lineDashedMaterial color="#999" dashSize={0.1} gapSize={0.05} />
                        </lineSegments>
                    )}

                    {/* Filled Node Display */}
                    {filledNode && (
                        <group scale={0.7}>
                             {/* We re-use BoardNodeMesh but static */}
                             <BoardNodeMesh 
                                node={{...filledNode, position: [0,0,0], rotation: 0}}
                                isLinking={false}
                                onDragStart={() => {}}
                                onDragEnd={() => {}}
                                onPinClick={() => {}}
                             />
                             {/* X button to remove */}
                             {!state.signed && (
                                 <mesh position={[1, 1, 0.2]} onClick={(e) => { e.stopPropagation(); onReturn(filledNode); }}>
                                     <planeGeometry args={[0.4, 0.4]} />
                                     <meshBasicMaterial color="red" />
                                     <Text position={[0,0,0.01]} fontSize={0.3}>X</Text>
                                 </mesh>
                             )}
                        </group>
                    )}
                </group>
            )
        })}

        {/* Sign & Stamp Area */}
        <group position={[0, -3.2, 0.06]}>
             <mesh onClick={onSign}>
                 <planeGeometry args={[1.5, 0.4]} />
                 <meshBasicMaterial color="white" opacity={0.5} transparent />
             </mesh>
             <Text position={[-0.5, 0, 0]} fontSize={0.1} color="#333" anchorX="right">Signature:</Text>
             {state.signed && (
                 <Text position={[0.2, 0, 0]} fontSize={0.15} color="blue">
                     Det. Holmes
                 </Text>
             )}

             {/* The Stamp Object */}
             {state.signed && (
                 <group position={[1, 0.5, 0.2]} onClick={onStamp} scale={state.stamped ? 1 : 1.1}>
                     <mesh rotation={[0.2, 0, 0]}>
                         <cylinderGeometry args={[0.4, 0.4, 0.8]} />
                         <meshStandardMaterial color="#880000" />
                     </mesh>
                     {state.stamped && (
                         <Text position={[0, 0, 0.41]} fontSize={0.3} color="#880000" rotation={[0,0, -0.2]}>
                             CASE CLOSED
                         </Text>
                     )}
                 </group>
             )}
        </group>
    </group>
  );
};

export default IndictmentClipboard;