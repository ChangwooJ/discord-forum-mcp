import { registerListForumThreads } from "./list-forum-threads.js";
import { registerGetForumTags } from "./get-forum-tags.js";
export function registerAllTools(server) {
    registerListForumThreads(server);
    registerGetForumTags(server);
}
