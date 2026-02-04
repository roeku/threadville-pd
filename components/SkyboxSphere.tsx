import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface SkyboxSphereProps {
    imagePath: string;
    scale?: number;
}

export const SkyboxSphere: React.FC<SkyboxSphereProps> = ({ imagePath, scale = 500, ...props }) => {
    const texture = useTexture(imagePath);

    // PERFORMANCE: Memoize material to avoid recreation
    const material = useMemo(() => {
        // Set up texture for best quality
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 16;

        return new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            toneMapped: false,
            fog: false,
            depthWrite: false,
        });
    }, [texture]);

    return (
        <mesh scale={scale} frustumCulled={false} {...props}>
            <sphereGeometry args={[1, 64, 32]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

export default SkyboxSphere;
