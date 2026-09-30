import { Injectable, BadRequestException } from '@nestjs/common';
import { AnalyzeAiDto, QualityCheckDto, RecommendDto, SeeOnMeDto, StylistInstructionsDto, TryOnDto } from './ai.dto';
import { AiReport, QualityResult } from './ai.provider';
import { OllamaProvider } from './ollama.provider';
import { GeminiProvider } from './gemini.provider';
import { HAIRSTYLE_CATALOG, catalogForPrompt } from './hairstyle.catalog';

const fallbackReport = (input: AnalyzeAiDto): AiReport => ({
  faceShape: 'Soft oval', texture: input.texture || 'Wavy', length: input.length || 'Shoulder length', density: 'Medium-full', movement: 'Natural wave', visibleCondition: 'Moderate',
  signals: [{ label: 'Dryness at ends', level: 'Mild', note: 'A nourishing finish may help the shape sit better.' }, { label: 'Humidity sensitivity', level: 'Noticeable', note: 'Suggest a light anti-frizz routine for local weather.' }, { label: 'Scalp visibility', level: 'Balanced', note: 'No unusual visual signal in this estimate.' }],
  recommendations: [{ name: 'Soft textured lob', score: 92, tag: 'Best match', description: 'Keeps the shoulder-grazing ease while letting natural wave do a little work.', chips: ['Low effort', 'Movement'] }, { name: 'Airy collarbone layers', score: 87, tag: 'Close match', description: 'A little more shape through the ends, with a soft frame around the face.', chips: ['Face framing', 'Versatile'] }, { name: 'Long side-swept fringe', score: 76, tag: 'Try if curious', description: 'A gentle change without committing to a shorter overall length.', chips: ['Fresh feel', 'Grow-out friendly'] }],
  services: [{ name: 'Conditioning finish', reason: 'Supports the mild dryness visible at the ends.' }, { name: 'Anti-frizz treatment', reason: 'A lighter routine may help with humidity.' }, { name: 'Signature cut', reason: 'Creates the movement and shape discussed above.' }],
});

@Injectable()
export class AiService {
  constructor(private readonly provider: OllamaProvider, private readonly gemini: GeminiProvider) {}

  async analyze(input: AnalyzeAiDto): Promise<AiReport & { provider: string }> {
    if ((process.env.AI_PROVIDER || 'gemini') === 'gemini') {
      const prompt = `You are Halo's hair consultation analysis engine. Analyze only visible characteristics and return ONLY JSON matching this shape: {"faceShape":"unknown","faceConfidence":0,"hairLength":"unknown","hairTexture":"unknown","hairType":"unknown","hairDensity":"unknown","hairVolume":"unknown","currentStyle":"unknown","hairline":"unknown"}. Use unknown and confidence 0 when uncertain. Never diagnose. User preferences: goal=${input.goal || 'unknown'}, length=${input.length || 'unknown'}, texture=${input.texture || 'unknown'}.`;
      const profile = await this.gemini.generateJson<Record<string, unknown>>(prompt, input.imageBase64);
      const recommendations = await this.recommend({ profile, preferences: { goal: input.goal, preferredLength: input.length, texture: input.texture } });
      const report = fallbackReport(input);
      report.faceShape = String(profile.faceShape || 'unknown');
      report.texture = String(profile.hairTexture || input.texture || 'unknown');
      report.length = String(profile.hairLength || input.length || 'unknown');
      report.density = String(profile.hairDensity || 'unknown');
      report.recommendations = recommendations.recommendations.map((item, index) => {
        const recommendation = item as { name: string; reason: string; length: string; maintenance: string; styling?: string; matchReasons?: string[] };
        return { name: recommendation.name, score: Math.max(70, 96 - index * 5), tag: index === 0 ? 'Best match' : 'Good match', description: recommendation.reason, chips: [recommendation.length, recommendation.maintenance, ...(recommendation.matchReasons || []).slice(0, 1)] };
      });
      return { ...report, provider: 'gemini', hairProfile: profile } as AiReport & { provider: string };
    }
    const fallback = fallbackReport(input);
    const result = await this.provider.analyze(`Return only JSON matching this exact structure: ${JSON.stringify(fallback)}. Guest goal: ${input.goal || 'A cut that feels like me'}; texture: ${input.texture || 'Wavy'}; length: ${input.length || 'Shoulder length'}. Use stylist-safe visible observations only. Never diagnose medical conditions.`, input.imageBase64);
    return { ...fallback, ...result, provider: result ? 'ollama' : 'deterministic-fallback' } as AiReport & { provider: string };
  }

  quality(input: QualityCheckDto): QualityResult {
    const hasImage = Boolean(input.imageBase64);
    const checks = [{ name: 'Image supplied', passed: hasImage, note: hasImage ? 'Image received for review.' : 'Capture an image to check quality.' }, { name: 'Face visibility', passed: hasImage, note: hasImage ? 'Ready for provider-level face visibility analysis.' : 'Keep the full face inside the guide.' }, { name: 'Lighting and sharpness', passed: hasImage, note: hasImage ? 'Ready for provider-level lighting and sharpness analysis.' : 'Use even natural light and avoid blur.' }, { name: 'Hair visibility', passed: hasImage, note: hasImage ? 'Ready for provider-level hair visibility analysis.' : 'Keep the sides and ends visible.' }];
    const passed = checks.every(check => check.passed);
    return { passed, score: passed ? 86 : 0, checks, retakeGuidance: passed ? [] : ['Move into even natural light.', 'Keep the camera at eye level.', 'Make sure the face and hair sides are fully visible.'] };
  }

  async tryOn(input: TryOnDto) {
    const previews: Record<string, string> = { 'Soft textured lob': '/images/hair-lob.svg', 'Airy collarbone layers': '/images/hair-airy.svg', 'Long side-swept fringe': '/images/hair-gloss.svg' };
    const localSource = input.imageBase64 ? `data:image/jpeg;base64,${input.imageBase64}` : '';
    const fallback = { styleName: input.styleName, status: 'preview-ready', provider: 'local', beforeImage: localSource || '/images/hair-before.svg', previewImage: localSource || previews[input.styleName] || '/images/hair-lob.svg', message: 'Local preview source ready. No paid image-generation provider is enabled.' };
    return { ...fallback, provider: 'local', message: 'Use the local browser preview renderer. No paid image-generation provider is enabled.' };
  }

  async recommend(input: RecommendDto) {
    if ((process.env.AI_PROVIDER || 'gemini') !== 'gemini') throw new BadRequestException('AI_PROVIDER must be gemini for recommendations.');
    const prompt = `You are Halo's hairstyle recommendation engine. Return ONLY JSON: {"recommendations":[{"styleId":"","name":"","reason":"","length":"","maintenance":"","styling":"","matchReasons":[]}]} with exactly 5 items. Select only styleId values from this catalog: ${JSON.stringify(catalogForPrompt())}. Never invent names. Profile: ${JSON.stringify(input.profile)} Preferences: ${JSON.stringify(input.preferences || {})}.`;
    const result = await this.gemini.generateJson<{ recommendations: unknown[] }>(prompt);
    const allowed = new Map(HAIRSTYLE_CATALOG.map(style => [style.id, style]));
    const recommendations = (result.recommendations || []).filter(item => typeof item === 'object' && item !== null && allowed.has(String((item as { styleId?: string }).styleId))).slice(0, 5);
    if (recommendations.length !== 5) throw new BadRequestException("We couldn't complete the recommendations. Please try again.");
    return { recommendations, provider: 'gemini' };
  }

  async stylistInstructions(input: StylistInstructionsDto) {
    const prompt = `You are Halo's professional hairstyle consultation assistant. Return ONLY JSON with keys styleName, length, layers, volume, texture, maintenance, stylistInstruction. Do not make medical claims. Profile: ${JSON.stringify(input.profile)} Selected style: ${input.selectedStyle} Preferences: ${JSON.stringify(input.preferences || {})}.`;
    return { ...(await this.gemini.generateJson<Record<string, unknown>>(prompt)), provider: 'gemini' };
  }

  async seeOnMe(input: SeeOnMeDto) {
    if (!input.originalImage) throw new BadRequestException('An original photo is required.');
    if (!HAIRSTYLE_CATALOG.some(style => style.id === input.styleId)) throw new BadRequestException('Choose a hairstyle from the catalog.');
    return { provider: 'local', previewImage: `data:image/jpeg;base64,${input.originalImage}`, styleId: input.styleId, message: 'Local preview source ready. Hairstyle overlay is rendered in the browser.' };
  }
}
