# Night Watch (core-loop prototype)

A tiny town sits on your real table. It is night, and you hold the only lantern:
it lights whatever you look at. Somewhere in town, someone is about to steal the
baker's pie. Watch closely, pinch to mark what you see, and at dawn pick the
culprit out of the lineup.

This folder is the 3-day test of the concept for the Meta VR Start Developer
Competition 2026. It answers one question: **is sweeping the light and catching
the moment fun within two minutes?**

## How it plays

- **Look**: the lantern follows where you look (head direction; eye gaze on
  devices that expose it). Figures only show who they are inside the light.
- **Pinch** (either hand): marks the person in the light with a red tag. The
  tag's icon records where you saw them.
- **Listen**: doors creak when someone goes out, the cat knocks over a bin, and
  the theft makes a sound where it happens. Headphones help.
- **Dawn**: the suspects line up. Look at one and pinch to accuse.
- **Stars**: right person, saw it happen, marked them in the act.
- **Replay**: the town replays the real moment. Pinch for another night.

Three hand-authored nights rotate, each with a different culprit. A night lasts
about 70 to 80 seconds.

## Run it

```bash
npm install
npm run dev
```

`npm run dev` starts the IWSDK dev server and opens a managed browser with the
built-in headset emulator (IWER). You can also open `https://localhost:8081` in
Chrome. Click **Keep watch**, then use the emulator panel to switch to hand
input, move the headset to look at the town, and pinch. The emulator controls
are documented at https://iwsdk.dev/guides/02-testing-experience.html#iwer-controls.

## Try it on a Quest

WebXR needs HTTPS, so host the build. The simplest route is Vercel:

1. Import this repository in Vercel.
2. Set **Root Directory** to `night-watch`. Vercel detects Vite (`npm run build`,
   output `dist`).
3. Make sure the production alias (`https://<project>.vercel.app`) is public:
   deployment protection must be off, or testers get a 401.
4. Open the alias in the Meta Quest browser and press **Keep watch**.

Hand tracking must be enabled on the headset. No controller is needed at any
point.

## Where things live

| File | What it holds |
| --- | --- |
| `src/night/tuning.ts` | The Feel Brief and every feel number (with units) |
| `src/night/story.ts` | Town spots, the three nights, route templates |
| `src/night/town.ts` | The procedural diorama |
| `src/night/figure.ts` | Figurines and the reveal colouring |
| `src/night/tags.ts` | Handwritten paper tags (embedded Caveat font, OFL) |
| `src/night/audio.ts` | Procedural sound palette and an offline sound probe |
| `src/night/night-watch-system.ts` | The game loop (one state machine) |

Everything is procedural: no external models, textures or audio files.

## Headless checks (for agents)

`tools/emulator/*.mjs` are Playwright scripts for `npx @iwsdk/cli browser run`.
They use a development-only hook (`window.__nightWatch`, stripped from
production builds) to pause, speed up and restart nights, read game state, and
render every sound offline to check levels. Start the dev server with
`npx @iwsdk/cli dev up --ai-mode agent --headless --allow-browser-automation`.

`package.json` pins Playwright 1.56.1 to match the Chromium build available in
the cloud development container. It is safe to remove locally.

## Known gaps (next steps)

- Not yet tested on a real headset: comfort, text size, hand-tracking pinch
  reliability, frame rate with lantern shadows.
- The town is placed in front of you at session start; it does not yet snap to
  a detected table or support re-centring.
- Continuous eye gaze in WebXR on Meta VR Glasses is unverified; the lantern
  falls back to head direction.
- Sounds are synthesized and were balanced by measurement, not by ear.
