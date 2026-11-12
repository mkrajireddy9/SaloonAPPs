import { Injectable } from "@nestjs/common";
import { GeminiProvider } from "./gemini.provider";
import { catalogForPrompt, HAIRSTYLE_CATALOG } from "./hairstyle.catalog";
import {
  HairstyleAnalysisProvider,
  HairstyleImageGenerationProvider,
  HairstyleProfile,
  HairstyleRecommendation,
} from "./hairstyle.provider";

@Injectable()
export class GeminiHairstyleProvider
  implements HairstyleAnalysisProvider, HairstyleImageGenerationProvider
{
  readonly name = "gemini";
  readonly model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  constructor(private readonly gemini: GeminiProvider) {}

  analyze(
    imageBase64: string,
    mimeType: string,
    preferences: Record<string, unknown>,
  ) {
    return this.gemini.generateJson<HairstyleProfile>(
      `Analyze only visible hair and face characteristics. Never diagnose medical conditions. Return ONLY JSON with these keys: faceShape, hairLength, hairTexture, currentStyle, hairDensity (strings), faceVisible, hairVisible (booleans), faceCount (number). Use "unknown", false, or 0 when uncertain. Preferences are not evidence: ${JSON.stringify(preferences)}.`,
      imageBase64,
    );
  }

  async recommend(
    profile: HairstyleProfile,
    preferences: Record<string, unknown>,
  ) {
    const result = await this.gemini.generateJson<{
      recommendations?: unknown[];
    }>(
      `Return ONLY JSON with exactly five recommendations. Use only catalog styleId values. Each item must contain styleId, name, description, reason, maintenance, serviceCategory, matchReasons (string array). Do not make medical claims. Catalog: ${JSON.stringify(catalogForPrompt())}. Visible profile: ${JSON.stringify(profile)}. Customer preferences: ${JSON.stringify(preferences)}.`,
    );
    const catalog = new Map(HAIRSTYLE_CATALOG.map((item) => [item.id, item]));
    const valid = (result.recommendations || []).filter(
      (item): item is Record<string, unknown> => {
        if (!item || typeof item !== "object") return false;
        const value = item as Record<string, unknown>;
        return typeof value.styleId === "string" && catalog.has(value.styleId);
      },
    );
    const selected = [...valid];
    for (const item of HAIRSTYLE_CATALOG) {
      if (selected.length >= 5) break;
      if (!selected.some((value) => value.styleId === item.id))
        selected.push({ styleId: item.id });
    }
    return selected.slice(0, 5).map((value) => {
      const item = catalog.get(String(value.styleId))!;
      return {
        styleId: item.id,
        name: item.name,
        description: String(
          value.description ||
            `A ${item.maintenance}-maintenance ${item.length} style.`,
        ),
        reason: String(
          value.reason ||
            "A possible match for the visible characteristics and stated preferences.",
        ),
        maintenance: item.maintenance,
        serviceCategory: String(value.serviceCategory || "Haircut"),
        matchReasons: Array.isArray(value.matchReasons)
          ? value.matchReasons
              .filter((reason): reason is string => typeof reason === "string")
              .slice(0, 3)
          : [],
      };
    });
  }

  async generate(imageBase64: string, style: HairstyleRecommendation) {
    const dataUrl = await this.gemini.editHairstyle(
      imageBase64,
      `${style.name}. Change only the hairstyle. Preserve identity, face, skin tone, expression, pose, clothing, background, camera angle, and lighting. Do not add text, accessories, or watermark.`,
    );
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("The image provider returned an invalid image");
    return { mimeType: match[1], bytes: Buffer.from(match[2], "base64") };
  }
}
