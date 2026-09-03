import { z } from "zod";
import { ChannelType, type AnyThreadChannel } from "discord.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { discord } from "../discord.js";

const EXCERPT_MAX_LENGTH = 140;

function makeExcerpt(content: string, max = EXCERPT_MAX_LENGTH): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return oneLine.slice(0, max).trimEnd() + "…";
}

async function fetchFirstMessageExcerpt(thread: AnyThreadChannel): Promise<string> {
  try {
    const starter = await thread.fetchStarterMessage();
    return starter ? makeExcerpt(starter.content) : "";
  } catch {
    return "";
  }
}

export function registerListForumThreads(server: McpServer) {
  server.tool(
    "list_forum_threads",
    "포럼 채널의 활성/아카이브 스레드 목록을 반환한다",
    { channelId: z.string().describe("포럼 채널 ID") },
    async ({ channelId }) => {
      const channel = await discord.channels.fetch(channelId);
      if (!channel || channel.type !== ChannelType.GuildForum) {
        return {
          isError: true,
          content: [{ type: "text", text: "포럼 채널이 아닙니다." }],
        };
      }

      const [active, archived] = await Promise.all([
        channel.threads.fetchActive(),
        channel.threads.fetchArchived(),
      ]);

      const threads = await Promise.all(
        [...active.threads.values(), ...archived.threads.values()].map(async (t) => ({
          id: t.id,
          title: t.name,
          archived: t.archived ?? false,
          appliedTags: t.appliedTags,
          lastActivity: t.archiveTimestamp ?? t.createdAt,
          firstMessageExcerpt: await fetchFirstMessageExcerpt(t),
        }))
      );

      return { content: [{ type: "text", text: JSON.stringify(threads, null, 2) }] };
    }
  );
}
