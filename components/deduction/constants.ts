import { LinkType, EvidenceLink } from '../../types/deduction';

export const SOLUTION_PATH: { source: string, target: string, type: LinkType }[] = [
    // Example Solution for the "Butler" scenario
    // Crime Scene -> Dagger (The Means)
    { source: 'root_crimescene', target: 'weapon_knife', type: LinkType.MATCHES },
    
    // Dagger -> Butler (The Suspect)
    { source: 'weapon_knife', target: 'suspect_butler', type: LinkType.LOCATES },
    
    // Butler -> Diary (The Motive)
    { source: 'suspect_butler', target: 'doc_diary', type: LinkType.MOTIVATES }
];
