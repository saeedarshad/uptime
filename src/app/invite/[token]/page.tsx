import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AcceptForm } from "./AcceptForm";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.invite.findUnique({
    where: { token: params.token },
    include: { org: { select: { name: true } } },
  });
  if (!invite) notFound();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-safety/10 blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-safety to-safety/80 text-xl font-black text-white shadow-card ring-1 ring-white/20">
            U
          </div>
          <span className="text-2xl font-bold tracking-tight text-content">
            UptimeHQ
          </span>
        </div>
        <div className="card p-7 sm:p-8">
          {invite.acceptedAt ? (
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-content">
                Invite already used
              </h1>
              <p className="mt-2 text-sm text-content/60">
                This invite has already been accepted. Try signing in instead.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold tracking-tight text-content">
                Join {invite.org.name}
              </h1>
              <p className="mb-6 mt-1 text-sm text-content/60">
                You&apos;ve been invited as <strong>{invite.name}</strong> (
                {invite.role}). Set a password to get started.
              </p>
              <AcceptForm token={invite.token} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
