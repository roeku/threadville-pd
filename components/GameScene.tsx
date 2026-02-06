import React, { Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Environment, PerspectiveCamera, Stars, OrbitControls, CameraControls, Html, useTexture, Box, useHelper, RoundedBox } from '@react-three/drei';
import { Leva, useControls } from 'leva';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import { useViewport } from '../hooks/useViewport';
import EvidenceObject from './EvidenceObject';
import InvestigationBoard from './InvestigationBoard';
import { OfficeModelMemo as OfficeModel } from './Office';
import { TextureLoadingOverlay } from './TextureLoadingOverlay';
import { WindowPanel } from './WindowPanel';
import { CityCyclorama } from './CityCyclorama';
import { CaseFile, EvidenceItem } from '../types';
import { Perf } from 'r3f-perf';
import { CubicleInstances, CubicleModel } from './Cubicle';
import CaseCompletionFolder from './CaseCompletionFolder';

// PERFORMANCE: Shared debug box geometries and materials
const debugBoxGeometries = new Map<string, THREE.BoxGeometry>();
const debugBoxMaterialsCache = new Map<string, THREE.MeshBasicMaterial>();

const getDebugBoxMaterial = (color: string) => {
  let material = debugBoxMaterialsCache.get(color);
  if (!material) {
    material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    debugBoxMaterialsCache.set(color, material);
  }
  return material;
};

const DebugBox = React.memo(({ position, args, color }: { position: [number, number, number], args: [number, number, number], color: string }) => {
  const key = args.join(',');
  let geometry = debugBoxGeometries.get(key);
  if (!geometry) {
    geometry = new THREE.BoxGeometry(...args);
    debugBoxGeometries.set(key, geometry);
  }

  const material = useMemo(() => getDebugBoxMaterial(color), [color]);

  return (
    <mesh position={position}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
});

DebugBox.displayName = 'DebugBox';

const ControlledPointLight = ({ position, intensity, color, distance, decay, castShadow, showHelper }: {
  position: [number, number, number];
  intensity: number;
  color: string;
  distance?: number;
  decay?: number;
  castShadow?: boolean;
  showHelper?: boolean;
}) => {
  const lightRef = React.useRef<THREE.PointLight>(null);
  useHelper(showHelper && lightRef, THREE.PointLightHelper, 0.5);

  return (
    <pointLight
      ref={lightRef}
      position={position}
      intensity={intensity}
      color={color}
      distance={distance}
      decay={decay}
      castShadow={castShadow}
    />
  );
};

interface GameSceneProps {
  showCompletionFolder?: boolean;
  completionReport?: any;
  onFolderAction?: (action: 'next' | 'replay' | 'menu') => void;
  sessionId?: string | null;
  sessionStartTime?: number | null;
  evidence: EvidenceItem[];
  focusedItemId: string | null;
  setFocusedItemId: (id: string | null) => void;
  pinnedItems: Set<string>;
  onPinItem: (id: string, pinned: boolean) => void;
  connections: [string, string][];
  onConnect: (id1: string, id2: string) => void;
  isLinkMode: boolean;
  caseFile: CaseFile | null;
}

const CaseFolder = ({ title, briefing, caseId }: { title: string, briefing: string, caseId: string }) => {
  // PERFORMANCE: Memoize materials
  const folderMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#c2a47e",
    roughness: 0.8
  }), []);

  const paperMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#f0f0e0"
  }), []);

  // PERFORMANCE: Memoize geometries to avoid recreation
  const folderGeometry = useMemo(() => new THREE.BoxGeometry(0.3, 0.02, 0.4), []);
  const paperGeometry = useMemo(() => new THREE.BoxGeometry(0.28, 0.001, 0.38), []);

  return (
    <RigidBody colliders="cuboid" type="dynamic" position={[0.5, 1, 1.2]} rotation={[0, -0.2, 0]}>
      <group>
        {/* Folder Base */}
        <mesh castShadow receiveShadow>
          <primitive object={folderGeometry} attach="geometry" />
          <primitive object={folderMaterial} attach="material" />
        </mesh>
        {/* Paper Inside */}
        <mesh position={[0, 0.015, 0]}>
          <primitive object={paperGeometry} attach="geometry" />
          <primitive object={paperMaterial} attach="material" />
        </mesh>
        {/* Text Context */}
        <Html
          transform
          distanceFactor={0.5}
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          className="select-none pointer-events-none"
        >
          <div className="w-64 p-4 font-serif text-black opacity-80" style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <div className="border-b border-black/20 mb-2 pb-1 font-bold tracking-tighter text-lg uppercase">
              POLICE DEPARTMENT - CASE FILE
            </div>
            <div className="mb-4">
              <span className="bg-black text-white px-1 text-[8px] mr-1 uppercase">Confidential</span>
              <span className="font-mono text-[9px]">ID: {caseId}</span>
            </div>
            <div className="text-xl font-bold mb-4 border-l-4 border-red-800 pl-2">
              {title}
            </div>
            <div className="text-justify italic">
              {briefing}
            </div>
          </div>
        </Html>
      </group>
    </RigidBody>
  )
};

const Desk = ({ currentCase, showCompletionFolder }: { currentCase: any, showCompletionFolder?: boolean }) => {
  const addToPrintQueue = useGameStore(state => state.addToPrintQueue);
  const setView = useGameStore(state => state.setView);

  const handlePrint = React.useCallback((content: string, title?: string, metadata?: any, reportId?: string) => {
    addToPrintQueue({ content, title, metadata, reportId });
  }, [addToPrintQueue]);

  const handleLogOut = React.useCallback(() => {
    // Immediately transition to desk view - stutter was caused by setTimeout delay
    console.log('[ViewChange][Desk] onLogOut', { from: useGameStore.getState().currentView, to: 'DESK' });
    setView('DESK');
  }, [setView]);

  return (
    <group>
      {/* Visual model contains its own fixed RigidBody + table collider (see components/Office.tsx) */}
      <OfficeModel
        scale={1}
        currentCase={currentCase}
        onPrint={handlePrint}
        onLogOut={handleLogOut}
        showCompletionFolder={showCompletionFolder}
      />
    </group>
  )
};

const CityBackdrop = () => {
  const texture = useTexture('/bg.jpg');

  // PERFORMANCE: Memoize texture setup
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }, [texture]);

  // PERFORMANCE: Memoize material
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    toneMapped: false,
    fog: false,
    depthWrite: false,
  }), [texture]);

  // PERFORMANCE: Memoize geometry to avoid recreation
  const cylinderGeometry = useMemo(() => new THREE.CylinderGeometry(
    16,      // radius top
    16,      // radius bottom  
    12,      // height
    32,      // radial segments (smoothness)
    2,       // height segments
    true     // openEnded (no caps)
  ), []);

  return (
    <mesh position={[0, 0, 0]} rotation={[0, Math.PI, 0]} frustumCulled>
      {/* Cylinder wraps around the scene - openEnded means no top/bottom caps */}
      <primitive object={cylinderGeometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const DeskLighting = () => (
  <>
    {/* Warm desk lamp glow */}
    <pointLight position={[-0.25, 1.2, 0.78]} intensity={8} color="#ffcc88" distance={2.5} decay={2} />
    {/* Cool window fill */}
    <pointLight position={[-1.6, 1.9, -0.6]} intensity={6} color="#7aa3ff" distance={8} decay={2} />
  </>
);



const OfficeEnvironment = ({ debugParams }: { debugParams: any }) => {
  // PERFORMANCE: Memoize geometry and materials to avoid recreation
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(14, 10), []);
  const wallGeometry = useMemo(() => new THREE.PlaneGeometry(10, 4.5), []);
  const smallWallGeometry = useMemo(() => new THREE.PlaneGeometry(4, 4.5), []);

  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    roughness: 0.7,
    metalness: 0,
  }), []);

  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#151f2f",
    roughness: 0.95,
    metalness: 0,
  }), []);

  const ceilingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#000000",
    roughness: 0.9,
    metalness: 0,
  }), []);

  return (
    <>
      {/* Floor - Dark evening office */}
      {/* <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow frustumCulled>
        <primitive object={planeGeometry} attach="geometry" />
        <primitive object={floorMaterial} attach="material" />
      </mesh> */}

      {/* Back wall (left) - Dark evening */}
      {/* <mesh position={[-5, 2, 2.5]} rotation={[0, 0, 0]} receiveShadow frustumCulled>
        <primitive object={smallWallGeometry} attach="geometry" />
        <primitive object={wallMaterial} attach="material" />
      </mesh> */}

      {/* Back wall (right) - Dark evening */}
      {/* <mesh position={[5, 2, 2.5]} rotation={[0, 0, 0]} receiveShadow frustumCulled>
        <primitive object={smallWallGeometry} attach="geometry" />
        <primitive object={wallMaterial} attach="material" />
      </mesh> */}

      {/* Left wall - Dark evening */}
      <mesh position={[-7, 2, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow frustumCulled>
        <primitive object={wallGeometry} attach="geometry" />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Right wall - Dark evening */}
      <mesh position={[7, 2, -2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow frustumCulled>
        <primitive object={wallGeometry} attach="geometry" />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Ceiling - Dark evening */}
      {/* <mesh position={[0, 4.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow frustumCulled>
        <primitive object={planeGeometry} attach="geometry" />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh> */}
    </>
  );
};

const SceneLogic = ({
  focusedItemId, setFocusedItemId, debugParams, deskGroupRef, showHelpers, viewport
}: {
  focusedItemId: string | null,
  setFocusedItemId: (id: string | null) => void,
  debugParams: any,
  deskGroupRef: React.RefObject<THREE.Group>,
  showHelpers?: boolean,
  viewport: ReturnType<typeof useViewport>
}) => {
  const cameraControlsRef = React.useRef<CameraControls>(null);
  const currentView = useGameStore((state) => state.currentView);
  const isInspecting = useGameStore((state) => state.isInspecting);
  const isDraggingItem = useGameStore((state) => state.isDraggingItem);
  const texturesLoadingCount = useGameStore((state) => state.texturesLoadingCount);
  const { gl } = useThree();
  const pointerRef = React.useRef({ x: 0, y: 0 });

  // Internal State - THE LOGIC GATE
  const isTransitioning = React.useRef(false);
  const isInitialized = React.useRef(false);
  const targetLookAt = React.useRef(new THREE.Vector3());
  const tmpDeskCenterWorld = React.useRef(new THREE.Vector3());

  // Desk/table surface center in local space for scene-v1.glb.
  // components/Office.tsx places the table collider at position [0, 0.74, 0].
  const deskCenterLocal = React.useMemo(() => new THREE.Vector3(0, 0.74, 0), []);
  // Interaction points in DESK local space
  const computerLocal = React.useMemo(() => new THREE.Vector3(-0.14, 0.97, -0.63), []);

  // Temp vectors for calculations
  const tmpWorldA = React.useRef(new THREE.Vector3());
  const tmpWorldB = React.useRef(new THREE.Vector3());
  const tmpDir = React.useRef(new THREE.Vector3());

  // Helper to find desk center in world space
  const getDeskWorldPoint = React.useCallback((local: THREE.Vector3, out: THREE.Vector3) => {
    out.copy(local);
    if (deskGroupRef.current) {
      deskGroupRef.current.localToWorld(out);
      return out;
    }
    // Fallback if ref isn't ready
    out.x += debugParams.deskPos.x;
    out.y += debugParams.deskPos.y;
    out.z += debugParams.deskPos.z;
    return out;
  }, [deskGroupRef, debugParams.deskPos.x, debugParams.deskPos.y, debugParams.deskPos.z]);

  // Initialize camera look target and controls on first mount
  React.useEffect(() => {
    if (isInitialized.current || !cameraControlsRef.current) return;
    const tempDeskCenter = new THREE.Vector3();
    getDeskWorldPoint(deskCenterLocal, tempDeskCenter);
    targetLookAt.current.copy(tempDeskCenter);

    // Immediately set the camera to look at the desk center
    cameraControlsRef.current.setLookAt(
      debugParams.cameraPos.x,
      debugParams.cameraPos.y + debugParams.sceneLiftY,
      debugParams.cameraPos.z,
      tempDeskCenter.x,
      tempDeskCenter.y,
      tempDeskCenter.z,
      false // No animation
    );

    isInitialized.current = true;
  }, [getDeskWorldPoint, deskCenterLocal, debugParams.cameraPos.x, debugParams.cameraPos.y, debugParams.cameraPos.z, debugParams.sceneLiftY]);

  // Track pointer globally so hovering HTML overlays doesn't reset canvas pointer
  React.useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointerRef.current.x = THREE.MathUtils.clamp(x, -1, 1);
      pointerRef.current.y = THREE.MathUtils.clamp(y, -1, 1);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [gl]);

  // 1. THE SMOOTH PARALLAX LOOP (Only runs when allowed)
  useFrame(() => {
    // ABORT if:
    // 1. Controls aren't ready
    // 2. We are currently animating/transitioning (The Lock)
    // 3. We aren't in DESK mode
    // 4. User is inspecting/dragging items
    // 5. Textures are still loading
    if (!cameraControlsRef.current || isTransitioning.current || currentView !== 'DESK' || isInspecting || focusedItemId || isDraggingItem || texturesLoadingCount > 0) {
      return;
    }

    const controls = cameraControlsRef.current;
    getDeskWorldPoint(deskCenterLocal, tmpDeskCenterWorld.current);

    // Calculate Mouse Offset - Clamp parallax offsets so target never crosses behind camera
    const maxX = 0.28;
    const maxY = 0.14;
    const mouseX = -pointerRef.current.x * maxX;
    const mouseY = pointerRef.current.y * maxY;

    // Calculate the desired destination
    const desiredTarget = tmpWorldA.current.set(
      tmpDeskCenterWorld.current.x + mouseX,
      tmpDeskCenterWorld.current.y + mouseY,
      tmpDeskCenterWorld.current.z
    );

    // Smoothly Lerp current target towards desired target (The "Weight" feeling)
    targetLookAt.current.lerp(desiredTarget, 0.12);

    // Apply manual update
    controls.setLookAt(
      debugParams.cameraPos.x,
      debugParams.cameraPos.y + debugParams.sceneLiftY,
      debugParams.cameraPos.z,
      targetLookAt.current.x,
      targetLookAt.current.y,
      targetLookAt.current.z,
      false // No internal animation, we are doing the lerp ourselves
    );
  });

  React.useEffect(() => {
    if (cameraControlsRef.current) {
      // Disable controls while dragging items or inspecting focused items
      // When dragging, we want raw mouse input for the drag, not camera movement
      cameraControlsRef.current.enabled = !focusedItemId && !isDraggingItem;
    }
  }, [focusedItemId, isDraggingItem]);

  // 2. THE VIEW CONTROLLER (Handles the big moves)
  React.useEffect(() => {
    if (!cameraControlsRef.current) return;
    const controls = cameraControlsRef.current;

    const performTransition = async () => {
      // LOCK: Stop useFrame from interfering
      isTransitioning.current = true;
      controls.enabled = false;

      // Default: Reset to restricted (Desk-like) state
      controls.mouseButtons.left = 0;
      controls.mouseButtons.right = 0;
      controls.mouseButtons.middle = 0;
      controls.mouseButtons.wheel = 0;
      controls.touches.one = 0;
      controls.touches.two = 0;
      controls.touches.three = 0;
      controls.azimuthRotateSpeed = 0;
      controls.polarRotateSpeed = 0;
      controls.truckSpeed = 0;
      controls.dollySpeed = 0;

      if (currentView === 'BOARD') {
        // --- BOARD VIEW ---
        // Enable Pan (Right Click / 1 Finger) and Zoom (Wheel / 2 Fingers)
        controls.mouseButtons.right = 2; // TRUCK
        controls.mouseButtons.wheel = 4; // DOLLY
        controls.touches.one = 2 as typeof controls.touches.one;        // TRUCK (Pan on touch)
        controls.touches.two = 4 as typeof controls.touches.two;        // DOLLY (Pinch to zoom)
        controls.truckSpeed = 2.0;
        controls.dollySpeed = 2.0;
        controls.minDistance = 0.5;
        // Mobile: increase max distance for better overview on narrow screens
        controls.maxDistance = viewport.isMobile ? 6.0 : 4.0;

        tmpWorldB.current.set(
          debugParams.boardPos.x,
          debugParams.boardPos.y + debugParams.sceneLiftY,
          debugParams.boardPos.z
        );

        // Mobile portrait: pull camera back further to show full board
        const boardCamDistance = viewport.isMobile && viewport.isPortrait ? 2.5 : 1.5;

        await controls.setLookAt(
          debugParams.boardPos.x,
          debugParams.boardPos.y + debugParams.sceneLiftY,
          debugParams.boardPos.z - boardCamDistance,
          tmpWorldB.current.x,
          tmpWorldB.current.y,
          tmpWorldB.current.z,
          true // Animate
        );
        controls.enabled = true;

      } else if (currentView === 'DESK') {
        // --- DESK VIEW ---
        getDeskWorldPoint(deskCenterLocal, tmpDeskCenterWorld.current);

        // Fly back to desk
        await controls.setLookAt(
          debugParams.cameraPos.x,
          debugParams.cameraPos.y + debugParams.sceneLiftY,
          debugParams.cameraPos.z,
          tmpDeskCenterWorld.current.x,
          tmpDeskCenterWorld.current.y,
          tmpDeskCenterWorld.current.z,
          true // Animate
        );

        // SYNC: Before unlocking, ensure our parallax target starts exactly where we landed
        targetLookAt.current.copy(tmpDeskCenterWorld.current);

        // Mobile: Enable touch drag for evidence items
        if (viewport.isMobile) {
          controls.touches.one = 0; // Keep disabled - evidence drag handlers will work
        }

        // Reset Inputs
        controls.mouseButtons.right = 0;
        controls.mouseButtons.wheel = 0;
        controls.enabled = true; // Re-enable for the parallax

      } else if (currentView === 'COMPUTER') {
        // --- COMPUTER VIEW ---
        getDeskWorldPoint(computerLocal, tmpWorldB.current);
        const deskCam = tmpWorldA.current.set(debugParams.cameraPos.x, debugParams.cameraPos.y + debugParams.sceneLiftY, debugParams.cameraPos.z);
        tmpDir.current.copy(deskCam).sub(tmpWorldB.current).normalize();

        // Mobile-responsive camera positioning
        let camDistance = 0.55;
        let yOffset = -0.08;

        if (viewport.isMobile) {
          // Portrait: pull back more and adjust angle to show full monitor
          if (viewport.isPortrait) {
            camDistance = 0.75; // Pull back further
            yOffset = -0.02;    // Less downward angle
          } else {
            // Landscape mobile: moderate adjustment
            camDistance = 0.65;
            yOffset = -0.05;
          }
        }

        const camPos = tmpWorldA.current.copy(tmpWorldB.current)
          .addScaledVector(tmpDir.current, camDistance)
          .add(new THREE.Vector3(0, yOffset, 0));

        await controls.setLookAt(
          camPos.x, camPos.y, camPos.z,
          tmpWorldB.current.x, tmpWorldB.current.y, tmpWorldB.current.z,
          true // Animate
        );

        // Enable touch controls for panning OS content
        if (viewport.isMobile) {
          controls.touches.one = 2 as typeof controls.touches.one;  // TRUCK (Pan)
          controls.touches.two = 4 as typeof controls.touches.two;  // DOLLY (Zoom)
          controls.truckSpeed = 1.0;
          controls.dollySpeed = 1.0;
          controls.minDistance = 0.4;
          controls.maxDistance = 1.2;
        }

        controls.enabled = true;
      }

      // UNLOCK: Allow useFrame to take over again
      isTransitioning.current = false;
    };

    performTransition();

  }, [currentView, getDeskWorldPoint, deskCenterLocal, computerLocal, viewport]);

  return (
    // <OrbitControls />

    <CameraControls
      ref={cameraControlsRef}
      makeDefault
      smoothTime={0.25}
      draggingSmoothTime={0.25}
      minPolarAngle={Math.PI / 6}     // Allow looking up more
      maxPolarAngle={Math.PI / 2.2}   // Prevent looking too far down
      minAzimuthAngle={-Math.PI / 3}  // Allow 60 deg left turn
      maxAzimuthAngle={Math.PI / 3}   // Allow 60 deg right turn
      minDistance={0.5}
      maxDistance={3.0}
      mouseButtons={{
        left: 0,  // Disable left mouse drag
        right: 0, // Disable right mouse drag
        wheel: 0, // Disable wheel zoom
        middle: 0 // Disable middle button
      }}
      touches={{
        one: 0,
        two: 0,
        three: 0
      }}
    />
  );
};



const GameScene: React.FC<GameSceneProps> = ({
  evidence, focusedItemId, setFocusedItemId,
  pinnedItems, onPinItem, connections, onConnect, isLinkMode,
  caseFile, showCompletionFolder, completionReport, onFolderAction, sessionId, sessionStartTime
}) => {
  const viewport = useViewport();

  // Debug Logging
  React.useEffect(() => {
    console.log("[GameScene] Render. Evidence Count:", evidence.length);
    console.log("[GameScene] Case File:", caseFile?.title, caseFile?.caseId);
    console.log("[GameScene] Viewport:", viewport);

    // Log invalid positions
    evidence.forEach((e, i) => {
      if (!e.position && e.type !== 'PAPER') { // Paper might be generated without pos initially
        console.warn(`[GameScene] Warning: Evidence ${e.id} (${e.label}) has no position!`);
      }
    });
  }, [evidence, caseFile, viewport]);

  // Map of refs for red string lines
  const itemRefs = React.useRef<Record<string, RapierRigidBody | null>>({});
  const deskGroupRef = React.useRef<THREE.Group>(null);

  const currentView = useGameStore((state) => state.currentView);
  const addLink = useGameStore(state => state.addLink);
  const linkingFromId = useGameStore(state => state.linkingFromId);
  const setLinkingFromId = useGameStore(state => state.setLinkingFromId);
  const setRadialMenu = useGameStore(state => state.setRadialMenu);

  const handleUnfocus = React.useCallback(() => setFocusedItemId(null), [setFocusedItemId]);

  const handlePinClick = React.useCallback((id: string, worldPos: THREE.Vector3) => {
    if (linkingFromId === id) {
      setLinkingFromId(null);
    } else if (linkingFromId) {
      const newId = addLink(linkingFromId, id);
      if (newId) {
        setLinkingFromId(null);
        setRadialMenu({ x: worldPos.x, y: worldPos.y, z: worldPos.z, connectionId: newId });
      }
    } else {
      setLinkingFromId(id);
    }
  }, [addLink, linkingFromId, setLinkingFromId, setRadialMenu]);

  // --- HARDCODED SCENE PARAMS ---
  // The imported GLB is oriented such that the desk reads as a side view from our camera.
  // Rotating the whole desk group aligns the desk to face the seated camera.
  const deskRotY = Math.PI / 2;
  const sceneLiftY = 2;

  const { cameraPos, deskPos, boardPos, boardScale, cubicleScale, cubicleLeftPos, cubicleRightPos, cubicleBackPos, ...lightingAndHelpers } = useControls('Scene Layout', {
    cameraPos: { value: { x: 0.2, y: 1.55, z: -1.25 }, step: 0.05 },
    deskPos: { value: { x: 0, y: 0, z: 0 }, step: 0.05 },
    boardPos: { value: { x: 0.2, y: 1.25, z: 0.4 }, step: 0.05 },
    boardScale: { value: 0.15, min: 0.1, max: 2.0, step: 0.05 },
    cubicleScale: { value: 0.2, min: 0.1, max: 2.0, step: 0.1 },
    cubicleLeftPos: { value: { x: -3, y: 0, z: 0 }, step: 0.1 },
    cubicleRightPos: { value: { x: -11.5, y: 0, z: 0 }, step: 0.1 },
    cubicleBackPos: { value: { x: 0, y: 0, z: 4.0 }, step: 0.1 },
    showHelpers: { value: false },
    showDebugBoxes: { value: false },
  });

  const { ambientColor, ambientIntensity, lampPos, lampInt, lampColor, rimPos, rimInt, rimColor, fillPos, fillInt, fillColor, backRimPos, backRimInt, backRimColor } = useControls('Lighting', {
    ambientColor: '#1a2a40',
    ambientIntensity: { value: 20, min: 0, max: 50, step: 0.5 },
    lampPos: { value: { x: 0.64, y: 3.3, z: 0.1 }, step: 0.01 },
    lampInt: { value: 1, min: 0, max: 100, step: .1 },
    lampColor: '#ebdcc1',
    rimPos: { value: { x: 1.3, y: 2.8, z: 1 }, step: 0.1 },
    rimInt: { value: 2, min: 0, max: 100, step: 1 },
    rimColor: '#7a9bde',
    fillPos: { value: { x: 0, y: 3, z: -4.5 }, step: 0.1 },
    fillInt: { value: 6, min: 0, max: 100, step: 1 },
    fillColor: '#bed8e5',
    backRimPos: { value: { x: -2.0, y: 3.5, z: 3.5 }, step: 0.1 },
    backRimInt: { value: 9, min: 0, max: 50, step: 0.5 },
    backRimColor: '#2a4a6a',
  });

  const lighting = lightingAndHelpers;

  const debug = {
    cameraPos,
    deskPos,
    boardPos,
    cubicleScale,
    cubicleLeftPos,
    cubicleRightPos,
    cubicleBackPos,
    sceneLiftY,
  };

  const showDebugBoxes = (lightingAndHelpers as any).showDebugBoxes;

  const cubicleRow = React.useMemo(
    () => [-6, -4, -2, 0, 2, 4, 6].map((z) => ({
      position: [0, 0, z] as [number, number, number],
      rotation: [0, -Math.PI / 2, 0] as [number, number, number],
    })),
    []
  );

  return (
    <div className="w-full h-screen bg-black">
      <Canvas dpr={[1, 1.5]} shadows onPointerMissed={() => {
        // Don't change view if in COMPUTER mode (user is interacting with OS)
        const currentView = useGameStore.getState().currentView;
        if (currentView === 'COMPUTER') return;
        setFocusedItemId(null);
        if (currentView !== 'DESK') {
          console.log('[ViewChange][Canvas] onPointerMissed', { from: currentView, to: 'DESK' });
          useGameStore.getState().setView('DESK');
        }
      }}>
        {/* <Perf position="top-left" /> */}
        <Leva hidden />
        <SceneLogic
          focusedItemId={focusedItemId}
          setFocusedItemId={setFocusedItemId}
          debugParams={debug}
          deskGroupRef={deskGroupRef}
          showHelpers={lighting.showHelpers}
          viewport={viewport}
        />
        {lighting.showHelpers && (
          <>
            <axesHelper args={[5]} />
            <gridHelper args={[20, 20]} position={[0, -2, 0]} />
            {/* <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.05}
              minDistance={0.5}
              maxDistance={20}
            /> */}
          </>
        )}

        {/* Detective Point of View: Seated looking at desk */}
        {/* Mobile: wider FOV for better view on small screens */}
        <PerspectiveCamera
          makeDefault
          position={[debug.cameraPos.x, debug.cameraPos.y + debug.sceneLiftY, debug.cameraPos.z]}
          fov={viewport.isMobile ? 55 : 40}
        />

        {/* HDRI as background - don't set manual background color */}

        {/* Ambient light - evening atmosphere */}
        <ambientLight intensity={ambientIntensity} color={ambientColor} />

        {/* PRIMARY: Warm desk lamp light - the hero light source */}
        <ControlledPointLight
          position={[lampPos.x, lampPos.y, lampPos.z]}
          intensity={lampInt}
          color={lampColor}
          distance={2}
          decay={.5}
          castShadow
          showHelper={lighting.showHelpers}
        />

        {/* Secondary: Warm rim light from lamp base */}
        <ControlledPointLight
          position={[rimPos.x, rimPos.y, rimPos.z]}
          intensity={rimInt}
          color={rimColor}
          distance={3}
          decay={2}
          showHelper={lighting.showHelpers}
        />

        {/* Fill light: Cool tones from evening cityscape */}
        <ControlledPointLight
          position={[fillPos.x, fillPos.y, fillPos.z]}
          intensity={fillInt}
          color={fillColor}
          distance={8}
          decay={2}
          showHelper={lighting.showHelpers}
        />

        {/* Back rim: Very subtle cool accent */}
        <ControlledPointLight
          position={[backRimPos.x, backRimPos.y, backRimPos.z]}
          intensity={backRimInt}
          color={backRimColor}
          distance={6}
          decay={2}
          showHelper={lighting.showHelpers}
        />

        <OfficeEnvironment debugParams={debug} />

        {/* Rainy Windows behind the desk */}
        <group position={[0, 5, 3]}>
          {/* Center Panel */}
          <WindowPanel position={[0, 0, 0.2]} width={2} height={5} />

          {/* Left Angled Panel */}
          <WindowPanel position={[-2, 0, 0.2]} rotation={[0, 0, 0]} width={2} height={5} />
          <WindowPanel position={[-4, 0, 0.2]} width={2} height={5} />
          {/* Right Angled Panel */}
          <WindowPanel position={[2, 0, 0.2]} rotation={[0, 0, 0]} width={2} height={5} />
          <WindowPanel position={[4, 0, 0.2]} width={2} height={5} />
        </group>
        <Box args={[10, .9, 1]} position={[0, 2, 3.1]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={1} />
        </Box>

        {/* Cyclorama curved backdrop - pre-blurred city image */}
        <CityCyclorama imagePath="/flat-city-blurred.jpg" />

        {/* Wrap entire scene in a group to lift everything together */}
        <group position={[0, sceneLiftY, 0]}>
          <Physics gravity={[0, -9.81, 0]}>
            {/* DEBUG BOXES */}
            {showDebugBoxes && (
              <>
                {/* Investigation Board Box - Green */}
                <DebugBox position={[boardPos.x, boardPos.y, boardPos.z]} args={[10 * boardScale, 6 * boardScale, 0.1 * boardScale]} color="green" />

                {/* Desk Surface Box - Yellow (use deskGroupRef transform) */}
                <group position={[deskPos.x, deskPos.y, deskPos.z]} rotation={[0, Math.PI / 2, 0]}>
                  <DebugBox position={[0, 0.74, 0]} args={[0.88, 0.02, 2]} color="yellow" />

                  {/* Computer Screen Box - Blue */}
                  <DebugBox position={[-0.134, 0.967, -0.626]} args={[0.5, 0.45, 0.01]} color="blue" />
                </group>
              </>
            )}
            <Suspense fallback={<Html center><div className="text-amber-500 font-mono text-xs">LOADING OFFICE...</div></Html>}>
              <group ref={deskGroupRef} position={[deskPos.x, deskPos.y, deskPos.z]} rotation={[0, deskRotY, 0]}>
                {/* <DeskLighting /> */}
                <Desk currentCase={caseFile} showCompletionFolder={showCompletionFolder} />



                {/* Spawn Evidence relative to Desk parent group */}
                {evidence.map((item) => {
                  // Debug log for individual item render
                  // console.log(`[GameScene] Rendering Item: ${item.id}, Type: ${item.type}`);
                  return (
                    <EvidenceObject
                      key={item.id}
                      ref={(el) => { itemRefs.current[item.id] = el; }}
                      item={item}
                      isFocused={focusedItemId === item.id}
                      onFocus={setFocusedItemId}
                      onUnfocus={handleUnfocus}
                      isPinned={pinnedItems.has(item.id)}
                      onPin={onPinItem}
                      onPinClick={handlePinClick}
                      sceneLiftY={sceneLiftY}
                    />
                  )
                })}

                {/* Audio Player Interaction Zone removed */}
              </group>
            </Suspense>

            <Suspense fallback={<Html position={[0, 5, -8]} center><div className="text-red-500 font-mono text-xs">LOADING EVIDENCE...</div></Html>}>

              {/* Investigation Board Zone - On the wall behind/above desk */}
              {/* Only render when in BOARD view to save computation */}
              {(
                <group position={[boardPos.x, boardPos.y, boardPos.z]} scale={[boardScale, boardScale, boardScale]}>
                  <InvestigationBoard
                    itemRefs={itemRefs} evidence={evidence} focusedItemId={focusedItemId}
                    setFocusedItemId={setFocusedItemId}
                  />
                </group>
              )}

            </Suspense>
            {showCompletionFolder && sessionId && (
              <CaseCompletionFolder
                sessionId={sessionId}
                sessionStartTime={sessionStartTime || Date.now()}
                caseTitle={caseFile?.title || 'Unknown Case'}
                caseFile={caseFile}
                solved={true}
                report={completionReport}
                onNextCase={() => onFolderAction?.('next')}
                onReplay={() => onFolderAction?.('replay')}
                onMainMenu={() => onFolderAction?.('menu')}
                position={[0, 0.5, 0.15]}
              />
            )}
          </Physics>

        </group>

        {/* Merged cubicles - instanced materials from cubicle-merged.glb */}
        {/* <Suspense fallback={null}>
          <group position={[2, -0.2, 7]} rotation={[0, -Math.PI / 2, 0]}>
            <CubicleInstances>
              {cubicleRow.map((item, index) => (
                <CubicleModel
                  key={`cubicle-left-${index}`}
                  position={[
                    debug.cubicleLeftPos.x + item.position[0],
                    debug.cubicleLeftPos.y + item.position[1],
                    debug.cubicleLeftPos.z + item.position[2],
                  ]}
                  rotation={[0, Math.PI / 2, 0]}
                  scale={debug.cubicleScale}
                />
              ))}

            </CubicleInstances>
          </group>
        </Suspense> */}

      </Canvas>
      <TextureLoadingOverlay />
    </div>
  );
};

export default GameScene;
