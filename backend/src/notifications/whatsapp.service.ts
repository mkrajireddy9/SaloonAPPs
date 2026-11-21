import { Injectable, Logger } from "@nestjs/common";

type WhatsAppTemplateParameter = { type: "text"; text: string };

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  isConfigured() {
    return (
      process.env.WHATSAPP_ENABLED === "true" &&
      Boolean(
        process.env.WHATSAPP_ACCESS_TOKEN &&
          process.env.WHATSAPP_PHONE_NUMBER_ID,
      )
    );
  }

  async sendAppointmentTemplate(
    recipientPhone: string,
    parameters: string[],
  ): Promise<string | null> {
    if (!this.isConfigured()) return null;

    const phone = recipientPhone.replace(/\D/g, "");
    if (phone.length < 8)
      throw new Error("The WhatsApp recipient phone number is invalid");

    const templateName =
      process.env.WHATSAPP_APPOINTMENT_TEMPLATE || "hello_world";
    const languageCode =
      process.env.WHATSAPP_APPOINTMENT_TEMPLATE_LANGUAGE || "en_US";
    const includeParameters =
      process.env.WHATSAPP_APPOINTMENT_TEMPLATE_VARIABLES === "true";
    const template: {
      name: string;
      language: { code: string };
      components?: Array<{
        type: "body";
        parameters: WhatsAppTemplateParameter[];
      }>;
    } = {
      name: templateName,
      language: { code: languageCode },
    };
    if (includeParameters) {
      template.components = [
        {
          type: "body",
          parameters: parameters.map((text) => ({ type: "text", text })),
        },
      ];
    }

    const apiVersion = process.env.WHATSAPP_API_VERSION || "v27.0";
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "template",
          template,
        }),
      },
    );
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
      messages?: Array<{ id?: string }>;
    };
    if (!response.ok) {
      throw new Error(
        body.error?.message || `WhatsApp API returned ${response.status}`,
      );
    }
    const messageId = body.messages?.[0]?.id || null;
    this.logger.log(`WhatsApp message sent to ${phone.slice(0, 3)}***`);
    return messageId;
  }

  async sendText(recipientPhone: string, message: string): Promise<string | null> {
    if (!this.isConfigured()) return null;
    const phone = recipientPhone.replace(/\D/g, "");
    if (phone.length < 8)
      throw new Error("The WhatsApp recipient phone number is invalid");
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v27.0";
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body: message },
        }),
      },
    );
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
      messages?: Array<{ id?: string }>;
    };
    if (!response.ok)
      throw new Error(body.error?.message || `WhatsApp API returned ${response.status}`);
    const messageId = body.messages?.[0]?.id || null;
    this.logger.log(`Manual WhatsApp message sent to ${phone.slice(0, 3)}***`);
    return messageId;
  }
}
