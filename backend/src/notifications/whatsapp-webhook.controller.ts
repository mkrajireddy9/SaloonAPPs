import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { NotificationService } from "./notification.service";

@Controller("notifications/whatsapp/webhook")
export class WhatsAppWebhookController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  verify(@Query() query: Record<string, string>, @Res() response: any) {
    if (
      query["hub.mode"] === "subscribe" &&
      query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN
    )
      return response.status(200).send(query["hub.challenge"]);
    throw new UnauthorizedException("Invalid WhatsApp webhook verification");
  }

  @Post()
  @HttpCode(200)
  async receive(@Req() request: any) {
    const secret = process.env.WHATSAPP_APP_SECRET;
    const signature = request.headers["x-hub-signature-256"];
    if (secret) {
      const expected = `sha256=${createHmac("sha256", secret)
        .update(request.rawBody || Buffer.from(JSON.stringify(request.body)))
        .digest("hex")}`;
      const actual = Array.isArray(signature) ? signature[0] : signature || "";
      if (
        actual.length !== expected.length ||
        !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
      )
        throw new UnauthorizedException("Invalid WhatsApp webhook signature");
    }
    const statuses = this.extractStatuses(request.body);
    await this.notifications.applyWhatsAppStatuses(statuses);
    return { received: true };
  }

  private extractStatuses(body: any) {
    return (body?.entry || []).flatMap((entry: any) =>
      (entry.changes || []).flatMap((change: any) => change.value?.statuses || []),
    );
  }
}
