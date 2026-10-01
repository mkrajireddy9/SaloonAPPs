import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OllamaProvider } from './ollama.provider';
import { GeminiProvider } from './gemini.provider';
import { PollinationsProvider } from './pollinations.provider';

@Module({ imports: [AuthModule], controllers: [AiController], providers: [AiService, OllamaProvider, GeminiProvider, PollinationsProvider], exports: [AiService] })
export class AiModule {}
