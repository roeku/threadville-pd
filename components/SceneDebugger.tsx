import { useControls } from 'leva';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Vector3, Euler } from 'three';

interface SceneDebuggerProps {
    setCameraPos?: (pos: [number, number, number]) => void;
}

export const SceneDebugger = () => {
    const { camera } = useThree();

    const helperColors = useControls('Helpers', {
        axes: true,
        grid: true,
    });

    const cameraControls = useControls('Camera (Seated Ref)', {
        position: { value: [0, 1.45, 2.3], step: 0.1 },
        fov: { value: 45, min: 10, max: 100 },
    });

    const deskControls = useControls('Desk', {
        position: { value: [0, -0.75, -1.2], step: 0.1 },
        rotation: { value: [0, 0, 0], step: 0.1 },
    });

    const boardControls = useControls('Board', {
        position: { value: [0, 0, -3.0], step: 0.1 },
        rotation: { value: [0, 0, 0], step: 0.1 },
    });

    const lightControls = useControls('Lights', {
        spotIntensity: { value: 200, min: 0, max: 1000 },
        spotPosition: { value: [2, 4, 1] },
        ambientIntensity: { value: 0.4, min: 0, max: 2 },
        fillIntensity: { value: 5, min: 0, max: 20 },
        fillPosition: { value: [-3, 2, 0] },
    });

    // Apply Camera Changes (Only if in default mode, otherwise CameraControls fights it)
    // Actually, we can just return these values and let the parent use them.
    // But Leva is global. We can read these values in the parent component easily 
    // if we call useControls there, OR we export this hook. 

    // For now, let's just use this component to render the helpers 
    // and we will duplicate the useControls in the parent or export a hook.
    // Actually, cleanest way:
    // GameScene calls useControls directly. 

    return (
        <>
            {helperColors.axes && <axesHelper args={[5]} />}
            {helperColors.grid && <gridHelper args={[20, 20]} />}
        </>
    );
};
