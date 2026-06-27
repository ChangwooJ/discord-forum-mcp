import { Client, GatewayIntentBits } from "discord.js";
export const discord = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
export async function loginDiscord() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        console.error("DISCORD_TOKEN 환경변수가 없습니다.");
        process.exit(1);
    }
    await discord.login(token);
    console.error(`Discord 로그인 성공: ${discord.user?.tag}`);
}
export function getUserToken() {
    const token = process.env.DISCORD_USER_TOKEN;
    if (!token)
        throw new Error("DISCORD_USER_TOKEN 환경변수가 없습니다.");
    return token;
}
