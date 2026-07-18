import { prisma } from "./prisma";

/**
 * Org-scoping helper.
 *
 * Multi-tenant safety rule: every query against a tenant-owned table MUST be
 * filtered by `orgId`. Rather than trust callers to remember, we wrap each
 * org-owned Prisma delegate so that `orgId` is injected automatically into
 * every `where` clause and every `create`/`update` payload. The raw
 * `prisma.*` delegates are never exposed through this surface, so it is
 * impossible to run an unscoped query by going through `tenantDb(orgId)`.
 *
 * The public method signatures are the delegate's own (via `Pick`), so full
 * Prisma typing and payload inference are preserved. The only casts are the
 * localized `as` on each wrapped method — there is no `any` in the surface.
 */

type WhereArgs = { where?: Record<string, unknown> } & Record<string, unknown>;
type DataArgs = { data?: unknown } & Record<string, unknown>;

// The "any function" supertype: every Prisma delegate method is assignable to
// this (bottom-typed rest params + unknown return), so it works as a generic
// constraint without widening the exposed types.
type AnyFn = (...args: never[]) => unknown;

// The subset of delegate operations we scope. Every Prisma model delegate
// structurally satisfies this. The exposed type below re-narrows to the
// concrete delegate so callers keep full Prisma typing and payload inference.
interface ScopableDelegate {
  findMany: AnyFn;
  findFirst: AnyFn;
  count: AnyFn;
  aggregate: AnyFn;
  groupBy: AnyFn;
  create: AnyFn;
  createMany: AnyFn;
  update: AnyFn;
  updateMany: AnyFn;
  delete: AnyFn;
  deleteMany: AnyFn;
}

type ReadOps =
  | "findMany"
  | "findFirst"
  | "count"
  | "aggregate"
  | "groupBy"
  | "update"
  | "updateMany"
  | "delete"
  | "deleteMany";

type ScopedOps = ReadOps | "create" | "createMany";

// Strip `orgId` from create payloads: callers must not (and cannot) set it —
// the scope injects it. Distributes over XOR/union input shapes.
type StripOrgId<T> = T extends unknown ? Omit<T, "orgId"> : never;
type DataOrgOptional<A> = A extends { data: infer D }
  ? Omit<A, "data"> & {
      data: D extends readonly (infer E)[] ? StripOrgId<E>[] : StripOrgId<D>;
    }
  : A;

type ScopedCreate<D extends ScopableDelegate> = (
  args: DataOrgOptional<NonNullable<Parameters<D["create"]>[0]>>,
) => ReturnType<D["create"]>;
type ScopedCreateMany<D extends ScopableDelegate> = (
  args: DataOrgOptional<NonNullable<Parameters<D["createMany"]>[0]>>,
) => ReturnType<D["createMany"]>;

type Scoped<D extends ScopableDelegate> = Pick<D, ReadOps> & {
  create: ScopedCreate<D>;
  createMany: ScopedCreateMany<D>;
};

function mergeWhere(args: unknown, orgId: string): WhereArgs {
  const a = (args ?? {}) as WhereArgs;
  return { ...a, where: { ...(a.where ?? {}), orgId } };
}

function mergeData(args: unknown, orgId: string): DataArgs {
  const a = (args ?? {}) as DataArgs;
  const data = a.data;
  if (Array.isArray(data)) {
    return {
      ...a,
      data: data.map((row) => ({ ...(row as Record<string, unknown>), orgId })),
    };
  }
  return { ...a, data: { ...((data ?? {}) as Record<string, unknown>), orgId } };
}

// A view of the delegate whose methods accept our merged args. This is the one
// sanctioned cast: Prisma's per-op generic overloads can't be invoked with a
// dynamically-built object without it. The public return type stays precise.
type CallableDelegate = Record<ScopedOps, (args: unknown) => unknown>;

/** Wrap a single Prisma delegate so every operation is scoped to `orgId`. */
export function scopeDelegate<D extends ScopableDelegate>(
  delegate: D,
  orgId: string,
): Scoped<D> {
  const d = delegate as unknown as CallableDelegate;
  return {
    findMany: ((args?: unknown) =>
      d.findMany(mergeWhere(args, orgId))) as D["findMany"],
    findFirst: ((args?: unknown) =>
      d.findFirst(mergeWhere(args, orgId))) as D["findFirst"],
    count: ((args?: unknown) =>
      d.count(mergeWhere(args, orgId))) as D["count"],
    aggregate: ((args: unknown) =>
      d.aggregate(mergeWhere(args, orgId))) as D["aggregate"],
    groupBy: ((args: unknown) =>
      d.groupBy(mergeWhere(args, orgId))) as D["groupBy"],
    create: ((args: unknown) =>
      d.create(mergeData(args, orgId))) as ScopedCreate<D>,
    createMany: ((args: unknown) =>
      d.createMany(mergeData(args, orgId))) as ScopedCreateMany<D>,
    update: ((args: unknown) =>
      d.update(mergeWhere(args, orgId))) as D["update"],
    updateMany: ((args: unknown) =>
      d.updateMany(mergeWhere(args, orgId))) as D["updateMany"],
    delete: ((args: unknown) =>
      d.delete(mergeWhere(args, orgId))) as D["delete"],
    deleteMany: ((args?: unknown) =>
      d.deleteMany(mergeWhere(args, orgId))) as D["deleteMany"],
  };
}

/**
 * Returns a set of Prisma delegates all pre-scoped to `orgId`. Use this for
 * every tenant-owned read and write. Tables without an `orgId` column
 * (WorkOrderPhoto, MeterReading, AssetDocument, Session) are reached through
 * their parent relation and are intentionally absent here.
 */
export function tenantDb(orgId: string) {
  return {
    orgId,
    user: scopeDelegate(prisma.user, orgId),
    asset: scopeDelegate(prisma.asset, orgId),
    workOrder: scopeDelegate(prisma.workOrder, orgId),
    pmSchedule: scopeDelegate(prisma.pMSchedule, orgId),
    pmTask: scopeDelegate(prisma.pMTask, orgId),
    insight: scopeDelegate(prisma.insight, orgId),
    activityLog: scopeDelegate(prisma.activityLog, orgId),
    invite: scopeDelegate(prisma.invite, orgId),
    subscriptionPayment: scopeDelegate(prisma.subscriptionPayment, orgId),
  };
}

export type TenantDb = ReturnType<typeof tenantDb>;
