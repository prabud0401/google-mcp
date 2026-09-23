import { getGmailClient } from "../auth";
import { extractAttachments, extractBody, getHeader } from "./mime";
import type { GmailLabel, GmailMessageDetail, GmailMessageSummary } from "./types";

export async function listMessages(params: {
  maxResults?: number;
  labelIds?: string[];
  q?: string;
  pageToken?: string;
}): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string }> {
  const gmail = await getGmailClient();
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: params.maxResults || 20,
    labelIds: params.labelIds,
    q: params.q,
    pageToken: params.pageToken,
  });

  const messages: GmailMessageSummary[] = [];
  if (response.data.messages) {
    for (const msg of response.data.messages) {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });
      messages.push({
        id: msg.id!,
        threadId: msg.threadId!,
        snippet: detail.data.snippet || "",
        from: getHeader(detail.data.payload?.headers, "From"),
        subject: getHeader(detail.data.payload?.headers, "Subject"),
        date: getHeader(detail.data.payload?.headers, "Date"),
        labelIds: detail.data.labelIds || [],
      });
    }
  }

  return { messages, nextPageToken: response.data.nextPageToken || undefined };
}

export async function readMessage(params: { messageId: string }): Promise<GmailMessageDetail> {
  const gmail = await getGmailClient();
  const response = await gmail.users.messages.get({
    userId: "me",
    id: params.messageId,
    format: "full",
  });

  const headers = response.data.payload?.headers;
  const { text, html } = response.data.payload ? extractBody(response.data.payload) : { text: "", html: "" };
  const attachments = response.data.payload ? extractAttachments(response.data.payload) : [];

  return {
    id: response.data.id!,
    threadId: response.data.threadId!,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    cc: getHeader(headers, "Cc") || undefined,
    subject: getHeader(headers, "Subject"),
    date: getHeader(headers, "Date"),
    body: text,
    htmlBody: html || undefined,
    labelIds: response.data.labelIds || [],
    attachments,
  };
}

export async function searchMessages(params: {
  query: string;
  maxResults?: number;
  pageToken?: string;
}): Promise<{ messages: GmailMessageSummary[]; nextPageToken?: string }> {
  return listMessages({
    q: params.query,
    maxResults: params.maxResults,
    pageToken: params.pageToken,
  });
}

export async function sendMessage(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  threadId?: string;
}): Promise<{ id: string; threadId: string }> {
  const gmail = await getGmailClient();
  const messageParts = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
  ];
  if (params.cc) messageParts.splice(1, 0, `Cc: ${params.cc}`);
  if (params.bcc) messageParts.splice(1, 0, `Bcc: ${params.bcc}`);
  messageParts.push("", params.body);

  const encodedMessage = Buffer.from(messageParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage, threadId: params.threadId },
  });

  return { id: response.data.id!, threadId: response.data.threadId! };
}

export async function modifyMessage(params: {
  messageId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}): Promise<{ id: string; labelIds: string[] }> {
  const gmail = await getGmailClient();
  const response = await gmail.users.messages.modify({
    userId: "me",
    id: params.messageId,
    requestBody: {
      addLabelIds: params.addLabelIds,
      removeLabelIds: params.removeLabelIds,
    },
  });
  return { id: response.data.id!, labelIds: response.data.labelIds || [] };
}

export async function listLabels(): Promise<GmailLabel[]> {
  const gmail = await getGmailClient();
  const response = await gmail.users.labels.list({ userId: "me" });
  return (response.data.labels || []).map((label) => ({
    id: label.id!,
    name: label.name!,
    type: label.type!,
    messageListVisibility: label.messageListVisibility || undefined,
    labelListVisibility: label.labelListVisibility || undefined,
  }));
}

export async function createLabel(params: {
  name: string;
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
}): Promise<{ id: string; name: string }> {
  const gmail = await getGmailClient();
  const response = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: params.name,
      messageListVisibility: params.messageListVisibility,
      labelListVisibility: params.labelListVisibility,
    },
  });
  return { id: response.data.id!, name: response.data.name! };
}

export async function createDraft(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  threadId?: string;
}): Promise<{ id: string; messageId: string }> {
  const gmail = await getGmailClient();
  const messageParts = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
  ];
  if (params.cc) messageParts.splice(1, 0, `Cc: ${params.cc}`);
  if (params.bcc) messageParts.splice(1, 0, `Bcc: ${params.bcc}`);
  messageParts.push("", params.body);

  const encodedMessage = Buffer.from(messageParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw: encodedMessage, threadId: params.threadId } },
  });

  return { id: response.data.id!, messageId: response.data.message?.id || "" };
}

export async function sendDraft(params: { draftId: string }): Promise<{ id: string; threadId: string }> {
  const gmail = await getGmailClient();
  const response = await gmail.users.drafts.send({
    userId: "me",
    requestBody: { id: params.draftId },
  });
  return { id: response.data.id!, threadId: response.data.threadId! };
}

export async function downloadAttachment(params: {
  messageId: string;
  attachmentId: string;
}): Promise<{ filename?: string; mimeType?: string; dataBase64: string; sizeBytes: number }> {
  const gmail = await getGmailClient();
  const response = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId: params.messageId,
    id: params.attachmentId,
  });

  const rawData = response.data.data;
  if (!rawData) {
    throw new Error("Empty attachment payload received from Gmail API");
  }

  const normalized = rawData.replace(/-/g, "+").replace(/_/g, "/");
  return {
    dataBase64: normalized,
    sizeBytes: response.data.size || 0,
  };
}
