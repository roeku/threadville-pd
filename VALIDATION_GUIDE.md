# Case Validation Guide

## Overview
The `validateCasePlayability()` function ensures generated cases meet all requirements for being playable detective cases.

## Validation Checks

### 1. Suspect Biometrics Validation
```typescript
// FAILS if any suspect has:
- No dnaSequence or dnaSequence === "PENDING"
- No fingerprintPattern or fingerprintPattern === "PENDING"
- Missing bloodType (warning only)
```

**Why:** GelSequencer and MinutiaeMapper require actual DNA/fingerprint data to compare against evidence

### 2. Forensic Evidence Validation
```typescript
// FAILS if any FORENSIC_SAMPLE has:
- No forensicData.value or value === "PENDING"
- Missing forensicData.type
```

**Why:** Players can't solve cases using forensics if the evidence has no data to compare

### 3. Document Fields Validation
```typescript
// FAILS if any PAPER evidence has:
- No metadata.fields
- Empty metadata.fields object {} 
```

**Why:** DocumentViewer renders by reading metadata.fields; empty fields means no clues appear

### 4. Solution Validation
```typescript
// FAILS if:
- solution.culpritId doesn't reference an actual suspect
- solution.weaponId doesn't reference an actual evidence item
```

**Why:** Cases need valid culprits and weapons for players to solve

### 5. Forensic Linkage Validation
```typescript
// WARNS if:
- No forensic evidence matches culprit's DNA/fingerprint/blood type
```

**Why:** Cases should be solvable via forensics (though not required for "Alibi" focus cases)

## Error vs Warning

**ERRORS** (Case Fails Validation):
- Missing suspect biometrics
- PENDING forensic values
- Missing document fields
- Invalid solution references
- These prevent case from being saved

**WARNINGS** (Case Passes but Has Issues):
- Missing blood type (can still solve via DNA/fingerprints)
- No forensic link to culprit (case may be solvable via alibi/motive)
- These are logged but don't block the case

## Integration Points

### In generateCase()
```typescript
const validation = validateCasePlayability(fullCase);
if (!validation.isValid) {
  console.error("❌ Generated case has validation errors:");
  validation.errors.forEach(e => console.error(`   - ${e}`));
  throw new Error(`Case validation failed: ${validation.errors.join(', ')}`);
}
```

### Checking Validation Results
```typescript
const result = validateCasePlayability(someCase);

// Check if playable
if (!result.isValid) {
  // Case cannot be saved
  showErrors(result.errors);
} else {
  // Case is playable
  if (result.warnings.length > 0) {
    // Case has issues but is still playable
    showWarnings(result.warnings);
  }
  saveCase(someCase);
}
```

## Common Failure Scenarios

### Scenario 1: Suspect Missing DNA
```
Error: Suspect "Elena Morgan" (suspect_1) missing DNA sequence
Fix: generateForensicProfile() not called on suspect after generation
```

### Scenario 2: Forensic Sample Has No Value
```
Error: Forensic evidence "Weapon - DNA" (for_dna_weapon) has PENDING or empty value
Fix: Post-processing didn't fill forensicData.value when manifest was too vague
```

### Scenario 3: Paper Evidence No Fields
```
Error: Paper evidence "Bank Statement" (doc_bank) has no structured fields for template "bank-statement"
Fix: generateDocumentContent() failed or returned empty fields object
```

### Scenario 4: Invalid Solution
```
Error: Solution references non-existent suspect culprit_999
Fix: CaseNarrative.solution.culpritId doesn't match any generated suspect.id
```

## Testing the Validator

### Force a Validation Failure
```typescript
// Create a broken case
const brokenCase = {
  ...validCase,
  suspects: [
    ...validCase.suspects.slice(0, 1),
    {
      ...validCase.suspects[1],
      dnaSequence: "PENDING" // This will fail validation
    }
  ]
};

// Run validation
const result = validateCasePlayability(brokenCase);
console.log(result.isValid); // false
console.log(result.errors); // ["Suspect XYZ missing DNA sequence"]
```

### Check Validation Warnings
```typescript
const result = validateCasePlayability(almostValidCase);
if (result.isValid && result.warnings.length > 0) {
  console.log("⚠️ Case is playable but has warnings:");
  result.warnings.forEach(w => console.log(`  - ${w}`));
}
```

## Future Enhancements

Potential additional validation checks:
- Minimum number of forensic samples (at least 3)
- Minimum number of suspects (at least 5)
- Clue text mentions suspect names
- At least one document per evidence type
- Weapon forensic evidence exists and links to culprit
- Timeline consistency check
