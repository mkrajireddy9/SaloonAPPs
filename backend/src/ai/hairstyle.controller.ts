import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { mkdirSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../auth/auth.guard";
import { HairstyleService } from "./hairstyle.service";
import { AnalyzeHairstyleDto, GenerateHairstyleDto } from "./hairstyle.dto";

const { diskStorage } = require("multer") as {
  diskStorage: (options: any) => any;
};
const uploadDirectory = resolve(process.cwd(), "uploads");
mkdirSync(uploadDirectory, { recursive: true });

@Controller("ai/hairstyle")
@ApiTags("ai-hairstyle")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class HairstyleController {
  constructor(private readonly service: HairstyleService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Create a private, consented hairstyle AI session" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: uploadDirectory,
        filename: (_req: any, file: any, cb: any) =>
          cb(
            null,
            `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
          ),
      }),
      limits: {
        fileSize: Number(process.env.MEDIA_MAX_BYTES || 5 * 1024 * 1024),
      },
    }),
  )
  upload(
    @UploadedFile() file: any,
    @Body() body: { consentGiven?: boolean | string },
    @Req() request: any,
  ) {
    return this.service.createSession(
      file,
      request.user,
      body.consentGiven === true || body.consentGiven === "true",
    );
  }

  @Post("upload-base64")
  uploadBase64(
    @Body()
    body: {
      imageBase64?: string;
      mimeType?: string;
      fileName?: string;
      consentGiven?: boolean;
    },
    @Req() request: any,
  ) {
    return this.service.createSessionFromBase64(body, request.user);
  }

  @Post("analyze")
  analyze(@Body() dto: AnalyzeHairstyleDto, @Req() request: any) {
    return this.service.analyze(dto, request.user);
  }

  @Get("history")
  history(@Req() request: any) {
    return this.service.history(request.user);
  }

  @Get("sessions/:sessionId")
  session(@Param("sessionId") id: string, @Req() request: any) {
    return this.service.getSession(id, request.user.email);
  }

  @Post("generate")
  generate(@Body() dto: GenerateHairstyleDto, @Req() request: any) {
    return this.service.generate(dto, request.user);
  }

  @Get("jobs/:jobId")
  job(@Param("jobId") id: string, @Req() request: any) {
    return this.service.getJob(id, request.user);
  }

  @Delete("sessions/:sessionId")
  remove(@Param("sessionId") id: string, @Req() request: any) {
    return this.service.remove(id, request.user);
  }
}
