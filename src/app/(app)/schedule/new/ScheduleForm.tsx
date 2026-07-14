"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createScheduleAction, type ScheduleState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: ScheduleState = {};

export function ScheduleForm({
  assets,
  defaultAssetId,
}: {
  assets: { id: string; name: string }[];
  defaultAssetId?: string;
}) {
  const [state, formAction] = useFormState(createScheduleAction, initial);
  const [trigger, setTrigger] = useState<"time" | "meter">("time");

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
          defaultValue={defaultAssetId ?? ""}
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
        <label className="label" htmlFor="taskName">
          Task name
        </label>
        <input
          id="taskName"
          name="taskName"
          required
          className="input"
          placeholder="Hydraulic fluid & safety check"
        />
      </div>
      <div>
        <label className="label" htmlFor="instructions">
          Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          className="input min-h-20"
          placeholder="What the tech should do…"
        />
      </div>
      <div>
        <label className="label" htmlFor="triggerType">
          Trigger
        </label>
        <select
          id="triggerType"
          name="triggerType"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value as "time" | "meter")}
          className="input"
        >
          <option value="time">By time (every N days)</option>
          <option value="meter">By meter (every N units)</option>
        </select>
      </div>
      {trigger === "time" ? (
        <div>
          <label className="label" htmlFor="intervalDays">
            Interval (days)
          </label>
          <input
            id="intervalDays"
            name="intervalDays"
            inputMode="numeric"
            className="input"
            placeholder="90"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="meterIntervalUnits">
              Interval (units)
            </label>
            <input
              id="meterIntervalUnits"
              name="meterIntervalUnits"
              inputMode="numeric"
              className="input"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="label" htmlFor="meterUnitLabel">
              Unit label
            </label>
            <input
              id="meterUnitLabel"
              name="meterUnitLabel"
              className="input"
              placeholder="miles"
            />
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <SubmitButton className="btn-primary" pendingText="Creating…">
          Create schedule
        </SubmitButton>
      </div>
    </form>
  );
}
