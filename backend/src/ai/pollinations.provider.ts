import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

type PollinationsImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
};

@Injectable()
export class PollinationsProvider {
  private readonly logger = new Logger(PollinationsProvider.name);
  private readonly endpoint = 'https://gen.pollinations.ai';

  async editHairstyle(imageBase64: string | undefined, styleName: string): Promise<string> {
    const key = process.env.POLLINATIONS_API_KEY;
    if (!key) {
      throw new BadGatewayException('Free AI preview is not configured yet. Add POLLINATIONS_API_KEY on the server.');
    }

    const prompt = `Create a highly realistic professional salon hairstyle preview. Preserve the person's facial identity, facial structure, skin tone, expression, pose, clothing, background, and lighting. Change only the hairstyle according to the requested hairstyle. Make the hair natural, realistic, detailed, and professionally styled with realistic hair strands and a salon-quality photographic appearance. Requested hairstyle: ${styleName}.`;
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('model', process.env.POLLINATIONS_IMAGE_MODEL || 'flux');
    form.append('response_format', 'b64_json');
    if (imageBase64) {
      form.append('image', new Blob([Buffer.from(imageBase64, 'base64')], { type: 'image/jpeg' }), 'customer-photo.jpg');
    }

    let response: Response;
    try {
      response = await fetch(`${this.endpoint}/v1/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
    } catch {
      throw new BadGatewayException('Free AI preview is temporarily unavailable. Please try Gemini or try again later.');
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      this.logger.warn(`Pollinations image generation failed (${response.status}): ${detail}`);
      throw new BadGatewayException('Free AI preview could not be generated. Please try Gemini or check the Pollinations setup.');
    }

    const body = await response.json() as PollinationsImageResponse;
    const result = body.data?.[0];
    if (result?.b64_json) return `data:image/png;base64,${result.b64_json}`;
    if (result?.url) return result.url;
    throw new BadGatewayException('Free AI returned an empty image. Please try another provider.');
  }
}
