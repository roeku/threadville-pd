import { CaseFile } from '../types';
import { 
  SolutionRule, 
  DeductionState, 
  EvidenceLink, 
  LinkType, 
  ValidationResult 
} from '../types/deduction';
import { EvidenceType } from '../types';

/**
 * Generates deduction rules from a case file.
 * This creates the "correct path" that players must discover.
 */
export function generateDeductionRules(caseFile: CaseFile): SolutionRule[] {
  const rules: SolutionRule[] = [];
  const criticalRuleIds: string[] = [];
  const culprit = caseFile.suspects.find(s => s.id === caseFile.solution.culpritId);
  const weapon = caseFile.entities.find(e => e.id === caseFile.solution.weaponId);
  
  if (!culprit || !weapon) {
    console.warn('Invalid case: missing culprit or weapon');
    return rules;
  }

  // ========== CORE LOGIC CHAIN ==========
  
  // Find forensic evidence that can link to the culprit
  const culpritForensics = caseFile.entities.filter(e => 
    e.type === EvidenceType.FORENSIC_SAMPLE && 
    e.forensicData && (
      e.forensicData.value === culprit.dnaSequence ||
      e.forensicData.value === culprit.fingerprintPattern ||
      e.forensicData.value === culprit.bloodType
    )
  );

  // Build chain:
  // - Forensic evidence on weapon: Weapon -> Report -> Culprit Profile
  // - Forensic evidence from scene: Report -> Culprit Profile

  // FIXED: Fallback to suspect object if no explicit profile entity exists
  const culpritProfile = caseFile.entities.find(e => 
    e.id === `PROFILE-${culprit.id}` || 
    (e.label?.includes(culprit.name) && e.type === EvidenceType.PHOTO)
  ) || { id: culprit.id, label: culprit.name, type: 'SUSPECT' };

  culpritForensics.forEach(forensic => {
    const reportId = forensic.metadata?.reportId ||
      (forensic.forensicData?.type === 'FINGERPRINT' ? `DOC-FP-${forensic.id}` : `DOC-DNA-${forensic.id}`);
    const reportLabel = forensic.metadata?.reportLabel ||
      (forensic.forensicData?.type === 'FINGERPRINT' ? `Fingerprint Match Report: ${forensic.id}` : `DNA Match Report: ${forensic.id}`);

    // Only create weapon -> report link if evidence is explicitly tied to the weapon
    const weaponLabel = weapon.label?.toLowerCase() || '';
    const forensicIsOnWeapon =
      forensic.clues?.some(c => {
        const clue = c.toLowerCase();
        return clue.includes('weapon') || clue.includes('handle') || clue.includes('grip') || (weaponLabel && clue.includes(weaponLabel));
      }) ||
      forensic.metadata?.relatedTo === weapon.id ||
      (typeof forensic.metadata?.location === 'string' && (
        forensic.metadata.location.toLowerCase().includes('weapon') ||
        (weaponLabel && forensic.metadata.location.toLowerCase().includes(weaponLabel))
      )) ||
      (typeof forensic.description === 'string' && (
        forensic.description.toLowerCase().includes('weapon') ||
        (weaponLabel && forensic.description.toLowerCase().includes(weaponLabel))
      )) ||
      forensic.label?.toLowerCase().includes('fingerprint on weapon') ||
      forensic.label?.toLowerCase().includes('blood on weapon');

    if (forensicIsOnWeapon && weapon.id !== reportId) {
      rules.push({
        id: `rule_${rules.length + 1}`,
        source: weapon.id,
        target: reportId,
        type: LinkType.MATCHES,
        description: `Forensic evidence on weapon identifies the handler`,
        weight: 1.0,
        reasoning: `${reportLabel} (found on ${weapon.label}) proves who used the weapon`,
      });
      criticalRuleIds.push(`rule_${rules.length}`);
      console.log(`[Rule] Weapon -> Report: ${weapon.label} (${weapon.id}) -> ${reportLabel} (${reportId})`);
    }

    // Printed Forensic Report -> Culprit Profile (always required)
    if (culpritProfile) {
      rules.push({
        id: `rule_${rules.length + 1}`,
        source: reportId,
        target: culpritProfile.id,
        type: LinkType.MATCHES,
        description: `${reportLabel} matches ${culprit.name}'s profile`,
        weight: 1.0,
        reasoning: `Forensic analysis proves this evidence belongs to ${culprit.name}`,
      });
      criticalRuleIds.push(`rule_${rules.length}`);
      // @ts-ignore
      console.log(`[Rule] Report -> Profile: ${reportLabel} (${reportId}) -> ${culpritProfile.label || culpritProfile.name} (${culpritProfile.id})`);
    }
  });

  // Rule 3: Culprit Profile <-> Motive (supporting evidence, bidirectional)
  const motiveEvidence = caseFile.entities.find(e =>
    e.label?.toLowerCase().includes('diary') ||
    e.label?.toLowerCase().includes('letter') ||
    e.label?.toLowerCase().includes('note') ||
    e.label?.toLowerCase().includes('email') ||
    e.clues?.some(c => c.toLowerCase().includes('motive'))
  );

  if (motiveEvidence && culpritProfile) {
    // Direction 1: Culprit Profile -> Motive Evidence
    rules.push({
      id: `rule_${rules.length + 1}`,
      source: culpritProfile.id,
      target: motiveEvidence.id,
      type: LinkType.MOTIVATES,
      description: `The suspect had a motive revealed in evidence`,
      weight: 0.8, // Supporting, not critical
      reasoning: `${motiveEvidence.label} reveals ${culprit.name}'s motive for the crime`,
    });
    
    // Direction 2: Motive Evidence -> Culprit Profile (more intuitive for players)
    rules.push({
      id: `rule_${rules.length + 1}`,
      source: motiveEvidence.id,
      target: culpritProfile.id,
      type: LinkType.MOTIVATES,
      description: `Evidence reveals the suspect's motive`,
      weight: 0.8, // Supporting, not critical
      reasoning: `${motiveEvidence.label} provides motive for ${culprit.name}'s actions`,
    });
  }

  // ========== RED HERRINGS ==========
  // Create contradicting connections for innocent suspects
  const innocents = caseFile.suspects.filter(s => s.id !== culprit.id);
  
  innocents.forEach(innocent => {
    // Find suspect profile for innocent
    // FIXED: Fallback to suspect object
    const innocentProfile = caseFile.entities.find(e => 
      e.id === `PROFILE-${innocent.id}` || 
      (e.label?.includes(innocent.name) && e.type === EvidenceType.PHOTO)
    ) || { id: innocent.id, label: innocent.name, type: 'SUSPECT' };

    // Find evidence that misleads about this suspect
    const innocentForensics = caseFile.entities.filter(e =>
      e.type === EvidenceType.FORENSIC_SAMPLE &&
      e.forensicData && (
        e.forensicData.value === innocent.dnaSequence ||
        e.forensicData.value === innocent.fingerprintPattern ||
        e.forensicData.value === innocent.bloodType
      )
    );

    innocentForensics.slice(0, 1).forEach(forensic => {
      rules.push({
        id: `rule_${rules.length + 1}`,
        source: forensic.id,
        target: innocentProfile.id,
        type: LinkType.MATCHES,
        description: `This forensic evidence points to ${innocent.name}, but not the culprit`,
        weight: 0.5,
        reasoning: `Red herring - innocent suspect's evidence is at the scene but doesn't mean they're guilty`,
        isRedHerring: true,
      });
    });

    // Add alibi contradiction
    const alibiEvidence = caseFile.entities.find(e =>
      e.label?.toLowerCase().includes('alibi') ||
      e.label?.toLowerCase().includes('statement') ||
      e.clues?.some(c => c.includes(innocent.name))
    );

    if (alibiEvidence) {
      rules.push({
        id: `rule_${rules.length + 1}`,
        source: alibiEvidence.id,
        target: innocentProfile.id,
        type: LinkType.CONTRADICTS,
        description: `Evidence contradicts suspect's alibi`,
        weight: 0.6,
        reasoning: `While ${innocent.name} has an alibi, the evidence shows they could have been at the scene`,
        isRedHerring: true,
      });
    }
  });

  return rules;
}

/**
 * Creates a DeductionState for a case, defining the puzzle rules.
 * PRIORITY: Use pre-generated deduction rules from case file if available.
 * FALLBACK: Generate rules dynamically if not available.
 */
export function createDeductionState(caseFile: CaseFile): DeductionState {
  // PRIORITY: Use pre-generated rules if available
  let rules: SolutionRule[] = [];
  if (caseFile.deductionRules && caseFile.deductionRules.length > 0) {
    console.log(`[DeductionService] Using ${caseFile.deductionRules.length} pre-generated rules from case file`);
    rules = caseFile.deductionRules as SolutionRule[];
  } else {
    // FALLBACK: Generate rules dynamically
    console.log(`[DeductionService] Generating deduction rules dynamically (case has no pre-generated rules)`);
    rules = generateDeductionRules(caseFile);
  }
  
  const criticalRules = rules.filter(r => r.weight >= 1.0 && !r.isRedHerring);
  
  // Find culprit profile - use culprit ID directly as per Gemini rules
  const culpritId = caseFile.solution.culpritId;
  
  return {
    caseId: caseFile.caseId,
    rules,
    criticalRuleIds: criticalRules.map(r => r.id),
    culpritId: caseFile.solution.culpritId,
    weaponId: caseFile.solution.weaponId,
    culpritProfileId: culpritId, // Use culprit ID directly
  };
}

/**
 * Helper to get normalized versions of an ID.
 * Returns array including original ID and any simplifications.
 */
function getNormalizedIds(id: string): string[] {
  const ids = [id];
  
  // Handle DECRYPT-{id}-{timestamp} -> {id}
  // format: DECRYPT-EVID-012-170732382
  const decryptMatch = id.match(/^DECRYPT-(EVID-\d+)(?:-\d+)?$/);
  if (decryptMatch) {
    ids.push(decryptMatch[1]);
  }

  // Handle DOC-FP-{id} -> {id}
  if (id.startsWith('DOC-FP-')) {
    ids.push(id.replace('DOC-FP-', ''));
  }

  // Handle DOC-DNA-{id} -> {id}
  if (id.startsWith('DOC-DNA-')) {
    ids.push(id.replace('DOC-DNA-', ''));
  }

  // Handle PROFILE-{suspectId} -> {suspectId}
  // format: PROFILE-S2 -> S2
  if (id.startsWith('PROFILE-')) {
    ids.push(id.replace('PROFILE-', ''));
  }
  
  return ids;
}

/**
 * Validates a single link against the deduction rules.
 */
export function validateLink(
  link: EvidenceLink,
  deductionState: DeductionState
): ValidationResult {
  const fromIds = getNormalizedIds(link.fromId);
  const toIds = getNormalizedIds(link.toId);
  const undirectedTypes = new Set<LinkType>([LinkType.MATCHES, LinkType.LOCATES]);

  // Check all combinations of normalized IDs
  for (const fId of fromIds) {
    for (const tId of toIds) {
      // Find exact match in rules
      const exactMatch = deductionState.rules.find(r =>
        r.source === fId &&
        r.target === tId &&
        r.type === link.type
      );

      if (exactMatch) {
        console.log(`[Validate] MATCH FOUND: ${fId} --${link.type}--> ${tId} (Original: ${link.fromId}->${link.toId})`);
        return {
          isValid: true,
          reason: exactMatch.reasoning,
          weight: exactMatch.weight,
        };
      }
    }
  }

  // Check if user got the connection right but type wrong (using normalized IDs)
  for (const fId of fromIds) {
    for (const tId of toIds) {
      const typeMatch = deductionState.rules.find(r =>
        r.source === fId &&
        r.target === tId
      );

      if (typeMatch) {
         console.log(`[Validate] WRONG TYPE: ${fId} --${link.type}--> ${tId} (expected ${typeMatch.type})`);
        return {
           isValid: false,
           reason: `Wrong link type. This should be ${typeMatch.type}, not ${link.type}`,
           weight: 0,
        };
      }
    }
  }

  console.log(`[Validate] NO MATCH: ${link.fromId} --${link.type}--> ${link.toId}`);

  // Check if connection exists in reverse direction
  for (const fId of fromIds) {
    for (const tId of toIds) {
      const reverseMatch = deductionState.rules.find(r =>
        r.source === tId &&
        r.target === fId
      );

      if (reverseMatch) {
        if (reverseMatch.type === link.type && undirectedTypes.has(reverseMatch.type)) {
          console.log(`[Validate] MATCH FOUND (UNDIRECTED): ${fId} --${link.type}--> ${tId}`);
          return {
            isValid: true,
            reason: reverseMatch.reasoning,
            weight: reverseMatch.weight,
          };
        }
        return {
          isValid: false,
          reason: `Connection is reversed. It should go from ${reverseMatch.source} to ${reverseMatch.target}`,
          weight: 0,
        };
      }
    }
  }

  // Generic invalid
  return {
    isValid: false,
    reason: `This connection doesn't follow from the evidence. Try connecting evidence that are more directly related.`,
    weight: 0,
  };
}

/**
 * Validates all links in the case and marks them VALID/INVALID
 */
export function validateAllLinks(
  links: EvidenceLink[],
  deductionState: DeductionState
): EvidenceLink[] {
  return links.map(link => {
    const validation = validateLink(link, deductionState);
    return {
      ...link,
      status: validation.isValid ? 'VALID' : 'INVALID',
      reasoning: validation.reason,
    };
  });
}

/**
 * Determines if the case is solved.
 * All links must be valid AND must form a logical chain to the culprit.
 */
export function isCaseSolved(
  links: EvidenceLink[],
  deductionState: DeductionState
): { solved: boolean; progress: number; missing: string[] } {

  const undirectedTypes = new Set<LinkType>([LinkType.MATCHES, LinkType.LOCATES]);

  const findMatchingRule = (link: EvidenceLink) => {
    const fromIds = getNormalizedIds(link.fromId);
    const toIds = getNormalizedIds(link.toId);

    for (const fId of fromIds) {
      for (const tId of toIds) {
        const exact = deductionState.rules.find(r =>
          r.source === fId &&
          r.target === tId &&
          r.type === link.type
        );
        if (exact) return exact;

        const reverse = deductionState.rules.find(r =>
          r.source === tId &&
          r.target === fId &&
          r.type === link.type
        );
        if (reverse && undirectedTypes.has(reverse.type)) return reverse;
      }
    }

    return undefined;
  };

  // 1. Require at least one valid link; invalid extras don't block solving
  const validLinks = links.filter(l => l.status === 'VALID');

  if (validLinks.length === 0) {
    return {
      solved: false,
      progress: 0,
      missing: ['Connect evidence to begin solving'],
    };
  }

  // 2. Must include all critical connections
  const validRuleIds = new Set<string>();
  validLinks.forEach(link => {
    const rule = findMatchingRule(link);
    if (rule) {
      validRuleIds.add(rule.id);
    }
  });

  const missingCritical = deductionState.criticalRuleIds.filter(
    id => !validRuleIds.has(id)
  );

  if (missingCritical.length > 0) {
    const missingDescriptions = missingCritical.map(id => {
      const rule = deductionState.rules.find(r => r.id === id);
      return rule?.description || 'Critical connection';
    });

    const progress = Math.round(
      ((deductionState.criticalRuleIds.length - missingCritical.length) /
        deductionState.criticalRuleIds.length) * 100
    );

    return {
      solved: false,
      progress,
      missing: missingDescriptions,
    };
  }

  // 3. Must reach the culprit
  const reachesCulprit = validLinks.some(link => {
    const fromIds = getNormalizedIds(link.fromId);
    const toIds = getNormalizedIds(link.toId);
    return (
      fromIds.includes(deductionState.culpritId) ||
      toIds.includes(deductionState.culpritId) ||
      (deductionState.culpritProfileId &&
        (fromIds.includes(deductionState.culpritProfileId) || toIds.includes(deductionState.culpritProfileId)))
    );
  });

  if (!reachesCulprit) {
    return {
      solved: false,
      progress: 50,
      missing: ['Evidence chain must lead to the culprit'],
    };
  }

  // Case is solved!
  return {
    solved: true,
    progress: 100,
    missing: [],
  };
}

/**
 * Gets suggestions for what to connect next
 */
export function getDeductionHints(
  links: EvidenceLink[],
  deductionState: DeductionState
): { suggestion: string; nextConnections: SolutionRule[] } {
  
  if (links.length === 0) {
    // Start with the crime scene
    const firstRule = deductionState.rules.find(r => r.weight >= 1.0 && !r.isRedHerring);
    if (firstRule) {
      return {
        suggestion: `Start by connecting ${firstRule.description}`,
        nextConnections: [firstRule],
      };
    }
  }

  // Find next critical rule that isn't yet connected
  const connectedRuleIds = new Set<string>();
  links.forEach(link => {
    const rule = findMatchingRule(link);
    if (rule) {
      connectedRuleIds.add(rule.id);
    }
  });

  const nextRule = deductionState.rules.find(r =>
    r.weight >= 1.0 &&
    !r.isRedHerring &&
    !connectedRuleIds.has(r.id)
  );

  if (nextRule) {
    return {
      suggestion: `Next: ${nextRule.description}`,
      nextConnections: [nextRule],
    };
  }

  return {
    suggestion: 'You\'re on the right track. Keep connecting evidence.',
    nextConnections: [],
  };
}

/**
 * Export for debugging: show all rules
 */
export function explainAllRules(deductionState: DeductionState): string {
  return deductionState.rules
    .map(r => `${r.source} --[${r.type}]--> ${r.target}: ${r.reasoning}`)
    .join('\n');
}
