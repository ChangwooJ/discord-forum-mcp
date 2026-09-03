import { z } from "zod";
import { ChannelType } from "discord.js";
import { discord, ensureDiscordReady } from "../discord.js";
const EXCERPT_MAX_LENGTH = 140;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
function makeExcerpt(content, max = EXCERPT_MAX_LENGTH) {
    const oneLine = content.replace(/\s+/g, " ").trim();
    if (oneLine.length <= max)
        return oneLine;
    return oneLine.slice(0, max).trimEnd() + "…";
}
async function fetchFirstMessageExcerpt(thread) {
    try {
        const starter = await thread.fetchStarterMessage();
        return starter ? makeExcerpt(starter.content) : "";
    }
    catch {
        return "";
    }
}
const outputShape = {
    threads: z.array(z.object({
        id: z.string(),
        title: z.string(),
        archived: z.boolean(),
        appliedTags: z.array(z.string()),
        lastActivity: z.string().nullable(),
        firstMessageExcerpt: z.string(),
    })),
    hasMore: z.boolean().describe("가져오지 않은 아카이브 스레드가 더 있는지 여부"),
    nextArchivedBefore: z
        .string()
        .optional()
        .describe("다음 페이지를 요청할 때 archivedBefore에 넣을 커서"),
};
export function registerListForumThreads(server) {
    server.registerTool("list_forum_threads", {
        title: "포럼 스레드 목록",
        description: "포럼 채널의 스레드 목록을 최신순으로 반환한다. 활성 스레드가 먼저 오고 그다음 아카이브 스레드가 온다",
        inputSchema: {
            channelId: z.string().describe("포럼 채널 ID"),
            limit: z
                .number()
                .int()
                .min(1)
                .max(MAX_LIMIT)
                .optional()
                .describe(`반환할 스레드 수 (기본 ${DEFAULT_LIMIT}, 최대 ${MAX_LIMIT})`),
            includeArchived: z
                .boolean()
                .optional()
                .describe("아카이브된 스레드 포함 여부 (기본 true)"),
            archivedBefore: z
                .string()
                .optional()
                .describe("이 ISO 타임스탬프보다 이전에 아카이브된 스레드부터 가져온다. 이전 응답의 nextArchivedBefore를 그대로 넣으면 다음 페이지가 된다"),
        },
        outputSchema: outputShape,
        annotations: {
            readOnlyHint: true,
            openWorldHint: true,
        },
    }, async ({ channelId, limit = DEFAULT_LIMIT, includeArchived = true, archivedBefore }) => {
        await ensureDiscordReady();
        const channel = await discord.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildForum) {
            return {
                isError: true,
                content: [{ type: "text", text: "포럼 채널이 아닙니다." }],
            };
        }
        // archivedBefore로 페이지를 넘기는 중이면 활성 스레드는 이미 첫 페이지에서 봤으므로 건너뛴다.
        const paging = archivedBefore !== undefined;
        const active = paging ? [] : [...(await channel.threads.fetchActive()).threads.values()];
        let archived = [];
        let hasMoreArchived = false;
        if (includeArchived && active.length < limit) {
            const fetched = await channel.threads.fetchArchived({
                limit: limit - active.length,
                ...(archivedBefore ? { before: archivedBefore } : {}),
            });
            archived = [...fetched.threads.values()];
            hasMoreArchived = fetched.hasMore;
        }
        const selected = [...active, ...archived].slice(0, limit);
        // 원글 발췌는 스레드마다 API 호출이 하나씩 붙는다.
        // limit으로 개수를 제한하는 것이 응답 크기뿐 아니라 호출량 제어이기도 하다.
        const threads = await Promise.all(selected.map(async (t) => ({
            id: t.id,
            title: t.name,
            archived: t.archived ?? false,
            appliedTags: t.appliedTags,
            lastActivity: (t.archivedAt ?? t.createdAt)?.toISOString() ?? null,
            firstMessageExcerpt: await fetchFirstMessageExcerpt(t),
        })));
        // 다음 페이지 커서는 마지막으로 반환한 아카이브 스레드의 아카이브 시각이다.
        const lastArchived = [...selected].reverse().find((t) => t.archived);
        const nextArchivedBefore = hasMoreArchived && lastArchived?.archivedAt
            ? lastArchived.archivedAt.toISOString()
            : undefined;
        const result = {
            threads,
            hasMore: hasMoreArchived,
            ...(nextArchivedBefore ? { nextArchivedBefore } : {}),
        };
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            structuredContent: result,
        };
    });
}
