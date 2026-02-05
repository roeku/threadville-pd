import React, { useRef, useMemo, useEffect } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Edges, RoundedBox, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import ConnectionLayer from './deduction/ConnectionLayer';
import RadialMenu from './deduction/RadialMenu';
import VerifySwitch from './deduction/VerifySwitch';
import { LinkType } from '../types/deduction';
import { EvidenceItem } from '../types';
import { useControls } from 'leva';
import { isCaseSolved } from '../services/deductionService';
import { trackConnection } from '../services/gameProgressService';

interface InvestigationBoardProps {
    itemRefs?: React.MutableRefObject<Record<string, RapierRigidBody | null>>;
    evidence: EvidenceItem[];
    focusedItemId?: string | null;
    setFocusedItemId?: (id: string | null) => void;
}

const InvestigationBoard: React.FC<InvestigationBoardProps> = ({ itemRefs, evidence, focusedItemId, setFocusedItemId }) => {
    const groupRef = useRef<THREE.Group>(null);
    const {
        links, updateLinkType, setSolved, solved,
        linkingFromId, radialMenu, setRadialMenu, deductionState, validateAndMarkLinks,
        currentView, setView, removeLink
    } = useGameStore();

    const [edgesVisible, setEdgesVisible] = React.useState(false);

    const corkTexture = useTexture('/corkboard.jpg');
    const { corkRepeatX, corkRepeatY, corkRotation, corkRoughness } = useControls('Board Texture', {
        corkRepeatX: { value: 2, min: 0.5, max: 10, step: 0.1 },
        corkRepeatY: { value: 2, min: 0.5, max: 10, step: 0.1 },
        corkRotation: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
        corkRoughness: { value: 0.9, min: 0.1, max: 1, step: 0.05 },
    });

    useEffect(() => {
        corkTexture.colorSpace = THREE.SRGBColorSpace;
        corkTexture.wrapS = THREE.RepeatWrapping;
        corkTexture.wrapT = THREE.RepeatWrapping;
        corkTexture.center.set(0.5, 0.5);
        corkTexture.repeat.set(corkRepeatX, corkRepeatY);
        corkTexture.rotation = corkRotation;
        corkTexture.needsUpdate = true;
    }, [corkTexture, corkRepeatX, corkRepeatY, corkRotation]);

    // PERFORMANCE: Memoize materials
    const corkMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        map: corkTexture,
        roughness: corkRoughness,
        bumpScale: 0.1
    }), [corkTexture, corkRoughness]);

    // PERFORMANCE: Memoize board geometry to avoid recreation
    const boardGeometry = useMemo(() => new THREE.BoxGeometry(10, 6, 0.01), []);

    const handleRadialSelect = (type: LinkType) => {
        if (radialMenu) {
            updateLinkType(radialMenu.connectionId, type);
            setRadialMenu(null);
        }
    };

    // Handle background click to exit board view
    const handleBoardClick = (e: any) => {
        e.stopPropagation();

        if (useGameStore.getState().isPointerOnComputer) {
            console.log('[ViewChange][Board] ignored (pointer on computer)', { from: currentView });
            return;
        }

        // If an item is focused, unfocus it
        if (focusedItemId && setFocusedItemId) {
            setFocusedItemId(null);
            return;
        }

        // Switch to BOARD view when clicking the board in DESK view
        if (currentView === 'DESK') {
            console.log('[ViewChange][Board] click', { from: currentView, to: 'BOARD' });
            setView('BOARD');
        } else if (currentView === 'BOARD' && !linkingFromId && !radialMenu) {
            // Exit board view when clicking background in BOARD view
            console.log('[ViewChange][Board] click', { from: currentView, to: 'DESK' });
            setView('DESK');
        }
    };

    const handleVerify = () => {
        if (!deductionState) {
            console.warn('No deduction state available');
            setSolved(false);
            return;
        }

        const evidenceById = new Map(evidence.map(item => [item.id, item]));

        // Validate all links against the deduction rules
        validateAndMarkLinks();

        // Check if case is solved
        const state = useGameStore.getState();
        const solveResult = isCaseSolved(state.links, deductionState);

        // Track all connections in database
        const sessionId = useGameStore.getState().sessionId;
        if (sessionId) {
            state.links.forEach(async (link) => {
                const fromItem = evidenceById.get(link.fromId);
                const toItem = evidenceById.get(link.toId);
                const fromLabel = fromItem?.label || link.fromId;
                const toLabel = toItem?.label || link.toId;

                // Check if this is a critical connection
                const isCritical = deductionState.criticalRuleIds.some(ruleId => {
                    const rule = deductionState.rules.find(r => r.id === ruleId);
                    return rule &&
                        ((rule.source === link.fromId && rule.target === link.toId) ||
                            (rule.source === link.toId && rule.target === link.fromId));
                });

                await trackConnection(sessionId, link, fromLabel, toLabel, isCritical);
            });
        }

        console.log('🔗 Connections Made:');
        if (state.links.length === 0) {
            console.log('  (none)');
        } else {
            state.links.forEach((link, index) => {
                const fromItem = evidenceById.get(link.fromId);
                const toItem = evidenceById.get(link.toId);
                const fromLabel = fromItem?.label || link.fromId;
                const toLabel = toItem?.label || link.toId;
                const status = link.status || 'UNCHECKED';
                console.log(`  ${index + 1}. ${fromLabel} --${link.type}--> ${toLabel} [${status}]`);
            });
        }

        // Count valid connections
        const validCount = state.links.filter(l => l.status === 'VALID').length;
        if (validCount > 0) {
            console.log(`✅ ${validCount} valid connection(s)`);
            // Play success sound
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.2);
        }

        if (solveResult.solved) {
            setSolved(true);
            console.log('🎉 Case Solved!');
            // Play victory sound - three ascending tones
            const playVictorySound = () => {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const frequencies = [523, 659, 784]; // C5, E5, G5
                frequencies.forEach((freq, i) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
                    osc.start(audioContext.currentTime + i * 0.15);
                    osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
                });
            };
            playVictorySound();
        } else {
            setSolved(false);
            console.log('❌ Case not yet solved. Missing:', solveResult.missing);
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
        <group ref={groupRef} rotation={[0, Math.PI, 0]}
        >
            {/* Board Physical Body */}
            <RigidBody type="fixed" colliders="cuboid">
                {/* Corkboard Surface */}
                <mesh
                    onPointerOver={() => {
                        //enable edges
                        setEdgesVisible(true);
                    }}
                    onPointerOut={() => {
                        //disable edges
                        setEdgesVisible(false);
                    }}
                    receiveShadow onClick={currentView === 'BOARD' || currentView === 'DESK' ? handleBoardClick : undefined} frustumCulled>
                    <primitive object={boardGeometry} attach="geometry" />
                    <primitive object={corkMaterial} attach="material" />
                    {edgesVisible && currentView !== "BOARD" && <Edges
                        linewidth={4}
                        scale={1}
                        threshold={15} // Display edges only when the angle between two faces exceeds this value (default=15 degrees)
                        color="white"
                    />}
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
                    onConnectionClick={(connId) => {
                        console.log('🗑️ Deleting connection:', connId);
                        removeLink(connId);
                    }}
                />
            )}

            {/* Radial Menu Popup */}
            {radialMenu && (
                <RadialMenu
                    position={[menuLocalPos.x, menuLocalPos.y, menuLocalPos.z]}
                    onSelect={handleRadialSelect}
                    onClose={() => {
                        console.log('❌ Canceling connection creation:', radialMenu.connectionId);
                        removeLink(radialMenu.connectionId);
                        setRadialMenu(null);
                    }}
                />
            )}
        </group>
    );
};

export default React.memo(InvestigationBoard);
