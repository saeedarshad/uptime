import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { tenantDb } from "../src/lib/tenant";
import { getPublicAsset } from "../src/lib/publicAsset";

// Proves multi-tenant isolation: org A cannot read or mutate org B's asset —
// not by id, not by the public slug — through the org-scoped API surface.

const SLUG_A = "iso-test-org-a";
const SLUG_B = "iso-test-org-b";

let orgAId = "";
let orgBId = "";
let assetBId = "";
let assetBPublicId = "";
let woBId = "";

async function makeOrg(slug: string, name: string) {
  return prisma.organization.create({ data: { name, slug } });
}

beforeAll(async () => {
  for (const slug of [SLUG_A, SLUG_B]) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) await prisma.organization.delete({ where: { id: existing.id } });
  }
  const orgA = await makeOrg(SLUG_A, "Iso Org A");
  const orgB = await makeOrg(SLUG_B, "Iso Org B");
  orgAId = orgA.id;
  orgBId = orgB.id;

  const assetB = await prisma.asset.create({
    data: {
      orgId: orgB.id,
      publicId: "isotestpub1",
      name: "Org B Secret Lift",
    },
  });
  assetBId = assetB.id;
  assetBPublicId = assetB.publicId;

  const woB = await prisma.workOrder.create({
    data: {
      orgId: orgB.id,
      assetId: assetB.id,
      number: 1,
      title: "Org B work order",
      reportedByName: "B tech",
    },
  });
  woBId = woB.id;

  // Give org A one asset of its own so findMany has a baseline.
  await prisma.asset.create({
    data: { orgId: orgA.id, publicId: "isotestpub2", name: "Org A Lift" },
  });
});

afterAll(async () => {
  await prisma.organization
    .deleteMany({ where: { slug: { in: [SLUG_A, SLUG_B] } } })
    .catch(() => undefined);
  await prisma.$disconnect();
});

describe("tenant isolation", () => {
  it("org A cannot read org B's asset by id", async () => {
    const found = await tenantDb(orgAId).asset.findFirst({
      where: { id: assetBId },
    });
    expect(found).toBeNull();
  });

  it("org A cannot read org B's asset by its public slug through the scoped API", async () => {
    const found = await tenantDb(orgAId).asset.findFirst({
      where: { publicId: assetBPublicId },
    });
    expect(found).toBeNull();
  });

  it("org A's asset list contains only its own assets", async () => {
    const assets = await tenantDb(orgAId).asset.findMany();
    expect(assets.every((a) => a.orgId === orgAId)).toBe(true);
    expect(assets.some((a) => a.id === assetBId)).toBe(false);
  });

  it("org A cannot read org B's work order", async () => {
    const wo = await tenantDb(orgAId).workOrder.findFirst({
      where: { id: woBId },
    });
    expect(wo).toBeNull();
  });

  it("org A cannot mutate org B's asset (updateMany matches nothing)", async () => {
    const res = await tenantDb(orgAId).asset.updateMany({
      where: { id: assetBId },
      data: { name: "HACKED" },
    });
    expect(res.count).toBe(0);
    const untouched = await prisma.asset.findUnique({ where: { id: assetBId } });
    expect(untouched?.name).toBe("Org B Secret Lift");
  });

  it("org B can read its own asset (scoping is not over-broad)", async () => {
    const found = await tenantDb(orgBId).asset.findFirst({
      where: { id: assetBId },
    });
    expect(found?.id).toBe(assetBId);
  });

  it("the public slug endpoint is deliberately public (unguessable), independent of org", async () => {
    // The QR flow resolves by unguessable publicId and is not org-scoped by
    // design; the protection above is that the authenticated API never leaks
    // another org's data.
    const asset = await getPublicAsset(assetBPublicId);
    expect(asset?.id).toBe(assetBId);
  });
});
