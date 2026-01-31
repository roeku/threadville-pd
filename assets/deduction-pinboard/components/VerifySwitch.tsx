
import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

interface Props {
    position: [number, number, number];
    onVerify: () => void;
    solved: boolean;
}

const VerifySwitch: React.FC<Props> = ({ position, onVerify, solved }) => {
    const [pressed, setPressed] = useState(false);

    const { scale } = useSpring({
        scale: pressed ? 0.9 : 1,
        config: { tension: 400, friction: 15 }
    });

    const handleClick = (e: any) => {
        e.stopPropagation();
        setPressed(true);
        onVerify();
        setTimeout(() => setPressed(false), 200);
    };

    return (
        <group position={position}>
            {/* Mounting Plate */}
            <mesh position={[0, 0, 0]}>
                 <boxGeometry args={[3.2, 0.9, 0.1]} />
                 <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.7} />
            </mesh>
            
            {/* The Button Body */}
            {/* @ts-ignore */}
            <animated.group scale={scale}>
                <mesh 
                    position={[0, 0, 0.1]} 
                    onClick={handleClick}
                    onPointerOver={() => document.body.style.cursor = 'pointer'} 
                    onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                     <boxGeometry args={[3, 0.7, 0.15]} />
                     <meshStandardMaterial 
                        color={solved ? "#15803d" : "#ca8a04"} 
                        emissive={solved ? "#22c55e" : "#facc15"}
                        emissiveIntensity={0.2}
                        roughness={0.3}
                     />
                </mesh>
                
                <Text position={[0, 0, 0.18]} fontSize={0.25} color="#fff" fontWeight="bold">
                    {solved ? "CASE SOLVED" : "VERIFY LEADS"}
                </Text>
            </animated.group>
        </group>
    );
};

export default VerifySwitch;
