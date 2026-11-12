import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { promises as fs } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { MediaService } from "../media/media.service";
import {
  AiGenerationJob,
  AiStyleRecommendation,
  AiStyleSession,
  AiUsageLog,
} from "./hairstyle.entity";
import { AnalyzeHairstyleDto, GenerateHairstyleDto } from "./hairstyle.dto";
import { HairstyleProfile } from "./hairstyle.provider";
import { GeminiHairstyleProvider } from "./gemini-hairstyle.provider";

type AuthenticatedUser = { email: string };

@Injectable()
export class HairstyleService {
  constructor(
    @InjectRepository(AiStyleSession)
    private readonly sessions: Repository<AiStyleSession>,
    @InjectRepository(AiStyleRecommendation)
    private readonly recommendations: Repository<AiStyleRecommendation>,
    @InjectRepository(AiGenerationJob)
    private readonly jobs: Repository<AiGenerationJob>,
    @InjectRepository(AiUsageLog)
    private readonly usage: Repository<AiUsageLog>,
    private readonly media: MediaService,
    private readonly analysisProvider: GeminiHairstyleProvider,
    private readonly imageProvider: GeminiHairstyleProvider,
  ) {}

  private enabled() {
    if (process.env.AI_HAIRSTYLE_ENABLED !== "true")
      throw new ServiceUnavailableException(
        "AI hairstyle preview is not enabled on this server.",
      );
  }

  private async session(id: string, email: string) {
    const session = await this.sessions.findOne({
      where: { id, ownerEmail: email },
    });
    if (!session) throw new NotFoundException("AI hairstyle session not found");
    return session;
  }

  private async withinLimit(email: string, action: "analysis" | "generation") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await this.usage.count({
      where: {
        ownerEmail: email,
        action,
        success: true,
        createdAt: MoreThanOrEqual(start),
      },
    });
    const limit = Number(
      process.env[
        action === "analysis"
          ? "AI_DAILY_ANALYSIS_LIMIT"
          : "AI_DAILY_GENERATION_LIMIT"
      ] || (action === "analysis" ? 1 : 1),
    );
    if (count >= limit)
      throw new ConflictException(
        `Your daily AI ${action} limit has been reached.`,
      );
  }

  async createSession(
    file: any,
    user: AuthenticatedUser,
    consentGiven: boolean,
  ) {
    this.enabled();
    if (!consentGiven)
      throw new BadRequestException("Photo processing consent is required.");
    const asset = await this.media.validateAndSave(
      file,
      user.email,
      null,
      true,
    );
    return this.sessions.save(
      this.sessions.create({
        ownerEmail: user.email,
        photoAssetId: asset.id,
        consentGiven: true,
        status: "uploaded",
        profile: null,
        preferences: {},
      }),
    );
  }

  async createSessionFromBase64(
    input: {
      imageBase64?: string;
      mimeType?: string;
      fileName?: string;
      consentGiven?: boolean;
    },
    user: AuthenticatedUser,
  ) {
    if (!input.imageBase64)
      throw new BadRequestException("A photo is required.");
    const mimeType = String(input.mimeType || "image/jpeg").toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType))
      throw new BadRequestException("Only JPEG, PNG, and WebP images are supported");
    const encoded = input.imageBase64.replace(/^data:[^;]+;base64,/, "");
    const bytes = Buffer.from(encoded, "base64");
    const maxBytes = Number(process.env.MEDIA_MAX_BYTES || 5 * 1024 * 1024);
    if (!bytes.length || bytes.length > maxBytes)
      throw new BadRequestException("Images must be 5 MB or smaller");
    const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const filePath = resolve(process.cwd(), "uploads", `${randomUUID()}.${extension}`);
    await fs.writeFile(filePath, bytes);
    return this.createSession(
      {
        path: filePath,
        filename: `${randomUUID()}.${extension}`,
        originalname: input.fileName || `hairstyle-photo.${extension}`,
        mimetype: mimeType,
        size: bytes.length,
      },
      user,
      input.consentGiven === true,
    );
  }

  async analyze(input: AnalyzeHairstyleDto, user: AuthenticatedUser) {
    this.enabled();
    const session = await this.session(input.sessionId, user.email);
    await this.withinLimit(user.email, "analysis");
    const preferences = {
      goal: input.goal,
      preferredLength: input.preferredLength,
      maintenance: input.maintenance,
      occasion: input.occasion,
      stylePreference: input.stylePreference,
    };
    session.status = "analyzing";
    session.preferences = preferences;
    await this.sessions.save(session);
    try {
      const image = await this.media.readPrivate(
        session.photoAssetId,
        user.email,
      );
      const encoded = image.bytes.toString("base64");
      const profile = await this.analysisProvider.analyze(
        encoded,
        image.mimeType,
        preferences,
      );
      this.validateProfile(profile);
      const styles = await this.analysisProvider.recommend(
        profile,
        preferences,
      );
      if (styles.length !== 5)
        throw new Error("The AI returned an invalid recommendation set");
      await this.recommendations.delete({ sessionId: session.id });
      await this.recommendations.save(
        styles.map((style, index) =>
          this.recommendations.create({
            ...style,
            sessionId: session.id,
            rank: index + 1,
          }),
        ),
      );
      session.profile = profile;
      session.status = "recommendations-ready";
      await this.sessions.save(session);
      await this.usage.save(
        this.usage.create({
          ownerEmail: user.email,
          sessionId: session.id,
          action: "analysis",
          provider: this.analysisProvider.name,
          model: this.analysisProvider.model,
          success: true,
          errorMessage: null,
        }),
      );
      return this.getSession(session.id, user.email);
    } catch (error) {
      session.status = "failed";
      await this.sessions.save(session);
      await this.usage.save(
        this.usage.create({
          ownerEmail: user.email,
          sessionId: session.id,
          action: "analysis",
          provider: this.analysisProvider.name,
          model: this.analysisProvider.model,
          success: false,
          errorMessage:
            error instanceof Error
              ? error.message.slice(0, 300)
              : "analysis failed",
        }),
      );
      throw error;
    }
  }

  private validateProfile(profile: HairstyleProfile) {
    for (const key of [
      "faceShape",
      "hairLength",
      "hairTexture",
      "currentStyle",
      "hairDensity",
    ])
      if (
        !profile ||
        typeof profile[key as keyof HairstyleProfile] !== "string"
      )
        throw new BadRequestException(
          "The AI returned an invalid hair analysis.",
        );
    if (profile.faceVisible === false || profile.hairVisible === false)
      throw new BadRequestException(
        "Please upload a clear photo with your face and hair visible.",
      );
    if (profile.faceCount !== undefined && profile.faceCount !== 1)
      throw new BadRequestException(
        "Please upload a photo with one clearly visible face.",
      );
  }

  async getSession(id: string, email: string) {
    const session = await this.session(id, email);
    const recommendations = await this.recommendations.find({
      where: { sessionId: id },
      order: { rank: "ASC" },
    });
    const jobs = await this.jobs.find({
      where: { sessionId: id, ownerEmail: email },
      order: { createdAt: "DESC" },
    });
    return { ...session, recommendations, jobs };
  }

  async history(user: AuthenticatedUser) {
    const sessions = await this.sessions.find({
      where: { ownerEmail: user.email },
      order: { createdAt: "DESC" },
    });
    return Promise.all(
      sessions.map((session) => this.getSession(session.id, user.email)),
    );
  }

  async generate(input: GenerateHairstyleDto, user: AuthenticatedUser) {
    this.enabled();
    await this.session(input.sessionId, user.email);
    const existing = await this.jobs.findOne({
      where: { idempotencyKey: input.idempotencyKey, ownerEmail: user.email },
    });
    if (existing) return existing;
    const recommendation = await this.recommendations.findOne({
      where: { id: input.recommendationId, sessionId: input.sessionId },
    });
    if (!recommendation)
      throw new NotFoundException("Hairstyle recommendation not found");
    await this.withinLimit(user.email, "generation");
    const job = await this.jobs.save(
      this.jobs.create({
        ownerEmail: user.email,
        sessionId: input.sessionId,
        recommendationId: recommendation.id,
        idempotencyKey: input.idempotencyKey,
        status: "queued",
        provider: this.imageProvider.name,
        model: this.imageProvider.model,
        outputAssetId: null,
        errorMessage: null,
      }),
    );
    void this.processGeneration(job.id);
    return job;
  }

  async getJob(id: string, user: AuthenticatedUser) {
    const job = await this.jobs.findOne({
      where: { id, ownerEmail: user.email },
    });
    if (!job) throw new NotFoundException("AI generation job not found");
    return job;
  }

  private async processGeneration(id: string) {
    const job = await this.jobs.findOne({ where: { id } });
    if (!job) return;
    try {
      job.status = "generating";
      await this.jobs.save(job);
      const session = await this.sessions.findOneByOrFail({
        id: job.sessionId,
      });
      const recommendation = await this.recommendations.findOneByOrFail({
        id: job.recommendationId,
      });
      const source = await this.media.readPrivate(
        session.photoAssetId,
        job.ownerEmail,
      );
      const result = await this.imageProvider.generate(
        source.bytes.toString("base64"),
        recommendation,
      );
      const output = await this.media.saveGenerated(
        result.bytes,
        result.mimeType,
        job.ownerEmail,
      );
      job.outputAssetId = output.id;
      job.status = "completed";
      await this.jobs.save(job);
      await this.usage.save(
        this.usage.create({
          ownerEmail: job.ownerEmail,
          sessionId: job.sessionId,
          action: "generation",
          provider: this.imageProvider.name,
          model: this.imageProvider.model,
          success: true,
          errorMessage: null,
        }),
      );
    } catch (error) {
      job.status = "failed";
      job.errorMessage =
        error instanceof Error
          ? error.message.slice(0, 300)
          : "generation failed";
      await this.jobs.save(job);
      await this.usage.save(
        this.usage.create({
          ownerEmail: job.ownerEmail,
          sessionId: job.sessionId,
          action: "generation",
          provider: this.imageProvider.name,
          model: this.imageProvider.model,
          success: false,
          errorMessage: job.errorMessage,
        }),
      );
    }
  }

  async remove(id: string, user: AuthenticatedUser) {
    const session = await this.session(id, user.email);
    const jobs = await this.jobs.find({
      where: { sessionId: id, ownerEmail: user.email },
    });
    const assetIds = [
      session.photoAssetId,
      ...jobs
        .map((job) => job.outputAssetId)
        .filter((value): value is string => Boolean(value)),
    ];
    for (const assetId of assetIds)
      await this.media
        .remove(assetId, user.email, false, null)
        .catch(() => undefined);
    await this.jobs.delete({ sessionId: id, ownerEmail: user.email });
    await this.recommendations.delete({ sessionId: id });
    await this.usage.delete({ sessionId: id });
    await this.sessions.delete({ id, ownerEmail: user.email });
    return { success: true };
  }
}
