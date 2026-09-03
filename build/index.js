#!/usr/bin/env node
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loginDiscord } from "./discord.js";
import { registerAllTools } from "./tools/index.js";
// 실행한 디렉토리(루트)의 .env.discord를 자동 로드한다.
// 파일이 없으면(클라이언트 env 설정 등으로 이미 주입된 경우) 조용히 넘어간다.
try {
    process.loadEnvFile(".env.discord");
}
catch {
    // .env.discord 없음 — 기존 환경변수를 그대로 사용
}
// package.json의 버전을 그대로 보고해 값이 어긋나지 않게 한다.
const require = createRequire(import.meta.url);
const { version } = require("../package.json");
const server = new McpServer({
    name: "discord-forum-mcp",
    version,
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
