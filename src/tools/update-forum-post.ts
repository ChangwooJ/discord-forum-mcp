import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getUserToken } from "../discord.js";

const outputShape = {
  id: z.string(),
  archived: z.boolean().optional(),
  appliedTags: z.array(z.string()).optional(),
};

export function registerUpdateForumPost(server: McpServer) {
  server.registerTool(
    "update_forum_post",
    {
      title: "포럼 글 상태 변경",
      description: "포럼 글(스레드)의 아카이브 상태 또는 적용 태그를 변경한다",
      inputSchema: {
        threadId: z.string().describe("스레드 ID"),
        archived: z.boolean().optional().describe("아카이브 여부"),
        appliedTags: z
          .array(z.string())
          .optional()
          .describe("적용할 태그 ID 목록. 기존 태그를 덮어쓴다"),
      },
      outputSchema: outputShape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true, // appliedTags는 기존 태그를 덮어쓴다
        idempotentHint: true, // 같은 인자로 다시 불러도 결과 상태가 같다
        openWorldHint: true,
      },
    },
    async ({ threadId, archived, appliedTags }) => {
      let token: string;
      try {
        token = getUserToken();
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: String(e) }] };
      }

      const body: Record<string, unknown> = {};
      if (archived !== undefined) body.archived = archived;
      if (appliedTags !== undefined) body.applied_tags = appliedTags;

      const res = await fetch(`https://discord.com/api/v10/channels/${threadId}`, {
        method: "PATCH",
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

      const channel = (await res.json()) as {
        id: string;
        thread_metadata?: { archived: boolean };
        applied_tags?: string[];
      };
      const result = {
        id: channel.id,
        archived: channel.thread_metadata?.archived,
        appliedTags: channel.applied_tags,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result,
      };
    }
  );
}
