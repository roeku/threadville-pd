import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { useControls } from 'leva';
import { renderDocumentToTexture } from '../services/document-rendering/renderDocument';
import { CaseFile } from '../types';

interface CaseCompletionFolderProps {
    sessionId: string;
    sessionStartTime: number;
    caseTitle: string;
    caseFile: CaseFile | null;
    solved: boolean;
    report: any;
    onNextCase: () => void;
    onReplay: () => void;
    onMainMenu: () => void;
    position?: [number, number, number];
}

export const CaseCompletionFolder = forwardRef<RapierRigidBody, CaseCompletionFolderProps>(
    ({
        sessionId,
        sessionStartTime,
        caseTitle,
        caseFile,
        solved,
        report,
        onNextCase,
        onReplay,
        onMainMenu,
        position = [0, 0.5, 0],
    }, ref) => {
        const rigidBodyRef = useRef<RapierRigidBody>(null);
        useImperativeHandle(ref, () => rigidBodyRef.current!);

        const { camera } = useThree();
        const currentView = useGameStore(state => state.currentView);
        const [hovered, setHovered] = useState(false);
        const [texture, setTexture] = useState<THREE.Texture | null>(null);

        // Debug controls for positioning
        const controls = useControls('CaseCompletionDocument', {
            enabled: true,
            distance: { value: -0.5, min: -0.8, max: -0.2, step: 0.01 },
            tiltX: { value: 1.6, min: 0, max: Math.PI, step: 0.1 },
            offsetY: { value: 0, min: -0.5, max: 0.5, step: 0.05 },
        });

        useCursor(hovered, 'pointer', 'auto');

        // Generate Texture on Mount
        useEffect(() => {
            const isPending = !report;

            const validConnections = report?.connections?.filter((c: any) => c.is_valid && !c.removed_at) || [];
            const invalidConnections = report?.connections?.filter((c: any) => !c.is_valid && !c.removed_at) || [];
            const criticalConnections = validConnections.filter((c: any) => c.is_critical);
            const solvedPuzzles = report?.puzzles?.filter((p: any) => p.solved) || [];
            const totalPuzzles = report?.puzzles?.length || 0;
            const documents = report?.documents || [];

            const formatTime = (seconds: number) => {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
                return `${minutes}m ${secs}s`;
            };
            // Calculate actual time elapsed
            const timeElapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

            const data = {
                caseTitle: caseTitle || "Untitled Case",
                caseStatus: isPending ? 'PROCESSING' : (solved ? 'SOLVED' : 'UNSOLVED'),
                timeToComplete: isPending ? '--:--:--' : formatTime(timeElapsedSeconds),
                confirmedLinks: validConnections.length,
                criticalLinks: criticalConnections.length,
                disputedLinks: invalidConnections.length,
                documentsFiled: documents.length,
                forensicTasksCompleted: isPending ? "Checking..." : `${solvedPuzzles.length}/${totalPuzzles}`,
                dateFiled: new Date().toLocaleDateString(),
                investigatorId: sessionId ? `DET-${sessionId.substring(0, 6).toUpperCase()}` : "DET-UNKNOWN",
                solutionReasoning: caseFile?.solution?.reasoning,
                averageCompletionTime: "45m 32s" // TODO: Calculate from DB stats
            };

            renderDocumentToTexture('case-completion', data).then((urls) => {
                if (urls.length > 0) {
                    new THREE.TextureLoader().load(urls[0], (tex) => {
                        tex.colorSpace = THREE.SRGBColorSpace;
                        tex.anisotropy = 8;
                        setTexture(tex);
                    });
                }
            });

            // PERFORMANCE: Cleanup - dispose texture when component unmounts or data changes
            // Capture current texture for cleanup
            const textureToDispose = texture;
            return () => {
                if (textureToDispose) {
                    textureToDispose.dispose();
                }
            };
        }, [caseTitle, solved, sessionStartTime, report, sessionId, caseFile]);

        const material = useMemo(() => new THREE.MeshStandardMaterial({
            color: "#fdfdfd",
            roughness: 0.8,
            metalness: 0,
        }), []);

        // Physics / Frame Loop
        useFrame(() => {
            if (!rigidBodyRef.current || currentView !== 'DESK') return;

            const targetPos = new THREE.Vector3(0, controls.offsetY, controls.distance);
            targetPos.applyMatrix4(camera.matrixWorld);
            rigidBodyRef.current.setTranslation(targetPos, true);

            const targetQuat = new THREE.Quaternion();
            targetQuat.setFromEuler(new THREE.Euler(controls.tiltX, 0, 0));
            targetQuat.premultiply(camera.quaternion);
            rigidBodyRef.current.setRotation(targetQuat, true);
        });

        if (currentView !== 'DESK') return null;

        return (
            <RigidBody
                ref={rigidBodyRef}
                type="kinematicPosition"
                position={position}
                colliders={false}
            >
                <group
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onClick={() => onNextCase()}
                >
                    {/* Base Paper Mesh - A4 Size */}
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[0.21, 0.002, 0.297]} />
                        <primitive object={material} attach="material" />
                    </mesh>

                    {/* Content Texture */}
                    {texture && (
                        <mesh position={[0, 0.0011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[0.21, 0.297]} />
                            <meshStandardMaterial
                                map={texture}
                                transparent
                                roughness={0.6}
                                metalness={0}
                            />
                        </mesh>
                    )}

                    {/* Interactive Hints (Visible on hover) */}
                    {hovered && (
                        <mesh position={[0, 0, 0]}>
                            <boxGeometry args={[0.215, 0.001, 0.302]} />
                            <meshBasicMaterial color="#ffaa00" wireframe />
                        </mesh>
                    )}
                </group>
            </RigidBody>
        );
    }
);

CaseCompletionFolder.displayName = 'CaseCompletionFolder';
export default CaseCompletionFolder;