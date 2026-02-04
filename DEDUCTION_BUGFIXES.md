# Bug Fixes - Deduction System

## Issues Fixed

### 1. **Self-Referential Connection Bug** ✅
**Problem:** Critical connection was "Blue Microfiber Cloth → Blue Microfiber Cloth"
- The crime scene detection was finding the weapon itself (cloth had "murder weapon" in clues)
- Generated rule: weapon → weapon (invalid)

**Fix:** Rewrote deduction logic to:
- Find forensic samples that link to weapon AND culprit
- Build proper chain: Weapon → Forensic Sample → Culprit Profile → Motive
- Removed generic "crime scene" finder

### 2. **No Suspect Evidence Items** ✅
**Problem:** Connections to suspects failed because suspects aren't evidence
- Engine tried to connect forensics → suspect IDs
- Suspects have no visual representation on board

**Fix:** Added 5 suspect profile evidence items:
- `PROFILE-S1` through `PROFILE-S5`
- Type: PHOTO with `suspect-profile` template
- Contains forensic markers (DNA, fingerprints, blood type)
- Can be pinned to investigation board

### 3. **Objects Can't Be Pinned** ✅
**Problem:** OBJ-001, OBJ-002, OBJ-003 used EvidenceType.OBJECT
- Investigation board only accepts PAPER/PHOTO types

**Fix:** 
- Created `EvidenceDocumentTemplate` component (evidence bagging form)
- Registered as `evidence-document` template
- Converted all 3 objects to PAPER type with proper metadata
- Now can be pinned and examined on board

### 4. **Missing Forensic Data** ✅
**Problem:** Suspects had "PENDING" DNA/fingerprints
- Couldn't match forensics to suspects

**Fix:** Updated suspect records:
- Maya Torres: `dnaSequence: "CTAT-ATAG-CAAT-TTGA"` (matches SMP-001)
- Kairos: `fingerprintPattern: "WHORL-ARCH-WHORL"` (matches SMP-003)
- Dr. Aris Thorne: `fingerprintPattern: "LOOP-LOOP-ARCH"` (matches SMP-002)
- Elena Rostov: `bloodType: "A-"` (matches SMP-004)

## Expected Solution Path (Viral Toxicity)

**Critical Connections:**
1. **Blue Microfiber Cloth** (OBJ-002) --MATCHES--> **DNA Swab from Microfiber Cloth** (SMP-001)
   - Forensic evidence found on the weapon
2. **DNA Swab from Microfiber Cloth** (SMP-001) --MATCHES--> **Suspect Profile: Maya Torres** (PROFILE-S1)
   - DNA proves Maya handled the murder weapon
3. **Suspect Profile: Maya Torres** (PROFILE-S1) --MOTIVATES--> **Unsent Email Draft** (DOC-005)
   - Email reveals her motive (IP theft, revenge)

**Red Herrings (Optional):**
- Fingerprint on Mini-Fridge → Kairos (he had access but didn't do it)
- Witness Statement → Various suspects (deflection attempts)
- Vape Mod → Dr. Aris Thorne (had nicotine but wrong concentration)

## Files Modified

1. **services/deductionService.ts** - Fixed rule generation logic
2. **src/data/ViralToxicity.ts** - Added profiles, converted objects, updated forensics
3. **components/templates/EvidenceDocumentTemplate.tsx** - New template (created)
4. **services/document-rendering/templateRegistry.tsx** - Registered 2 new templates
5. **App.tsx** - Enhanced logging to show expected connections

## Testing

Reload the case and check console output:
```
=== DEDUCTION PUZZLE ===
Total Rules: X
Critical Rules: 3

--- CRITICAL CONNECTIONS (Required to solve) ---
1. [Blue Microfiber Cloth] --MATCHES--> [DNA Swab from Microfiber Cloth]
2. [DNA Swab from Microfiber Cloth] --MATCHES--> [Suspect Profile: Maya Torres]
3. [Suspect Profile: Maya Torres] --MOTIVATES--> [Unsent Email Draft]

--- RED HERRINGS (Optional/Misleading) ---
...
```

All items should now be pinnable to the board!
