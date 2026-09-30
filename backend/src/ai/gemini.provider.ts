import { BadGatewayException, HttpException, Injectable, HttpStatus, Logger } from '@nestjs/common';

type GeminiResult = { candidates?: { content?: { parts?: { text?: string }[] } }[] };

@Injectable()
export class GeminiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  async generateJson<T>(prompt: string, imageBase64?: string): Promise<T> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new BadGatewayException('AI analysis is not configured. Add GEMINI_API_KEY to the backend environment.');
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    if (process.env.AI_ALLOW_PAID !== 'true' && /(image|pro|ultra)/i.test(model)) throw new BadGatewayException('The configured AI model is not allowed for the zero-cost MVP.');
    const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [{ text: prompt }];
    if (imageBase64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
    const response = await fetch(`${this.endpoint}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }) });
    if (response.status === 429) throw new HttpException('Free AI quota temporarily unavailable. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    if (!response.ok) {
      const detail = (await response.text()).replace(/AIza[\w-]+/g, '[redacted]').slice(0, 240);
      this.logger.error(`Gemini rejected request: status=${response.status} detail=${detail}`);
      throw new BadGatewayException('The free AI provider is temporarily unavailable.');
    }
    const body = await response.json() as GeminiResult;
    const text = body.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim();
    if (!text) throw new BadGatewayException("We couldn't complete the analysis. Please try again.");
    try { return JSON.parse(text.replace(/^```json\s*/i, '').replace(/\s*```$/, '')) as T; } catch { throw new BadGatewayException("We couldn't complete the analysis. Please try again."); }
  }
}
