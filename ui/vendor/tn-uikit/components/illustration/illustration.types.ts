export const illustrationList = [
  "lists",
  "warning",
  "disconnect",
  "block",
  "dialog",
  "user",
  "time-1",
  "reload",
  "search",
  "document",
  "dnt-load-image",
  "plane-table",
  "notification",
  "map-illustration",
  "affiche",
  "map-build",
  "robot",
  "achievement",
  "calendar-progress",
  "task",
  "empty",
  "balloons"
] as const;

export type IllustrationType = (typeof illustrationList)[number];
