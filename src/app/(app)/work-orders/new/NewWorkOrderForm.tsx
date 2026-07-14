"use client";

import { useFormState } from "react-dom";
import { createWorkOrderAction, type WoState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: WoState = {};

export function NewWorkOrderForm({
  assets,
  defaultReporter,
  defaults,
}: {
  assets: { id: string; name: string }[];
  defaultReporter: string;
  defaults?: { assetId?: string; title?: string; priority?: string };
}) {
  const [state, formAction] = useFormState(createWorkOrderAction, initial);
  return (
    <form action={formAction} className="card space-y-4 p-6">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="assetId">
          Asset
        </label>
        <select
          id="assetId"
          name="assetId"
          required
          defaultValue={defaults?.assetId ?? ""}
          className="input"
        >
          <option value="" disabled>
            Choose an asset…
          </option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="title">
          Issue
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
          className="input"
          placeholder="Hydraulic seal leaking"
        />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="input min-h-24"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={defaults?.priority ?? "normal"}
            className="input"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="reportedByName">
            Reported by
          </label>
          <input
            id="reportedByName"
            name="reportedByName"
            required
            defaultValue={defaultReporter}
            className="input"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton className="btn-primary" pendingText="Creating…">
          Create work order
        </SubmitButton>
      </div>
    </form>
  );
}
