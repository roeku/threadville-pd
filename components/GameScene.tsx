import React, { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Environment, PerspectiveCamera, Stars, OrbitControls, CameraControls, Html, useTexture, Box, useHelper, useGLTF } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { useGameStore } from '../stores/useGameStore';
import EvidenceObject from './EvidenceObject';
import InvestigationBoard from './InvestigationBoard';
import { OfficeModel } from './Office';
import { WindowPanel } from './WindowPanel';
import { CaseFile, EvidenceItem } from '../types';
import { Perf } from 'r3f-perf';

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

const CaseFolder = ({ title, briefing, caseId }: { title: string, briefing: string, caseId: string }) => (
  <RigidBody colliders="cuboid" type="dynamic" position={[0.5, 1, 1.2]} rotation={[0, -0.2, 0]}>
    <group>
      {/* Folder Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.02, 0.4]} />
        <meshStandardMaterial color="#c2a47e" roughness={0.8} />
      </mesh>
      {/* Paper Inside */}
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[0.28, 0.001, 0.38]} />
        <meshStandardMaterial color="#f0f0e0" />
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
);

const Desk = ({ currentCase }: { currentCase: any }) => {
  const addToPrintQueue = useGameStore(state => state.addToPrintQueue);
  const setView = useGameStore(state => state.setView);

  return (
    <group>
      {/* Visual model contains its own fixed RigidBody + table collider (see components/Office.tsx) */}
      <OfficeModel
        scale={1}
        currentCase={currentCase}
        onPrint={(content: string, title?: string, metadata?: any) => addToPrintQueue({ content, title, metadata })}
        onLogOut={() => {
          // Immediately transition to desk view - stutter was caused by setTimeout delay
          setView('DESK');
        }}
      />
    </group>
  )
};

const CityBackdrop = () => {
  const texture = useTexture('/bg.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping; // Allow wrapping around cylinder
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return (
    <mesh position={[0, 0, 0]} rotation={[0, Math.PI, 0]}>
      {/* Cylinder wraps around the scene - openEnded means no top/bottom caps */}
      <cylinderGeometry args={[
        16,      // radius top
        16,      // radius bottom  
        12,       // height
        32,      // radial segments (smoothness)
        2,       // height segments
        true     // openEnded (no caps)
      ]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}  // Render inside the cylinder
        toneMapped={false}
        fog={false}
        depthWrite={false}
      />
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
  return (
    <>
      {/* Floor - Dark evening office */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.7}
          metalness={0}
        />
      </mesh>

      {/* Back wall - Evening building/cityscape */}
      {/* <mesh position={[0, 2, 3.5]} receiveShadow>
        <planeGeometry args={[14, 4.5]} />
        <meshStandardMaterial
          color="#0f1a2e"
          roughness={0.95}
          metalness={0}
        />
      </mesh> */}

      {/* Back wall (left) - Dark evening */}
      <mesh position={[-5, 2, 2.5]} rotation={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4.5]} />
        <meshStandardMaterial
          color="#151f2f"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Back wall (right) - Dark evening */}
      <mesh position={[5, 2, 2.5]} rotation={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4.5]} />
        <meshStandardMaterial
          color="#151f2f"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Left wall - Dark evening */}
      <mesh position={[-6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4.5]} />
        <meshStandardMaterial
          color="#151f2f"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Right wall - Dark evening */}
      <mesh position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4.5]} />
        <meshStandardMaterial
          color="#151f2f"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Ceiling - Dark evening */}
      <mesh position={[0, 4.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0.9}
          metalness={0}
        />
      </mesh>
    </>
  );
};

const SceneLogic = ({
  focusedItemId, setFocusedItemId, debugParams, deskGroupRef, showHelpers
}: {
  focusedItemId: string | null,
  setFocusedItemId: (id: string | null) => void,
  debugParams: any,
  deskGroupRef: React.RefObject<THREE.Group>,
  showHelpers?: boolean
}) => {
  const cameraControlsRef = React.useRef<CameraControls>(null);
  const currentView = useGameStore((state) => state.currentView);
  const isInspecting = useGameStore((state) => state.isInspecting);
  const isDraggingItem = useGameStore((state) => state.isDraggingItem);

  // Internal State - THE LOGIC GATE
  const isTransitioning = React.useRef(false);
  const targetLookAt = React.useRef(new THREE.Vector3());
  const tmpDeskCenterWorld = React.useRef(new THREE.Vector3());

  // Desk/table surface center in local space for scene-v1.glb.
  // components/Office.tsx places the table collider at position [0, 0.74, 0].
  const deskCenterLocal = React.useMemo(() => new THREE.Vector3(0, 0.74, 0), []);
  // Interaction points in DESK local space
  const audioLocal = React.useMemo(() => new THREE.Vector3(0.0, 0.85, 0.5), []);
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

  // 1. THE SMOOTH PARALLAX LOOP (Only runs when allowed)
  useFrame((state) => {
    // ABORT if:
    // 1. Controls aren't ready
    // 2. We are currently animating/transitioning (The Lock)
    // 3. We aren't in DESK mode
    // 4. User is inspecting/dragging items
    if (!cameraControlsRef.current || isTransitioning.current || currentView !== 'DESK' || isInspecting || focusedItemId || isDraggingItem) {
      return;
    }

    const controls = cameraControlsRef.current;
    getDeskWorldPoint(deskCenterLocal, tmpDeskCenterWorld.current);

    // Calculate Mouse Offset - Clamp parallax offsets so target never crosses behind camera
    const maxX = 0.28;
    const maxY = 0.14;
    const mouseX = -THREE.MathUtils.clamp(state.pointer.x, -1, 1) * maxX;
    const mouseY = THREE.MathUtils.clamp(state.pointer.y, -1, 1) * maxY;

    // Calculate the desired destination
    const desiredTarget = new THREE.Vector3(
      tmpDeskCenterWorld.current.x + mouseX,
      tmpDeskCenterWorld.current.y + mouseY,
      tmpDeskCenterWorld.current.z
    );

    // Smoothly Lerp current target towards desired target (The "Weight" feeling)
    targetLookAt.current.lerp(desiredTarget, 0.12);

    // Apply manual update
    controls.setLookAt(
      debugParams.cameraPos.x,
      debugParams.cameraPos.y,
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
        controls.touches.one = 2;        // TRUCK (Pan on touch)
        controls.touches.two = 4;        // DOLLY (Pinch to zoom)
        controls.truckSpeed = 2.0;
        controls.dollySpeed = 2.0;
        controls.minDistance = 0.5;
        controls.maxDistance = 4.0;

        tmpWorldB.current.set(debugParams.boardPos.x, debugParams.boardPos.y, debugParams.boardPos.z);

        await controls.setLookAt(
          debugParams.boardPos.x,
          debugParams.boardPos.y,
          debugParams.boardPos.z - 1.5,
          tmpWorldB.current.x,
          tmpWorldB.current.y,
          tmpWorldB.current.z,
          true // Animate
        );
        controls.enabled = true;

      } else if (currentView === 'AUDIO') {
        // --- AUDIO VIEW ---
        getDeskWorldPoint(audioLocal, tmpWorldB.current);
        const deskCam = tmpWorldA.current.set(debugParams.cameraPos.x, debugParams.cameraPos.y, debugParams.cameraPos.z);
        tmpDir.current.copy(deskCam).sub(tmpWorldB.current).normalize();
        const camPos = tmpWorldA.current.copy(tmpWorldB.current).addScaledVector(tmpDir.current, 0.9).add(new THREE.Vector3(0, 0.12, 0));

        await controls.setLookAt(
          camPos.x, camPos.y, camPos.z,
          tmpWorldB.current.x, tmpWorldB.current.y, tmpWorldB.current.z,
          true // Animate
        );
        controls.enabled = true;

      } else if (currentView === 'DESK') {
        // --- DESK VIEW ---
        getDeskWorldPoint(deskCenterLocal, tmpDeskCenterWorld.current);

        // Fly back to desk
        await controls.setLookAt(
          debugParams.cameraPos.x,
          debugParams.cameraPos.y,
          debugParams.cameraPos.z,
          tmpDeskCenterWorld.current.x,
          tmpDeskCenterWorld.current.y,
          tmpDeskCenterWorld.current.z,
          true // Animate
        );

        // SYNC: Before unlocking, ensure our parallax target starts exactly where we landed
        targetLookAt.current.copy(tmpDeskCenterWorld.current);

        // Reset Inputs
        controls.mouseButtons.right = 0;
        controls.mouseButtons.wheel = 0;
        controls.enabled = true; // Re-enable for the parallax

      } else if (currentView === 'COMPUTER') {
        // --- COMPUTER VIEW ---
        getDeskWorldPoint(computerLocal, tmpWorldB.current);
        const deskCam = tmpWorldA.current.set(debugParams.cameraPos.x, debugParams.cameraPos.y, debugParams.cameraPos.z);
        tmpDir.current.copy(deskCam).sub(tmpWorldB.current).normalize();
        const camPos = tmpWorldA.current.copy(tmpWorldB.current).addScaledVector(tmpDir.current, 0.55).add(new THREE.Vector3(0, -0.08, 0));

        await controls.setLookAt(
          camPos.x, camPos.y, camPos.z,
          tmpWorldB.current.x, tmpWorldB.current.y, tmpWorldB.current.z,
          true // Animate
        );
        controls.enabled = true;
      }

      // UNLOCK: Allow useFrame to take over again
      isTransitioning.current = false;
    };

    performTransition();

  }, [currentView, getDeskWorldPoint, deskCenterLocal, audioLocal, computerLocal]);

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

const MergedCubicles = React.memo(({
  cubicleRow,
  scale,
  leftPos,
  rightPos,
}: {
  cubicleRow: Array<{ position: [number, number, number]; rotation: [number, number, number] }>;
  scale: number;
  leftPos: { x: number; y: number; z: number };
  rightPos: { x: number; y: number; z: number };
}) => {
  const { nodes } = useGLTF('/cubicle.glb') as any;
  const instanceCount = cubicleRow.length; // Left + right rows

  // Get all unique meshes from the GLTF
  const meshes = React.useMemo(() => {
    const meshList: Array<{ geometry: THREE.BufferGeometry; material: THREE.Material }> = [];
    Object.values(nodes).forEach((node: any) => {
      if (node?.geometry && node?.material) {
        meshList.push({
          geometry: node.geometry,
          material: node.material
        });
      }
    });
    return meshList;
  }, [nodes]);

  // Update matrices for all instances
  React.useEffect(() => {
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempRotation = new THREE.Euler();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3(scale, scale, scale);

    // Base rotation for GLTF model
    const baseRotation = new THREE.Euler(Math.PI / 2, 0, 0);
    const baseQuaternion = new THREE.Quaternion().setFromEuler(baseRotation);

    meshes.forEach((_, meshIndex) => {
      const instancedMeshRef = (window as any)[`cubicleInstancedMesh_${meshIndex}`];
      if (!instancedMeshRef) return;

      let index = 0;

      // Left row
      cubicleRow.forEach((item) => {
        tempPosition.set(
          leftPos.x + item.position[0],
          leftPos.y + item.position[1],
          leftPos.z + item.position[2]
        );
        tempRotation.set(0, Math.PI / 2, 0);
        tempQuaternion.setFromEuler(tempRotation);
        tempQuaternion.multiply(baseQuaternion);
        tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
        instancedMeshRef.setMatrixAt(index++, tempMatrix);
      });

      // Right row
      cubicleRow.forEach((item) => {
        tempPosition.set(
          rightPos.x + item.position[0],
          rightPos.y + item.position[1],
          rightPos.z + item.position[2]
        );
        tempRotation.set(0, Math.PI / 2, 0);
        tempQuaternion.setFromEuler(tempRotation);
        tempQuaternion.multiply(baseQuaternion);
        tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
        instancedMeshRef.setMatrixAt(index++, tempMatrix);
      });

      instancedMeshRef.instanceMatrix.needsUpdate = true;
    });
  }, [meshes, cubicleRow, leftPos, rightPos, scale]);

  return (
    <>
      {meshes.map((mesh, i) => (
        <instancedMesh
          key={i}
          ref={(ref) => {
            if (ref) (window as any)[`cubicleInstancedMesh_${i}`] = ref;
          }}
          args={[mesh.geometry, mesh.material, instanceCount]}
          frustumCulled
        />
      ))}
    </>
  );
});

MergedCubicles.displayName = 'MergedCubicles';

const GameScene: React.FC<GameSceneProps> = ({
  evidence, focusedItemId, setFocusedItemId,
  pinnedItems, onPinItem, connections, onConnect, isLinkMode,
  caseFile
}) => {
  // Debug Logging
  React.useEffect(() => {
    console.log("[GameScene] Render. Evidence Count:", evidence.length);
    console.log("[GameScene] Case File:", caseFile?.title, caseFile?.caseId);

    // Log invalid positions
    evidence.forEach((e, i) => {
      if (!e.position && e.type !== 'PAPER') { // Paper might be generated without pos initially
        console.warn(`[GameScene] Warning: Evidence ${e.id} (${e.label}) has no position!`);
      }
    });
  }, [evidence, caseFile]);

  // Map of refs for red string lines
  const itemRefs = React.useRef<Record<string, RapierRigidBody | null>>({});
  const deskGroupRef = React.useRef<THREE.Group>(null);

  const addLink = useGameStore(state => state.addLink);
  const linkingFromId = useGameStore(state => state.linkingFromId);
  const setLinkingFromId = useGameStore(state => state.setLinkingFromId);
  const setRadialMenu = useGameStore(state => state.setRadialMenu);

  const handlePinClick = (id: string, worldPos: THREE.Vector3) => {
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
  };

  // --- HARDCODED SCENE PARAMS ---
  // The imported GLB is oriented such that the desk reads as a side view from our camera.
  // Rotating the whole desk group aligns the desk to face the seated camera.
  const deskRotY = Math.PI / 2;

  const { cameraPos, deskPos, boardPos, boardScale, cubicleScale, cubicleLeftPos, cubicleRightPos, cubicleBackPos, ...lightingAndHelpers } = useControls('Scene Layout', {
    cameraPos: { value: { x: 0.2, y: 1.55, z: -1.25 }, step: 0.05 },
    deskPos: { value: { x: 0, y: 0, z: 0 }, step: 0.05 },
    boardPos: { value: { x: 0.2, y: 1.25, z: 0.4 }, step: 0.05 },
    boardScale: { value: 0.15, min: 0.1, max: 2.0, step: 0.05 },
    cubicleScale: { value: 0.2, min: 0.1, max: 2.0, step: 0.1 },
    cubicleLeftPos: { value: { x: -3, y: 0, z: 0 }, step: 0.1 },
    cubicleRightPos: { value: { x: -11.5, y: 0, z: 0 }, step: 0.1 },
    cubicleBackPos: { value: { x: 0, y: 0, z: 4.0 }, step: 0.1 },
    showHelpers: { value: true },
  });

  const { ambientColor, ambientIntensity, lampPos, lampInt, lampColor, rimPos, rimInt, rimColor, fillPos, fillInt, fillColor, backRimPos, backRimInt, backRimColor } = useControls('Lighting', {
    ambientColor: '#1a2a40',
    ambientIntensity: { value: 20, min: 0, max: 50, step: 0.5 },
    lampPos: { value: { x: 0.8, y: 1.3, z: 0.2 }, step: 0.1 },
    lampInt: { value: 1, min: 0, max: 100, step: 1 },
    lampColor: '#ebdcc1',
    rimPos: { value: { x: -0.7, y: 2.8, z: 1 }, step: 0.1 },
    rimInt: { value: 2, min: 0, max: 100, step: 1 },
    rimColor: '#7a9bde',
    fillPos: { value: { x: 0, y: 2, z: 3.5 }, step: 0.1 },
    fillInt: { value: 6, min: 0, max: 100, step: 1 },
    fillColor: '#4a7ba7',
    backRimPos: { value: { x: 0, y: 1.5, z: -2.5 }, step: 0.1 },
    backRimInt: { value: 3, min: 0, max: 50, step: 0.5 },
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
  };

  const cubicleRow = React.useMemo(
    () => [-6, -4, -2, 0, 2, 4, 6].map((z) => ({
      position: [0, 0, z] as [number, number, number],
      rotation: [0, -Math.PI / 2, 0] as [number, number, number],
    })),
    []
  );

  return (
    <div className="w-full h-screen bg-black">
      <Canvas shadows onPointerMissed={() => {
        // If the player is interacting with the computer DOM overlay,
        // we must not interpret missed clicks as "exit current view".
        if (useGameStore.getState().currentView === 'COMPUTER') return;

        setFocusedItemId(null);
        if (useGameStore.getState().currentView !== 'DESK') {
          useGameStore.getState().setView('DESK');
        }
      }}>
        <Perf position="top-left" />
        <SceneLogic
          focusedItemId={focusedItemId}
          setFocusedItemId={setFocusedItemId}
          debugParams={debug}
          deskGroupRef={deskGroupRef}
          showHelpers={lighting.showHelpers}
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
        <PerspectiveCamera makeDefault position={[debug.cameraPos.x, debug.cameraPos.y, debug.cameraPos.z]} fov={50} />

        <color attach="background" args={['#0a0f1a']} />
        {/* Disable fog so we can setup the scene */}
        {/* <fog attach="fog" args={['#0f1520', 2, 15]} /> */}

        {/* Ambient light - evening atmosphere */}
        <ambientLight intensity={ambientIntensity} color={ambientColor} />

        {/* PRIMARY: Warm desk lamp light - the hero light source */}
        <ControlledPointLight
          position={[lampPos.x, lampPos.y, lampPos.z]}
          intensity={lampInt}
          color={lampColor}
          distance={2}
          decay={1}
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
        <group position={[0, 2, 6]}>
          {/* Center Panel */}
          <WindowPanel position={[0, 0, 0.2]} width={3} height={5} />

          {/* Left Angled Panel */}
          <WindowPanel position={[-3, 0, 0.2]} rotation={[0, 0, 0]} width={3} height={5} />
          <WindowPanel position={[-6, 0, 0.2]} width={3} height={5} />

          {/* Right Angled Panel */}
          <WindowPanel position={[3, 0, 0.2]} rotation={[0, 0, 0]} width={3} height={5} />
          <WindowPanel position={[6, 0, 0.2]} width={3} height={5} />
        </group>

        <Environment files="/shanghai_bund_1k.exr" background={true} backgroundBlurriness={0.2} backgroundIntensity={.1} environmentIntensity={0} />

        <Physics debug gravity={[0, -9.81, 0]}>
          <RigidBody type="fixed" position={[0, -5, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[100, 1, 100]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
            </mesh>
          </RigidBody>

          <Suspense fallback={<Html center><div className="text-amber-500 font-mono text-xs">LOADING OFFICE...</div></Html>}>
            <group ref={deskGroupRef} position={[deskPos.x, deskPos.y, deskPos.z]} rotation={[0, deskRotY, 0]}>
              {/* <DeskLighting /> */}
              <Desk currentCase={caseFile} />



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
                    onUnfocus={() => setFocusedItemId(null)}
                    isPinned={pinnedItems.has(item.id)}
                    onPin={(pinned) => onPinItem(item.id, pinned)}
                    onPinClick={handlePinClick}
                  />
                )
              })}

              {/* Audio Player Interaction Zone - positioned on desk */}
              <mesh
                position={[0, 0.85, 0.5]}
                onClick={(e) => {
                  e.stopPropagation();
                  if (useGameStore.getState().currentView === 'COMPUTER') return;
                  useGameStore.getState().setView('AUDIO');
                }}
              >
                <boxGeometry args={[0.3, 0.2, 0.3]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </group>
          </Suspense>

          <Suspense fallback={<Html position={[0, 5, -8]} center><div className="text-red-500 font-mono text-xs">LOADING EVIDENCE...</div></Html>}>

            {/* Investigation Board Zone - On the wall behind/above desk */}
            <group position={[boardPos.x, boardPos.y, boardPos.z]} scale={[boardScale, boardScale, boardScale]}>
              <InvestigationBoard
                itemRefs={itemRefs} evidence={evidence} focusedItemId={focusedItemId}
                setFocusedItemId={setFocusedItemId}
              />
            </group>

          </Suspense>
        </Physics>
        {/* Merged cubicles - single instanced mesh */}
        <Suspense fallback={null}>
          <group position={[2, -0.2, 7]} rotation={[0, -Math.PI / 2, 0]}>
            <MergedCubicles
              cubicleRow={cubicleRow}
              scale={debug.cubicleScale}
              leftPos={debug.cubicleLeftPos}
              rightPos={debug.cubicleRightPos}
            />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GameScene;
