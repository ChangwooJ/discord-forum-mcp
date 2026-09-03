import { z } from "zod";
import { ChannelType } from "discord.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { discord, ensureDiscordReady } from "../discord.js";

const outputShape = {
  messages: z
    .array(
      z.object({
        id: z.string(),
        author: z.string(),
        content: z.string(),
        createdAt: z.string(),
      })
    )
    .describe("오래된 순으로 정렬된 메시지 목록"),
};

export function registerReadMessages(server: McpServer) {
  server.registerTool(
    "read_messages",
    {
      title: "스레드 메시지 읽기",
      description: "스레드(포럼 글)의 메시지(원글+댓글)를 읽는다",
      inputSchema: {
        channelId: z.string().describe("스레드 ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("가져올 메시지 수 (기본 50, 최대 100)"),
      },
      outputSchema: outputShape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async ({ channelId, limit = 50 }) => {
      await ensureDiscordReady();
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

      const fetched = await channel.messages.fetch({ limit });
      const messages = [...fetched.values()].reverse().map((m) => ({
        id: m.id,
        author: m.author.tag,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }));

      return {
        content: [{ type: "text", text: JSON.stringify(messages, null, 2) }],
        structuredContent: { messages },
      };
    }
  );
}
