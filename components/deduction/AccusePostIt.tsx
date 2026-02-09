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
                <planeGeometry args={[0.6, 0.5]} />
                <meshStandardMaterial
                    color={isActive ? "#ffeb3b" : "#e2d8a6"}
                    roughness={0.8}
                    emissive={isActive ? "#ffd700" : "#ffd700"}
                    emissiveIntensity={isActive ? 0.3 : 0}
                />
            </mesh>

            {/* Post-it text (using canvas texture for better quality) */}
            <mesh position={[0, 0, 0.012]}>
                <planeGeometry args={[0.55, 0.45]} />
                <meshBasicMaterial 
                    map={texture} 
                    transparent={true}
                    toneMapped={true}
                    opacity={.9}
                />
            </mesh>

            {/* Shadow/depth effect */}
            <mesh position={[0.02, -0.02, 0]}>
                <planeGeometry args={[0.6, 0.5]} />
                <meshStandardMaterial
                    color="#ffd700"
                    transparent
                    opacity={0.2}
                />
            </mesh>

            {/* Invisible hit area to make dragging easier */}
            <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[0.75, 0.65]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
};

function createPostItTexture(isActive: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 448;

    const ctx = canvas.getContext('2d', { alpha: true })!;
    
    // Fill with yellow post-it color to match background
    ctx.fillStyle = isActive ? '#ffeb3b' : '#e2d8a6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Main text with shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = isActive ? '#c62828' : '#616161';
    ctx.font = 'bold 96px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = 'CULPRIT';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 70);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (isActive) {
        ctx.font = 'bold 42px "Courier New", monospace';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText('Drag to suspect', canvas.width / 2, canvas.height / 2 + 60);
    } else {
        ctx.font = '36px "Courier New", monospace';
        ctx.fillStyle = '#424242';
        ctx.fillText('Solve case first', canvas.width / 2, canvas.height / 2 + 60);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

export default AccusePostIt;
