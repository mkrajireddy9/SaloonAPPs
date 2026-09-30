import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OllamaProvider } from './ollama.provider';
import { GeminiProvider } from './gemini.provider';

@Module({ imports: [AuthModule], controllers: [AiController], providers: [AiService, OllamaProvider, GeminiProvider], exports: [AiService] })
export class AiModule {}
