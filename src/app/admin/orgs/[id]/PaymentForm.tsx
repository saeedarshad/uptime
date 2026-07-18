"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { recordPayment, setTrialEnds, type AdminState } from "../../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: AdminState = {};

function toInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function PaymentForm({
  orgId,
  monthlyAmount,
  annualAmount,
}: {
  orgId: string;
  monthlyAmount: number;
  annualAmount: number;
}) {
  const [state, formAction] = useFormState(recordPayment, initial);
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");

  const today = new Date();
  const start = toInput(today);
  const end = toInput(addMonths(today, interval === "annual" ? 12 : 1));
  const amount = interval === "annual" ? annualAmount : monthlyAmount;

  // `key` forces the date/amount defaults to refresh when the interval flips.
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      {state.ok && state.message && (
        <div className="rounded-md bg-ok/10 px-3 py-2 text-sm text-ok">
          {state.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="interval">
            Plan
          </label>
          <select
            id="interval"
            name="interval"
            className="input"
            value={interval}
            onChange={(e) =>
              setInterval(e.target.value as "monthly" | "annual")
            }
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="amount">
            Amount (USD)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={amount}
            key={`amt-${interval}`}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="periodStart">
            Period start
          </label>
          <input
            id="periodStart"
            name="periodStart"
            type="date"
            required
            defaultValue={start}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="periodEnd">
            Period end (paid through)
          </label>
          <input
            id="periodEnd"
            name="periodEnd"
            type="date"
            required
            defaultValue={end}
            key={`end-${interval}`}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="method">
            Method (optional)
          </label>
          <input
            id="method"
            name="method"
            type="text"
            placeholder="Bank transfer"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="reference">
            Reference (optional)
          </label>
          <input
            id="reference"
            name="reference"
            type="text"
            placeholder="Invoice #"
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">
          Note (optional)
        </label>
        <input id="note" name="note" type="text" className="input" />
      </div>
      <SubmitButton pendingText="Recording…">Record payment</SubmitButton>
    </form>
  );
}

export function TrialForm({
  orgId,
  trialEndsAt,
}: {
  orgId: string;
  trialEndsAt: string | null;
}) {
  const [state, formAction] = useFormState(setTrialEnds, initial);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="orgId" value={orgId} />
      <div>
        <label className="label" htmlFor="trialEndsAt">
          Trial ends
        </label>
        <input
          id="trialEndsAt"
          name="trialEndsAt"
          type="date"
          required
          defaultValue={trialEndsAt ?? toInput(new Date())}
          className="input"
        />
      </div>
      <SubmitButton pendingText="Saving…">Set trial</SubmitButton>
      {state.error && (
        <span className="text-sm text-danger">{state.error}</span>
      )}
      {state.ok && state.message && (
        <span className="text-sm text-ok">{state.message}</span>
      )}
    </form>
  );
}
