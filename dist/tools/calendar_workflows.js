"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCalendarTools = registerCalendarTools;
exports.registerWorkflowTools = registerWorkflowTools;
const zod_1 = require("zod");
const ghl_js_1 = require("../services/ghl.js");
function registerCalendarTools(server) {
    server.registerTool("ghl_list_calendars", {
        title: "List Calendars",
        description: `List all calendars for this GHL location. Returns calendar IDs needed for booking appointments.`,
        inputSchema: zod_1.z.object({}),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async () => {
        try {
            const locationId = (0, ghl_js_1.getLocationId)();
            const { data } = await (0, ghl_js_1.getClient)().get("/calendars/", { params: { locationId } });
            return { content: [{ type: "text", text: (0, ghl_js_1.truncate)(JSON.stringify(data, null, 2)) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
    server.registerTool("ghl_list_appointments", {
        title: "List Appointments",
        description: `List appointments for this location, optionally filtered by calendar or contact.

Args:
  - calendarId: filter by specific calendar (optional)
  - contactId: filter by specific contact (optional)
  - startTime: ISO 8601 start datetime to filter from (optional)
  - endTime: ISO 8601 end datetime to filter to (optional)`,
        inputSchema: zod_1.z.object({
            calendarId: zod_1.z.string().optional(),
            contactId: zod_1.z.string().optional(),
            startTime: zod_1.z.string().optional().describe("ISO 8601 datetime e.g. 2026-03-01T00:00:00Z"),
            endTime: zod_1.z.string().optional(),
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async ({ calendarId, contactId, startTime, endTime }) => {
        try {
            const locationId = (0, ghl_js_1.getLocationId)();
            const params = { locationId };
            if (calendarId)
                params.calendarId = calendarId;
            if (contactId)
                params.contactId = contactId;
            if (startTime)
                params.startTime = startTime;
            if (endTime)
                params.endTime = endTime;
            const { data } = await (0, ghl_js_1.getClient)().get("/calendars/events/appointments", { params });
            return { content: [{ type: "text", text: (0, ghl_js_1.truncate)(JSON.stringify(data, null, 2)) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
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
        inputSchema: zod_1.z.object({
            calendarId: zod_1.z.string().min(1),
            contactId: zod_1.z.string().min(1),
            startTime: zod_1.z.string().describe("ISO 8601 e.g. 2026-03-20T14:00:00-05:00"),
            endTime: zod_1.z.string().describe("ISO 8601 e.g. 2026-03-20T15:00:00-05:00"),
            title: zod_1.z.string().optional(),
            meetingLocationType: zod_1.z.enum(["default", "custom", "zoom", "google_meet"]).optional(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    }, async (params) => {
        try {
            const { data } = await (0, ghl_js_1.getClient)().post("/calendars/events/appointments", params);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
}
function registerWorkflowTools(server) {
    server.registerTool("ghl_list_workflows", {
        title: "List Workflows",
        description: `List all automation workflows in this GHL location.
Returns workflow IDs needed to trigger automations on contacts.`,
        inputSchema: zod_1.z.object({}),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async () => {
        try {
            const locationId = (0, ghl_js_1.getLocationId)();
            const { data } = await (0, ghl_js_1.getClient)().get("/workflows/", { params: { locationId } });
            return { content: [{ type: "text", text: (0, ghl_js_1.truncate)(JSON.stringify(data, null, 2)) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
    server.registerTool("ghl_trigger_workflow", {
        title: "Trigger Workflow for Contact",
        description: `Enroll a contact into a GHL automation workflow.

Args:
  - workflowId: the workflow to trigger (get IDs from ghl_list_workflows)
  - contactId: the contact to enroll in the workflow
  - eventStartTime: optional ISO 8601 datetime for timed workflow triggers`,
        inputSchema: zod_1.z.object({
            workflowId: zod_1.z.string().min(1),
            contactId: zod_1.z.string().min(1),
            eventStartTime: zod_1.z.string().optional().describe("ISO 8601 datetime (optional)"),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    }, async ({ workflowId, contactId, eventStartTime }) => {
        try {
            const payload = { contactId };
            if (eventStartTime)
                payload.event_start_time = eventStartTime;
            const { data } = await (0, ghl_js_1.getClient)().post(`/workflows/${workflowId}/subscribe`, payload);
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
}
//# sourceMappingURL=calendar_workflows.js.map