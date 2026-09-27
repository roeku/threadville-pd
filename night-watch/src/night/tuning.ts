/**
 * NIGHT WATCH: FEEL BRIEF (core-loop prototype)
 *
 * 1. Core verbs: LOOK (a warm lantern follows where you look) and PINCH
 *    (mark what the light shows; at dawn, pinch the culprit).
 * 2. Essence: attention is the scarce resource. You light one small patch at
 *    a time while sounds and movement pull you elsewhere. Keep watching the
 *    likely spot (safe) or chase a sound (greedy). A crumb trail keeps a
 *    missed moment fair.
 * 3. Reference feel: Return of the Obra Dinn's patient inspection plus the
 *    "watch the monitors" tension of a stealth camera room, on a tabletop
 *    diorama. Not horror, not a text puzzle.
 * 4. Tone and material: cozy and mysterious. A painted wooden toy town,
 *    paper tags, oil-lantern glow. Wood knocks softly, paper snaps; only the
 *    incident itself rings like tin.
 * 5. Look: night indigo, moonlit slate, lantern amber, lit-wood cream and a
 *    vermilion accent. Lit low-poly 3D. Text only on handwritten paper tags.
 * 6. Input and posture: seated at a table. Head direction aims the lantern
 *    (eye gaze where the device exposes it); a pinch from either hand
 *    selects. The town is about 45 cm wide and within two feet. No
 *    controllers are ever needed.
 * 7. Weighted events: reveal (minor), mark (standard), incident (major),
 *    dawn verdict (major), replay (standard).
 * 8. Sound palette: evolving night ambience (crickets, wind, owl), wooden
 *    footsteps, door creaks, reveal shimmer, incident (tin scrape and window
 *    creak), cat bin clatter, tag snap rising per mark, dawn swell, verdict
 *    chimes. Key of D major pentatonic, one shared reverb, a limiter.
 * 9. Session shape: a night of about 90 seconds. Quiet start, a distraction,
 *    the theft at an unpredictable moment, a crumb trail, then dawn and a
 *    lineup. Another night is one pinch away.
 */

/** Every feel-relevant number, with units. Tune here, not in the logic. */
export const TUNING = {
  // Placement, relative to the head when the session starts.
  boardForward: 0.5, // m in front of the eyes, horizontal
  boardBelowEyes: 0.42, // m below eye height
  boardWidth: 0.46, // m
  boardDepth: 0.32, // m
  boardThickness: 0.016, // m

  // Lantern (the core verb).
  lanternRadius: 0.055, // m, radius of the lit circle on the board
  lanternFollowRate: 14, // 1/s, exponential follow toward the gaze point
  lanternIntensity: 1.6, // spotlight intensity at full strength
  lanternPenumbra: 0.6, // 0..1, soft edge of the cone
  lanternFadeRate: 3, // 1/s, lantern strength easing in or out
  lanternShadows: true, // spotlight casts shadows from figures and houses
  lanternUsesEyeGaze: true, // follow a continuous 'gaze' input source if present
  glowOpacity: 0.55, // 0..1, additive glow disc drawn on the board

  // Reveal: figures and crumbs warm up when inside the light.
  revealRiseRate: 10, // 1/s, lit amount rising
  revealFallRate: 1.8, // 1/s, afterglow fading once the light leaves
  revealHysteresis: 0.012, // m, extra radius before a lit figure counts as unlit
  shimmerCooldown: 3, // s, per figure, between reveal shimmers

  // Marks and scoring.
  markPickRadius: 0.05, // m, how far from the lantern centre a pinch can mark
  inTheActWindow: 4, // s either side of the theft that counts as "in the act"
  inTheActRadius: 0.07, // m from the pie's windowsill
  witnessRadius: 0.075, // m, lantern centre to sill distance to witness the theft
  witnessWindow: 0.8, // s either side of the theft

  // Night clock.
  duskDuration: 4, // s, window lights go out one by one
  nightDuration: 88, // s, length of the story clock
  dawnDuration: 3.2, // s, sunrise transition
  lineupWalkTime: 1.6, // s, suspects step to the lineup
  verdictHold: 2.6, // s before the replay starts
  replaySpeed: 1.6, // x story speed during the replay
  replayLead: 7, // s of story shown before the theft
  replayTail: 3.5, // s of story shown after the theft
  restartGuard: 0.8, // s after a state change before a pinch counts again

  // Figures.
  walkBobHeight: 0.0016, // m
  walkBobRate: 7, // steps per second
  turnRate: 10, // 1/s, facing smoothing
  footstepEvery: 0.28, // s between footsteps while walking
  lineupPickRadius: 0.045, // m, gaze-to-suspect distance for the lineup
  crumbEvery: 0.32, // s between crumbs dropped by the culprit
  crumbSize: 0.0028, // m radius

  // Audio mix (linear gain).
  masterGain: 0.9,
  ambienceGain: 0.34,
  sfxGain: 0.9,
  uiGain: 0.55,
  reverbSeconds: 2.3, // s, impulse length of the shared reverb
  reverbSend: 0.2, // default send level
  pitchJitter: 0.07, // +- fraction on every repeated sound
  duckAmount: 0.3, // ambience multiplier during major events
  duckSeconds: 0.5, // s to come back after a duck
  footstepAudibleRadius: 0.1, // m from the lantern centre where footsteps play
} as const;

/** One palette shared by world, light and tags. */
export const PALETTE = {
  indigo: 0x1b1f3b,
  slate: 0x3a4a7a,
  amber: 0xffb347,
  cream: 0xf4ead5,
  vermilion: 0xe0503c,
  ink: 0x2b2233,
  nightFigure: 0x2a2f4d,
  woodDark: 0x3d2a1f,
  wood: 0x6b4a33,
  cobble: 0x565b72,
  plaza: 0x6d6f80,
  grass: 0x2f4a36,
  wall: 0xd9c9a8,
  wallWarm: 0xcfb28c,
  roofRed: 0x8a3b2e,
  roofTeal: 0x2f5d62,
  roofPlum: 0x5e4a7d,
  roofBakery: 0x9a5b2f,
  window: 0xffcf7a,
  pie: 0xd89a4e,
  skin: 0xe9c9a6,
  moon: 0xe8ecff,
  sun: 0xffc66e,
} as const;

/** D major pentatonic, in Hz, low to high. Every tonal sound uses it. */
export const SCALE = [
  293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25, 739.99, 880.0,
  987.77, 1174.66,
] as const;
