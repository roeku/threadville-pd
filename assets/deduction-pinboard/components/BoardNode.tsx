
import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Image } from '@react-three/drei';
import * as THREE from 'three';
import { BoardNode, NodeType } from '../types';

interface Props {
  node: BoardNode;
  isLinking: boolean;
  onDragStart: () => void;
  onDragEnd: (pos: [number, number, number]) => void;
  onPinClick: (worldPos: THREE.Vector3) => void;
}

const BoardNodeMesh: React.FC<Props> = ({ node, isLinking, onDragStart, onDragEnd, onPinClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const pinRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [pinHovered, setPinHover] = useState(false);
  const [active, setActive] = useState(false);
  
  const targetPosition = useRef(new THREE.Vector3(...node.position));
  const { raycaster, camera, mouse } = useThree();

  const isEvidence = node.type === NodeType.EVIDENCE || node.type === NodeType.START;
  const isStart = node.type === NodeType.START;
  
  const width = isEvidence ? 1.5 : 1.2;
  const height = isEvidence ? 1.8 : 1.2;

  useFrame(() => {
    if (!meshRef.current) return;

    if (active) {
        // Dragging Logic
        const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.5);
        const target = new THREE.Vector3();
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(planeZ, target);

        targetPosition.current.lerp(target, 0.2);
        
        // Tilt
        const deltaX = (target.x - meshRef.current.position.x) * 2;
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, deltaX * 0.3, 0.1);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.1);
    } else {
        targetPosition.current.set(...node.position);
        meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, node.rotation, 0.1);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
    }

    meshRef.current.position.x = targetPosition.current.x;
    meshRef.current.position.y = targetPosition.current.y;
    meshRef.current.position.z = targetPosition.current.z + (active ? 0.5 : 0);
  });

  const handlePointerDown = (e: any) => {
      e.stopPropagation();
      // If clicking the PIN, trigger link
      if (pinHovered) {
          const worldPos = new THREE.Vector3();
          pinRef.current?.getWorldPosition(worldPos);
          onPinClick(worldPos);
          return;
      }
      
      // Otherwise drag card
      setActive(true);
      onDragStart();
      // @ts-ignore
      e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: any) => {
      if (active) {
        e.stopPropagation();
        setActive(false);
        onDragEnd([meshRef.current!.position.x, meshRef.current!.position.y, 0.05]);
        // @ts-ignore
        e.target.releasePointerCapture(e.pointerId);
      }
  };

  return (
    <group 
        ref={meshRef} 
        position={node.position}
        rotation={[0, 0, node.rotation]}
    >
        {/* Layer 0: Shadow Caster */}
        <mesh position={[0, 0, -0.05]} castShadow>
             <planeGeometry args={[width, height]} />
             <meshBasicMaterial transparent opacity={0} /> 
        </mesh>

        {/* Layer 1: The Card Body */}
        <mesh 
            onPointerOver={() => { setHover(true); document.body.style.cursor = 'grab'; }} 
            onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            receiveShadow
        >
            <boxGeometry args={[width, height, 0.02]} />
            <meshStandardMaterial 
                color={isStart ? "#ffebd0" : (isEvidence ? "#f5f5f0" : "#fef08a")} 
                roughness={0.6}
            />
        </mesh>

        {/* Content */}
        {isEvidence && (
            <group position={[0, 0.1, 0.021]}>
                {node.image && <Image url={node.image} scale={[width - 0.2, height - 0.8]} position={[0, 0.2, 0]} transparent />}
                <Text 
                    position={[0, -0.6, 0.01]} 
                    fontSize={0.11} 
                    color="#222" 
                    anchorX="center"
                    maxWidth={width - 0.2}
                >
                    {node.title.toUpperCase()}
                </Text>
            </group>
        )}

        {/* Pin Group - Z Layer 3 (Above String Layer) */}
        <group position={[0, height / 2 - 0.15, 0.1]}>
            {/* Invisible HITBOX for Pin - Much Larger */}
            <mesh 
                onPointerOver={(e) => { e.stopPropagation(); setPinHover(true); document.body.style.cursor = 'crosshair'; }} 
                onPointerOut={(e) => { e.stopPropagation(); setPinHover(false); }}
                onClick={(e) => {
                    e.stopPropagation();
                    const worldPos = new THREE.Vector3();
                    pinRef.current?.getWorldPosition(worldPos);
                    onPinClick(worldPos);
                }}
                visible={false}
            >
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial color="red" wireframe />
            </mesh>

            {/* Visual Pin */}
            <mesh ref={pinRef} castShadow scale={pinHovered || isLinking ? 1.3 : 1}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial 
                    color={pinHovered ? "#22c55e" : "#ef4444"} 
                    roughness={0.3} 
                    emissive={pinHovered ? "#22c55e" : "#000000"}
                    emissiveIntensity={0.5}
                />
            </mesh>
        </group>
    </group>
  );
};

export default BoardNodeMesh;
