import { useGameStore } from '../stores/useGameStore';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { Text, Image as DreiImage, useCursor, useTexture } from '@react-three/drei';
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { EvidenceItem, EvidenceType } from '../types';

import { renderDocumentToTexture } from '../services/document-rendering/renderDocument';
import { getTemplateForEvidence } from '../services/templateManager';

const DeductionPin = React.memo(({ onClick, visible }: { onClick: (e: any) => void, visible: boolean }) => {
  const [hover, setHover] = useState(false);

  // PERFORMANCE: Memoize materials for pin components
  const metalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#c0c0c0",
    metalness: 0.9,
    roughness: 0.2,
  }), []);

  const plasticMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: hover ? "#ff6666" : "#dd0000",
    metalness: 0.1,
    roughness: 0.8,
    emissive: hover ? "#ff3333" : "#000000",
    emissiveIntensity: hover ? 0.5 : 0,
  }), []);

  // Update plastic material on hover
  useEffect(() => {
    if (plasticMaterial) {
      plasticMaterial.color.setHex(hover ? 0xff6666 : 0xdd0000);
      plasticMaterial.emissive.setHex(hover ? 0xff3333 : 0x000000);
      plasticMaterial.emissiveIntensity = hover ? 0.5 : 0;
      plasticMaterial.needsUpdate = true;
    }
  }, [hover, plasticMaterial]);

  // PERFORMANCE: Memoize geometries
  const needleGeometry = useMemo(() => new THREE.CylinderGeometry(0.003, 0.0008, 0.08, 16), []);
  const baseFlangeGeometry = useMemo(() => new THREE.CylinderGeometry(0.015, 0.025, 0.025, 32), []);
  const neckGeometry = useMemo(() => new THREE.CylinderGeometry(0.035, 0.012, 0.045, 32), []);
  const headGeometry = useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 0.008, 32), []);
  const interactionGeometry = useMemo(() => new THREE.SphereGeometry(0.06), []);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHover(true);
    document.body.style.cursor = 'crosshair';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHover(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick(e);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
  };

  return (
    <group visible={visible}>
      {/* Needle (Metal) - Tip pointing down */}
      <mesh
        position={[0, -0.04, 0]}
        castShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <primitive object={needleGeometry} attach="geometry" />
        <primitive object={metalMaterial} attach="material" />
      </mesh>

      {/* Base Flange (bottom of plastic body) */}
      <mesh
        position={[0, 0, 0]}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <primitive object={baseFlangeGeometry} attach="geometry" />
        <primitive object={plasticMaterial} attach="material" />
      </mesh>

      {/* Neck/Upper Body (Flares out) */}
      <mesh
        position={[0, 0.035, 0]}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <primitive object={neckGeometry} attach="geometry" />
        <primitive object={plasticMaterial} attach="material" />
      </mesh>

      {/* Flat Head Cap */}
      <mesh
        position={[0, 0.058, 0]}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      >
        <primitive object={headGeometry} attach="geometry" />
        <primitive object={plasticMaterial} attach="material" />
      </mesh>
      {/* Interaction Zone - larger */}
      <mesh
        position={[0, 0.02, 0]}
        visible={false}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        <primitive object={interactionGeometry} attach="geometry" />
      </mesh>
    </group>
  );
});

interface EvidenceObjectProps {
  item: EvidenceItem;
  isFocused: boolean;
  onFocus: (id: string) => void;
  onUnfocus: () => void;
  isPinned: boolean;
  onPin: (id: string, pinned: boolean) => void;
  onPinClick?: (id: string, pos: THREE.Vector3) => void; // New prop
  sceneLiftY?: number;
}

const EvidenceObject = React.memo(forwardRef((props: EvidenceObjectProps, ref: React.Ref<RapierRigidBody>) => {
  const { item, isFocused, onFocus, onUnfocus, isPinned, onPin, onPinClick, sceneLiftY = 0 } = props;
  const localRef = useRef<RapierRigidBody>(null);
  useImperativeHandle(ref, () => localRef.current!);
  // Note: this assumes localRef is populated. Rapier might load async? usually fine.

  const currentView = useGameStore((state) => state.currentView);
  const setIsDraggingItem = useGameStore((state) => state.setIsDraggingItem);

  const rigidBody = localRef; // Use localRef internally
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster, mouse, viewport } = useThree();

  // Sync dragging state to global store to disable camera interactions
  useEffect(() => {
    setIsDraggingItem(isDragging);
  }, [isDragging, setIsDraggingItem]);

  // Use planes for raycasting when dragging
  const boardPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.38), []);
  const deskPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const dragPoint = useRef(new THREE.Vector3());

  useCursor(hovered && !isDragging, 'pointer', 'auto');
  useCursor(isDragging, 'grabbing', 'auto');

  // Use item's imageUrl if provided, otherwise generate a consistent random image for photos
  const imageUrl = useMemo(() => {
    if (item.imageUrl) {
      return item.imageUrl;
    }
    if (item.type === EvidenceType.PHOTO) {
      const seed = item.id;
      return `https://picsum.photos/seed/${seed}/200/200`;
    }
    return undefined;
  }, [item.type, item.id, item.imageUrl]);

  const [zoomOffset, setZoomOffset] = useState(0);

  const photoAlibi = useMemo(() => {
    if (item.type !== EvidenceType.PHOTO) return null;
    const isProfile = item.id?.startsWith('PROFILE-') || item.description?.toLowerCase().includes('profile card');
    if (!isProfile) return null;

    const sourceText = item.description || item.content || '';
    const alibiIndex = sourceText.toLowerCase().indexOf('alibi:');
    if (alibiIndex === -1) return 'ALIBI: Not provided.';

    const raw = sourceText.slice(alibiIndex + 6).trim();
    if (!raw) return 'ALIBI: Not provided.';
    return `ALIBI: ${raw}`;
  }, [item.type, item.id, item.description, item.content]);

  useFrame((state, delta) => {
    if (!rigidBody.current) return;

    // PERFORMANCE: Early exit if not in any active state
    if (!isFocused && !isDragging) return;

    // PERFORMANCE: Skip if we're in a view that doesn't allow interaction
    if (currentView === 'COMPUTER') return;

    if (isFocused) {
      // Focus Mode: Smoothly move to front of camera
      // Base distance is -0.4. Zoom offset adds to this (e.g. -0.1 gets closer)
      const baseDist = -0.4;
      const targetDist = baseDist + zoomOffset;
      const clampedDist = Math.max(-0.8, Math.min(-0.2, targetDist));

      const targetPos = new THREE.Vector3(panOffset.x, panOffset.y, clampedDist);
      targetPos.applyMatrix4(camera.matrixWorld);

      const currentPos = rigidBody.current.translation();
      const newPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).lerp(targetPos, 0.1);

      // Face the camera perfectly
      // Face the camera - simplified to look at camera position
      // The text is on the top face (Y+), so we need to rotate it to face -Z relative to camera

      const targetQuat = new THREE.Quaternion();
      targetQuat.setFromEuler(new THREE.Euler(Math.PI / 3, 0, 0)); // Tilt up 60 degrees to face camera
      targetQuat.premultiply(camera.quaternion); // Match camera orientation

      // Apply User Rotation
      targetQuat.multiply(userRotation.current);

      const currentRot = rigidBody.current.rotation();
      const currentQuat = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
      currentQuat.slerp(targetQuat, 0.1);

      rigidBody.current.setTranslation(newPos, true);
      rigidBody.current.setRotation(currentQuat, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    else if (isDragging) {
      // Drag Logic: Raycast to plane and move kinematic body
      raycaster.setFromCamera(mouse, camera);

      const currentPos = rigidBody.current.translation();
      let targetPos: THREE.Vector3 | null = null;

      // Define Wall/Board Plane (Z-facing) and Desk Plane (Y-facing)
      // Board is at Z ~ 0.38, evidence placed at Z ~ 0.35 (in front). Normal points to -Z (towards camera).
      // Plane equation: -z + 0.35 = 0  => z = 0.35
      deskPlane.constant = -currentPos.y;

      // Board View: Always use Wall Plane
      if (currentView === 'BOARD' || isPinned) {
        const hit = new THREE.Vector3();
        raycaster.ray.intersectPlane(boardPlane, hit);
        if (hit) {
          targetPos = new THREE.Vector3(hit.x, hit.y, 0.4);
          // Orient flat against board
          targetRotation.current.setFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI));
          if (meshRef.current) meshRef.current.scale.set(1, 1, 1);
        }
      }
      // Desk View: Hybrid approach (Wall + Desk)
      else {
        const deskHit = new THREE.Vector3();
        const boardHit = new THREE.Vector3();

        const hasDeskHit = raycaster.ray.intersectPlane(deskPlane, deskHit);
        const hasBoardHit = raycaster.ray.intersectPlane(boardPlane, boardHit);

        // Threshold: exact intersection of Desk and Board planes
        // Z = 0.48. 
        // If the desk hit is "behind" the board (Z > 0.48) or simply "close enough" (Z > 0.25), switch to wall.
        const WALL_THRESHOLD_Z = 0.25;

        if (hasDeskHit && deskHit.z < WALL_THRESHOLD_Z) {
          // We are on the desk part
          targetPos = new THREE.Vector3(deskHit.x, currentPos.y, deskHit.z);
          // Orient flat on desk (reset rotation)
          targetRotation.current.setFromEuler(new THREE.Euler(0, 0, 0));
          if (meshRef.current) meshRef.current.scale.set(1, 1, 1);

        } else if (hasBoardHit) {
          // We are projecting onto the wall part
          targetPos = new THREE.Vector3(boardHit.x, boardHit.y, 0.38);
          // Orient flat against board
          targetRotation.current.setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0));
          if (meshRef.current) meshRef.current.scale.set(1, 1, 1);

        } else if (hasDeskHit) {
          // Fallback: If we missed the board plane (too high?), clamp desk hit?
          // Actually if we look too high, ray intersects desk plane "behind" us or at infinity.
          // Just stick to using board hit if available.
        }
      }

      if (targetPos) {
        const lerpPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).lerp(targetPos, 0.2);
        rigidBody.current.setTranslation(lerpPos, true);
      }

      // Lerp rotation towards target
      const currentRot = rigidBody.current.rotation();
      const currentQuat = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
      currentQuat.slerp(targetRotation.current, 0.15);
      rigidBody.current.setRotation(currentQuat, true);

      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  // Drag Logic handled in useFrame


  // Improved Click/Drag separation
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);

  // Focus Mode Interaction State
  const userRotation = useRef(new THREE.Quaternion());
  const isInteracting = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const targetRotation = useRef(new THREE.Quaternion());

  // Reset user rotation when focus changes
  useEffect(() => {
    if (isFocused) {
      userRotation.current.identity();
      setZoomOffset(0);
      console.log(`Viewing evidence: ${item.label} (ID: ${item.id})`);
    }
  }, [isFocused, item.label, item.id]);

  const handlePinClick = React.useCallback((e: any) => {
    if (!isPinned) return;
    const worldPos = new THREE.Vector3();
    e.object.getWorldPosition(worldPos);
    onPinClick?.(item.id, worldPos);
  }, [isPinned, onPinClick, item.id]);

  const onPointerDown = React.useCallback((e: any) => {
    e.stopPropagation();

    // If focused, start manual rotation
    if (isFocused) {
      isInteracting.current = true;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    // Normal Drag logic
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    if (rigidBody.current) {
      setIsDragging(true);
      rigidBody.current.setBodyType(2, true); // KinematicPosition
      rigidBody.current.wakeUp();
    }
  }, [isFocused]);

  const onPointerMove = React.useCallback((e: any) => {
    // Handle Rotation/Pan in Focus Mode
    if (isFocused && isInteracting.current) {
      e.stopPropagation();
      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;
      const sensitivity = 0.005;

      if (e.shiftKey) {
        // Pan (Move Up/Down/Left/Right)
        // In camera space, X is right, Y is up.
        // Note: dx is pixels. We need to scale down.
        const panScale = 0.001;
        setPanOffset(prev => ({
          x: prev.x + (dx * panScale),
          y: prev.y - (dy * panScale) // Screen Y is down, World Y is up
        }));
      } else {
        // Rotate
        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * sensitivity);
        const qy = new THREE.Quaternion();
        qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * sensitivity);

        userRotation.current.multiply(qx); // Vertical rotates around X
        userRotation.current.premultiply(qy); // Horizontal rotates around Y (Global/View relative)
      }

      lastPointerPos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isFocused]);

  const onPointerUp = React.useCallback((e: any) => {
    e.stopPropagation();

    if (isFocused) {
      if (isInteracting.current) {
        isInteracting.current = false;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

        // Check for click (minimal movement) to handle page turn
        if (lastPointerPos.current && dragStartPos.current === null) {
          // If we just clicked without moving much, maybe it was a page turn?
          // Actually, let's keep it simple: Click = Page Turn. Drag = Rotate.
          // But we use the same Down/Up. 
          // We can simply check total rotation or handlePageClick explicitly inside move?
          // Let's defer page click to 'onClick' or similar if possible, 
          // or just assume if delta was small it's a click.
        }
      }
      return;
    }

    setIsDragging(false);

    if (rigidBody.current) {
      // Check if dropped near board (Board is around z = 0.6, y = 1.6)
      const pos = rigidBody.current.translation();
      // Camera is at z ~ -1.25. Board is at z ~ 0.6.
      // So "near board" is z > 0.
      const boardHalfWidth = BOARD_WIDTH * 0.5;
      const boardHalfHeight = BOARD_HEIGHT * 0.5;
      const withinBoardX = pos.x >= BOARD_CENTER_X - boardHalfWidth && pos.x <= BOARD_CENTER_X + boardHalfWidth;
      const withinBoardY = pos.y >= BOARD_CENTER_Y - boardHalfHeight && pos.y <= BOARD_CENTER_Y + boardHalfHeight;
      const withinBoardZ = Math.abs(pos.z - BOARD_CENTER_Z) <= BOARD_DEPTH_TOLERANCE;

      const isOnBoard = withinBoardX && withinBoardY && withinBoardZ;

      if (isOnBoard) {
        if (!isPinned) {
          onPin(item.id, true);
          // Snap to board surface (Board front face ~ 0.5)
          rigidBody.current.setTranslation({ x: pos.x, y: pos.y, z: 0.38 }, true);
          // Fixed rotation facing camera (Top of paper becomes Top of board)
          const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI));
          rigidBody.current.setRotation(q, true);

          rigidBody.current.setBodyType(1, true); // Fixed
        }
      } else {
        if (isPinned) {
          onPin(item.id, false);
          rigidBody.current.setBodyType(0, true);
          rigidBody.current.wakeUp();
        } else {
          rigidBody.current.setBodyType(0, true);
          rigidBody.current.wakeUp();
          rigidBody.current.setLinvel({ x: 0, y: -1, z: 0 }, true);
        }
      }
    }

    if (dragStartPos.current) {
      const dist = Math.hypot(e.clientX - dragStartPos.current.x, e.clientY - dragStartPos.current.y);
      // Increased threshold to differentiate drag vs click clearly
      if (dist < 10) {
        if (!isFocused) onFocus(item.id);
      }
      dragStartPos.current = null;
    }
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, [isFocused, isPinned, onPin, onFocus, item.id]);

  // Revert physics type when unfocused OR unpinned state changes (from outside)
  useEffect(() => {
    if (rigidBody.current) {
      if (isPinned) {
        rigidBody.current.setBodyType(1, true); // Fixed
      } else if (!isFocused) {
        rigidBody.current.setBodyType(0, true); // Dynamic
        rigidBody.current.wakeUp();
      }
    }
  }, [isPinned, isFocused]);


  const borderColor = hovered ? "#ff9900" : "#222";
  // const paperWidth = 0.21; // Now dynamic
  // const paperHeight = 0.29; // Now dynamic

  const templateId = useMemo(
    () => getTemplateForEvidence(item),
    [item.metadata?.templateId, item.metadata?.type, item.label, item.content, item.type]
  );

  const shouldRenderDocument = useMemo(() => {
    if (item.type === EvidenceType.PHOTO) return false;
    if (item.type === EvidenceType.FORENSIC_SAMPLE) return false;
    return item.type === EvidenceType.PAPER || item.type === EvidenceType.OBJECT;
  }, [item.type]);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Place document above desk when exiting focus mode
  useEffect(() => {
    if (!isFocused && rigidBody.current && !isPinned) {
      // Exit focus: place above desk so it stays visible
      const safePos = {
        x: DESK_X_CENTER,
        y: DESK_Y_CENTER + DESK_DROP_HEIGHT,
        z: DESK_Z_CENTER
      };
      rigidBody.current.setTranslation(safePos, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [isFocused, isPinned]);

  // Monitor for documents falling off desk and reset them
  useEffect(() => {
    const fallCheckInterval = setInterval(() => {
      if (!rigidBody.current) return;

      const pos = rigidBody.current.translation();

      // If document has fallen too far below desk, bring it back
      if (pos.y < FALL_THRESHOLD_Y && !isPinned && !isFocused) {
        const safePos = {
          x: pos.x > 2 ? pos.x - 0.5 : (pos.x < -2 ? pos.x + 0.5 : pos.x), // Keep it roughly in place horizontally
          y: DESK_Y_CENTER + DESK_DROP_HEIGHT,
          z: Math.max(DESK_Z_CENTER, pos.z) // Keep Z if it's higher
        };
        rigidBody.current.setTranslation(safePos, true);
        rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(fallCheckInterval);
  }, [isPinned, isFocused]);

  const [paperWidth, paperHeight] = useMemo(() => {
    // Default A4 vertical: 0.21 x 0.29
    if (!templateId) return [0.21, 0.29];

    switch (templateId) {
      case 'rail-timetable': return [0.10, 0.20]; // Ticket size
      case 'boarding-pass': return [0.20, 0.10]; // Wide ticket
      case 'news-clipping': return [0.15, 0.25]; // Scrap
      case 'handwritten-note': return [0.15, 0.20]; // Notepad
      case 'crime-scene-sketch': return [0.29, 0.21]; // Landscape A4
      case 'email-printout': return [0.21, 0.29];
      default: return [0.21, 0.29];
    }
  }, [templateId]);

  // Safe desk position to place documents
  const DESK_X_CENTER = 0;
  const DESK_Y_CENTER = 1.2 + sceneLiftY;
  const DESK_Z_CENTER = 0.1;
  const DESK_DROP_HEIGHT = 0.15; // Height above desk surface
  const FALL_THRESHOLD_Y = 0.3 + sceneLiftY; // If document falls below this, reset it

  // Board bounds (match default scene layout in GameScene)
  const BOARD_CENTER_X = 0.2;
  const BOARD_CENTER_Y = 1.25 + sceneLiftY;
  const BOARD_CENTER_Z = 0.4;
  const BOARD_WIDTH = 10 * 0.15;
  const BOARD_HEIGHT = 6 * 0.15;
  const BOARD_DEPTH_TOLERANCE = 0.08;

  const [generatedMaps, setGeneratedMaps] = useState<THREE.Texture[]>([]);
  // Use store for pagination state so HUD can access it
  const documentStates = useGameStore(state => state.documentStates);
  const setDocumentTotalPages = useGameStore(state => state.setDocumentTotalPages);
  const incrementTextureLoading = useGameStore(state => state.incrementTextureLoading);
  const decrementTextureLoading = useGameStore(state => state.decrementTextureLoading);
  const currentPage = documentStates[item.id]?.currentPage || 0;

  // PERFORMANCE: Memoize materials to avoid recreation on every render
  const paperBaseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#fdfdfd",
    roughness: 0.9,
    metalness: 0,
  }), []);

  const photoBaseMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#fff",
    roughness: 0.5,
  }), []);

  // PERFORMANCE: Single wireframe material that we update instead of recreating
  const borderWireframeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: borderColor,
    wireframe: true,
  }), []);

  // Update border material color on hover instead of recreating material
  useEffect(() => {
    if (borderWireframeMaterial) {
      borderWireframeMaterial.color.setHex(hovered ? 0xff9900 : 0x222222);
      borderWireframeMaterial.needsUpdate = true;
    }
  }, [hovered, borderWireframeMaterial]);

  // PERFORMANCE: Memoize geometries for paper evidence to avoid recreation
  const paperBoxGeometry = useMemo(() => new THREE.BoxGeometry(paperWidth, 0.002, paperHeight), [paperWidth, paperHeight]);
  const paperPlaneGeometry = useMemo(() => new THREE.PlaneGeometry(paperWidth, paperHeight), [paperWidth, paperHeight]);
  const paperOutlineGeometry = useMemo(() => new THREE.BoxGeometry(paperWidth + 0.01, 0.001, paperHeight + 0.01), [paperWidth, paperHeight]);

  // PERFORMANCE: Memoize geometries for photo evidence
  const photoBoxGeometry = useMemo(() => new THREE.BoxGeometry(0.15, 0.002, 0.18), []);
  const photoOutlineGeometry = useMemo(() => new THREE.BoxGeometry(0.16, 0.001, 0.19), []);

  // PERFORMANCE: Memoize document content material to avoid recreation on page changes
  const documentContentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: generatedMaps[0], // Start with first page, will be updated by useEffect
    transparent: true,
    roughness: 0.8,
    metalness: 0,
    side: THREE.FrontSide,
  }), [generatedMaps]);

  // Update material map when page changes
  useEffect(() => {
    if (documentContentMaterial && generatedMaps.length > 0) {
      documentContentMaterial.map = generatedMaps[currentPage];
      documentContentMaterial.needsUpdate = true;
    }
  }, [documentContentMaterial, generatedMaps, currentPage]);

  useEffect(() => {
    // Capture the current textures to dispose in cleanup - spread to new array
    const texturesToDispose = [...generatedMaps];

    if (shouldRenderDocument && templateId) {
      // Use fields if available, otherwise fallback to top-level metadata
      // INJECT CONTENT: Ensure abstract 'content' and 'label' are available to restrictions
      const data = {
        ...(item.metadata.fields ? item.metadata.fields : item.metadata),
        // Inject fallback data for unstructured AI responses
        content: item.content,
        label: item.label,
        description: item.description,
        evidenceId: item.id,
        itemType: item.type,
        imageUrl: item.imageUrl
      };

      // Track that this evidence is starting texture load
      incrementTextureLoading();

      renderDocumentToTexture(templateId, data).then((urls) => {
        // urls is string[]
        Promise.all(urls.map((url) => {
          return new Promise<THREE.Texture>((resolve) => {
            new THREE.TextureLoader().load(url, (tex) => {
              tex.wrapS = THREE.ClampToEdgeWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
              tex.anisotropy = 8;
              tex.colorSpace = THREE.SRGBColorSpace;
              resolve(tex);
            });
          });
        })).then((textures) => {
          setGeneratedMaps(textures);
          setDocumentTotalPages(item.id, textures.length);
          decrementTextureLoading();
        });
      }).catch(err => {
        console.error("Texture Gen Error", err);
        decrementTextureLoading();
      });
    } else {
      setGeneratedMaps([]);
    }

    // PERFORMANCE: Cleanup - dispose old textures when component unmounts or metadata changes
    return () => {
      texturesToDispose.forEach(texture => {
        texture.dispose();
      });
    };
  }, [shouldRenderDocument, templateId, item.metadata, item.id]);

  // Physics cleanup for focus mode
  // When entering focus, we SNAP to kinematic. When leaving, SNAP to dynamic.
  // The useFrame logic was fighting with setTranslation.
  useEffect(() => {
    if (!rigidBody.current) return;

    if (isFocused) {
      rigidBody.current.setBodyType(2, true); // KinematicPosition - No gravity, manual move
      rigidBody.current.wakeUp();
    } else {
      if (isPinned) {
        rigidBody.current.setBodyType(1, true); // Fixed
        if (meshRef.current) meshRef.current.scale.set(1, 1, 1);
      } else {
        rigidBody.current.setBodyType(0, true); // Dynamic
        if (meshRef.current) meshRef.current.scale.set(1, 1, 1);
      }
      rigidBody.current.wakeUp();
    }
  }, [isFocused, isPinned]);

  // Snap pinned items to the board pose on first placement and on reload
  useEffect(() => {
    if (!rigidBody.current || !isPinned || isFocused) return;

    const pos = rigidBody.current.translation();
    rigidBody.current.setTranslation({ x: pos.x, y: pos.y, z: 0.38 }, true);

    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI));
    rigidBody.current.setRotation(q, true);

    rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }, [isPinned, isFocused]);


  return (
    <RigidBody
      ref={rigidBody}
      position={item.position}
      rotation={item.rotation}
      colliders={false}
      friction={2}
      restitution={0.05}
      linearDamping={2}
      angularDamping={2}
    >
      <group
        ref={meshRef}
        onPointerOver={() => !isDragging && currentView === 'BOARD' && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onWheel={(e) => {
          if (isFocused) {
            // Zoom in/out
            // e.deltaY is positive for scroll down (zoom out), negative for scroll up (zoom in)
            const zoomSpeed = 0.001;
            setZoomOffset(prev => prev - e.deltaY * zoomSpeed);
          }
        }}
        onPointerMove={(e) => {
          // Allow interaction in DESK and BOARD (not in COMPUTER or EVIDENCE)
          if (currentView === 'COMPUTER' || currentView === 'EVIDENCE') return;
          onPointerMove(e);
        }}
        onPointerDown={(e) => {
          // Allow interaction in DESK and BOARD (not in COMPUTER or EVIDENCE)
          if (currentView === 'COMPUTER' || currentView === 'EVIDENCE') return;
          onPointerDown(e);
        }}
        onPointerUp={(e) => {
          // Allow interaction in DESK and BOARD (not in COMPUTER or EVIDENCE)
          if (currentView === 'COMPUTER' || currentView === 'EVIDENCE') return;
          onPointerUp(e);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {shouldRenderDocument && (
          <group>
            {/* Base Paper Block (Physical Body) */}
            <mesh castShadow receiveShadow frustumCulled>
              <primitive object={paperBoxGeometry} attach="geometry" />
              <primitive object={paperBaseMaterial} attach="material" />
            </mesh>

            {/* Document Content Plane (Decal on Top) */}
            {generatedMaps.length > 0 && (
              <mesh
                position={[0, 0.0011, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
                frustumCulled
              >
                <primitive object={paperPlaneGeometry} attach="geometry" />
                <primitive object={documentContentMaterial} attach="material" />
              </mesh>
            )}

            {/* Outline on hover */}
            {hovered && (
              <mesh position={[0, 0, 0]} frustumCulled>
                <primitive object={paperOutlineGeometry} attach="geometry" />
                <primitive object={borderWireframeMaterial} attach="material" />
              </mesh>
            )}

            <mesh position={[0, 0, 0]} frustumCulled>
              <primitive object={paperOutlineGeometry} attach="geometry" />
              <primitive object={borderWireframeMaterial} attach="material" />
            </mesh>

            {isPinned && <group position={[0, 0, -paperHeight / 2 + 0.02]} scale={.3}>
              <DeductionPin
                visible={isPinned}
                onClick={handlePinClick}
              />
            </group>}


            <CuboidCollider args={[paperWidth / 2, 0.001, paperHeight / 2]} />
          </group>
        )}

        {item.type === EvidenceType.PHOTO && (
          <group>
            {/* Photo Border */}
            <mesh castShadow receiveShadow frustumCulled>
              <primitive object={photoBoxGeometry} attach="geometry" />
              <primitive object={photoBaseMaterial} attach="material" />
            </mesh>
            {/* Outline */}
            {hovered && (
              <mesh position={[0, 0, 0]} frustumCulled>
                <primitive object={photoOutlineGeometry} attach="geometry" />
                <primitive object={borderWireframeMaterial} attach="material" />
              </mesh>
            )}
            {/* Photo Image */}
            <DreiImage
              url={imageUrl}
              position={[0, 0.002, -0.01]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[0.13, 0.13]}
            />
            {/* Label */}
            <Text
              position={[0, 0.002, 0.07]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.01}
              color="black"
              anchorX="center"
              anchorY="middle"
            >
              {item.label}
            </Text>

            {/* Back-side Alibi (profile cards) */}
            {photoAlibi && (
              <Text
                position={[0, -0.0011, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                fontSize={0.008}
                color="#1a1a1a"
                maxWidth={0.12}
                lineHeight={1.2}
                anchorX="center"
                anchorY="middle"
              >
                {photoAlibi}
              </Text>
            )}

            {isPinned && <group position={[0, .012, -0.07]} scale={.3}>
              <DeductionPin
                visible={isPinned}
                onClick={handlePinClick}
              />
            </group>}

            <CuboidCollider args={[0.075, 0.001, 0.09]} />
          </group>
        )}


      </group>
    </RigidBody >
  );
}));

export default EvidenceObject;