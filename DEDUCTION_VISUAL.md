# Deduction System - Visual Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            GAME INITIALIZATION                           │
│                                                                          │
│  Load CaseFile:                                                         │
│  - 3-5 suspects (with DNA, fingerprint, blood type)                    │
│  - 10-15 evidence items (photos, documents, forensic samples)          │
│  - Solution (culprit ID, weapon ID, motive, reasoning)                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEDUCTION SERVICE GENERATION                          │
│                                                                          │
│  createDeductionState(caseFile) {                                       │
│    1. Find crime scene evidence                                         │
│    2. Find weapon                                                       │
│    3. Link weapon to forensic evidence                                  │
│    4. Link forensics to culprit via DNA/fingerprint match              │
│    5. Link culprit to motive (diary, letter, etc.)                     │
│    6. Create red herrings from innocent suspects                       │
│  }                                                                      │
│                                                                          │
│  Result: DeductionState {                                              │
│    rules: [                                                             │
│      {source: "photo", target: "knife", type: MATCHES, weight: 1.0},  │
│      {source: "knife", target: "dna_sample", type: MATCHES, w: 1.0},  │
│      {source: "dna_sample", target: "culprit", type: MATCHES, w: 1.0},│
│      {source: "culprit", target: "diary", type: MOTIVATES, w: 0.8},   │
│      {source: "innocent_dna", target: "innocent", type: MATCHES, ...}, │
│    ],                                                                   │
│    criticalRuleIds: ["rule_1", "rule_2", "rule_3", "rule_4"],        │
│    culpritId: "suspect_butler",                                        │
│    weaponId: "obj_knife"                                               │
│  }                                                                      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  PLAYER INTERACTION (3D BOARD)                           │
│                                                                          │
│  Evidence Items (displayed in 3D space):                                │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐                   │
│  │  Photo  │ │  Knife   │ │  DNA    │ │  Diary   │                   │
│  │ Pinned  │ │ Pinned   │ │ Pinned  │ │ Pinned   │                   │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘                   │
│       │ click start link                                               │
│       └──────────────► Knife │ (radial menu shows)                    │
│           click end link  │                                           │
│                          ├─► Choose type: MATCHES/CONTRADICTS/...     │
│                          │                                             │
│          Red string appears: Photo ═══ Knife [MATCHES type]           │
│                                                                        │
│  Player creates: EvidenceLink {                                       │
│    id: "conn_123",                                                    │
│    fromId: "photo",                                                   │
│    toId: "knife",                                                     │
│    type: LinkType.MATCHES,                                            │
│    status: 'UNCHECKED'                                                │
│  }                                                                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                    Player creates more links
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          VERIFICATION                                    │
│                                                                          │
│  Player clicks VERIFY button:                                          │
│                                                                          │
│  validateAndMarkLinks() {                                              │
│    For each EvidenceLink:                                              │
│      - Find matching SolutionRule (source, target, type)               │
│      - If found: status = VALID ✓ (gold string)                       │
│      - If not:   status = INVALID ✗ (gray string)                     │
│  }                                                                      │
│                                                                          │
│  Link Results:                                                         │
│  [VALID]   Photo ═══ Knife        (Rule matched: photo→knife[MATCHES])│
│  [VALID]   Knife ═══ DNA          (Rule matched: knife→dna[MATCHES])  │
│  [VALID]   DNA ═══ Butler         (Rule matched: dna→butler[MATCHES]) │
│  [VALID]   Butler ═══ Diary       (Rule matched: butler→diary[MOTIV]) │
│  [INVALID] Chef DNA ═══ Butler    (No rule: red herring blocked)     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       WIN CONDITION CHECK                                │
│                                                                          │
│  isCaseSolved(links, deductionState):                                  │
│                                                                          │
│  ✓ Check 1: All links are VALID?                                       │
│    - Links: [VALID, VALID, VALID, VALID, INVALID]                    │
│    - Result: NO ✗ (one invalid link)                                   │
│    - Return: { solved: false, progress: 80%, missing: [...] }         │
│                                                                          │
│  Player removes invalid link, tries again...                           │
│                                                                          │
│  ✓ Check 1: All links are VALID?                                       │
│    - Links: [VALID, VALID, VALID, VALID]                             │
│    - Result: YES ✓                                                     │
│                                                                          │
│  ✓ Check 2: Include all critical rules?                                │
│    - Critical: 4 rules needed                                          │
│    - Found: 4 valid links matching critical rules                     │
│    - Result: YES ✓                                                     │
│                                                                          │
│  ✓ Check 3: Chain reaches culprit?                                     │
│    - Links: Photo→Knife→DNA→Butler→Diary                              │
│    - Culprit: Butler                                                   │
│    - Result: YES ✓                                                     │
│                                                                          │
│  ══════════════════════════════════════════════════════════════════    │
│  ALL CHECKS PASS: { solved: true, progress: 100%, missing: [] }       │
│  ══════════════════════════════════════════════════════════════════    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     🎉 CASE SOLVED! 🎉                                  │
│                                                                          │
│  - All red strings turn GOLD                                            │
│  - "CONFIRM" button changes to "CASE CLOSED"                           │
│  - Case solved animation triggers                                       │
│  - Game unlocks next case or shows completion screen                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────┐
│  CaseFile    │
└──────┬───────┘
       │
       │ suspects[]
       │ - dnaSequence
       │ - fingerprint
       │ - bloodType
       │
       │ entities[]
       │ - forensicData
       │ - clues
       │ - label
       │
       │ solution
       │ - culpritId
       │ - weaponId
       │
       ▼
┌──────────────────────────┐
│ generateDeductionRules() │
└──────┬───────────────────┘
       │
       │ Analyzes:
       │ - Which evidence mentions weapon?
       │ - Which forensics match culprit?
       │ - Which evidence shows motive?
       │ - Which innocent suspect evidence?
       │
       ▼
┌─────────────────────────┐
│  SolutionRule[]         │
│                         │
│ ┌─────────────────────┐ │
│ │ source: "photo"     │ │
│ │ target: "knife"     │ │
│ │ type: MATCHES       │ │
│ │ weight: 1.0         │ │  ← Critical rule (must find)
│ │ reasoning: "..."    │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ source: "innocent"  │ │
│ │ target: "chef"      │ │
│ │ isRedHerring: true  │ │  ← Red herring (avoid)
│ └─────────────────────┘ │
│                         │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────┐
│  DeductionState          │
│                          │
│ rules: SolutionRule[]    │
│ criticalRuleIds: string[]│  ← Must find these to win
│ culpritId: string        │
│ weaponId: string         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  useGameStore            │
│  deductionState: ^       │
│  links: EvidenceLink[]   │
└──────┬───────────────────┘
       │
       │ validateLink(link)
       │ for each link
       │
       ▼
┌──────────────────────────┐
│  EvidenceLink[]          │
│  (with status marked)    │
│                          │
│ [VALID] Photo→Knife      │
│ [VALID] Knife→DNA        │
│ [INVALID] Chef→Chef      │
│                          │
└──────┬───────────────────┘
       │
       │ isCaseSolved()
       │
       ▼
┌──────────────────────────┐
│  CaseResult              │
│                          │
│ solved: boolean          │
│ progress: 0-100%         │
│ missing: string[]        │
└──────────────────────────┘
```

---

## Link Type Meanings

```
┌─────────────────────────────────────────────────────────────┐
│                   LINK TYPES                                │
└─────────────────────────────────────────────────────────────┘

┌────────────────┐
│    MATCHES     │  "Evidence agrees with evidence"
│    (RED)       │
│                │  Crime Scene Photo --[MATCHES]--> Weapon
│                │  "Weapon visible in photo"
│                │
│                │  DNA Sample --[MATCHES]--> Suspect
│                │  "DNA profile matches suspect's DNA"
└────────────────┘

┌────────────────┐
│  CONTRADICTS   │  "Evidence goes against something"
│    (BLUE)      │
│                │  Suspect's Alibi --[CONTRADICTS]--> Timeline
│                │  "Alibi contradicts security footage"
│                │
│                │  Innocent Suspect --[CONTRADICTS]--> Crime
│                │  "Evidence doesn't really implicate them"
└────────────────┘

┌────────────────┐
│   MOTIVATES    │  "Shows reason why suspect did it"
│  (PURPLE)      │
│                │  Suspect --[MOTIVATES]--> Diary
│                │  "Diary reveals motive for murder"
│                │
│                │  Financial Ruin --[MOTIVATES]--> Murder
│                │  "Victim's insurance gives motive"
└────────────────┘

┌────────────────┐
│    LOCATES     │  "Places someone/something at location"
│   (GREEN)      │
│                │  Security Footage --[LOCATES]--> Crime Scene
│                │  "Video places suspect at scene"
│                │
│                │  Weapon --[LOCATES]--> Culprit
│                │  "Fingerprints on weapon place suspect"
└────────────────┘

┌────────────────┐
│    UNKNOWN     │  "Not yet classified" (temporary)
│   (WHITE)      │
│                │  Shows until player selects via radial menu
└────────────────┘
```

---

## Win Condition Flowchart

```
START: Player clicks VERIFY
  │
  ▼
validateAndMarkLinks()
  │ Set status on each link (VALID/INVALID)
  │
  ▼
[Question] Are ALL links VALID?
  │
  ├─► NO ──► Show error: "X links are invalid"
  │         Return: { solved: false, progress: 20% }
  │
  └─► YES ──┐
            │
            ▼
[Question] Are ALL critical rules included?
  │
  ├─► NO ──► Show error: "Missing X critical connection(s)"
  │         Return: { solved: false, progress: 50% }
  │
  └─► YES ──┐
            │
            ▼
[Question] Does chain reach culprit?
  │
  ├─► NO ──► Show error: "Evidence chain must lead to culprit"
  │         Return: { solved: false, progress: 75% }
  │
  └─► YES ──┐
            │
            ▼
      🎉 CASE SOLVED! 🎉
      Return: { solved: true, progress: 100% }
```

---

## Example: "The Poisoned Teacup"

### Initial Setup

```
Suspects (3):
├─ Lord Ashford (DNA: AGTC-1234, Fingerprint: Loop-Whorl-Arc)
├─ Lady Victoria (DNA: CGTA-5678, Fingerprint: Whorl-Loop-Loop)  
└─ Dr. Holmes (DNA: TGCA-9012, Fingerprint: Arc-Arc-Whorl)

Evidence (8):
├─ Crime Scene Photo (clues: "teacup", "poison")
├─ Teacup with Residue (forensic: DNA=AGTC-1234)
├─ Poison Bottle (forensic: Fingerprint=Loop-Whorl-Arc)
├─ Lord's Diary (clues: "Victoria betrayed me")
├─ Victoria's Alibi (document: time-stamped)
├─ Doctor's Lab Notes (clues: "prepared antidote")
├─ Security Log (shows Victoria at library)
└─ Love Letter (from Lord to Secretary)

Solution:
├─ Culprit: Lord Ashford
├─ Weapon: Poison Bottle
└─ Motive: Betrayal by Victoria
```

### Generated Rules

```
CRITICAL RULES (weight=1.0):
  Rule 1: Photo --[MATCHES]--> Teacup
          "Teacup visible in crime scene photo"
  
  Rule 2: Teacup --[MATCHES]--> DNA Sample
          "DNA extracted from teacup residue"
  
  Rule 3: DNA Sample --[MATCHES]--> Poison Bottle
          "Residue matches fingerprints on bottle"
  
  Rule 4: Poison Bottle --[MATCHES]--> Lord Ashford
          "Fingerprints match Lord's profile"
  
  Rule 5: Lord Ashford --[MOTIVATES]--> Diary
          "Diary reveals motive (betrayal)"

RED HERRINGS (weight=0.5):
  Red 1: Victoria's Alibi --[CONTRADICTS]--> Security Log
         "Alibi doesn't match timestamp"
  
  Red 2: Doctor's Notes --[MATCHES]--> Doctor
         "Doctor had access to poison"
  
  Red 3: Love Letter --[MOTIVATES]--> Doctor
         "Letter suggests Doctor had motive"
```

### Player's Successful Solution

```
Player Action                     Result
──────────────────────────────────────────
Click Photo                    Photo highlighted (yellow)
Click Teacup                   Connection created (UNKNOWN)
Open Radial Menu               Choose MATCHES
                              │
                              ▼
                          ✓ [VALID] Photo→Teacup

Click Teacup                   Teacup highlighted
Click DNA Sample               Connection created
Choose MATCHES from menu       │
                              ▼
                          ✓ [VALID] Teacup→DNA

Click DNA Sample               DNA highlighted
Click Poison Bottle            Connection created
Choose MATCHES from menu       │
                              ▼
                          ✓ [VALID] DNA→Poison

Click Poison Bottle            Poison highlighted
Click Lord Ashford             Connection created
Choose MATCHES from menu       │
                              ▼
                          ✓ [VALID] Poison→Lord

Click Lord Ashford             Lord highlighted
Click Diary                    Connection created
Choose MOTIVATES from menu     │
                              ▼
                          ✓ [VALID] Lord→Diary

Click VERIFY button            validate and verify
                              │
                              ▼
                    ✓ All 5 critical rules found
                    ✓ All links VALID
                    ✓ Chain reaches culprit
                              │
                              ▼
                    🎉 CASE SOLVED! 🎉
```

---

## Color Coding

```
During Linking:
  🟨 YELLOW   - Current source item (being linked from)
  ⚪ WHITE    - Possible target items

After Selection:
  🟥 RED      - Unknown type (not yet selected)

After Verification:
  🟨 GOLD     - Valid connection ✓
  ⬜ GRAY     - Invalid connection ✗

Button States:
  ⬜ GRAY     - Incomplete case
  🟨 GOLD     - Case ready to verify
  ✓ GREEN    - CASE CLOSED! (solved)
```

---

## Summary

The deduction system works by:

1. **Extracting** logic from your case file
2. **Generating** the "correct" solution paths
3. **Validating** player connections against those paths
4. **Tracking** progress toward win condition
5. **Declaring** victory when all critical connections valid

All **automatic** and **data-driven**! 🎉

