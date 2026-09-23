export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
  labelIds: string[];
}

export interface GmailAttachmentInfo {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  date: string;
  body: string;
  htmlBody?: string;
  labelIds: string[];
  attachments: GmailAttachmentInfo[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
}
