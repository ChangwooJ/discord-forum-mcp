import { z } from "zod";
import { ChannelType } from "discord.js";
import { discord } from "../discord.js";
export function registerUpdateForumPost(server) {
    server.tool("update_forum_post", "포럼 글(스레드)의 아카이브 상태 또는 적용 태그를 변경한다", {
        threadId: z.string().describe("스레드 ID"),
        archived: z.boolean().optional().describe("아카이브 여부"),
        appliedTags: z.array(z.string()).optional().describe("적용할 태그 ID 목록"),
    }, async ({ threadId, archived, appliedTags }) => {
        const channel = await discord.channels.fetch(threadId);
        if (!channel ||
            (channel.type !== ChannelType.PublicThread &&
                channel.type !== ChannelType.PrivateThread)) {
            return {
                isError: true,
                content: [{ type: "text", text: "스레드 채널이 아닙니다." }],
            };
        }
        if (appliedTags !== undefined) {
            await channel.setAppliedTags(appliedTags);
        }
        if (archived !== undefined) {
            await channel.setArchived(archived);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        id: channel.id,
                        archived: channel.archived,
                        appliedTags: channel.appliedTags,
                    }, null, 2),
                },
            ],
        };
    });
}
