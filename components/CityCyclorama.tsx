import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

interface CityCycloramaProps {
    imagePath: string;
}

export const CityCyclorama: React.FC<CityCycloramaProps> = ({ imagePath, ...props }) => {
    const texture = useTexture(imagePath);

    const cylinderArgs = useMemo(() => {
        // [radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength]
        // radius: 25 units away (far enough to create parallax)
        // height: 20 units (tall enough to fill vertical view)
        // thetaLength: Math.PI / 1.5 (We only create a 120-degree arc, not a full circle)
        return [25, 25, 20, 64, 1, true, -Math.PI / 3, Math.PI / 1.5] as const;
    }, []);

    const material = useMemo(() => {
        // Fix texture mapping
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Anisotropy helps keep texture sharp at oblique angles
        texture.anisotropy = 16;

        // Flip texture horizontally if it looks backwards on the inside of the cylinder
        texture.repeat.set(-1, 1);
        texture.offset.set(1, 0);

        return new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide, // Render on the inside of the curve
            toneMapped: false,    // CRITICAL: Ignores scene lighting limits, making lights look "neon" bright
            fog: false,           // Ignore scene fog so the city stays visible through the atmosphere
        });
    }, [texture]);

    return (
        // Curved backdrop positioned outside the window view
        <mesh {...props}>
            <cylinderGeometry args={cylinderArgs} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

export default CityCyclorama;
