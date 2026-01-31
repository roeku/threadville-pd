import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Center, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Fix for TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      spotLight: any;
      color: any;
    }
  }
}

interface Props {
  textureUrls: string[] | null;
  aspectRatio: number; // width / height
}

interface PageMeshProps {
  url: string;
  aspectRatio: number;
  index: number;
  currentPage: number;
}

const PageMesh: React.FC<PageMeshProps> = ({ url, aspectRatio, index, currentPage }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, url);
  
  // Calculate mesh size
  const height = 2.8;
  const width = height * aspectRatio;

  // Stable random rotation for realism
  const randomRot = useMemo(() => (Math.random() - 0.5) * 0.05, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Target positions based on state
    let targetPos = new THREE.Vector3();
    let targetRot = new THREE.Euler(0, 0, 0);

    if (index === currentPage) {
      // ACTIVE: Center stage
      targetPos.set(0, 0, 0);
      targetRot.set(0, 0, randomRot);
    } else if (index < currentPage) {
      // PREVIOUS: Stacked on the left
      // Stack them slightly visible on the left
      const offset = (currentPage - index);
      targetPos.set(-width - 0.5 - (offset * 0.05), 0, -offset * 0.1);
      targetRot.set(0, 0.2, randomRot); // Slight tilt
    } else {
      // NEXT: Stacked behind/right
      const offset = (index - currentPage);
      targetPos.set(offset * 0.02, -offset * 0.02, -offset * 0.1);
      targetRot.set(0, 0, randomRot);
    }

    // Add gentle float only to active page
    if (index === currentPage) {
        targetPos.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }

    // Smooth Lerp
    const speed = 4 * delta;
    meshRef.current.position.lerp(targetPos, speed);
    
    // Lerp rotation (a bit hacky with Euler, but works for small angles)
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, speed);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, speed);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, speed);
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial 
        map={texture} 
        roughness={0.8}
        metalness={0.0}
        side={THREE.DoubleSide}
        transparent={true}
      />
    </mesh>
  );
};

export const ThreeScene: React.FC<Props> = ({ textureUrls, aspectRatio }) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Reset page when document changes
  useEffect(() => {
    setCurrentPage(0);
  }, [textureUrls]);

  const handleNext = () => {
    if (textureUrls && currentPage < textureUrls.length - 1) {
      setCurrentPage(curr => curr + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(curr => curr - 1);
    }
  };

  return (
    <div className="w-full h-full bg-neutral-900 rounded-lg overflow-hidden relative shadow-2xl border border-gray-800 group">
      {(!textureUrls || textureUrls.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10 pointer-events-none">
            <div className="text-center">
                <p className="text-4xl mb-2">📄</p>
                <p>No document generated yet.</p>
            </div>
        </div>
      )}
      
      <Canvas shadows camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <spotLight 
            position={[5, 10, 5]} 
            angle={0.5} 
            penumbra={1} 
            intensity={2} 
            castShadow 
            shadow-mapSize={[1024, 1024]} 
        />
        <Environment preset="city" />

        <Center>
            {textureUrls && textureUrls.map((url, i) => (
                <PageMesh 
                    key={`${url}-${i}`} 
                    url={url} 
                    aspectRatio={aspectRatio} 
                    index={i} 
                    currentPage={currentPage}
                />
            ))}
        </Center>

        <ContactShadows opacity={0.4} scale={10} blur={2.5} far={4} color="#000000" />
        <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      </Canvas>
      
      {/* Navigation Controls Overlay */}
      {textureUrls && textureUrls.length > 0 && (
        <>
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-20 pointer-events-none">
                <button 
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all
                        ${currentPage === 0 ? 'bg-black/20 text-gray-600 cursor-not-allowed' : 'bg-black/50 text-white hover:bg-blue-600/80 hover:scale-110 shadow-lg'}`}
                >
                    ←
                </button>
                
                <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-mono font-bold text-gray-300 shadow-xl">
                    PAGE {currentPage + 1} / {textureUrls.length}
                </div>

                <button 
                    onClick={handleNext}
                    disabled={currentPage === textureUrls.length - 1}
                    className={`pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all
                        ${currentPage === textureUrls.length - 1 ? 'bg-black/20 text-gray-600 cursor-not-allowed' : 'bg-black/50 text-white hover:bg-blue-600/80 hover:scale-110 shadow-lg'}`}
                >
                    →
                </button>
            </div>

            {/* Instruction Hint */}
            <div className="absolute top-4 left-4 text-[10px] text-gray-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                Left Click + Drag to Rotate • Right Click to Pan • Scroll to Zoom
            </div>
        </>
      )}
    </div>
  );
};