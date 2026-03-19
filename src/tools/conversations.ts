import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, getLocationId, formatError, truncate } from "../services/ghl.js";

export function registerConversationTools(server: McpServer): void {

  server.registerTool("ghl_list_conversations", {
    title: "List Conversations",
    description: `List conversations in GHL inbox, optionally filtered by contact or type.

Args:
  - contactId: filter by a specific contact (optional)
  - type: "SMS" | "Email" | "WhatsApp" | "IG" | "FB" (optional)
  - unreadOnly: only show unread conversations (optional, default false)
  - limit: max results (default 20)
  - page: page number (default 1)`,
    inputSchema: z.object({
      contactId: z.string().optional(),
      type: z.enum(["SMS", "Email", "WhatsApp", "IG", "FB"]).optional(),
      unreadOnly: z.boolean().default(false),
      limit: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).default(1),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ contactId, type, unreadOnly, limit, page }) => {
    try {
      const locationId = getLocationId();
      const params: Record<string, unknown> = { locationId, limit, page };
      if (contactId) params.contactId = contactId;
      if (type) params.type = type;
      if (unreadOnly) params.unreadOnly = true;
      const { data } = await getClient().get("/conversations/search", { params });
      return { content: [{ type: "text", text: truncate(JSON.stringify(data, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_get_conversation_messages", {
    title: "Get Conversation Messages",
    description: `Get the message history for a specific conversation.

Args:
  - conversationId: the GHL conversation ID
  - limit: max messages to return (default 20)`,
    inputSchema: z.object({
      conversationId: z.string().min(1),
      limit: z.number().int().min(1).max(100).default(20),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ conversationId, limit }) => {
    try {
      const { data } = await getClient().get(`/conversations/${conversationId}/messages`, { params: { limit } });
      return { content: [{ type: "text", text: truncate(JSON.stringify(data, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_send_message", {
    title: "Send Message",
    description: `Send a message to a contact via SMS, Email, or other channel.

Args:
  - contactId: the GHL contact ID to message
  - type: "SMS" | "Email" | "WhatsApp"
  - message: the message body text
  - subject: email subject line (required when type is "Email")
  - html: HTML body for email (optional, falls back to message text)`,
    inputSchema: z.object({
      contactId: z.string().min(1),
      type: z.enum(["SMS", "Email", "WhatsApp"]),
      message: z.string().min(1).describe("Message body"),
      subject: z.string().optional().describe("Email subject (required for Email type)"),
      html: z.string().optional().describe("HTML email body (optional)"),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ contactId, type, message, subject, html }) => {
    try {
      const payload: Record<string, unknown> = { type, message, contactId };
      if (subject) payload.subject = subject;
      if (html) payload.html = html;
      const { data } = await getClient().post("/conversations/messages", payload);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });
}
