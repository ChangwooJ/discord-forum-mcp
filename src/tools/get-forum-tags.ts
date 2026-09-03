import { z } from "zod";
import { ChannelType } from "discord.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { discord, ensureDiscordReady } from "../discord.js";

export function registerGetForumTags(server: McpServer) {
  server.tool(
    "get_forum_tags",
    "포럼 채널에 정의된 태그 목록(이름↔ID 매핑)을 반환한다",
    { channelId: z.string().describe("포럼 채널 ID") },
    async ({ channelId }) => {
      await ensureDiscordReady();
      const channel = await discord.channels.fetch(channelId);
      if (!channel || channel.type !== ChannelType.GuildForum) {
        return {
          isError: true,
          content: [{ type: "text", text: "포럼 채널이 아닙니다." }],
        };
      }

      const tags = channel.availableTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
      }));

      return { content: [{ type: "text", text: JSON.stringify(tags, null, 2) }] };
    }
  );
}
