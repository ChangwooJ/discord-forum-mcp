import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getUserToken } from "../discord.js";

export function registerSendMessage(server: McpServer) {
  server.tool(
    "send_message",
    "스레드(포럼 글)에 메시지를 게시한다",
    {
      channelId: z.string().describe("스레드 ID"),
      message: z.string().describe("게시할 메시지 내용"),
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

      const sent = await res.json() as { id: string; timestamp: string };
      return {
        content: [
          { type: "text", text: JSON.stringify({ id: sent.id, createdAt: sent.timestamp }, null, 2) },
        ],
      };
    }
  );
}
