import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListForumThreads } from "./list-forum-threads.js";
import { registerGetForumTags } from "./get-forum-tags.js";

export function registerAllTools(server: McpServer) {
  registerListForumThreads(server);
  registerGetForumTags(server);
}
