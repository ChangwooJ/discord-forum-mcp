#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loginDiscord } from "./discord.js";
import { registerAllTools } from "./tools/index.js";
const server = new McpServer({
    name: "discord-forum-mcp",
    version: "1.0.0",
});
async function main() {
    await loginDiscord();
    registerAllTools(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("discord-forum-mcp running on stdio");
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
