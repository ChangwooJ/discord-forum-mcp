#!/usr/bin/env node
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { discord, ensureDiscordReady } from "./discord.js";
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
    registerAllTools(server);
    // 핸드셰이크를 먼저 끝낸다. 디스코드 로그인을 기다렸다가 connect 하면
    // 게이트웨이가 느리거나 토큰이 잘못됐을 때 클라이언트가 initialize 응답을
    // 받지 못해 원인도 모른 채 타임아웃으로 서버를 종료시킨다.
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`discord-forum-mcp v${version} running on stdio`);
    // 로그인은 백그라운드로 시작하고, 실패해도 서버를 죽이지 않는다.
    // 각 도구가 ensureDiscordReady()로 대기하며 그때 다시 시도한다.
    ensureDiscordReady().catch((err) => {
        console.error("Discord 로그인 실패 (도구 호출 시 재시도):", err instanceof Error ? err.message : String(err));
    });
}
async function shutdown() {
    await discord.destroy().catch(() => { });
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
