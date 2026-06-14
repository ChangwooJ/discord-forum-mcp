import { z } from "zod";
import { ChannelType } from "discord.js";
import { discord } from "../discord.js";
export function registerListForumThreads(server) {
    server.tool("list_forum_threads", "포럼 채널의 활성/아카이브 스레드 목록을 반환한다", { channelId: z.string().describe("포럼 채널 ID") }, async ({ channelId }) => {
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
        const threads = [
            ...active.threads.values(),
            ...archived.threads.values(),
        ].map((t) => ({
            id: t.id,
            title: t.name,
            archived: t.archived ?? false,
            appliedTags: t.appliedTags,
            lastActivity: t.archiveTimestamp ?? t.createdAt,
        }));
        return { content: [{ type: "text", text: JSON.stringify(threads, null, 2) }] };
    });
}
