import { Client, GatewayIntentBits } from "discord.js";

export const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let loginPromise: Promise<Client> | null = null;

async function login(): Promise<Client> {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    throw new Error(
      "DISCORD_TOKEN 환경변수가 없습니다. MCP 설정의 env 블록에 넣거나 실행 디렉토리에 .env.discord 파일을 두세요."
    );
  }
  await discord.login(token);
  console.error(`Discord 로그인 성공: ${discord.user?.tag}`);
  return discord;
}

/**
 * 디스코드 로그인이 끝날 때까지 기다린다.
 *
 * 로그인은 MCP 핸드셰이크를 막지 않도록 백그라운드로 시작되므로,
 * 봇 클라이언트를 쓰는 도구는 반드시 이 함수를 먼저 await 해야 한다.
 * 실패한 시도는 캐시하지 않아 다음 호출에서 다시 시도한다.
 */
export function ensureDiscordReady(): Promise<Client> {
  if (!loginPromise) {
    loginPromise = login().catch((err) => {
      loginPromise = null;
      throw err;
    });
  }
  return loginPromise;
}

export function getUserToken(): string {
  const token = process.env.DISCORD_USER_TOKEN;
  if (!token) throw new Error("DISCORD_USER_TOKEN 환경변수가 없습니다.");
  return token;
}
