# Threadville PD

> Investigate procedural murders. Collect forensic evidence, interrogate suspects, and solve cases using a dynamic deduction board.

## Inspiration

We were inspired by detective games that blend investigative puzzle-solving with authentic forensic gameplay. Traditional procedural generation often feels disconnected from storytelling, so we set out to create a system where AI generates not just random elements, but **interconnected narratives**—where every piece of evidence has meaning, suspects have believable motives, and solutions emerge from logical forensic connections. The goal: make every case feel like a real case you can actually solve.

## What It Does

Threadville PD is a web-based detective investigation game where players:

- **Investigate procedurally generated cases** - Each case is uniquely crafted by AI with distinct suspects, motives, and evidence
- **Collect forensic evidence** - Examine photos, documents, forensic samples, and digital artifacts that form the puzzle
- **Interrogate suspects** - Build profiles and identify inconsistencies in testimonies
- **Deduce connections** - Place evidence on an interactive investigation board and link connections to form theories
- **Solve mysteries** - The game validates your deductions in real-time and confirms when you've solved the case

Features include:
- **AI-generated narratives** powered by Google Gemini (Pro model for logic, Flash for efficiency)
- **Generated Game visuals** for suspects, crime scenes, and evidence
- **Intelligent forensic validation** - DNA, fingerprints, and blood types are tracked and must match culprits
- **Red herrings and false leads** - Not all evidence points to the guilty party
- **Dynamic document rendering** - Autopsy reports, bank statements, search warrants, and more, generated with contextual data
- **Game progression tracking** - Resume investigations and track your solving statistics

## How We Built It

**Tech Stack:**
- **Frontend**: React + TypeScript, Three.js for 3D scene rendering
- **Backend**: Supabase for database and storage
- **AI**: Google Gemini 3 API for case generation, image generation, and content enrichment
- **Styling**: Tailwind CSS + custom skeuomorphic UI components
- **Build**: Vite + Vitest

**Architecture:**

1. **Case Generation Pipeline**
   - AI generates a complete case blueprint with suspects, evidence, and solution
   - Intelligent forensic linking ensures DNA/fingerprints create a solvable logic graph
   - Document enrichment generates contextual "boring list" documents (bank statements, train schedules)
   - Asset image generation creates game visuals

2. **Deduction System**
   - Automatic rule generation from case data (what connections are correct)
   - Real-time validation of player links against case logic
   - Win condition detection when critical deductions are complete
   - Hint system suggests next logical connections

3. **Evidence Management**
   - Structured metadata for each piece of evidence
   - Template-based document rendering (autopsy reports, search warrants, etc.)
   - Forensic data validation (DNA sequences, fingerprint patterns, blood types)
   - Support for locked devices with decryption puzzles and audio transcripts

## Challenges We Ran Into

1. **Procedural Coherence** - Initial case generation created disconnected evidence. Solution: Implemented intelligent forensic linking that ensures culprits have matching DNA/fingerprints in evidence, with red herrings for other suspects.

2. **Schema Complexity** - Gemini's schema validation struggled with deeply nested document templates. Solution: Split document generation into separate calls with targeted schemas instead of sending all metadata at once.

3. **Forensic Data Generation** - Distinguishing between culprit evidence and red herrings required suspect data visibility during generation. Solution: Embedded suspect forensic profiles early and used them to intelligently assign evidence during case hydration.

4. **UI/UX for Investigation** - Making the investigation board intuitive for creating and validating connections. Solution: Built a custom React component with drag-and-drop linking and real-time visual feedback.

5. **Image Generation Quality** - Ensuring assets generated without UI elements or artifacts. Solution: Developed detailed negative prompts and specific style prompts for consistency.

## Accomplishments We're Proud Of

✅ **Complete procedural case generation** - Every aspect of a case (suspects, evidence, documents, solutions) is AI-generated and contextually coherent

✅ **Intelligent deduction system** - Cases create solvable logic puzzles with real forensic constraints (DNA, fingerprints, blood type matching)

✅ **Production-ready architecture** - deduction logic, comprehensive validation, and error handling

✅ **Multi-layer evidence system** - Support for documents, photos, forensic samples, and digital artifacts (audio, locked devices)

✅ **Visual assets** - Stylized images of suspects and crime scenes that feel game-ready

✅ **Scalable design** - Modular components and services allow for easy expansion (new document types, forensic categories, game modes)

✅ **Real-time feedback** - Players know immediately whether their deductions are correct, with clear messaging on what's missing

## What We Learned

- **Procedural generation requires constraint satisfaction** - Random content isn't enough; players need a solvable puzzle with discoverable logic
- **Multi-model AI strategies matter** - Using Gemini Pro for complex logic and Flash for high-volume tasks balances quality and cost
- **Forensic authenticity drives engagement** - Players care about real-world investigative mechanics (DNA matching, fingerprint analysis)
- **Schema design is critical** - Overly complex JSON structures break AI output; smaller, focused schemas work better
- **Red herrings are essential** - A case without misleading evidence feels too easy; believable false leads create tension

## What's Next for Threadville PD

- **Mobile optimization** - Adapt the investigation board for tablet and mobile experiences
- **Multiplayer deduction** - Cooperative investigations where players compare theories and share discoveries
- **Case difficulty scaling** - From "Rookie" (obvious culprits) to "Legendary" (complex misdirection)
- **Case library** - Let players save favorite cases, replay, and compare solving times
- **Achievement system** - Track forensic accuracy, speed, and number of cases solved
- **DLC content packs** - Themed cases (corporate espionage, organized crime, etc.)
- **Community cases** - Allow players to generate and share cases they've designed
- **Crime Scenes** - Allow players to move from the desk to the actual crime scenes to collect more evidence.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

View your app online at https://threadvillepd.vercel.app

