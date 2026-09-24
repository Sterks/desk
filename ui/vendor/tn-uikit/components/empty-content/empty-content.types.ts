export const emptyContentIconList = ["empty-list", "empty-alert", "empty-chat", "no-connection", "not-found", "no-access"] as const;

export type EmptyContentIcon = (typeof emptyContentIconList)[number];
