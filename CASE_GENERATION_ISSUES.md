# Critical Issues in Case Generation (geminiService.ts)

## 🔴 ROOT CAUSES OF NON-PLAYABLE CASES

### **Issue 1: Suspect Forensic Data NOT Generated in Wizard Pipeline**
**Location:** Lines 920-1040 (generateNarrative, generateEvidenceManifest)

**Problem:**
- `generateNarrative()` returns suspects with raw Gemini output (no forensic profile validation)
- `generateEvidenceManifest()` doesn't enforce that suspects have dnaSequence/fingerprintPattern
- The forensic profile generation (`generateForensicProfile()`) only runs in `generateCase()`, not in wizard

**Impact:**
- Wizard-generated cases produce suspects with PENDING or missing DNA/fingerprints
- Game cannot compare forensic evidence against suspects
- Players cannot solve cases using GelSequencer or MinutiaeMapper

**Fix Required:**
```typescript
// After generateNarrative(), hydrate suspect forensics
narrative.suspects.forEach(suspect => {
  if (!suspect.dnaSequence || suspect.dnaSequence === "PENDING") {
    const profile = generateForensicProfile();
    suspect.dnaSequence = profile.dna;
    suspect.fingerprintPattern = profile.fingerprint;
  }
});
```

---

### **Issue 2: Forensic Evidence Not Linked to Correct Suspects**
**Location:** Lines 595-625 (generateCase → FORENSIC_SAMPLE hydration)

**Problem:**
```typescript
if (entity.type === EntityType.FORENSIC_SAMPLE && entity.metadata?.forensicType) {
    let matchedSuspect = fullCase.suspects.find(s => 
        entity.description?.includes(s.name) || 
        entity.label?.includes(s.name)
    );
    if (!matchedSuspect) {
        matchedSuspect = fullCase.suspects[Math.floor(Math.random() * fullCase.suspects.length)];
    }
    // Assigns based on matchedSuspect...
}
```

**Issues:**
- Random fallback means 80% chance forensic evidence points to wrong suspect
- String matching on description is fragile (what if name not in description?)
- No validation that evidence links to the actual culprit
- Forensic value assignment doesn't check if suspect has generated profile yet

**Impact:**
- Fingerprint evidence might match "Sarah Jara" instead of culprit "Elias"
- Case becomes unsolvable
- Players get confused when multiple "matches" appear to be possible

**Fix Required:**
```typescript
// BEFORE assigning forensic evidence, ensure suspects are hydrated
// THEN: Use the solution to explicitly link evidence to culprit or red herrings
if (entity.type === EntityType.FORENSIC_SAMPLE) {
    let targetSuspect;
    
    if (entity.clues?.some(c => c.includes("culprit") || c.includes("weapon"))) {
        // This is evidence pointing to the culprit
        targetSuspect = fullCase.suspects.find(s => s.id === fullCase.solution.culpritId);
    } else if (entity.clues?.some(c => c.includes("red herring"))) {
        // Random innocent suspect for red herring
        const innocents = fullCase.suspects.filter(s => s.id !== fullCase.solution.culpritId);
        targetSuspect = innocents[Math.floor(Math.random() * innocents.length)];
    } else {
        // Check clue description for explicit suspect mention
        targetSuspect = fullCase.suspects.find(s => 
            entity.clues?.some(clue => clue.includes(s.name)) ||
            entity.description?.includes(s.name)
        );
    }
    
    if (!targetSuspect) {
        targetSuspect = fullCase.suspects[Math.floor(Math.random() * fullCase.suspects.length)];
    }
    
    // Now assign forensic data from the suspect's profile
    assignForensicData(entity, targetSuspect);
}
```

---

### **Issue 3: PAPER Evidence Fields Not Guaranteed to Be Generated**
**Location:** Lines 555-590 (enrichEvidenceItem)

**Problem:**
```typescript
// Fallback: if a PAPER item lacks structured fields, generate them now
if (resolvedTemplateId && item.type === EvidenceType.PAPER && !mergedMetadata.fields) {
  try {
    const fallbackFields = await generateDocumentContent(resolvedTemplateId, caseContext);
    mergedMetadata.fields = fallbackFields;
  } catch (fieldError) {
    console.warn("Failed to generate fallback fields...");
  }
}
```

**Issues:**
- Fallback only runs if `!mergedMetadata.fields`
- But `mergedMetadata.fields` might be an empty object `{}`, which is truthy
- If AI generates incomplete fields (missing required keys), fallback never runs
- Document templates can't render with missing keys (DocumentViewer falls back to generic text)

**Impact:**
- Witness statements render as generic template, not actual testimony
- Bank statements show fallback "0.00" balances instead of real numbers
- Players miss critical clues hidden in document fields

**Fix Required:**
```typescript
// Validate field completeness for the schema
const requiredFields = getRequiredFieldsForSchema(resolvedTemplateId);
const hasCompleteFields = requiredFields.every(key => mergedMetadata.fields?.[key]);

if (!hasCompleteFields) {
    const fallbackFields = await generateDocumentContent(resolvedTemplateId, caseContext);
    mergedMetadata.fields = { ...mergedMetadata.fields, ...fallbackFields };
}
```

---

### **Issue 4: No Case Validation Before Returning**
**Location:** End of generateCase(), generateNarrative(), generateEvidenceManifest()

**Problem:**
- No checks that case is actually solvable
- No validation that:
  - All suspects have biometric data
  - All FORENSIC_SAMPLE evidence has non-PENDING values
  - All PAPER evidence has complete field data
  - Forensic evidence links to at least one suspect
  - Solution references valid suspect/weapon IDs

**Impact:**
- Broken cases get saved to database
- Players load unplayable cases
- No clear error message about what's wrong

**Fix Required:**
```typescript
function validateCasePlayability(caseFile: CaseFile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Suspect validation
  caseFile.suspects.forEach(s => {
    if (!s.dnaSequence || s.dnaSequence === "PENDING") {
      errors.push(`Suspect ${s.name} missing DNA sequence`);
    }
    if (!s.fingerprintPattern || s.fingerprintPattern === "PENDING") {
      errors.push(`Suspect ${s.name} missing fingerprint pattern`);
    }
  });

  // 2. Forensic evidence validation
  caseFile.entities
    .filter(e => e.type === EvidenceType.FORENSIC_SAMPLE)
    .forEach(e => {
      if (!e.forensicData?.value || e.forensicData.value === "PENDING") {
        errors.push(`Forensic evidence ${e.id} has PENDING value`);
      }
    });

  // 3. Document field validation
  caseFile.entities
    .filter(e => e.type === EvidenceType.PAPER && e.metadata?.templateId)
    .forEach(e => {
      if (!e.metadata.fields || Object.keys(e.metadata.fields).length === 0) {
        errors.push(`Paper evidence ${e.id} (${e.metadata.templateId}) has no fields`);
      }
    });

  // 4. Solution validation
  const culpritExists = caseFile.suspects.some(s => s.id === caseFile.solution.culpritId);
  const weaponExists = caseFile.entities.some(e => e.id === caseFile.solution.weaponId);
  if (!culpritExists) errors.push(`Solution references non-existent suspect ${caseFile.solution.culpritId}`);
  if (!weaponExists) errors.push(`Solution references non-existent weapon ${caseFile.solution.weaponId}`);

  return { errors, warnings, isValid: errors.length === 0 };
}
```

---

### **Issue 5: generateEvidenceManifest Schema Doesn't Enforce Forensic Data**
**Location:** Lines 1170-1190

**Problem:**
```typescript
// ADDED: Forensic Data Structure
forensicData: {
    type: Type.OBJECT,
    properties: { ... },
    nullable: true  // <-- TOO PERMISSIVE
},
```

**Issues:**
- `nullable: true` allows AI to skip forensicData
- No `required` array for FORENSIC_SAMPLE items
- Post-processing adds foresticType but doesn't validate values are non-PENDING

**Impact:**
- Gemini doesn't know it MUST fill forensicData
- Generated manifests have empty forensic evidence

**Fix Required:**
```typescript
// In evidenceManifestSchema, add conditional validation
// If type === "FORENSIC_SAMPLE", then forensicData is REQUIRED with non-null value
```

---

## 📋 SUMMARY OF FIXES NEEDED

| Issue | Severity | Location | Quick Fix |
|-------|----------|----------|-----------|
| Suspects lack forensic profiles in wizard | 🔴 CRITICAL | generateNarrative() return | Hydrate after generation |
| Forensic evidence random linkage | 🔴 CRITICAL | generateCase() FORENSIC hydration | Use solution + explicit mapping |
| PAPER fields incomplete/missing | 🔴 CRITICAL | enrichEvidenceItem() | Validate required fields before return |
| No case validation | 🔴 CRITICAL | End of case generation | Add validateCasePlayability() |
| Manifests don't enforce forensics | 🟡 HIGH | evidenceManifestSchema | Add required[] for FORENSIC items |

---

## 🎯 RECOMMENDED ORDER OF IMPLEMENTATION

1. **Add validateCasePlayability()** - Gate all case returns
2. **Fix forensic profile hydration** - Ensure all suspects have data before evidence linking
3. **Fix forensic evidence linkage** - Map to culprit/red herrings explicitly
4. **Fix document field validation** - Ensure enrichment completes all fields
5. **Strengthen manifest schema** - Force forensic data generation

---

## ✅ VERIFICATION CHECKLIST

After fixes, validate:
- [ ] All suspects in a generated case have dnaSequence (not "PENDING")
- [ ] All suspects have fingerprintPattern (not "PENDING")
- [ ] All FORENSIC_SAMPLE evidence has forensicData.value matching a suspect's profile
- [ ] All PAPER evidence has complete metadata.fields for its template schema
- [ ] Forensic evidence for culprit matches culprit's biometrics
- [ ] Red herring evidence matches innocent suspect (not culprit)
- [ ] Case.solution references valid suspect and weapon IDs
- [ ] DocumentViewer can render all PAPER evidence without fallbacks
- [ ] GelSequencer finds exact match when comparing culprit DNA
- [ ] MinutiaeMapper finds exact match when comparing culprit fingerprint
