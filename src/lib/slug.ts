import { prisma } from "./prisma";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  );
}

/** Generate a unique org slug, appending a counter on collision. */
export async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let n = 1;
  // Small orgs table; linear probing is fine.
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
