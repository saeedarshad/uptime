"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { logAsDoneAction, type ScheduleState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";

const initial: ScheduleState = {};

export function LogDoneForm({
  taskId,
  taskName,
  defaultName,
}: {
  taskId: string;
  taskName: string;
  defaultName: string;
}) {
  const [state, formAction] = useFormState(logAsDoneAction, initial);
  const toast = useToast();
  useEffect(() => {
    if (state.ok) toast.push("Logged as done", "success");
    else if (state.error) toast.push(state.error, "error");
  }, [state, toast]);

  return (
    <details className="group">
      <summary className="btn-secondary cursor-pointer list-none text-sm">
        Log as done
      </summary>
      <form
        action={formAction}
        className="mt-3 space-y-2 rounded-md border border-content/10 bg-content/[0.02] p-3"
      >
        <input type="hidden" name="taskId" value={taskId} />
        <input type="hidden" name="taskName" value={taskName} />
        <input
          name="completedByName"
          defaultValue={defaultName}
          className="input"
          placeholder="Completed by"
        />
        <textarea
          name="notes"
          className="input min-h-16"
          placeholder="Notes (optional)"
        />
        <SubmitButton className="btn-primary w-full" pendingText="Saving…">
          Confirm complete
        </SubmitButton>
      </form>
    </details>
  );
}
