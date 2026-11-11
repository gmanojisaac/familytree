import { Prisma } from "@/generated/prisma/client";
import { auth } from "./auth";
import { db } from "./db";
import { requireThat } from "./http";

export type Actor = { accountId: string; personId: string; isChild: boolean; moderator: boolean; sessionId: string; adultVerified: boolean };
export async function actorFrom(headers: Headers): Promise<Actor> {
  const session = await auth.api.getSession({ headers });
  requireThat(session, 401, "Sign in to enter your private grove.");
  const record = await db.session.findUnique({ where: { id: session.session.id }, include: { user: { include: { person: true } } } });
  requireThat(record && record.expiresAt > new Date(), 401, "Your session has ended.");
  requireThat(record.user.emailVerified, 403, "Verify your email before entering.");
  let person = record.user.person;
  if (!person) person = await db.person.create({ data: { accountId: record.userId, displayName: "New family member", privacy: { create: {} }, notification: { create: {} } } });
  requireThat(!person.deceased, 403, "This account is in memorial mode. Contact your designated steward.");
  if (record.activeChildId) {
    const consent = await db.guardianConsent.findUnique({ where: { guardianAccountId_childPersonId: { guardianAccountId: record.userId, childPersonId: record.activeChildId } }, include: { child: true } });
    requireThat(consent?.explore, 403, "Your guardian has paused this child view.");
    return { accountId: record.userId, personId: consent.childPersonId, isChild: true, moderator: false, sessionId: record.id, adultVerified: false };
  }
  return { accountId: record.userId, personId: person.id, isChild: false, moderator: record.user.role === "MODERATOR", sessionId: record.id, adultVerified: record.user.adultVerified };
}
export function adult(actor: Actor) { requireThat(!actor.isChild && actor.adultVerified, 403, "A verified adult account is required."); }
export async function treeAccess(actor: Actor, treeId: string, steward = false) {
  if (actor.isChild) {
    requireThat(!steward);
    requireThat(await db.personTreeVisibility.findFirst({ where: { personId: actor.personId, treeId, sourceLinkId: null } }));
    return;
  }
  const membership = await db.treeMembership.findUnique({ where: { accountId_treeId: { accountId: actor.accountId, treeId } } });
  requireThat(membership && (!steward || membership.role === "STEWARD"));
}
export async function allowedPeople(actor: Actor) {
  const treeIds = actor.isChild
    ? (await db.personTreeVisibility.findMany({ where: { personId: actor.personId, sourceLinkId: null } })).map(v => v.treeId)
    : (await db.treeMembership.findMany({ where: { accountId: actor.accountId } })).map(m => m.treeId);
  const rows = await db.personTreeVisibility.findMany({
    where: { treeId: { in: treeIds }, ...(actor.isChild ? { sourceLinkId: null } : {}) },
    include: { person: { include: { privacy: true, notification: true } }, sourceLink: true }
  });
  return [...new Map(rows.filter(r => !r.sourceLinkId || (r.sourceLink?.status === "APPROVED" && r.person.privacy?.allowLinked && !r.person.isMinor))
    .map(r => [r.personId, r.person])).values()];
}
export async function personAccess(actor: Actor, personId: string) {
  const person = (await allowedPeople(actor)).find(p => p.id === personId);
  requireThat(person, 404, "This person is unavailable.");
  return person;
}
export async function childVoiceAllowed(actor: Actor) {
  if (!actor.isChild) return true;
  return !!(await db.guardianConsent.findUnique({ where: { guardianAccountId_childPersonId: { guardianAccountId: actor.accountId, childPersonId: actor.personId } } }))?.voice;
}
export async function audit(actor: Actor, action: string, subjectId: string) {
  await db.auditLog.create({ data: { actorAccountId: actor.accountId, action, subjectId } });
}
export async function limit(actor: Actor, action: string, max = 10) {
  const key = actor.accountId + ":" + action;
  // Atomic upsert: counters are shared across all server instances.
  const schema=new URL(process.env.DATABASE_URL!).searchParams.get("schema")??"public";requireThat(/^[a-z_][a-z0-9_]*$/i.test(schema),500,"Invalid database schema configuration.");const table=Prisma.raw("\""+schema+"\".\"ActionLimit\"");
  const result = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO ${table} AS counter ("key", "window", "count") VALUES (${key}, NOW(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN counter."window" < NOW() - INTERVAL '1 hour' THEN 1 ELSE counter."count" + 1 END,
      "window" = CASE WHEN counter."window" < NOW() - INTERVAL '1 hour' THEN NOW() ELSE counter."window" END
    RETURNING "count"`;
  requireThat(result[0].count <= max, 429, "Please wait before trying again. The hourly limit has been reached.");
}
