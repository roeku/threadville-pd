import { EntityType, CaseEntity } from './types';

export const UE5_STYLE_PREFIX = "A photorealistic Unreal Engine 5 asset render of";
export const UE5_STYLE_SUFFIX = "8k resolution, cinematic lighting, raytracing, volumetric fog, highly detailed textures, quixel megascans, moody detective game atmosphere, depth of field.";
export const NEGATIVE_PROMPTS = "cartoon, illustration, drawing, painting, low poly, anime, distorted text, watermark, UI, HUD, bright cheerful lighting, text, interface";

// Helper to construct prompts based on entity type
export const constructPrompt = (entity: CaseEntity): string | null => {
  // Base details with visual tags if available
  const visualTags = entity.visualTags ? `Visual details: ${entity.visualTags}.` : "";
  
  switch (entity.type) {
    case EntityType.SUSPECT: {
      const coreDescription = `${entity.name}, ${entity.description}`;
      const visualCues = entity.notes || "Neutral expression";
      const location = entity.metadata.location || "police holding cell";
      
      return `${UE5_STYLE_PREFIX} a police booking photo of ${coreDescription}.
      ${entity.description}. ${visualTags}
      The subject looks tired, stressed, or defiant. 
      They are situated in a ${location}.
      Lighting is harsh overhead fluorescent or dramatic interrogation lamp.
      Skin texture is hyper-realistic with pores and imperfections.
      ${UE5_STYLE_SUFFIX} 
      --no ${NEGATIVE_PROMPTS}`;
    }

    case EntityType.EVIDENCE_PHOTO: {
      const description = entity.description;
      const location = entity.metadata.location || "a crime scene";

      return `${UE5_STYLE_PREFIX} a crime scene photo of ${description}.
      ${visualTags}
      The scene is located in ${location}.
      The angle is eye-level, handheld camera style.
      The room is dark, illuminated by flash or street lights outside.
      Atmosphere is heavy, dusty, noir.
      Visible evidence markers (yellow cards).
      ${UE5_STYLE_SUFFIX} 
      --no ${NEGATIVE_PROMPTS}`;
    }

    case EntityType.EVIDENCE_OBJECT: 
    case EntityType.FORENSIC_SAMPLE: {
      const objectName = entity.name;
      const details = entity.description;
      const context = entity.metadata.location || "an evidence table";

      return `${UE5_STYLE_PREFIX} an isolated asset render of ${objectName}: ${details}.
      ${visualTags}
      The object is resting on ${context}.
      Lighting is 'Rembrandt' style with strong rim light to show silhouette.
      Focus is sharp on the object, blurred background.
      ${UE5_STYLE_SUFFIX} 
      --no ${NEGATIVE_PROMPTS}`;
    }

    case EntityType.EVIDENCE_PAPER:
    default:
      return null;
  }
};