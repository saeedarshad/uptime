import { requireManager } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { appUrl } from "@/lib/qr";
import { PageHeader, Badge } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import {
  ProfileForm,
  PinForm,
  ChipsForm,
  InviteForm,
} from "./SettingsForms";
import { revokeInvite } from "./actions";

export default async function SettingsPage() {
  const { org } = await requireManager();
  const td = tenantDb(org.id);
  const [users, invites] = await Promise.all([
    td.user.findMany({ orderBy: { name: "asc" } }),
    td.invite.findMany({
      where: { acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Your org profile, labor rate, PIN, symptom chips and team."
      />
      <div className="space-y-6">
        <ProfileForm
          org={{
            name: org.name,
            city: org.city,
            timezone: org.timezone,
            businessType: org.businessType,
            laborRateCents: org.laborRateCents,
          }}
        />
        <PinForm pinEnabled={!!org.pinCode} />
        <ChipsForm chips={org.symptomChips} />

        <div className="card p-6">
          <h2 className="text-base font-semibold text-graphite">Team</h2>
          <p className="mb-4 mt-1 text-sm text-graphite/60">
            Unlimited users on every plan. Invite by email — they set a password
            from the link, no verification hoops.
          </p>

          <div className="mb-6 divide-y divide-graphite/5">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-graphite">{u.name}</span>
                  <span className="ml-2 text-graphite/50">{u.email}</span>
                </div>
                <Badge tone={u.role === "tech" ? "muted" : "info"}>
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>

          <InviteForm />

          {invites.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-graphite/70">
                Pending invites
              </h3>
              <div className="divide-y divide-graphite/5">
                {invites.map((inv) => {
                  const link = `${appUrl()}/invite/${inv.token}`;
                  const revoke = revokeInvite.bind(null, inv.id);
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <div>
                        <span className="font-medium text-graphite">
                          {inv.name}
                        </span>
                        <span className="ml-2 text-graphite/50">
                          {inv.email} · {inv.role}
                        </span>
                        <div className="mt-0.5 break-all font-mono text-xs text-graphite/40">
                          {link}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <CopyButton value={link} />
                        <form action={revoke}>
                          <button className="btn-ghost text-xs text-danger/80">
                            Revoke
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
