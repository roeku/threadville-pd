// Ported from assets/casefiles_-noir-asset-gen/constants.ts for main app use
import { EvidenceItem, EvidenceType } from '../types';

export const STYLE_SUFFIX = "Style: Photorealistic, Unreal Engine 5 render, 8k resolution, cinematic lighting, quixel megascans, modern crime drama atmosphere, depth of field, clinical sharpness, high fidelity 3D game art.";

export const NEGATIVE_PROMPT_COMMON = "UI, HUD, interface, text, watermark, health bar, minimap, crosshair, icons, menu, subtitles, game overlay, button prompt, cartoon, low poly, drawing, anime, sketch, painting, 2D, gore, blood, dead body, corpse, violence, cyberpunk, neon, sci-fi, futuristic";

export const NEGATIVE_PROMPT_SCENE = `--no ${NEGATIVE_PROMPT_COMMON}, bright daylight, flat lighting, blur`;
export const NEGATIVE_PROMPT_CHARACTER = `--no ${NEGATIVE_PROMPT_COMMON}, smiling, posing, perfect skin, makeup, symmetrical face, fashion model`;
export const NEGATIVE_PROMPT_OBJECT = `--no ${NEGATIVE_PROMPT_COMMON}, floating object, white background, vector art`;

export const constructEvidencePrompt = (entity: EvidenceItem | any): string => {
  // Debug Log
  console.log("Constructing prompt for:", entity.label || entity.name);

  // Safety Bypass for Body Photos:
  // If the label or content implies a body, we switch to a "Holographic Reconstruction" or "Chalk Outline" style
  // to avoid generating realistic gore which flags filters.
  const label = (entity.label || entity.name || "Evidence") as string;
  const content = (entity.content || entity.description || "") as string;
  
  const isBody = label.toLowerCase().includes('body') || label.toLowerCase().includes('victim') || content.toLowerCase().includes('dead');

  if (isBody) {
     return `A technical forensic sketch or chalk outline of a crime scene victim.
     The image is a high-contrast technical documentation, not a gruesome photo.
     Location: ${entity.metadata?.location || 'Crime Scene'}.
     Context: ${content.slice(0, 100)}.
     Style: Technical illustration, crime scene documentation, black and white or muted colors, no gore.
     ${STYLE_SUFFIX} ${NEGATIVE_PROMPT_SCENE}`;
  }

  // Handle Suspects specifically (CaseEditor passes suspects here)
  if (entity.type === 'SUSPECT') {
      const visualTags = entity.visualTags || "Detailed mugshot";
      return `A photorealistic mugshot of ${label}.
      ${visualTags}.
      The subject looks tired, stressed, or defiant.
      Lighting is harsh overhead fluorescent or dramatic interrogation lamp.
      Skin texture is hyper-realistic with pores and imperfections.
      ${STYLE_SUFFIX} ${NEGATIVE_PROMPT_CHARACTER}`;
  }

  switch (entity.type) {
    // Note: We use string comparison because EvidenceType might be 'paper' or 'PAPER' depending on the AI
    case EvidenceType.PHOTO:
    case 'PHOTO' as any: {
      const description = entity.content;
      const location = entity.metadata?.location || "a location of interest";

      return `A forensic investigator's photo of ${description}.
Location: ${location}.
The image focuses on physical details and spatial relationships.
Atmosphere implies a mystery to be solved.
${STYLE_SUFFIX} ${NEGATIVE_PROMPT_SCENE}`;
    }

    case EvidenceType.OBJECT:
    case 'OBJECT' as any: {
      const objectName = entity.label;
      const details = entity.content;
      const context = entity.metadata?.location || "a forensic lab table";

      return `A highly detailed macro photograph of ${objectName}: ${details}.
This object is being analyzed for clues.
Placed on ${context} with dramatic side lighting to reveal texture.
${STYLE_SUFFIX} ${NEGATIVE_PROMPT_OBJECT}`;
    }

    case EvidenceType.PAPER:
    case 'PAPER' as any:
      // Papers usually generated via HTML canvas, but if we need a "texture" for them:
      return `A close up texture of a crumpled document. ${STYLE_SUFFIX}`;
      
    case EvidenceType.FORENSIC_SAMPLE:
    case 'FORENSIC_SAMPLE' as any:
         return `A microscope slide or test tube containing ${entity.label}. Lab setting. ${STYLE_SUFFIX}`;
    
    case EvidenceType.AUDIO:
    case 'AUDIO' as any:
        return `A close-up photo of audio equipment, such as a voice recorder, cassette tape, or a USB drive labeled '${entity.label}'.
        Placed on an evidence desk.
        ${STYLE_SUFFIX} ${NEGATIVE_PROMPT_OBJECT}`;
         
    default:
      return `A mysterious piece of evidence. ${STYLE_SUFFIX}`;
  }
};
