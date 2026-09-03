import { z } from "zod";
import { ChannelFlagsBitField, ChannelType } from "discord.js";
import { discord, ensureDiscordReady, getUserToken } from "../discord.js";
const outputShape = {
    id: z.string().describe("생성된 스레드 ID"),
    title: z.string(),
    appliedTags: z.array(z.string()),
    appliedTagNames: z.array(z.string()).describe("적용된 태그의 이름"),
    firstMessageId: z.string().optional(),
    createdAt: z.string().optional(),
};
export function registerCreateForumPost(server) {
    server.registerTool("create_forum_post", {
        title: "포럼 글 작성",
        description: "포럼 채널에 새 글(스레드)을 작성한다. 태그는 ID 또는 이름으로 지정할 수 있다",
        inputSchema: {
            channelId: z.string().describe("포럼 채널 ID"),
            title: z.string().min(1).max(100).describe("포럼 글 제목 (1~100자)"),
            message: z.string().min(1).max(2000).describe("첫 게시글 본문 (1~2000자)"),
            appliedTags: z.array(z.string()).optional().describe("적용할 태그 ID 목록"),
            tagNames: z
                .array(z.string())
                .optional()
                .describe("적용할 태그 이름 목록 (ID로 자동 변환, appliedTags와 합쳐짐)"),
            autoArchiveDuration: z
                .union([z.literal(60), z.literal(1440), z.literal(4320), z.literal(10080)])
                .optional()
                .describe("자동 아카이브까지의 시간(분): 60 / 1440 / 4320 / 10080"),
        },
        outputSchema: outputShape,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false, // 새 글을 만들 뿐 기존 것을 바꾸지 않는다
            idempotentHint: false, // 같은 인자로 다시 부르면 글이 하나 더 생긴다
            openWorldHint: true,
        },
    }, async ({ channelId, title, message, appliedTags, tagNames, autoArchiveDuration }) => {
        let token;
        try {
            token = getUserToken();
        }
        catch (e) {
            return { isError: true, content: [{ type: "text", text: String(e) }] };
        }
        await ensureDiscordReady();
        const channel = await discord.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildForum) {
            return {
                isError: true,
                content: [{ type: "text", text: "포럼 채널이 아닙니다." }],
            };
        }
        const available = channel.availableTags;
        const tagIds = new Set(appliedTags ?? []);
        const unknownIds = [...tagIds].filter((id) => !available.some((t) => t.id === id));
        if (unknownIds.length > 0) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `포럼에 없는 태그 ID: ${unknownIds.join(", ")}\n사용 가능한 태그: ${JSON.stringify(available.map((t) => ({ id: t.id, name: t.name })))}`,
                    },
                ],
            };
        }
        const unknownNames = [];
        for (const name of tagNames ?? []) {
            const tag = available.find((t) => t.name.toLowerCase() === name.toLowerCase());
            if (tag)
                tagIds.add(tag.id);
            else
                unknownNames.push(name);
        }
        if (unknownNames.length > 0) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `포럼에 없는 태그 이름: ${unknownNames.join(", ")}\n사용 가능한 태그: ${JSON.stringify(available.map((t) => ({ id: t.id, name: t.name })))}`,
                    },
                ],
            };
        }
        // 포럼이 태그를 필수로 요구하는 경우(Require Tag) 미리 안내한다.
        const requiresTag = channel.flags.has(ChannelFlagsBitField.Flags.RequireTag);
        if (requiresTag && tagIds.size === 0) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: `이 포럼은 태그가 필수입니다. 사용 가능한 태그: ${JSON.stringify(available.map((t) => ({ id: t.id, name: t.name })))}`,
                    },
                ],
            };
        }
        const body = {
            name: title,
            message: { content: message },
        };
        if (tagIds.size > 0)
            body.applied_tags = [...tagIds];
        if (autoArchiveDuration !== undefined) {
            body.auto_archive_duration = autoArchiveDuration;
        }
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/threads`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.text();
            return { isError: true, content: [{ type: "text", text: `Discord API 오류: ${err}` }] };
        }
        const thread = (await res.json());
        const nameById = new Map(available.map((t) => [t.id, t.name]));
        const result = {
            id: thread.id,
            title: thread.name,
            appliedTags: thread.applied_tags ?? [],
            appliedTagNames: (thread.applied_tags ?? []).map((id) => nameById.get(id) ?? id),
            firstMessageId: thread.message?.id,
            createdAt: thread.message?.timestamp ?? thread.thread_metadata?.create_timestamp,
        };
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            structuredContent: result,
        };
    });
}
