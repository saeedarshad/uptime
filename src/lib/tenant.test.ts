import { describe, it, expect, vi } from "vitest";
import { scopeDelegate } from "./tenant";

// A stand-in Prisma delegate that records the args it was called with.
function makeSpyDelegate() {
  const calls: Record<string, unknown> = {};
  const rec = (op: string) => (args?: unknown) => {
    calls[op] = args;
    return Promise.resolve({ op, args });
  };
  return {
    delegate: {
      findMany: rec("findMany"),
      findFirst: rec("findFirst"),
      count: rec("count"),
      aggregate: rec("aggregate"),
      groupBy: rec("groupBy"),
      create: rec("create"),
      createMany: rec("createMany"),
      update: rec("update"),
      updateMany: rec("updateMany"),
      delete: rec("delete"),
      deleteMany: rec("deleteMany"),
    },
    calls,
  };
}

describe("scopeDelegate", () => {
  const ORG = "org_A";

  it("injects orgId into where on reads", async () => {
    const { delegate, calls } = makeSpyDelegate();
    const scoped = scopeDelegate(delegate, ORG);

    await scoped.findMany({ where: { status: "open" } });
    expect(calls.findMany).toEqual({ where: { status: "open", orgId: ORG } });

    await scoped.findFirst({ where: { id: "x" } });
    expect(calls.findFirst).toEqual({ where: { id: "x", orgId: ORG } });
  });

  it("injects orgId even when no where is provided", async () => {
    const { delegate, calls } = makeSpyDelegate();
    const scoped = scopeDelegate(delegate, ORG);

    await scoped.findMany();
    expect(calls.findMany).toEqual({ where: { orgId: ORG } });

    await scoped.count();
    expect(calls.count).toEqual({ where: { orgId: ORG } });
  });

  it("cannot be tricked into a different org via where.orgId (scope wins)", async () => {
    const { delegate, calls } = makeSpyDelegate();
    const scoped = scopeDelegate(delegate, ORG);

    // Caller attempts to read another org; injected orgId overrides it.
    await scoped.findMany({ where: { orgId: "org_B" } });
    expect((calls.findMany as { where: { orgId: string } }).where.orgId).toBe(
      ORG,
    );
  });

  it("injects orgId into create data", async () => {
    const { delegate, calls } = makeSpyDelegate();
    const scoped = scopeDelegate(delegate, ORG);

    await scoped.create({ data: { name: "Lift" } });
    expect(calls.create).toEqual({ data: { name: "Lift", orgId: ORG } });
  });

  it("injects orgId into every row of createMany", async () => {
    const { delegate, calls } = makeSpyDelegate();
    const scoped = scopeDelegate(delegate, ORG);

    await scoped.createMany({ data: [{ name: "A" }, { name: "B" }] });
    expect(calls.createMany).toEqual({
      data: [
        { name: "A", orgId: ORG },
        { name: "B", orgId: ORG },
      ],
    });
  });

  it("injects orgId into where on update/delete/updateMany/deleteMany", async () => {
    const { delegate, calls } = makeSpyDelegate();
    const scoped = scopeDelegate(delegate, ORG);

    await scoped.update({ where: { id: "1" }, data: { name: "x" } });
    expect((calls.update as { where: { orgId: string } }).where.orgId).toBe(ORG);

    await scoped.delete({ where: { id: "1" } });
    expect((calls.delete as { where: { orgId: string } }).where.orgId).toBe(ORG);

    await scoped.updateMany({ data: { status: "retired" } });
    expect(
      (calls.updateMany as { where: { orgId: string } }).where.orgId,
    ).toBe(ORG);

    await scoped.deleteMany();
    expect(
      (calls.deleteMany as { where: { orgId: string } }).where.orgId,
    ).toBe(ORG);
  });

  it("does not mutate the caller's original args object", async () => {
    const { delegate } = makeSpyDelegate();
    const scoped = scopeDelegate(delegate, ORG);
    const original = { where: { status: "open" } };
    await scoped.findMany(original);
    expect(original).toEqual({ where: { status: "open" } });
  });
});
