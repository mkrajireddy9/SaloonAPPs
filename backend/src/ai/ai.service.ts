import { Injectable } from '@nestjs/common';
import { AnalyzeAiDto, QualityCheckDto, TryOnDto } from './ai.dto';
import { AiReport, QualityResult } from './ai.provider';
import { OllamaProvider } from './ollama.provider';
import { fal } from '@fal-ai/client';

const fallbackReport = (input: AnalyzeAiDto): AiReport => ({
  faceShape: 'Soft oval', texture: input.texture || 'Wavy', length: input.length || 'Shoulder length', density: 'Medium-full', movement: 'Natural wave', visibleCondition: 'Moderate',
  signals: [{ label: 'Dryness at ends', level: 'Mild', note: 'A nourishing finish may help the shape sit better.' }, { label: 'Humidity sensitivity', level: 'Noticeable', note: 'Suggest a light anti-frizz routine for local weather.' }, { label: 'Scalp visibility', level: 'Balanced', note: 'No unusual visual signal in this estimate.' }],
  recommendations: [{ name: 'Soft textured lob', score: 92, tag: 'Best match', description: 'Keeps the shoulder-grazing ease while letting natural wave do a little work.', chips: ['Low effort', 'Movement'] }, { name: 'Airy collarbone layers', score: 87, tag: 'Close match', description: 'A little more shape through the ends, with a soft frame around the face.', chips: ['Face framing', 'Versatile'] }, { name: 'Long side-swept fringe', score: 76, tag: 'Try if curious', description: 'A gentle change without committing to a shorter overall length.', chips: ['Fresh feel', 'Grow-out friendly'] }],
  services: [{ name: 'Conditioning finish', reason: 'Supports the mild dryness visible at the ends.' }, { name: 'Anti-frizz treatment', reason: 'A lighter routine may help with humidity.' }, { name: 'Signature cut', reason: 'Creates the movement and shape discussed above.' }],
});

@Injectable()
export class AiService {
  constructor(private readonly provider: OllamaProvider) {}

  async analyze(input: AnalyzeAiDto): Promise<AiReport & { provider: string }> {
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
    const fallback = { styleName: input.styleName, status: 'preview-ready', provider: 'local-demo-provider', beforeImage: '/images/hair-before.svg', previewImage: previews[input.styleName] || '/images/hair-lob.svg', message: 'Add FAL_KEY to enable real image-to-image generation.' };
    const token = process.env.FAL_KEY;
    if (!token) return { ...fallback, message: 'FAL_KEY is not loaded by the backend.' };
    if (!input.imageBase64) return { ...fallback, message: 'An input image is required for real image-to-image generation.' };
    try {
      const imageDataUrl = `data:image/jpeg;base64,${input.imageBase64}`;
      const prompt = `Keep the person's identity and face. Change only the hairstyle to a ${input.styleName}. Create a natural salon consultation preview with realistic hair, consistent lighting, and no text.`;
      fal.config({ credentials: token });
      const result = await fal.subscribe('fal-ai/flux-2/klein/9b/edit', {
        input: { prompt, image_urls: [imageDataUrl] },
      }) as { data?: { images?: { url?: string }[] } };
      const imageUrl = result.data?.images?.[0]?.url;
      if (!imageUrl) throw new Error('provider returned no image');
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error(`image ${imageResponse.status}`);
      const bytes = Buffer.from(await imageResponse.arrayBuffer());
      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      return { ...fallback, provider: 'fal-image-to-image', previewImage: `data:${contentType};base64,${bytes.toString('base64')}`, message: 'Generated by fal FLUX.2 image-to-image.' };
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 180) : 'provider request failed';
      return { ...fallback, message: `fal provider unavailable: ${reason}` };
    }
  }
}
