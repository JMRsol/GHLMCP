import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, getLocationId, formatError, truncate } from "../services/ghl.js";

export function registerContactTools(server: McpServer): void {

  server.registerTool("ghl_search_contacts", {
    title: "Search Contacts",
    description: `Search GHL contacts by name, email, phone, or free-text query.
Returns contact id, name, email, phone, tags, source, and pipeline stage.

Args:
  - query: search string (name, email, or phone)
  - limit: max results (default 20, max 100)
  - page: page number for pagination (default 1)

Returns: list of matching contacts with their IDs and metadata.`,
    inputSchema: z.object({
      query: z.string().min(1).describe("Name, email, or phone to search for"),
      limit: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).default(1),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ query, limit, page }) => {
    try {
      const client = getClient();
      const locationId = getLocationId();
      const { data } = await client.get("/contacts/search", {
        params: { locationId, query, limit, page },
      });
      const contacts = data.contacts ?? [];
      if (!contacts.length) return { content: [{ type: "text", text: `No contacts found for "${query}"` }] };
      const output = contacts.map((c: Record<string, unknown>) => ({
        id: c.id, name: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
        email: c.email, phone: c.phone, tags: c.tags, source: c.source,
        dateAdded: c.dateAdded,
      }));
      return { content: [{ type: "text", text: truncate(JSON.stringify({ total: data.total, page, contacts: output }, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_get_contact", {
    title: "Get Contact",
    description: `Get full details for a single GHL contact by contact ID.
Returns all fields including custom fields, tags, opportunities, and DND status.

Args:
  - contactId: the GHL contact ID string`,
    inputSchema: z.object({
      contactId: z.string().min(1).describe("GHL contact ID"),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ contactId }) => {
    try {
      const { data } = await getClient().get(`/contacts/${contactId}`);
      return { content: [{ type: "text", text: truncate(JSON.stringify(data.contact ?? data, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_create_contact", {
    title: "Create Contact",
    description: `Create a new contact in GHL.
Returns the created contact object with its new ID.

Args:
  - firstName, lastName, email, phone: basic identity fields
  - tags: array of tag strings to apply
  - source: traffic source label (e.g. "Instagram", "Referral")
  - customFields: key-value pairs for custom fields`,
    inputSchema: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
      customFields: z.record(z.string()).optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (params) => {
    try {
      const locationId = getLocationId();
      const payload: Record<string, unknown> = { locationId, ...params };
      if (params.customFields) {
        payload.customField = Object.entries(params.customFields).map(([key, value]) => ({ key, field_value: value }));
        delete payload.customFields;
      }
      const { data } = await getClient().post("/contacts/", payload);
      return { content: [{ type: "text", text: JSON.stringify(data.contact ?? data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_update_contact", {
    title: "Update Contact",
    description: `Update fields on an existing GHL contact.
Only provided fields are updated — omitted fields are left unchanged.

Args:
  - contactId: the GHL contact ID to update
  - firstName, lastName, email, phone, tags, source: optional fields to update
  - customFields: key-value map of custom field updates`,
    inputSchema: z.object({
      contactId: z.string().min(1),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
      customFields: z.record(z.string()).optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ contactId, customFields, ...rest }) => {
    try {
      const payload: Record<string, unknown> = { ...rest };
      if (customFields) {
        payload.customField = Object.entries(customFields).map(([key, value]) => ({ key, field_value: value }));
      }
      const { data } = await getClient().put(`/contacts/${contactId}`, payload);
      return { content: [{ type: "text", text: JSON.stringify(data.contact ?? data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_add_tags", {
    title: "Add Tags to Contact",
    description: `Add one or more tags to a GHL contact without removing existing tags.

Args:
  - contactId: the GHL contact ID
  - tags: array of tag strings to add`,
    inputSchema: z.object({
      contactId: z.string().min(1),
      tags: z.array(z.string()).min(1),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ contactId, tags }) => {
    try {
      const { data } = await getClient().post(`/contacts/${contactId}/tags`, { tags });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_remove_tags", {
    title: "Remove Tags from Contact",
    description: `Remove specific tags from a GHL contact.

Args:
  - contactId: the GHL contact ID
  - tags: array of tag strings to remove`,
    inputSchema: z.object({
      contactId: z.string().min(1),
      tags: z.array(z.string()).min(1),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ contactId, tags }) => {
    try {
      const { data } = await getClient().delete(`/contacts/${contactId}/tags`, { data: { tags } });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_add_note", {
    title: "Add Note to Contact",
    description: `Add a note to a GHL contact record.

Args:
  - contactId: the GHL contact ID
  - body: the note text content`,
    inputSchema: z.object({
      contactId: z.string().min(1),
      body: z.string().min(1).describe("Note content"),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ contactId, body }) => {
    try {
      const userId = process.env.GHL_USER_ID ?? "";
      const { data } = await getClient().post(`/contacts/${contactId}/notes`, { body, userId });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });
}
