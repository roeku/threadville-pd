
import { BoardNode, NodeType, ConnectionType, EdgeSolution } from './types';

// 3D scale: Board is roughly 10 units wide, 8 units tall.

export const INITIAL_NODES: BoardNode[] = [
  {
    id: 'root_crimescene',
    type: NodeType.START,
    title: 'CRIME SCENE',
    description: 'Body found in Study.',
    image: 'https://placehold.co/400x400/2a1a1a/FFF.png?text=CRIME+SCENE',
    position: [0, 2, 0.5],
    rotation: 0,
  },
  {
    id: 'suspect_butler',
    type: NodeType.EVIDENCE,
    title: 'Arthur (Butler)',
    description: 'Photo taken at the estate.',
    image: 'https://placehold.co/400x400/4a3b2a/FFF.png?text=Suspect:+Butler',
    position: [-2, -3.5, 0.5],
    rotation: -0.1,
  },
  {
    id: 'suspect_gardener',
    type: NodeType.EVIDENCE,
    title: 'Sam (Gardener)',
    description: 'Has a history of violence.',
    image: 'https://placehold.co/400x400/2a3b2a/FFF.png?text=Suspect:+Gardener',
    position: [-0.5, -3.5, 0.5],
    rotation: 0.1,
  },
  {
    id: 'weapon_knife',
    type: NodeType.EVIDENCE,
    title: 'Antique Dagger',
    description: 'Found wiped clean.',
    image: 'https://placehold.co/400x400/333333/FFF.png?text=Evidence:+Dagger',
    position: [1, -3.5, 0.5],
    rotation: 0.05,
  },
  {
    id: 'doc_diary',
    type: NodeType.EVIDENCE,
    title: 'Diary Page',
    description: '"He threatened me..."',
    image: 'https://placehold.co/400x400/f0f0f0/333.png?text=Diary+Entry',
    position: [2.5, -3.5, 0.5],
    rotation: -0.2,
  },
  {
    id: 'photo_clock',
    type: NodeType.EVIDENCE,
    title: 'Broken Clock',
    description: 'Stopped at 11:42 PM.',
    image: 'https://placehold.co/400x400/1a1a2a/FFF.png?text=Broken+Clock',
    position: [4, -3.5, 0.5],
    rotation: 0.15,
  }
];

// The correct "Circuit" that must be built
export const SOLUTION_PATH: EdgeSolution[] = [
    // Crime Scene -> Dagger (The Means)
    { source: 'root_crimescene', target: 'weapon_knife', type: ConnectionType.MATCHES },
    
    // Dagger -> Butler (The Suspect)
    { source: 'weapon_knife', target: 'suspect_butler', type: ConnectionType.LOCATES },
    
    // Butler -> Diary (The Motive)
    { source: 'suspect_butler', target: 'doc_diary', type: ConnectionType.MOTIVATES }
];
