# 변경 이력

## 2.0.0

### 호환성이 깨지는 변경

- **`list_forum_threads`의 반환이 배열에서 객체로 바뀌었습니다.**
  기존 `[{...}]` → 현재 `{ threads: [...], hasMore, nextArchivedBefore }`
- **`list_forum_threads`가 기본적으로 25개만 반환합니다.** 기존에는 활성+아카이브
  스레드를 전부 반환했습니다. 전부 필요하면 `hasMore`가 `false`가 될 때까지
  `nextArchivedBefore`를 `archivedBefore`에 넣어 이어서 호출하세요.
- **`lastActivity`가 항상 ISO 8601 문자열입니다.** 기존에는 아카이브 스레드는
  숫자 타임스탬프, 활성 스레드는 ISO 문자열이라 타입이 섞여 있었습니다.
- **`read_messages`의 `limit`이 1~100으로 검증됩니다.** 기존에는 검증이 없어
  100을 넘기면 Discord API가 거부했습니다.

### 추가

- `create_forum_post` — 포럼 채널에 새 글을 작성합니다. 태그를 ID(`appliedTags`)
  또는 이름(`tagNames`)으로 지정할 수 있고, 태그가 필수인 포럼은 미리 안내합니다.
- `list_forum_threads`에 페이지네이션(`limit`, `includeArchived`, `archivedBefore`) 추가
- 모든 도구에 MCP tool annotations 추가. 조회 계열은 `readOnlyHint: true`라
  지원하는 클라이언트에서 매번 승인을 묻지 않게 설정할 수 있습니다.
- 모든 도구에 `outputSchema`와 `structuredContent` 추가. 응답을 텍스트 파싱 없이
  구조화된 데이터로 받을 수 있습니다.

### 수정

- **디스코드 로그인이 MCP 핸드셰이크를 막지 않습니다.** 기존에는 로그인을 끝낸
  뒤에야 `connect()`에 도달해서, 게이트웨이가 느리거나 토큰이 잘못되면 클라이언트가
  `initialize` 응답을 받지 못하고 원인 불명의 타임아웃으로 서버를 종료시켰습니다.
- 토큰이 없어도 서버가 죽지 않고, 도구 호출 시 원인을 안내하며 재시도합니다.
- SIGINT/SIGTERM에서 게이트웨이 연결을 정리합니다.
- 서버가 보고하는 버전을 `package.json`에서 읽습니다. 기존에는 하드코딩이라
  실제 배포 버전과 어긋나 있었습니다.

## 1.2.0

- `create_forum_post` 최초 추가 (2.0.0에서 이어짐)
- npm에만 배포돼 있고 저장소에서 유실됐던 `.env.discord` 자동 로드와
  `list_forum_threads`의 `firstMessageExcerpt` 복원
- GitHub Actions Trusted Publishing(OIDC) 배포 파이프라인 도입
