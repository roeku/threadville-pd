import React from 'react';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';

interface AccusePostItProps {
    position: [number, number, number];
    isActive: boolean;
    isDragging: boolean;
    onConfirm: () => void;
    onPointerDown: (e: any) => void;
    onPointerMove: (e: any) => void;
    onPointerUp: (e: any) => void;
}

const AccusePostIt: React.FC<AccusePostItProps> = ({
    position,
    isActive,
    isDragging,
    onConfirm,
    onPointerDown,
    onPointerMove,
    onPointerUp
}) => {
    useCursor(true, isDragging ? 'grabbing' : 'grab');
    const texture = React.useMemo(() => createPostItTexture(isActive), [isActive]);

    React.useEffect(() => {
        return () => {
            texture.dispose();
        };
    }, [texture]);

    return (
        <group
            position={position}
            rotation={[0, 0, -0.15]}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={(e) => {
                e.stopPropagation();
                if (isActive && !isDragging) {
                    onConfirm();
                }
            }}
        >
            {/* Post-it background */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[0.4, 0.35]} />
                <meshStandardMaterial
                    color={isActive ? "#ffeb3b" : "#e2d8a6"}
                    roughness={0.8}
                    emissive={isActive ? "#ffd700" : "#000000"}
                    emissiveIntensity={isActive ? 0.3 : 0}
                />
            </mesh>

            {/* Post-it text (using canvas texture for better quality) */}
            <mesh position={[0, 0, 0.012]}>
                <planeGeometry args={[0.35, 0.3]} />
                <meshBasicMaterial map={texture} />
            </mesh>

            {/* Shadow/depth effect */}
            <mesh position={[0.02, -0.02, 0]}>
                <planeGeometry args={[0.4, 0.35]} />
                <meshStandardMaterial
                    color="#000000"
                    transparent
                    opacity={0.2}
                />
            </mesh>

            {/* Invisible hit area to make dragging easier */}
            <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[0.55, 0.45]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
};

function createPostItTexture(isActive: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 224;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = isActive ? '#ff6b00' : '#6b5d2a';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = 'CULPRIT';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 40);

    if (isActive) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333333';
        ctx.fillText('Click to', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('confirm', canvas.width / 2, canvas.height / 2 + 40);
    } else {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#4b4b4b';
        ctx.fillText('Build your case', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('to accuse', canvas.width / 2, canvas.height / 2 + 38);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    return texture;
}

export default AccusePostIt;
