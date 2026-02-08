import React, { useRef, useMemo, useEffect } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Edges, RoundedBox, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import ConnectionLayer from './deduction/ConnectionLayer';
import RadialMenu from './deduction/RadialMenu';
import AccusePostIt from './deduction/AccusePostIt';
import { LinkType } from '../types/deduction';
import { EvidenceItem } from '../types';
import { useControls } from 'leva';
import { trackConnection } from '../services/gameProgressService';
import { useThree } from '@react-three/fiber';

interface InvestigationBoardProps {
    itemRefs?: React.MutableRefObject<Record<string, RapierRigidBody | null>>;
    evidence: EvidenceItem[];
    focusedItemId?: string | null;
    setFocusedItemId?: (id: string | null) => void;
}

const InvestigationBoard: React.FC<InvestigationBoardProps> = ({ itemRefs, evidence, focusedItemId, setFocusedItemId }) => {
    const groupRef = useRef<THREE.Group>(null);
    const {
        links, updateLinkType, solved,
        linkingFromId, radialMenu, setRadialMenu, deductionState,
        currentView, setView, removeLink, solvProgress
    } = useGameStore();

    const confirmAccusation = useGameStore(state => state.confirmAccusation);
    const { raycaster } = useThree();

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

    // Accuse post-it drag state (local board space)
    const [accusePos, setAccusePos] = React.useState<[number, number, number]>([4.6, 2.2, 0.2]);
    const [isDraggingAccuse, setIsDraggingAccuse] = React.useState(false);
    const dragOffset = React.useRef(new THREE.Vector3());
    const dragStartScreen = React.useRef<{ x: number; y: number } | null>(null);
    const dragMoved = React.useRef(false);

    const clampToBoard = React.useCallback((pos: THREE.Vector3) => {
        const halfW = 5; // boardGeometry width/2
        const halfH = 3; // boardGeometry height/2
        return new THREE.Vector3(
            Math.max(-halfW + 0.4, Math.min(halfW - 0.4, pos.x)),
            Math.max(-halfH + 0.3, Math.min(halfH - 0.3, pos.y)),
            0.2
        );
    }, []);

    const getBoardPlaneIntersection = React.useCallback((event: any) => {
        if (!groupRef.current) return null;

        // Board plane in world space at local z = 0.2
        const localPoint = new THREE.Vector3(0, 0, 0.2);
        const worldPoint = groupRef.current.localToWorld(localPoint.clone());
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, worldPoint);

        const intersection = new THREE.Vector3();
        const ray = event.ray || raycaster.ray;
        const hit = ray.intersectPlane(plane, intersection);
        if (!hit) return null;

        // Convert to local board space
        const localHit = groupRef.current.worldToLocal(intersection.clone());
        return localHit;
    }, [raycaster]);

    const handleAccusePointerDown = React.useCallback((e: any) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        dragMoved.current = false;
        dragStartScreen.current = { x: e.clientX, y: e.clientY };
        setIsDraggingAccuse(true);

        const hit = getBoardPlaneIntersection(e);
        if (!hit) return;

        dragOffset.current.set(
            accusePos[0] - hit.x,
            accusePos[1] - hit.y,
            0
        );
    }, [accusePos, getBoardPlaneIntersection]);

    const handleAccusePointerMove = React.useCallback((e: any) => {
        if (!isDraggingAccuse) return;
        e.stopPropagation();

        if (dragStartScreen.current) {
            const dx = e.clientX - dragStartScreen.current.x;
            const dy = e.clientY - dragStartScreen.current.y;
            if (Math.hypot(dx, dy) > 6) {
                dragMoved.current = true;
            }
        }

        const hit = getBoardPlaneIntersection(e);
        if (!hit) return;

        const next = new THREE.Vector3(
            hit.x + dragOffset.current.x,
            hit.y + dragOffset.current.y,
            0.2
        );

        const clamped = clampToBoard(next);
        setAccusePos([clamped.x, clamped.y, clamped.z]);
    }, [clampToBoard, getBoardPlaneIntersection, isDraggingAccuse]);

    const handleAccusePointerUp = React.useCallback((e: any) => {
        e.stopPropagation();
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

        const wasDragging = dragMoved.current;
        dragMoved.current = false;
        dragStartScreen.current = null;
        setIsDraggingAccuse(false);

        // If active and dropped near culprit profile, snap and confirm
        if (!solved && solvProgress >= 40 && itemRefs?.current && deductionState?.culpritProfileId) {
            const culpritBody = itemRefs.current[deductionState.culpritProfileId];
            if (culpritBody && groupRef.current) {
                const p = culpritBody.translation();
                const worldPos = new THREE.Vector3(p.x, p.y, p.z);
                const localPos = groupRef.current.worldToLocal(worldPos.clone());
                const target = new THREE.Vector3(localPos.x + 0.15, localPos.y + 0.12, 0.2);
                const current = new THREE.Vector3(accusePos[0], accusePos[1], accusePos[2]);
                if (current.distanceTo(target) < 0.35) {
                    const snapped = clampToBoard(target);
                    setAccusePos([snapped.x, snapped.y, snapped.z]);
                    if (!wasDragging || dragMoved.current) {
                        confirmAccusation();
                    }
                }
            }
        }
    }, [accusePos, clampToBoard, confirmAccusation, deductionState?.culpritProfileId, itemRefs, solved, solvProgress]);

    // Track connections and handle case completion
    useEffect(() => {
        const evidenceById = new Map(evidence.map(item => [item.id, item]));
        const sessionId = useGameStore.getState().sessionId;

        // Track all connections in database
        if (sessionId && links.length > 0) {
            links.forEach(async (link) => {
                const fromItem = evidenceById.get(link.fromId);
                const toItem = evidenceById.get(link.toId);
                const fromLabel = fromItem?.label || link.fromId;
                const toLabel = toItem?.label || link.toId;

                // Check if this is a critical connection
                const isCritical = deductionState?.criticalRuleIds.some(ruleId => {
                    const rule = deductionState.rules.find(r => r.id === ruleId);
                    return rule &&
                        ((rule.source === link.fromId && rule.target === link.toId) ||
                            (rule.source === link.toId && rule.target === link.fromId));
                });

                await trackConnection(sessionId, link, fromLabel, toLabel, isCritical || false);
            });
        }

        // Log connections
        console.log('🔗 Connections Made:');
        if (links.length === 0) {
            console.log('  (none)');
        } else {
            links.forEach((link, index) => {
                const fromItem = evidenceById.get(link.fromId);
                const toItem = evidenceById.get(link.toId);
                const fromLabel = fromItem?.label || link.fromId;
                const toLabel = toItem?.label || link.toId;
                const status = link.status || 'UNCHECKED';
                console.log(`  ${index + 1}. ${fromLabel} --${link.type}--> ${toLabel} [${status}]`);
            });
        }

        // Count valid connections
        const validCount = links.filter(l => l.status === 'VALID').length;
        if (validCount > 0) {
            console.log(`✅ ${validCount} valid connection(s)`);
            // Play success sound
            try {
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
            } catch (e) {
                // Audio context may not be available
            }
        }
    }, [links, evidence, deductionState]);

    // Handle case completion
    useEffect(() => {
        if (solved) {
            console.log('🎉 Case Solved!');
            // Play victory sound - three ascending tones
            try {
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
            } catch (e) {
                // Audio context may not be available
            }
        }
    }, [solved]);

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

            {/* Accusation Post-it - Always visible, activates after 40% progress */}
            <AccusePostIt
                position={accusePos}
                isActive={!solved && solvProgress >= 40}
                isDragging={isDraggingAccuse}
                onConfirm={confirmAccusation}
                onPointerDown={handleAccusePointerDown}
                onPointerMove={handleAccusePointerMove}
                onPointerUp={handleAccusePointerUp}
            />
        </group>
    );
};

export default React.memo(InvestigationBoard);
