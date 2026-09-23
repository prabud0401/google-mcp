import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  listMessages,
  readMessage,
  searchMessages,
  sendMessage,
  modifyMessage,
  listLabels,
  createLabel,
  createDraft,
  sendDraft,
  downloadAttachment,
} from "./gmail/service";

export const tools: Tool[] = [
  {
    name: "list_messages",
    description: "List messages in Gmail inbox or matching labels and queries",
    inputSchema: {
      type: "object",
      properties: {
        maxResults: {
          type: "number",
          description: "Maximum number of messages to return (default: 20, max: 100)",
        },
        labelIds: {
          type: "array",
          items: { type: "string" },
          description: "Filter by label IDs (e.g. ['INBOX', 'UNREAD'])",
        },
        q: {
          type: "string",
          description: "Gmail search query string",
        },
        pageToken: {
          type: "string",
          description: "Pagination token",
        },
      },
    },
  },
  {
    name: "read_message",
    description: "Read the full contents of a specific email message including headers, body text/HTML, and attachments metadata",
    inputSchema: {
      type: "object",
      required: ["messageId"],
      properties: {
        messageId: {
          type: "string",
          description: "The unique ID of the message to read",
        },
      },
    },
  },
  {
    name: "search_messages",
    description: "Search for emails using Gmail's query language (e.g. 'from:example@gmail.com after:2024/01/01 has:attachment')",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: {
          type: "string",
          description: "Gmail search query",
        },
        maxResults: {
          type: "number",
          description: "Maximum results to return (default: 20)",
        },
        pageToken: {
          type: "string",
          description: "Pagination token",
        },
      },
    },
  },
  {
    name: "send_message",
    description: "Send a new email message via Gmail",
    inputSchema: {
      type: "object",
      required: ["to", "subject", "body"],
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        body: { type: "string", description: "Plain text email body" },
        cc: { type: "string", description: "CC email addresses (comma separated)" },
        bcc: { type: "string", description: "BCC email addresses (comma separated)" },
        threadId: { type: "string", description: "Optional thread ID to reply to" },
      },
    },
  },
  {
    name: "modify_message",
    description: "Modify labels on a Gmail message (mark read/unread, star, archive, etc.)",
    inputSchema: {
      type: "object",
      required: ["messageId"],
      properties: {
        messageId: { type: "string", description: "The message ID to modify" },
        addLabelIds: {
          type: "array",
          items: { type: "string" },
          description: "Labels to add (e.g. ['STARRED', 'IMPORTANT'])",
        },
        removeLabelIds: {
          type: "array",
          items: { type: "string" },
          description: "Labels to remove (e.g. ['UNREAD'])",
        },
      },
    },
  },
  {
    name: "list_labels",
    description: "List all Gmail labels (system and user-created labels)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_label",
    description: "Create a new label in Gmail",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "Label name" },
        messageListVisibility: {
          type: "string",
          enum: ["show", "hide"],
          description: "Visibility in message list",
        },
        labelListVisibility: {
          type: "string",
          enum: ["labelShow", "labelShowIfUnread", "labelHide"],
          description: "Visibility in label list",
        },
      },
    },
  },
  {
    name: "create_draft",
    description: "Create an email draft without sending it",
    inputSchema: {
      type: "object",
      required: ["to", "subject", "body"],
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Draft subject" },
        body: { type: "string", description: "Plain text draft body" },
        cc: { type: "string", description: "CC recipients" },
        bcc: { type: "string", description: "BCC recipients" },
        threadId: { type: "string", description: "Thread ID if replying" },
      },
    },
  },
  {
    name: "send_draft",
    description: "Send an existing email draft by draftId",
    inputSchema: {
      type: "object",
      required: ["draftId"],
      properties: {
        draftId: { type: "string", description: "The unique ID of the draft to send" },
      },
    },
  },
  {
    name: "download_attachment",
    description: "Download a specific email attachment as base64 data",
    inputSchema: {
      type: "object",
      required: ["messageId", "attachmentId"],
      properties: {
        messageId: { type: "string", description: "The ID of the email message" },
        attachmentId: { type: "string", description: "The ID of the attachment" },
      },
    },
  },
];

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "list_messages": {
        const result = await listMessages({
          maxResults: args.maxResults !== undefined ? Number(args.maxResults) : undefined,
          labelIds: args.labelIds as string[] | undefined,
          q: args.q as string | undefined,
          pageToken: args.pageToken as string | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "read_message": {
        const result = await readMessage({ messageId: String(args.messageId) });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "search_messages": {
        const result = await searchMessages({
          query: String(args.query),
          maxResults: args.maxResults !== undefined ? Number(args.maxResults) : undefined,
          pageToken: args.pageToken as string | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "send_message": {
        const result = await sendMessage({
          to: String(args.to),
          subject: String(args.subject),
          body: String(args.body),
          cc: args.cc as string | undefined,
          bcc: args.bcc as string | undefined,
          threadId: args.threadId as string | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "modify_message": {
        const result = await modifyMessage({
          messageId: String(args.messageId),
          addLabelIds: args.addLabelIds as string[] | undefined,
          removeLabelIds: args.removeLabelIds as string[] | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "list_labels": {
        const result = await listLabels();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "create_label": {
        const result = await createLabel({
          name: String(args.name),
          messageListVisibility: args.messageListVisibility as "show" | "hide" | undefined,
          labelListVisibility: args.labelListVisibility as
            | "labelShow"
            | "labelShowIfUnread"
            | "labelHide"
            | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "create_draft": {
        const result = await createDraft({
          to: String(args.to),
          subject: String(args.subject),
          body: String(args.body),
          cc: args.cc as string | undefined,
          bcc: args.bcc as string | undefined,
          threadId: args.threadId as string | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "send_draft": {
        const result = await sendDraft({ draftId: String(args.draftId) });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "download_attachment": {
        const result = await downloadAttachment({
          messageId: String(args.messageId),
          attachmentId: String(args.attachmentId),
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error executing ${name}: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
