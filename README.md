# discord-forum-mcp

Discord 포럼 채널 워크플로우를 위한 경량 MCP 서버.

범용 Discord MCP 서버와 달리 포럼 글 작성→조회→읽기→댓글→아카이브 워크플로우에 필요한 도구만 담습니다.

## 도구 목록

| 도구 | 설명 |
|------|------|
| `list_forum_threads` | 포럼 채널의 활성/아카이브 스레드 목록 조회 |
| `get_forum_tags` | 포럼 채널에 정의된 태그 목록(이름↔ID) 조회 |
| `read_messages` | 스레드의 메시지(원글+댓글) 읽기 |
| `create_forum_post` | 포럼 채널에 새 글(스레드) 작성 (태그 지정 가능) |
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
    "lastActivity": "2025-06-14T00:00:00.000Z",
    "firstMessageExcerpt": "탈퇴 시 개인정보 즉시 파기 여부부터 정해야 합니다…"
  }
]
```

`firstMessageExcerpt`는 원글 본문을 한 줄로 정리한 140자 발췌입니다. 원글을 못 가져오면 빈 문자열이 됩니다.

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

### create_forum_post

포럼 채널에 새 글을 작성합니다. 포럼 글은 "제목 + 첫 게시글 + 태그"로 구성되므로 `title`과 `message`가 모두 필수입니다.

태그는 ID(`appliedTags`)로 직접 주거나 이름(`tagNames`)으로 줄 수 있으며, 이름은 서버에서 ID로 변환됩니다. 둘 다 주면 합쳐서 적용합니다. 존재하지 않는 태그를 주면 사용 가능한 태그 목록과 함께 오류를 반환하고, 태그가 필수(Require Tag)인 포럼에 태그 없이 요청하면 마찬가지로 안내합니다.

**입력**
- `channelId` (string) — 포럼 채널 ID
- `title` (string) — 글 제목 (1~100자)
- `message` (string) — 첫 게시글 본문 (1~2000자)
- `appliedTags` (string[], 선택) — 적용할 태그 ID 목록
- `tagNames` (string[], 선택) — 적용할 태그 이름 목록 (대소문자 무시)
- `autoArchiveDuration` (60 | 1440 | 4320 | 10080, 선택) — 자동 아카이브까지의 시간(분)

**반환**
```json
{
  "id": "1514933753422680165",
  "title": "회원 탈퇴 API 구현",
  "appliedTags": ["1514867292918513735"],
  "appliedTagNames": ["진행중"],
  "firstMessageId": "1514933753422680165",
  "createdAt": "2025-06-14T00:00:00.000Z"
}
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
- 공개 스레드 만들기 (포럼 글 작성용)
- Manage Threads (아카이브·태그 변경용)

## 클라이언트 설정

- `DISCORD_TOKEN` — 봇 토큰. 조회 계열 도구(`list_forum_threads`, `get_forum_tags`, `read_messages`)와 태그 검증에 사용합니다.
- `DISCORD_USER_TOKEN` — 유저 토큰. 쓰기 계열 도구(`create_forum_post`, `send_message`, `update_forum_post`)가 봇이 아닌 본인 계정으로 글을 남기기 위해 사용합니다.

아래 예시처럼 MCP 설정의 `env` 블록에 넣어도 되고,
**실행 디렉토리(루트)에 `.env.discord` 파일을 두면 서버가 시작 시 자동으로 읽습니다.**

```
# .env.discord
DISCORD_TOKEN=your_bot_token_here
DISCORD_USER_TOKEN=your_user_token_here
```

### Claude Code

프로젝트 루트의 `.mcp.json`:

```json
{
  "mcpServers": {
    "discord-forum-mcp": {
      "command": "npx",
      "args": ["-y", "discord-forum-mcp"],
      "env": {
        "DISCORD_TOKEN": "your_bot_token_here",
        "DISCORD_USER_TOKEN": "your_user_token_here"
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
        "DISCORD_TOKEN": "your_bot_token_here",
        "DISCORD_USER_TOKEN": "your_user_token_here"
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
        "DISCORD_TOKEN": "your_bot_token_here",
        "DISCORD_USER_TOKEN": "your_user_token_here"
      }
    }
  }
}
```

> **Windows 사용자**: `command`를 `"cmd"`, `args` 첫 번째 요소를 `"/c"`로 변경하고 나머지를 이어붙입니다.
> ```json
> { "command": "cmd", "args": ["/c", "npx", "-y", "discord-forum-mcp"] }
> ```
