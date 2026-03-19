import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, getLocationId, formatError, truncate } from "../services/ghl.js";

export function registerCalendarTools(server: McpServer): void {

  server.registerTool("ghl_list_calendars", {
    title: "List Calendars",
    description: `List all calendars for this GHL location. Returns calendar IDs needed for booking appointments.`,
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => {
    try {
      const locationId = getLocationId();
      const { data } = await getClient().get("/calendars/", { params: { locationId } });
      return { content: [{ type: "text", text: truncate(JSON.stringify(data, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_list_appointments", {
    title: "List Appointments",
    description: `List appointments for this location, optionally filtered by calendar or contact.

Args:
  - calendarId: filter by specific calendar (optional)
  - contactId: filter by specific contact (optional)
  - startTime: ISO 8601 start datetime to filter from (optional)
  - endTime: ISO 8601 end datetime to filter to (optional)`,
    inputSchema: z.object({
      calendarId: z.string().optional(),
      contactId: z.string().optional(),
      startTime: z.string().optional().describe("ISO 8601 datetime e.g. 2026-03-01T00:00:00Z"),
      endTime: z.string().optional(),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ calendarId, contactId, startTime, endTime }) => {
    try {
      const locationId = getLocationId();
      const params: Record<string, unknown> = { locationId };
      if (calendarId) params.calendarId = calendarId;
      if (contactId) params.contactId = contactId;
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      const { data } = await getClient().get("/calendars/events/appointments", { params });
      return { content: [{ type: "text", text: truncate(JSON.stringify(data, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_create_appointment", {
    title: "Create Appointment",
    description: `Book an appointment for a contact in GHL.

Args:
  - calendarId: which calendar to book on (required)
  - contactId: the contact being booked (required)
  - startTime: ISO 8601 appointment start datetime (required)
  - endTime: ISO 8601 appointment end datetime (required)
  - title: appointment title/name (optional)
  - meetingLocationType: "default" | "custom" | "zoom" | "google_meet" (optional)`,
    inputSchema: z.object({
      calendarId: z.string().min(1),
      contactId: z.string().min(1),
      startTime: z.string().describe("ISO 8601 e.g. 2026-03-20T14:00:00-05:00"),
      endTime: z.string().describe("ISO 8601 e.g. 2026-03-20T15:00:00-05:00"),
      title: z.string().optional(),
      meetingLocationType: z.enum(["default", "custom", "zoom", "google_meet"]).optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (params) => {
    try {
      const { data } = await getClient().post("/calendars/events/appointments", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });
}

export function registerWorkflowTools(server: McpServer): void {

  server.registerTool("ghl_list_workflows", {
    title: "List Workflows",
    description: `List all automation workflows in this GHL location.
Returns workflow IDs needed to trigger automations on contacts.`,
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => {
    try {
      const locationId = getLocationId();
      const { data } = await getClient().get("/workflows/", { params: { locationId } });
      return { content: [{ type: "text", text: truncate(JSON.stringify(data, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_trigger_workflow", {
    title: "Trigger Workflow for Contact",
    description: `Enroll a contact into a GHL automation workflow.

Args:
  - workflowId: the workflow to trigger (get IDs from ghl_list_workflows)
  - contactId: the contact to enroll in the workflow
  - eventStartTime: optional ISO 8601 datetime for timed workflow triggers`,
    inputSchema: z.object({
      workflowId: z.string().min(1),
      contactId: z.string().min(1),
      eventStartTime: z.string().optional().describe("ISO 8601 datetime (optional)"),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ workflowId, contactId, eventStartTime }) => {
    try {
      const payload: Record<string, unknown> = { contactId };
      if (eventStartTime) payload.event_start_time = eventStartTime;
      const { data } = await getClient().post(`/workflows/${workflowId}/subscribe`, payload);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });
}
