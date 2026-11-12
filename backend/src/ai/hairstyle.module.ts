import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { MediaModule } from "../media/media.module";
import { GeminiProvider } from "./gemini.provider";
import { GeminiHairstyleProvider } from "./gemini-hairstyle.provider";
import { HairstyleController } from "./hairstyle.controller";
import {
  AiGenerationJob,
  AiStyleRecommendation,
  AiStyleSession,
  AiUsageLog,
} from "./hairstyle.entity";
import { HairstyleService } from "./hairstyle.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiStyleSession,
      AiStyleRecommendation,
      AiGenerationJob,
      AiUsageLog,
    ]),
    AuthModule,
    MediaModule,
  ],
  controllers: [HairstyleController],
  providers: [HairstyleService, GeminiProvider, GeminiHairstyleProvider],
})
export class HairstyleModule {}
