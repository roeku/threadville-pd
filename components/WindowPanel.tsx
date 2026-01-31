import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Global time uniform shared across all window panels
const globalTimeUniform = { value: 0 };

// Shared shader material instance - all panels use the same material
let sharedShaderMaterial: THREE.ShaderMaterial | null = null;

const getSharedShaderMaterial = () => {
    if (!sharedShaderMaterial) {
        sharedShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_time: globalTimeUniform,
            },
            vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
            fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;

      // Generate a random float from a single input and seed.
      float Random11(float inputValue, float seed) {
          return fract(sin(inputValue * 345.456) * seed);
      }

      // Generate a random float from a 2d input and seed.
      float Random21(vec2 inputValue, float seed) {
          return fract(sin(dot(inputValue, vec2(123.456, 43.12))) * seed);
      }

      // Generate drops as distortions, that can be applied to UV coordinates
      vec2 Drops(vec2 uv, float seed) {
          // Randomly move everything
          float shiftY = Random11(0.5, seed);
          uv.y += shiftY;

          // Split UV space into cells. Each cell will contain a drop.
          float cellsResolution = 40.0;
          uv *= cellsResolution;

          // Move each row randomly.
          float rowIndex = floor(uv.y);
          float shiftX = Random11(rowIndex, seed);
          uv.x += shiftX;

          vec2 cellIndex = floor(uv);
          vec2 cellUv = fract(uv);

          vec2 cellCenter = vec2(0.5);
          float distanceFromCenter = distance(cellUv, cellCenter);

          // We don't want to show every drop. So randomly remove some of them.
          float isDropShown = step(0.8, Random21(cellIndex, seed + 14244.324));

          // Decrease each drop intensity with time. Then make it appear again.
          float dropIntensity = 1.0 - fract(u_time * 0.1 + Random21(cellIndex, seed + 32132.432) * 2.0) * 2.0;
          dropIntensity = sign(dropIntensity) * abs(dropIntensity * dropIntensity * dropIntensity * dropIntensity);
          dropIntensity = clamp(dropIntensity, 0.0, 1.0);

          // We only need results from inside a specific radius of a drop.
          float isInsideDrop = 1.0 - step(0.1, distanceFromCenter);

          vec2 vecToCenter = normalize(cellCenter - cellUv);

          // Drop value is a vector to the center that increases with distance from it.
          vec2 dropValue = vecToCenter * distanceFromCenter * distanceFromCenter * 40.0;

          vec2 drop = dropValue * isInsideDrop * isDropShown * dropIntensity;
          return drop;
      }

      void main() {
          vec2 uv = vUv;

          // PERFORMANCE: Reduced iterations from 10 to 5 for better performance
          vec2 drops = vec2(0.0);
          for(int i = 0; i < 5; i++) {
              drops += Drops(uv, 42424.43 + float(i) * 12313.432);
          }
          
          // --- RENDER AS TRANSPARENT OVERLAY ---
          
          float dropStrength = length(drops);
          
          // Glass color (faint blue/grey)
          vec3 glassColor = vec3(0.5, 0.6, 0.7);
          
          // Window reflection gradient (fake sky reflection)
          float reflection = smoothstep(0.3, 1.0, 1.0 - uv.y);
          glassColor += vec3(0.1) * reflection;

          // Simple fake lighting on drops
          // We assume light comes from top-left (1,1)
          // drops vector points to center of drop, so it acts like a normal on the XY plane
          vec2 lightDir = normalize(vec2(1.0, 1.0));
          float highlight = dot(normalize(drops + vec2(0.0001)), lightDir); 
          highlight = clamp(highlight, 0.0, 1.0);
          highlight = pow(highlight, 4.0); // Sharp specular
          
          // Final Color
          vec3 finalColor = glassColor;
          
          // Add highlights (white)
          finalColor += vec3(1.0) * highlight * 2.0;

          // Alpha mixing
          // Base glass alpha
          float baseAlpha = 0.2; 
          // Drop alpha (higher where drops are stronger)
          float dropAlpha = smoothstep(0.0, 0.05, dropStrength) * 0.8;
          
          float finalAlpha = max(baseAlpha, dropAlpha);

          gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }
    return sharedShaderMaterial;
};

// Single manager component to update time uniform once per frame
// PERFORMANCE: Use a singleton pattern to ensure only one manager exists
const WindowTimeManager = (() => {
    let instance: (() => null) | null = null;
    
    return () => {
        if (!instance) {
            instance = () => {
                useFrame((state) => {
                    // Update global time once per frame - all panels use this uniform
                    globalTimeUniform.value = state.clock.getElapsedTime();
                });
                return null;
            };
        }
        return instance();
    };
})();

const WindowPanelComponent = ({ position, rotation, width = 3, height = 4 }: { position: [number, number, number], rotation?: [number, number, number], width?: number, height?: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Get shared material instance
    const shaderMaterial = useMemo(() => getSharedShaderMaterial(), []);
    
    // PERFORMANCE: Memoize frame material to avoid recreation
    const frameMaterial = useMemo(() => 
        new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.8 }), 
    []);

    return (
        <group position={position} rotation={rotation}>
            {/* Glass Pane */}
            <mesh ref={meshRef} frustumCulled>
                <planeGeometry args={[width, height]} />
                <primitive object={shaderMaterial} attach="material" />
            </mesh>

            {/* Frame / Mullions */}
            {/* Top Frame */}
            <mesh position={[0, height / 2, 0]} frustumCulled>
                <boxGeometry args={[width + 0.1, 0.1, 0.1]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>
            {/* Bottom Frame */}
            <mesh position={[0, -height / 2, 0]} frustumCulled>
                <boxGeometry args={[width + 0.1, 0.1, 0.1]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>
            {/* Left Frame */}
            <mesh position={[-width / 2, 0, 0]} frustumCulled>
                <boxGeometry args={[0.1, height, 0.1]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>
            {/* Right Frame */}
            <mesh position={[width / 2, 0, 0]} frustumCulled>
                <boxGeometry args={[0.1, height, 0.1]} />
                <primitive object={frameMaterial} attach="material" />
            </mesh>
            
            {/* Mount time manager in first panel only */}
            <WindowTimeManager />
        </group>
    );
};

// Memoize with custom equality check to prevent unnecessary re-renders
const arePropsEqual = (
    prevProps: any,
    nextProps: any
) => {
    const pos = prevProps.position;
    const nextPos = nextProps.position;
    const rot = prevProps.rotation;
    const nextRot = nextProps.rotation;

    const vecEqual = (a?: number[], b?: number[]) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    };

    return (
        vecEqual(pos, nextPos) &&
        vecEqual(rot, nextRot) &&
        prevProps.width === nextProps.width &&
        prevProps.height === nextProps.height
    );
};

export const WindowPanel = React.memo(WindowPanelComponent, arePropsEqual);
