import { Buffer } from "node:buffer";

import type {
  DeliveryReceipt,
  NotificationProvider,
  OutboundMessage,
} from "./contracts";

export class NoopNotificationProvider implements NotificationProvider {
  constructor(public readonly channel: "email" | "sms") {}

  async send(message: OutboundMessage): Promise<DeliveryReceipt> {
    return {
      provider: `noop-${this.channel}`,
      providerMessageId: `${this.channel}:${message.templateKey}`,
      status: "queued",
    };
  }
}

export class ResendEmailProvider implements NotificationProvider {
  readonly channel = "email" as const;

  constructor(private readonly apiKey: string, private readonly fromEmail: string) {}

  async send(message: OutboundMessage): Promise<DeliveryReceipt> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromEmail,
        html: message.body.replace(/\n/g, "<br />"),
        subject: message.subject ?? "TaproomOS update",
        text: message.body,
        to: [message.recipient],
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as { id?: string };

    return {
      provider: "resend",
      providerMessageId: payload.id ?? `resend:${message.templateKey}`,
      status: "sent",
    };
  }
}

export class TwilioSmsProvider implements NotificationProvider {
  readonly channel = "sms" as const;

  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromPhone: string,
  ) {}

  async send(message: OutboundMessage): Promise<DeliveryReceipt> {
    const body = new URLSearchParams({
      Body: message.body,
      From: this.fromPhone,
      To: message.recipient,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!response.ok) {
      throw new Error(`Twilio request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as { sid?: string };

    return {
      provider: "twilio",
      providerMessageId: payload.sid ?? `twilio:${message.templateKey}`,
      status: "sent",
    };
  }
}
