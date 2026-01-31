import React, { useState } from 'react';
import { RoundedBox, Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

interface Props {
    position: [number, number, number];
    onVerify: () => void;
    solved: boolean;
}

const VerifySwitch: React.FC<Props> = ({ position, onVerify, solved }) => {
    const [pressed, setPressed] = useState(false);

    const { scale } = useSpring({
        scale: pressed ? 0.98 : 1,
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
            <RoundedBox args={[3.2, 0.9, 0.1]} material-color="#5d4037" />

            {/* The Button Body */}
            {/* @ts-ignore */}
            <animated.group scale={scale}>
                <mesh
                    position={[0, 0, 0.1]}
                    onClick={handleClick}
                    onPointerOver={() => document.body.style.cursor = 'pointer'}
                    onPointerOut={() => document.body.style.cursor = 'auto'}
                >
                    <RoundedBox args={[3, 0.7, 0.15]} material-color={solved ? "#cfcfcf" : "#cfcfcf"} />
                </mesh>

                <Text position={[0, 0, 0.18]} fontSize={0.2} color="#000" fontWeight="bold">
                    {solved ? "CASE CLOSED" : "CONFIRM"}
                </Text>
            </animated.group>
        </group>
    );
};

export default VerifySwitch;
