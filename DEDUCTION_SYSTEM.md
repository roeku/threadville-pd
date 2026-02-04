# Deduction System - Complete Flow

## Overview

The deduction system is the core mechanic for solving cases. Players pin evidence pieces together on the investigation board and create connections between them. The game validates these connections against a **SOLUTION_PATH** - the correct logical flow from evidence to culprit.

## Current Problems

1. **SOLUTION_PATH is hardcoded** - Not generated from actual case files
2. **Data structures don't match gameplay** - Links don't validate against evidence relationships
3. **No connection rules** - Can't properly validate what connects to what
4. **UI is incomplete** - RadialMenu and ConnectionLayer exist but don't fully integrate

## Architecture

### 1. Data Flow

```
CaseFile (suspects + entities)
    ↓
Generate SOLUTION_PATH (from case generation)
    ↓
Player pins evidence on board
    ↓
Creates EvidenceLink connections
    ↓
Game validates against SOLUTION_PATH
    ↓
Mark links VALID/INVALID
    ↓
Verify switch checks if solved
```

### 2. Key Data Structures

#### EvidenceLink (Enhanced)
```typescript
interface EvidenceLink {
  id: string;
  fromId: string;      // Source evidence/suspect ID
  toId: string;        // Target evidence/suspect ID
  type: LinkType;      // MATCHES, CONTRADICTS, MOTIVATES, LOCATES
  status: LinkStatus;  // UNCHECKED, VALID, INVALID
  confidence?: number; // 0-1 for soft validation
  reasoning?: string;  // Why this link is valid/invalid
}
```

#### SolutionRule
```typescript
interface SolutionRule {
  id: string;
  source: string;           // Evidence/Suspect ID (from)
  target: string;           // Evidence/Suspect ID (to)
  type: LinkType;           // Expected connection type
  description: string;      // "DNA matches suspect's profile"
  weight: number;           // 1=critical, 0.5=supporting
  reasoning: string;        // Why this connection is valid
}
```

#### DeductionCase (Generated from CaseFile)
```typescript
interface DeductionCase {
  caseId: string;
  evidenceMap: Map<string, EvidenceItem>;
  suspectMap: Map<string, Suspect>;
  solutionRules: SolutionRule[];
  criticalConnections: string[];  // IDs of must-find connections
  culprit: Suspect;
  weapon: EvidenceItem;
}
```

### 3. The SOLUTION_PATH

Instead of hardcoded paths, generate from the case:

```typescript
function generateSolutionPath(caseFile: CaseFile): SolutionRule[] {
  const rules: SolutionRule[] = [];
  
  // Rule 1: Crime Scene -> Weapon
  rules.push({
    source: 'crime_scene_photo_id',
    target: 'weapon_id',
    type: LinkType.MATCHES,
    description: "Weapon visible in crime scene photo",
    weight: 1.0
  });
  
  // Rule 2: Weapon -> Culprit (forensics)
  rules.push({
    source: 'weapon_id',
    target: 'culprit_id',
    type: LinkType.LOCATES,  // or MATCHES if fingerprint evidence
    description: "Culprit's fingerprints on weapon",
    weight: 1.0
  });
  
  // Rule 3: Culprit -> Motive
  rules.push({
    source: 'culprit_id',
    target: 'diary_id',
    type: LinkType.MOTIVATES,
    description: "Diary reveals culprit's motive",
    weight: 1.0
  });
  
  // Red Herrings: Innocent suspect -> Misleading evidence
  rules.push({
    source: 'innocent_suspect_id',
    target: 'misleading_evidence_id',
    type: LinkType.CONTRADICTS,  // This is a dead end
    description: "Red herring - evidence doesn't actually implicate",
    weight: 0.5,
    isRedHerring: true
  });
  
  return rules;
}
```

### 4. Validation Logic

```typescript
function validateLink(
  link: EvidenceLink,
  deductionCase: DeductionCase
): { isValid: boolean; reason: string } {
  
  const rule = deductionCase.solutionRules.find(r =>
    r.source === link.fromId &&
    r.target === link.toId &&
    r.type === link.type
  );
  
  if (rule) {
    return { isValid: true, reason: rule.description };
  }
  
  // Check if it's a red herring (might be valid reasoning but wrong)
  const contradictingRule = deductionCase.solutionRules.find(r =>
    (r.source === link.fromId && r.target === link.toId) &&
    r.type !== link.type
  );
  
  if (contradictingRule) {
    return { 
      isValid: false, 
      reason: `Wrong link type. Expected ${contradictingRule.type}, got ${link.type}` 
    };
  }
  
  return { 
    isValid: false, 
    reason: "This connection doesn't follow the evidence" 
  };
}
```

### 5. Win Condition

```typescript
function isCaseSolved(
  links: EvidenceLink[],
  deductionCase: DeductionCase
): boolean {
  
  // 1. All links must be valid
  const allValid = links.every(l => l.status === 'VALID');
  if (!allValid) return false;
  
  // 2. Must include all critical connections
  const validIds = new Set(links.map(l => l.id));
  const hasCritical = deductionCase.criticalConnections.every(
    cid => validIds.has(cid)
  );
  
  if (!hasCritical) return false;
  
  // 3. Chain must connect to culprit
  const reachCulprit = canReachTarget(
    links,
    deductionCase.suspectMap.get(deductionCase.culprit.id)!.id,
    deductionCase
  );
  
  return reachCulprit;
}
```

## Implementation Steps

### Phase 1: Data Structure Setup
1. ✓ Define enhanced SolutionRule interface
2. ✓ Define DeductionCase interface
3. ✓ Create utility service for deduction logic

### Phase 2: SOLUTION_PATH Generation
1. Create `generateSolutionRules()` function in geminiService
2. Integrate into case generation pipeline
3. Store with CaseFile in database

### Phase 3: Store Integration
1. Add deductionCase to game store
2. Implement validateAndMarkLink() 
3. Implement isCaseSolved() check

### Phase 4: UI Polish
1. Show validation feedback when linking
2. Highlight valid connections
3. Show reasoning for invalid connections
4. Add progress indicator (% case solved)

## Expected Evidence Chains

### Mystery Example: "The Butler Did It"
```
Crime Scene Photo
  ↓ MATCHES (visible in photo)
Murder Weapon (Dagger)
  ↓ MATCHES (fingerprints found)
Butler Suspect
  ↓ MOTIVATES (diary shows motive)
Diary Entry
```

### Forensics-Heavy: "DNA Match"
```
Body (forensic sample)
  ↓ MATCHES (DNA extracted)
DNA Profile
  ↓ LOCATES (matches database)
Guilty Suspect
  ↓ CONTRADICTS (alibi contradicted)
Suspect's False Alibi
```

### Alibi-Breaking: "Timeline Evidence"
```
Security Footage
  ↓ LOCATES (shows suspect at scene)
Crime Scene
  ↓ CONTRADICTS (conflicts with claimed alibi)
Suspect's Alibi Statement
```

## File Locations

- **Interfaces**: `/types/deduction.ts` (extended)
- **Service**: `/services/deductionService.ts` (NEW)
- **Store**: `/stores/useGameStore.ts` (enhanced)
- **Components**: 
  - `/components/deduction/InvestigationBoard.tsx` (updated)
  - `/components/deduction/ConnectionLayer.tsx` (integrated)
  - `/components/deduction/VerifySwitch.tsx` (functional)

## Next Steps

1. Implement deductionService with validation logic
2. Update store with validation methods
3. Enhance InvestigationBoard to use validation
4. Add visual feedback for valid/invalid links
5. Generate proper SOLUTION_PATH in case generation
