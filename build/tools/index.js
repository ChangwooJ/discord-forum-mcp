import { registerListForumThreads } from "./list-forum-threads.js";
import { registerGetForumTags } from "./get-forum-tags.js";
import { registerReadMessages } from "./read-messages.js";
import { registerCreateForumPost } from "./create-forum-post.js";
import { registerSendMessage } from "./send-message.js";
import { registerUpdateForumPost } from "./update-forum-post.js";
export function registerAllTools(server) {
    registerListForumThreads(server);
    registerGetForumTags(server);
    registerReadMessages(server);
    registerCreateForumPost(server);
    registerSendMessage(server);
    registerUpdateForumPost(server);
}
