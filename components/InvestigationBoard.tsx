import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import ConnectionLayer from './deduction/ConnectionLayer';
import RadialMenu from './deduction/RadialMenu';
import VerifySwitch from './deduction/VerifySwitch';
import { SOLUTION_PATH } from './deduction/constants';
import { LinkType } from '../types/deduction';
import { EvidenceItem } from '../types';

interface InvestigationBoardProps {
    itemRefs?: React.MutableRefObject<Record<string, RapierRigidBody | null>>;
    evidence: EvidenceItem[];
    focusedItemId?: string | null;
    setFocusedItemId?: (id: string | null) => void;
}

const InvestigationBoard: React.FC<InvestigationBoardProps> = ({ itemRefs, evidence, focusedItemId, setFocusedItemId }) => {
    const groupRef = useRef<THREE.Group>(null);
    const {
        links, addLink, updateLinkType, setLinkStatus, setSolved, solved,
        linkingFromId, radialMenu, setRadialMenu,
        currentView, setView
    } = useGameStore();

    const { pointer, camera, raycaster } = useThree();
    
    // PERFORMANCE: Memoize materials
    const corkMaterial = useMemo(() => new THREE.MeshStandardMaterial({ 
        color: "#d2b48c", 
        roughness: 0.9, 
        bumpScale: 0.1 
    }), []);

    const handleRadialSelect = (type: LinkType) => {
        if (radialMenu) {
            updateLinkType(radialMenu.connectionId, type);
            setRadialMenu(null);
        }
    };

    // Handle background click to exit board view
    const handleBoardClick = (e: any) => {
        e.stopPropagation();

        // If an item is focused, unfocus it
        if (focusedItemId && setFocusedItemId) {
            setFocusedItemId(null);
            return;
        }

        if (currentView === 'BOARD' && !linkingFromId && !radialMenu) {
            setView('DESK');
        } else if (currentView === 'DESK') {
            setView('BOARD');
        }
    };

    const handleVerify = () => {
        let allValid = true;
        let incorrectCount = 0;

        links.forEach(link => {
            const validRule = SOLUTION_PATH.find(rule =>
                (rule.source === link.fromId && rule.target === link.toId) &&
                rule.type === link.type
            );

            if (validRule) {
                setLinkStatus(link.id, 'VALID');
            } else {
                setLinkStatus(link.id, 'INVALID');
                allValid = false;
                incorrectCount++;
            }
        });

        const requiredCount = SOLUTION_PATH.length;
        const validCount = links.filter(l => l.status === 'VALID').length;

        if (allValid && validCount >= requiredCount && incorrectCount === 0) {
            setSolved(true);
        } else {
            setSolved(false);
        }
    };

    // Position Radial Menu relative to the Board component
    const menuLocalPos = useMemo(() => {
        if (!radialMenu || !groupRef.current) return new THREE.Vector3(0, 0, 0);
        const worldPos = new THREE.Vector3(radialMenu.x, radialMenu.y, radialMenu.z);
        const localPos = worldPos.clone();
        groupRef.current.worldToLocal(localPos);
        return localPos;
    }, [radialMenu]);

    return (
        <group ref={groupRef} rotation={[0, Math.PI, 0]}>
            {/* Board Physical Body */}
            <RigidBody type="fixed" colliders="cuboid">
                {/* Corkboard Surface */}
                <mesh receiveShadow onClick={handleBoardClick} frustumCulled>
                    <boxGeometry args={[10, 6, 0.2]} />
                    <primitive object={corkMaterial} attach="material" />
                </mesh>

                {/* Frame */}
                <mesh position={[0, 0, -0.15]} frustumCulled>
                    <RoundedBox args={[10.5, 6.5, 0.1]} material-color="#5d4037" />
                </mesh>
            </RigidBody>

            {/* Light for the board (Vignette effect simulated by point light close to surface) */}
            {/* <pointLight position={[0, 0, 4]} intensity={60} distance={15} decay={2} color="#fff8e7" /> */}
            <ambientLight intensity={0.4} color="#ffffff" />

            {/* Verify Switch */}
            <VerifySwitch
                position={[0, 3, 0.2]}
                onVerify={handleVerify}
                solved={solved}
            />

            {/* Connections Layer */}
            {itemRefs && (
                <ConnectionLayer
                    connections={links}
                    itemRefs={itemRefs}
                    evidence={evidence}
                    interaction={{
                        linkingFromId,
                        mouseWorldPos: [0, 0, 0],
                        menuData: radialMenu
                    }}
                    parentRef={groupRef}
                />
            )}

            {/* Radial Menu Popup */}
            {radialMenu && (
                <RadialMenu
                    position={[menuLocalPos.x, menuLocalPos.y, menuLocalPos.z]}
                    onSelect={handleRadialSelect}
                    onClose={() => setRadialMenu(null)}
                />
            )}
        </group>
    );
};

export default InvestigationBoard;
