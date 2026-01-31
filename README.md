# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DQObnjE_vp_U2sBxHO2deZtFsGR0HBu3

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Document Templates

- Location: [services/documentTemplates.ts](services/documentTemplates.ts)
- Purpose: Define structured templates for evidence papers and generate `EvidenceItem` objects with `metadata` used for rendering.

### Usage Example

```ts
import { templates, generateDocumentEvidence, getTemplateById } from './services/documentTemplates';

// Pick a template (first per category already implemented)
const tpl = getTemplateById('incident-report')!;

// Provide data matching the template fields
const evidence = generateDocumentEvidence(tpl, {
   reportNumber: 'IR-2026-0012',
   officer: 'Det. Jane Doe',
   incidentType: 'Burglary',
   location: '221B Baker St.',
   datetime: new Date().toISOString(),
   narrative: 'Responded to scene, observed forced entry, collected prints.'
});

// Add to your case state or spawn in scene via EvidenceObject
// evidence.type === PAPER; evidence.metadata contains layout and textures
```

### Textures

- See [assets/textures/README.md](assets/textures/README.md) for the list of suggested texture files to drop in.
- You can provide your own textures; use the suggested paths for plug-and-play.

### Current Templates (first in each category)

- Case Files: Case File Cover
- Law & Legal: Search Warrant
- Police & Operations: Incident Report
- Forensics & Lab: Lab Submission Form
- Medical & EMS: Autopsy Report
- Financial & Records: Bank Statement
- Communications & Digital: Email Printout
- Travel & Logistics: Airline Boarding Pass
- Media & Public: News Article Clipping
- Maps & Scene Artifacts: Crime Scene Sketch
- Personal & Misc: Handwritten Note
- Administrative & Corporate: Internal Memo
- Audio & Transcripts: Interview Transcript
- Template/Texture Bases: Letterhead Page
