import { prisma } from "./prisma";

/** Append to the org's activity feed. Never throws into the caller path. */
export async function logActivity(args: {
  orgId: string;
  actorName: string;
  verb: string;
  subject: string;
}): Promise<void> {
  await prisma.activityLog
    .create({ data: args })
    .catch((err) => console.error("[activity] failed to log", err));
}
