import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getUserToken } from "../discord.js";

const outputShape = {
  id: z.string().describe("게시된 메시지 ID"),
  createdAt: z.string().describe("게시 시각 (ISO 8601)"),
};

export function registerSendMessage(server: McpServer) {
  server.registerTool(
    "send_message",
    {
      title: "스레드에 메시지 게시",
      description: "스레드(포럼 글)에 메시지를 게시한다",
      inputSchema: {
        channelId: z.string().describe("스레드 ID"),
        message: z.string().min(1).max(2000).describe("게시할 메시지 내용 (1~2000자)"),
      },
      outputSchema: outputShape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false, // 새 메시지를 추가할 뿐 기존 내용을 바꾸지 않는다
        idempotentHint: false, // 같은 인자로 다시 부르면 메시지가 하나 더 생긴다
        openWorldHint: true,
      },
    },
    async ({ channelId, message }) => {
      let token: string;
      try {
        token = getUserToken();
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: String(e) }] };
      }

      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { isError: true, content: [{ type: "text", text: `Discord API 오류: ${err}` }] };
      }

      const sent = (await res.json()) as { id: string; timestamp: string };
      const result = { id: sent.id, createdAt: sent.timestamp };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );
}
