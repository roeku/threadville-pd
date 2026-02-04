import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface SkyboxSphereProps {
    imagePath: string;
    scale?: number;
}

export const SkyboxSphere: React.FC<SkyboxSphereProps> = ({ imagePath, scale = 500, ...props }) => {
    const texture = useTexture(imagePath);

    // PERFORMANCE: Memoize geometry to avoid recreation
    // PERFORMANCE: Reduced segments from (64, 32) to (32, 16) for better performance
    const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 32, 16), []);

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
            <primitive object={sphereGeometry} attach="geometry" />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

export default SkyboxSphere;
