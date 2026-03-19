"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConversationTools = registerConversationTools;
const zod_1 = require("zod");
const ghl_js_1 = require("../services/ghl.js");
function registerConversationTools(server) {
    server.registerTool("ghl_list_conversations", {
        title: "List Conversations",
        description: `List conversations in GHL inbox, optionally filtered by contact or type.

Args:
  - contactId: filter by a specific contact (optional)
  - type: "SMS" | "Email" | "WhatsApp" | "IG" | "FB" (optional)
  - unreadOnly: only show unread conversations (optional, default false)
  - limit: max results (default 20)
  - page: page number (default 1)`,
        inputSchema: zod_1.z.object({
            contactId: zod_1.z.string().optional(),
            type: zod_1.z.enum(["SMS", "Email", "WhatsApp", "IG", "FB"]).optional(),
            unreadOnly: zod_1.z.boolean().default(false),
            limit: zod_1.z.number().int().min(1).max(100).default(20),
            page: zod_1.z.number().int().min(1).default(1),
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async ({ contactId, type, unreadOnly, limit, page }) => {
        try {
            const locationId = (0, ghl_js_1.getLocationId)();
            const params = { locationId, limit, page };
            if (contactId)
                params.contactId = contactId;
            if (type)
                params.type = type;
            if (unreadOnly)
                params.unreadOnly = true;
            const { data } = await (0, ghl_js_1.getClient)().get("/conversations/search", { params });
            return { content: [{ type: "text", text: (0, ghl_js_1.truncate)(JSON.stringify(data, null, 2)) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
    server.registerTool("ghl_get_conversation_messages", {
        title: "Get Conversation Messages",
        description: `Get the message history for a specific conversation.

Args:
  - conversationId: the GHL conversation ID
  - limit: max messages to return (default 20)`,
        inputSchema: zod_1.z.object({
            conversationId: zod_1.z.string().min(1),
            limit: zod_1.z.number().int().min(1).max(100).default(20),
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ conversationId, limit }) => {
        try {
            const { data } = await (0, ghl_js_1.getClient)().get(`/conversations/${conversationId}/messages`, { params: { limit } });
            return { content: [{ type: "text", text: (0, ghl_js_1.truncate)(JSON.stringify(data, null, 2)) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
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
        inputSchema: zod_1.z.object({
            contactId: zod_1.z.string().min(1),
            type: zod_1.z.enum(["SMS", "Email", "WhatsApp"]),
            message: zod_1.z.string().min(1).describe("Message body"),
            subject: zod_1.z.string().optional().describe("Email subject (required for Email type)"),
            html: zod_1.z.string().optional().describe("HTML email body (optional)"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    }, async ({ contactId, type, message, subject, html }) => {
        try {
            const payload = { type, message, contactId };
            if (subject)
                payload.subject = subject;
            if (html)
                payload.html = html;
            const { data } = await (0, ghl_js_1.getClient)().post("/conversations/messages", payload);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
}
//# sourceMappingURL=conversations.js.map