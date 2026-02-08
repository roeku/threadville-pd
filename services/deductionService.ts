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
 */
export function createDeductionState(caseFile: CaseFile): DeductionState {
  const rules = generateDeductionRules(caseFile);
  const criticalRules = rules.filter(r => r.weight >= 1.0 && !r.isRedHerring);
  const culpritProfile = caseFile.entities.find(e =>
    e.id === `PROFILE-${caseFile.solution.culpritId}` ||
    (e.label?.includes(caseFile.suspects.find(s => s.id === caseFile.solution.culpritId)?.name || '') && e.type === EvidenceType.PHOTO)
  );
  
  return {
    caseId: caseFile.caseId,
    rules,
    criticalRuleIds: criticalRules.map(r => r.id),
    culpritId: caseFile.solution.culpritId,
    weaponId: caseFile.solution.weaponId,
    culpritProfileId: culpritProfile?.id,
  };
}

/**
 * Validates a single link against the deduction rules.
 */
export function validateLink(
  link: EvidenceLink,
  deductionState: DeductionState
): ValidationResult {
  // Find exact match in rules
  const exactMatch = deductionState.rules.find(r =>
    r.source === link.fromId &&
    r.target === link.toId &&
    r.type === link.type
  );

  if (exactMatch) {
      console.log(`[Validate] MATCH FOUND: ${link.fromId} --${link.type}--> ${link.toId}`);
    return {
      isValid: true,
      reason: exactMatch.reasoning,
      weight: exactMatch.weight,
    };
  }

  // Check if user got the connection right but type wrong
  const typeMatch = deductionState.rules.find(r =>
    r.source === link.fromId &&
    r.target === link.toId
  );

  if (typeMatch) {
      console.log(`[Validate] WRONG TYPE: ${link.fromId} --${link.type}--> ${link.toId} (expected ${typeMatch.type})`);
    return {
      isValid: false,
      reason: `Wrong link type. This should be ${typeMatch.type}, not ${link.type}`,
      weight: 0,

    };
  }
        console.log(`[Validate] NO MATCH: ${link.fromId} --${link.type}--> ${link.toId}`);


  // Check if connection exists in reverse direction
  const reverseMatch = deductionState.rules.find(r =>
    r.source === link.toId &&
    r.target === link.fromId
  );

  if (reverseMatch) {
    return {
      isValid: false,
      reason: `Connection is reversed. It should go from ${reverseMatch.source} to ${reverseMatch.target}`,
      weight: 0,
    };
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
  
  // 1. All links must be valid
  const validLinks = links.filter(l => l.status === 'VALID');
  const allValid = validLinks.length > 0 && validLinks.length === links.length;
  
  if (!allValid || links.length === 0) {
    return {
      solved: false,
      progress: 0,
      missing: ['All connections must be correct'],
    };
  }

  // 2. Must include all critical connections
  const validRuleIds = new Set<string>();
  validLinks.forEach(link => {
    const rule = deductionState.rules.find(r =>
      r.source === link.fromId &&
      r.target === link.toId &&
      r.type === link.type
    );
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
  const reachesCulprit = validLinks.some(link =>
    link.toId === deductionState.culpritId ||
    link.fromId === deductionState.culpritId ||
    (deductionState.culpritProfileId && (link.toId === deductionState.culpritProfileId || link.fromId === deductionState.culpritProfileId))
  );

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
    const rule = deductionState.rules.find(r =>
      r.source === link.fromId &&
      r.target === link.toId &&
      r.type === link.type
    );
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
