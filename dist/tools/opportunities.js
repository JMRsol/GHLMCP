"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOpportunityTools = registerOpportunityTools;
const zod_1 = require("zod");
const ghl_js_1 = require("../services/ghl.js");
function registerOpportunityTools(server) {
    server.registerTool("ghl_list_pipelines", {
        title: "List Pipelines",
        description: `List all pipelines and their stages for this GHL location.
Use this to get pipeline IDs and stage IDs before creating or moving opportunities.`,
        inputSchema: zod_1.z.object({}),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async () => {
        try {
            const locationId = (0, ghl_js_1.getLocationId)();
            const { data } = await (0, ghl_js_1.getClient)().get("/opportunities/pipelines", { params: { locationId } });
            return { content: [{ type: "text", text: (0, ghl_js_1.truncate)(JSON.stringify(data, null, 2)) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
    server.registerTool("ghl_list_opportunities", {
        title: "List Opportunities",
        description: `List opportunities in a pipeline, optionally filtered by stage or status.

Args:
  - pipelineId: filter by pipeline (optional)
  - stageId: filter by stage (optional)
  - status: "open" | "won" | "lost" | "abandoned" (optional)
  - contactId: filter by contact (optional)
  - limit: max results (default 20)
  - page: page number (default 1)`,
        inputSchema: zod_1.z.object({
            pipelineId: zod_1.z.string().optional(),
            stageId: zod_1.z.string().optional(),
            status: zod_1.z.enum(["open", "won", "lost", "abandoned"]).optional(),
            contactId: zod_1.z.string().optional(),
            limit: zod_1.z.number().int().min(1).max(100).default(20),
            page: zod_1.z.number().int().min(1).default(1),
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async ({ pipelineId, stageId, status, contactId, limit, page }) => {
        try {
            const locationId = (0, ghl_js_1.getLocationId)();
            const params = { location_id: locationId, limit, page };
            if (pipelineId)
                params.pipeline_id = pipelineId;
            if (stageId)
                params.pipeline_stage_id = stageId;
            if (status)
                params.status = status;
            if (contactId)
                params.contact_id = contactId;
            const { data } = await (0, ghl_js_1.getClient)().get("/opportunities/search", { params });
            const opps = data.opportunities ?? [];
            return { content: [{ type: "text", text: (0, ghl_js_1.truncate)(JSON.stringify({ total: data.total, page, opportunities: opps }, null, 2)) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
    server.registerTool("ghl_create_opportunity", {
        title: "Create Opportunity",
        description: `Create a new opportunity in a GHL pipeline.

Args:
  - title: opportunity name/title (required)
  - pipelineId: the pipeline to add it to (required)
  - stageId: the initial pipeline stage (required)
  - contactId: link to a contact (required)
  - monetaryValue: deal value in dollars (optional)
  - status: "open" | "won" | "lost" | "abandoned" (default "open")
  - source: lead source label (optional)`,
        inputSchema: zod_1.z.object({
            title: zod_1.z.string().min(1),
            pipelineId: zod_1.z.string().min(1),
            stageId: zod_1.z.string().min(1),
            contactId: zod_1.z.string().min(1),
            monetaryValue: zod_1.z.number().min(0).optional(),
            status: zod_1.z.enum(["open", "won", "lost", "abandoned"]).default("open"),
            source: zod_1.z.string().optional(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    }, async (params) => {
        try {
            const locationId = (0, ghl_js_1.getLocationId)();
            const { data } = await (0, ghl_js_1.getClient)().post("/opportunities/", { locationId, ...params });
            return { content: [{ type: "text", text: JSON.stringify(data.opportunity ?? data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
    server.registerTool("ghl_update_opportunity", {
        title: "Update Opportunity",
        description: `Update an existing GHL opportunity — move stage, change status, update value, etc.

Args:
  - opportunityId: the opportunity ID to update
  - title, monetaryValue, status, stageId, source: fields to update (all optional)`,
        inputSchema: zod_1.z.object({
            opportunityId: zod_1.z.string().min(1),
            title: zod_1.z.string().optional(),
            monetaryValue: zod_1.z.number().min(0).optional(),
            status: zod_1.z.enum(["open", "won", "lost", "abandoned"]).optional(),
            stageId: zod_1.z.string().optional().describe("Move to a new pipeline stage ID"),
            source: zod_1.z.string().optional(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    }, async ({ opportunityId, stageId, ...rest }) => {
        try {
            const payload = { ...rest };
            if (stageId)
                payload.pipelineStageId = stageId;
            const { data } = await (0, ghl_js_1.getClient)().put(`/opportunities/${opportunityId}`, payload);
            return { content: [{ type: "text", text: JSON.stringify(data.opportunity ?? data, null, 2) }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
    server.registerTool("ghl_delete_opportunity", {
        title: "Delete Opportunity",
        description: `Permanently delete a GHL opportunity. This cannot be undone.

Args:
  - opportunityId: the opportunity ID to delete`,
        inputSchema: zod_1.z.object({
            opportunityId: zod_1.z.string().min(1),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    }, async ({ opportunityId }) => {
        try {
            await (0, ghl_js_1.getClient)().delete(`/opportunities/${opportunityId}`);
            return { content: [{ type: "text", text: `Opportunity ${opportunityId} deleted.` }] };
        }
        catch (e) {
            return { content: [{ type: "text", text: (0, ghl_js_1.formatError)(e) }], isError: true };
        }
    });
}
//# sourceMappingURL=opportunities.js.map