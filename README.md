# discord-forum-mcp

Discord 포럼 채널 워크플로우를 위한 경량 MCP 서버.

범용 Discord MCP 서버와 달리 포럼 글 조회→읽기→댓글→아카이브 워크플로우에 필요한 도구만 담습니다.

## 도구 목록

| 도구 | 설명 |
|------|------|
| `list_forum_threads` | 포럼 채널의 활성/아카이브 스레드 목록 조회 |
| `get_forum_tags` | 포럼 채널에 정의된 태그 목록(이름↔ID) 조회 |
| `read_messages` | 스레드의 메시지(원글+댓글) 읽기 |
| `send_message` | 스레드에 메시지 게시 |
| `update_forum_post` | 스레드의 아카이브 상태 또는 태그 변경 |

### list_forum_threads

**입력**
- `channelId` (string) — 포럼 채널 ID

**반환**
```json
[
  {
    "id": "1514933753422680165",
    "title": "회원 탈퇴 API 구현",
    "archived": false,
    "appliedTags": ["1514867292918513735"],
    "lastActivity": "2025-06-14T00:00:00.000Z"
  }
]
```

### get_forum_tags

`list_forum_threads`의 `appliedTags` ID를 이름으로 해석할 때 사용합니다.

**입력**
- `channelId` (string) — 포럼 채널 ID

**반환**
```json
[
  { "id": "1514867265571389561", "name": "완료" },
  { "id": "1514867292918513735", "name": "진행중" }
]
```

### read_messages

**입력**
- `channelId` (string) — 스레드 ID
- `limit` (number, 선택) — 가져올 메시지 수 (기본 50, 최대 100)

**반환**
```json
[
  {
    "id": "1514933753422680166",
    "author": "username#0000",
    "content": "메시지 내용",
    "createdAt": "2025-06-14T00:00:00.000Z"
  }
]
```

### send_message

**입력**
- `channelId` (string) — 스레드 ID
- `message` (string) — 게시할 메시지 내용

**반환**
```json
{ "id": "1514933753422680167", "createdAt": "2025-06-14T00:00:00.000Z" }
```

### update_forum_post

`archived`와 `appliedTags`는 독립적으로 사용할 수 있습니다.

**입력**
- `threadId` (string) — 스레드 ID
- `archived` (boolean, 선택) — `true`로 아카이브, `false`로 복원
- `appliedTags` (string[], 선택) — 적용할 태그 ID 목록

**반환**
```json
{
  "id": "1514933753422680165",
  "archived": true,
  "appliedTags": ["1514867265571389561"]
}
```

## 사전 요구사항: Discord 봇 설정

[Discord Developer Portal](https://discord.com/developers/applications)에서 봇을 생성하고 아래를 적용합니다.

**Privileged Gateway Intents (Bot 탭)**
- Server Members Intent
- Message Content Intent

**봇 권한**
- 채널 보기
- 메시지 보내기 / 스레드에 메시지 보내기
- 메시지 기록 읽기
- Manage Threads (아카이브·태그 변경용)

## 클라이언트 설정

`DISCORD_TOKEN`에 봇 토큰을 넣으면 됩니다.

### Claude Code

프로젝트 루트의 `.mcp.json`:

```json
{
  "mcpServers": {
    "discord-forum-mcp": {
      "command": "npx",
      "args": ["-y", "discord-forum-mcp"],
      "env": {
        "DISCORD_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 또는
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "discord-forum-mcp": {
      "command": "npx",
      "args": ["-y", "discord-forum-mcp"],
      "env": {
        "DISCORD_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "discord-forum-mcp": {
      "command": "npx",
      "args": ["-y", "discord-forum-mcp"],
      "env": {
        "DISCORD_TOKEN": "your_bot_token_here"
      }
    }
  }
}
```

> **Windows 사용자**: `command`를 `"cmd"`, `args` 첫 번째 요소를 `"/c"`로 변경하고 나머지를 이어붙입니다.
> ```json
> { "command": "cmd", "args": ["/c", "npx", "-y", "discord-forum-mcp"] }
> ```
