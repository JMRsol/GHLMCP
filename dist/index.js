"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const express_1 = __importDefault(require("express"));
const contacts_js_1 = require("./tools/contacts.js");
const opportunities_js_1 = require("./tools/opportunities.js");
const conversations_js_1 = require("./tools/conversations.js");
const calendar_workflows_js_1 = require("./tools/calendar_workflows.js");
const server = new mcp_js_1.McpServer({
    name: "ghl-mcp-server",
    version: "1.0.0",
});
(0, contacts_js_1.registerContactTools)(server);
(0, opportunities_js_1.registerOpportunityTools)(server);
(0, conversations_js_1.registerConversationTools)(server);
(0, calendar_workflows_js_1.registerCalendarTools)(server);
(0, calendar_workflows_js_1.registerWorkflowTools)(server);
async function runHTTP() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", server: "ghl-mcp-server", version: "1.0.0" });
    });
    app.post("/mcp", async (req, res) => {
        const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
        });
        res.on("close", () => transport.close());
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });
    const port = parseInt(process.env.PORT ?? "3000");
    app.listen(port, () => {
        console.error(`GHL MCP server running on http://localhost:${port}/mcp`);
    });
}
async function runStdio() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("GHL MCP server running on stdio");
}
const transport = process.env.TRANSPORT ?? "http";
if (transport === "http") {
    runHTTP().catch((error) => {
        console.error("Server error:", error);
        process.exit(1);
    });
}
else {
    runStdio().catch((error) => {
        console.error("Server error:", error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map