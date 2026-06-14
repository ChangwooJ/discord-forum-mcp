import { z } from "zod";
import { ChannelType } from "discord.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { discord } from "../discord.js";

export function registerSendMessage(server: McpServer) {
  server.tool(
    "send_message",
    "스레드(포럼 글)에 메시지를 게시한다",
    {
      channelId: z.string().describe("스레드 ID"),
      message: z.string().describe("게시할 메시지 내용"),
    },
    async ({ channelId, message }) => {
      const channel = await discord.channels.fetch(channelId);
      if (
        !channel ||
        (channel.type !== ChannelType.PublicThread &&
          channel.type !== ChannelType.PrivateThread)
      ) {
        return {
          isError: true,
          content: [{ type: "text", text: "스레드 채널이 아닙니다." }],
        };
      }

      const sent = await channel.send(message);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ id: sent.id, createdAt: sent.createdAt }, null, 2),
          },
        ],
      };
    }
  );
}
