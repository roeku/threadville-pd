import React, { useMemo, useRef } from 'react';
import { QuadraticBezierLine } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import { EvidenceLink, LinkType, InteractionState } from '../../types/deduction';
import { EvidenceItem, EvidenceType } from '../../types';

interface Props {
    connections: EvidenceLink[];
    itemRefs: React.MutableRefObject<Record<string, RapierRigidBody | null>>;
    evidence: EvidenceItem[];
    interaction: InteractionState;
    parentRef?: React.RefObject<THREE.Group>; // To transform world coords to local
}

const getPinOffset = (item?: EvidenceItem) => {
    if (!item) return new THREE.Vector3(0, 0.02, -0.12); // Fallback

    if (item.type === EvidenceType.PHOTO) {
        return new THREE.Vector3(0, 0.02, -0.07);
    }

    // Paper
    const tid = item.metadata?.type || item.metadata?.templateId;
    let width = 0.21;
    let height = 0.29; // Default A4

    if (tid) {
        switch (tid) {
            case 'rail-timetable': width = 0.10; height = 0.20; break;
            case 'boarding-pass': width = 0.20; height = 0.10; break;
            case 'news-clipping': width = 0.15; height = 0.25; break;
            case 'handwritten-note': width = 0.15; height = 0.20; break;
            case 'crime-scene-sketch': width = 0.29; height = 0.21; break;
            case 'email-printout': width = 0.21; height = 0.29; break;
        }
    }

    // Pin logic from EvidenceObject: -paperHeight / 2 + 0.02
    return new THREE.Vector3(0, 0.02, -height / 2 + 0.02);
}

const SingleConnection = ({ conn, itemRefs, evidence, parentRef }: { conn: EvidenceLink, itemRefs: any, evidence: EvidenceItem[], parentRef?: any }) => {
    const lineRef = useRef<any>(null);
    const startVec = useMemo(() => new THREE.Vector3(), []);
    const endVec = useMemo(() => new THREE.Vector3(), []);
    const midVec = useMemo(() => new THREE.Vector3(), []);
    
    // PERFORMANCE: Cache last positions to avoid unnecessary updates
    const lastPositions = useRef({ start: new THREE.Vector3(), end: new THREE.Vector3() });
    const updateThreshold = 0.001; // Only update if items moved more than this

    const fromItem = useMemo(() => evidence.find(e => e.id === conn.fromId), [evidence, conn.fromId]);
    const toItem = useMemo(() => evidence.find(e => e.id === conn.toId), [evidence, conn.toId]);

    const { color, width, opacity, dash } = useMemo(() => {
        let color = '#ef4444'; // Default Red
        let opacity = 0.8;
        let width = 2;
        let dash = false;

        if (conn.status === 'VALID') {
            color = '#fbbf24'; // Gold
            width = 4;
            opacity = 1;
        } else if (conn.status === 'INVALID') {
            color = '#525252'; // Charred Grey
            width = 1;
            opacity = 0.5;
        } else {
            // Normal State based on Type
            switch (conn.type) {
                case LinkType.MATCHES: color = '#ef4444'; break; // Red Thread
                case LinkType.CONTRADICTS: color = '#3b82f6'; break; // Blue
                case LinkType.MOTIVATES: color = '#a855f7'; break; // Purple
                case LinkType.LOCATES: color = '#22c55e'; break; // Green
                case LinkType.UNKNOWN: color = '#ffffff'; dash = true; break;
            }
        }
        return { color, width, opacity, dash };
    }, [conn.type, conn.status]);

    useFrame(() => {
        if (!itemRefs.current || !lineRef.current) return;
        const startBody = itemRefs.current[conn.fromId];
        const endBody = itemRefs.current[conn.toId];

        if (startBody && endBody) {
            const p1 = startBody.translation();
            const p2 = endBody.translation();
            
            // PERFORMANCE: Skip update if items haven't moved significantly
            const moved = (
                Math.abs(p1.x - lastPositions.current.start.x) > updateThreshold ||
                Math.abs(p1.y - lastPositions.current.start.y) > updateThreshold ||
                Math.abs(p1.z - lastPositions.current.start.z) > updateThreshold ||
                Math.abs(p2.x - lastPositions.current.end.x) > updateThreshold ||
                Math.abs(p2.y - lastPositions.current.end.y) > updateThreshold ||
                Math.abs(p2.z - lastPositions.current.end.z) > updateThreshold
            );
            
            if (!moved) return;
            
            // Update cached positions
            lastPositions.current.start.set(p1.x, p1.y, p1.z);
            lastPositions.current.end.set(p2.x, p2.y, p2.z);
            
            const r1 = startBody.rotation();
            const r2 = endBody.rotation();

            // Pin Offset Logic
            const pinLocal1 = getPinOffset(fromItem);
            const pinLocal2 = getPinOffset(toItem);

            startVec.set(p1.x, p1.y, p1.z).add(pinLocal1.clone().applyQuaternion(new THREE.Quaternion(r1.x, r1.y, r1.z, r1.w)));
            endVec.set(p2.x, p2.y, p2.z).add(pinLocal2.clone().applyQuaternion(new THREE.Quaternion(r2.x, r2.y, r2.z, r2.w)));

            // Transform to Local Space if parentRef provided
            if (parentRef?.current) {
                parentRef.current.worldToLocal(startVec);
                parentRef.current.worldToLocal(endVec);
            }

            // Catenary
            const dist = startVec.distanceTo(endVec);
            const droop = Math.min(dist * 0.2, 0.5);

            midVec.lerpVectors(startVec, endVec, 0.5);
            midVec.y -= droop;
            midVec.z -= 0.15; // Pull out from board (Towards Camera/Negative Z in Board Space)

            lineRef.current.setPoints(startVec, endVec, midVec);
        }
    });

    return (
        <QuadraticBezierLine
            ref={lineRef}
            start={[0, 0, 0]} end={[0, 0, 0]} mid={[0, 0, 0]}
            color={color}
            lineWidth={width}
            dashed={dash}
            dashScale={10}
            opacity={opacity}
            transparent
        />
    )
}

const DraggingConnection = ({ fromId, mousePos, itemRefs, evidence, parentRef }: { fromId: string, mousePos: [number, number, number], itemRefs: any, evidence: EvidenceItem[], parentRef?: any }) => {
    const lineRef = useRef<any>(null);
    const startVec = useMemo(() => new THREE.Vector3(), []);
    const endVec = useMemo(() => new THREE.Vector3(), []);
    const midVec = useMemo(() => new THREE.Vector3(), []);

    const fromItem = useMemo(() => evidence.find(e => e.id === fromId), [evidence, fromId]);

    // Use pointer if mousePos is not provided/updated? 
    // Actually InvestigationBoard will pass mousePos. `mousePos` in InteractionState is static?
    // Wait, I said in previous step I'd use useThree().pointer in DraggingConnection.
    const { raycaster, camera, pointer } = useThree();
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []); // Z-plane (corkboard)

    useFrame(() => {
        if (!itemRefs.current || !lineRef.current) return;
        const startBody = itemRefs.current[fromId];

        if (startBody) {
            const p1 = startBody.translation();
            const r1 = startBody.rotation();
            const pinLocal = getPinOffset(fromItem);
            startVec.set(p1.x, p1.y, p1.z).add(pinLocal.clone().applyQuaternion(new THREE.Quaternion(r1.x, r1.y, r1.z, r1.w)));

            // Calculate Mouse Pos on Plane (if we are in Board View, we want to hit the board)
            // But we need to raycast in World Space, find intersection, then convert to Local.

            raycaster.setFromCamera(pointer, camera);
            // We need a plane that matches the board surface.
            // The Board is at `boardPos`.
            // If parentRef is the board group, we can use its world matrix.
            // But dragging in free space?
            // Let's assume the board is roughly Z-aligned at parentRef's Z.

            // To make it simpler: use the passed `mousePos` which InvestigationBoard should update?
            // No, doing it here is better.

            const target = new THREE.Vector3();
            // We want to intersect the Corkboard.
            // The corkboard is at Local Z = 0 in parentRef. 
            // So we can transform the ray into local space, intersect Z=0 plane.

            if (parentRef?.current) {
                // Transform inverse
                const invMat = parentRef.current.matrixWorld.clone().invert();
                const rayOrigin = raycaster.ray.origin.clone().applyMatrix4(invMat);
                const rayDir = raycaster.ray.direction.clone().transformDirection(invMat);
                const localRay = new THREE.Ray(rayOrigin, rayDir);

                const localPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.05); // Just above cork
                localRay.intersectPlane(localPlane, target);
                endVec.copy(target); // Local coords directly

                // Also transform startVec (which is World) to Local
                parentRef.current.worldToLocal(startVec);

            } else {
                endVec.set(mousePos[0], mousePos[1], mousePos[2]);
            }

            // Catenary
            const dist = startVec.distanceTo(endVec);
            const droop = Math.min(dist * 0.2, 0.5);

            midVec.lerpVectors(startVec, endVec, 0.5);
            midVec.y -= droop;
            midVec.z -= 0.15;

            lineRef.current.setPoints(startVec, endVec, midVec);
        }
    });

    return (
        <QuadraticBezierLine
            ref={lineRef}
            start={[0, 0, 0]} end={[0, 0, 0]} mid={[0, 0, 0]}
            color="#ffffff"
            lineWidth={2}
            dashed
            dashScale={5}
            opacity={0.6}
            transparent
        />
    )

}

const ConnectionLayer: React.FC<Props> = ({ connections, itemRefs, evidence, interaction, parentRef }) => {
    return (
        <group>
            {connections.map(conn => (
                <SingleConnection key={conn.id} conn={conn} itemRefs={itemRefs} evidence={evidence} parentRef={parentRef} />
            ))}

            {interaction.linkingFromId && (
                <DraggingConnection
                    fromId={interaction.linkingFromId}
                    mousePos={interaction.mouseWorldPos}
                    itemRefs={itemRefs}
                    evidence={evidence}
                    parentRef={parentRef}
                />
            )}
        </group>
    );
};

export default ConnectionLayer;
