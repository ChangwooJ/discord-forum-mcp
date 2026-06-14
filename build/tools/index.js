import { registerListForumThreads } from "./list-forum-threads.js";
import { registerGetForumTags } from "./get-forum-tags.js";
import { registerReadMessages } from "./read-messages.js";
import { registerSendMessage } from "./send-message.js";
export function registerAllTools(server) {
    registerListForumThreads(server);
    registerGetForumTags(server);
    registerReadMessages(server);
    registerSendMessage(server);
}
