import { Injectable } from '@nestjs/common';
import { AiProvider, AiReport } from './ai.provider';

@Injectable()
export class OllamaProvider implements AiProvider {
  async analyze(prompt: string, imageBase64?: string): Promise<Partial<AiReport> | null> {
    try {
      const response = await fetch(`${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: process.env.OLLAMA_VISION_MODEL || process.env.OLLAMA_MODEL || 'llama3.2', stream: false, format: 'json', prompt, ...(imageBase64 ? { images: [imageBase64] } : {}) }),
      });
      if (!response.ok) return null;
      const payload = await response.json() as { response?: string };
      return payload.response ? JSON.parse(payload.response) as Partial<AiReport> : null;
    } catch { return null; }
  }
}
