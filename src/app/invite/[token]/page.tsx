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
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-safety text-lg font-bold text-white">
            U
          </div>
          <span className="text-xl font-bold tracking-tight text-graphite">
            UptimeHQ
          </span>
        </div>
        <div className="card p-6">
          {invite.acceptedAt ? (
            <div className="text-center">
              <h1 className="text-lg font-bold text-graphite">
                Invite already used
              </h1>
              <p className="mt-2 text-sm text-graphite/60">
                This invite has already been accepted. Try signing in instead.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-bold text-graphite">
                Join {invite.org.name}
              </h1>
              <p className="mb-5 text-sm text-graphite/60">
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
