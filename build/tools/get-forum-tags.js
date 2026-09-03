import { z } from "zod";
import { ChannelType } from "discord.js";
import { discord, ensureDiscordReady } from "../discord.js";
const tagShape = {
    tags: z
        .array(z.object({ id: z.string(), name: z.string() }))
        .describe("포럼에 정의된 태그 목록"),
};
export function registerGetForumTags(server) {
    server.registerTool("get_forum_tags", {
        title: "포럼 태그 조회",
        description: "포럼 채널에 정의된 태그 목록(이름↔ID 매핑)을 반환한다",
        inputSchema: { channelId: z.string().describe("포럼 채널 ID") },
        outputSchema: tagShape,
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
    }, async ({ channelId }) => {
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
        return {
            content: [{ type: "text", text: JSON.stringify(tags, null, 2) }],
            structuredContent: { tags },
        };
    });
}
