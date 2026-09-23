import type { gmail_v1 } from "googleapis";
import type { GmailAttachmentInfo } from "./types";

export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

export function extractBody(payload: gmail_v1.Schema$MessagePart): { text: string; html: string } {
  let text = "";
  let html = "";

  function processPayload(part: gmail_v1.Schema$MessagePart): void {
    if (part.body?.data) {
      const content = decodeBase64Url(part.body.data);
      if (part.mimeType === "text/plain") {
        text = content;
      } else if (part.mimeType === "text/html") {
        html = content;
      }
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        processPayload(subPart);
      }
    }
  }

  processPayload(payload);
  return { text, html };
}

export function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string {
  if (!headers) return "";
  const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

export function extractAttachments(payload: gmail_v1.Schema$MessagePart): GmailAttachmentInfo[] {
  const attachments: GmailAttachmentInfo[] = [];

  function scan(part: gmail_v1.Schema$MessagePart): void {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }
    if (part.parts) {
      for (const subPart of part.parts) {
        scan(subPart);
      }
    }
  }

  scan(payload);
  return attachments;
}
