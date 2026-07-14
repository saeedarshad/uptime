import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { PageHeader, Badge, EmptyState, LinkButton } from "@/components/ui";
import { LogDoneForm } from "./LogDoneForm";

type TaskWithRel = Awaited<ReturnType<typeof loadTasks>>[number];

async function loadTasks(orgId: string) {
  return prisma.pMTask.findMany({
    where: { orgId, status: { in: ["upcoming", "due", "overdue"] } },
    include: {
      schedule: {
        select: {
          taskName: true,
          triggerType: true,
          meterUnitLabel: true,
          asset: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ dueAt: "asc" }],
  });
}

export default async function SchedulePage() {
  const { org, user } = await requireAuth();
  const tasks = await loadTasks(org.id);

  const groups = {
    overdue: tasks.filter((t) => t.status === "overdue"),
    due: tasks.filter((t) => t.status === "due"),
    upcoming: tasks.filter((t) => t.status === "upcoming"),
  };

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Preventive maintenance, grouped by what's due."
        action={<LinkButton href="/schedule/new">New schedule</LinkButton>}
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No maintenance scheduled"
          body="Set up recurring tasks so nothing slips — oil changes, safety checks, calibrations."
          action={<LinkButton href="/schedule/new">Add a schedule</LinkButton>}
        />
      ) : (
        <div className="space-y-8">
          <Group
            title="Overdue"
            tone="danger"
            tasks={groups.overdue}
            tz={org.timezone}
            userName={user.name}
          />
          <Group
            title="Due this week"
            tone="warn"
            tasks={groups.due}
            tz={org.timezone}
            userName={user.name}
          />
          <Group
            title="Upcoming"
            tone="muted"
            tasks={groups.upcoming}
            tz={org.timezone}
            userName={user.name}
          />
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  tone,
  tasks,
  tz,
  userName,
}: {
  title: string;
  tone: "danger" | "warn" | "muted";
  tasks: TaskWithRel[];
  tz: string;
  userName: string;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-graphite/60">
          {title}
        </h2>
        <Badge tone={tone}>{tasks.length}</Badge>
      </div>
      <div className="space-y-3">
        {tasks.map((t) => {
          const due =
            t.schedule.triggerType === "time"
              ? t.dueAt
                ? `Due ${formatDate(t.dueAt, tz)}`
                : "No due date"
              : t.dueMeter
                ? `Due at ${Number(t.dueMeter).toLocaleString()} ${t.schedule.meterUnitLabel ?? "units"}`
                : "Meter-based";
          return (
            <div
              key={t.id}
              className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium text-graphite">
                  {t.schedule.taskName}
                </div>
                <div className="mt-0.5 text-sm text-graphite/60">
                  <Link
                    href={`/assets/${t.schedule.asset.id}`}
                    className="hover:text-safety"
                  >
                    {t.schedule.asset.name}
                  </Link>{" "}
                  · {due}
                </div>
              </div>
              <div className="sm:w-56">
                <LogDoneForm
                  taskId={t.id}
                  taskName={t.schedule.taskName}
                  defaultName={userName}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
