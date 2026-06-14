import { z } from "zod";
import { ChannelType } from "discord.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { discord } from "../discord.js";

export function registerReadMessages(server: McpServer) {
  server.tool(
    "read_messages",
    "스레드(포럼 글)의 메시지(원글+댓글)를 읽는다",
    {
      channelId: z.string().describe("스레드 ID"),
      limit: z.number().optional().describe("가져올 메시지 수 (기본 50, 최대 100)"),
    },
    async ({ channelId, limit = 50 }) => {
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

      const messages = await channel.messages.fetch({ limit });
      const result = [...messages.values()].reverse().map((m) => ({
        id: m.id,
        author: m.author.tag,
        content: m.content,
        createdAt: m.createdAt,
      }));

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
