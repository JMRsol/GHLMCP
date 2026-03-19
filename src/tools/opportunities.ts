import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, getLocationId, formatError, truncate } from "../services/ghl.js";

export function registerOpportunityTools(server: McpServer): void {

  server.registerTool("ghl_list_pipelines", {
    title: "List Pipelines",
    description: `List all pipelines and their stages for this GHL location.
Use this to get pipeline IDs and stage IDs before creating or moving opportunities.`,
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => {
    try {
      const locationId = getLocationId();
      const { data } = await getClient().get("/opportunities/pipelines", { params: { locationId } });
      return { content: [{ type: "text", text: truncate(JSON.stringify(data, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
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
    inputSchema: z.object({
      pipelineId: z.string().optional(),
      stageId: z.string().optional(),
      status: z.enum(["open", "won", "lost", "abandoned"]).optional(),
      contactId: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).default(1),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ pipelineId, stageId, status, contactId, limit, page }) => {
    try {
      const locationId = getLocationId();
      const params: Record<string, unknown> = { location_id: locationId, limit, page };
      if (pipelineId) params.pipeline_id = pipelineId;
      if (stageId) params.pipeline_stage_id = stageId;
      if (status) params.status = status;
      if (contactId) params.contact_id = contactId;
      const { data } = await getClient().get("/opportunities/search", { params });
      const opps = data.opportunities ?? [];
      return { content: [{ type: "text", text: truncate(JSON.stringify({ total: data.total, page, opportunities: opps }, null, 2)) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
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
    inputSchema: z.object({
      title: z.string().min(1),
      pipelineId: z.string().min(1),
      stageId: z.string().min(1),
      contactId: z.string().min(1),
      monetaryValue: z.number().min(0).optional(),
      status: z.enum(["open", "won", "lost", "abandoned"]).default("open"),
      source: z.string().optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (params) => {
    try {
      const locationId = getLocationId();
      const { data } = await getClient().post("/opportunities/", { locationId, ...params });
      return { content: [{ type: "text", text: JSON.stringify(data.opportunity ?? data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_update_opportunity", {
    title: "Update Opportunity",
    description: `Update an existing GHL opportunity — move stage, change status, update value, etc.

Args:
  - opportunityId: the opportunity ID to update
  - title, monetaryValue, status, stageId, source: fields to update (all optional)`,
    inputSchema: z.object({
      opportunityId: z.string().min(1),
      title: z.string().optional(),
      monetaryValue: z.number().min(0).optional(),
      status: z.enum(["open", "won", "lost", "abandoned"]).optional(),
      stageId: z.string().optional().describe("Move to a new pipeline stage ID"),
      source: z.string().optional(),
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ opportunityId, stageId, ...rest }) => {
    try {
      const payload: Record<string, unknown> = { ...rest };
      if (stageId) payload.pipelineStageId = stageId;
      const { data } = await getClient().put(`/opportunities/${opportunityId}`, payload);
      return { content: [{ type: "text", text: JSON.stringify(data.opportunity ?? data, null, 2) }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });

  server.registerTool("ghl_delete_opportunity", {
    title: "Delete Opportunity",
    description: `Permanently delete a GHL opportunity. This cannot be undone.

Args:
  - opportunityId: the opportunity ID to delete`,
    inputSchema: z.object({
      opportunityId: z.string().min(1),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  }, async ({ opportunityId }) => {
    try {
      await getClient().delete(`/opportunities/${opportunityId}`);
      return { content: [{ type: "text", text: `Opportunity ${opportunityId} deleted.` }] };
    } catch (e) { return { content: [{ type: "text", text: formatError(e) }], isError: true }; }
  });
}
