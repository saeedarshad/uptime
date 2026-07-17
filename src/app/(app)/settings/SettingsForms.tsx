"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import { BUSINESS_TYPES } from "@/lib/businessTypes";
import {
  updateOrgProfile,
  updatePin,
  updateSymptomChips,
  inviteUser,
  type SettingsState,
} from "./actions";

const initial: SettingsState = {};

function useToastEffect(state: SettingsState) {
  const toast = useToast();
  useEffect(() => {
    if (state.ok) toast.push(state.message ?? "Saved", "success");
    else if (state.error) toast.push(state.error, "error");
  }, [state, toast]);
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="mb-5 border-b border-content/[0.06] pb-4">
        <h2 className="text-base font-bold text-content">{title}</h2>
        {desc && (
          <p className="mt-1 text-sm leading-relaxed text-content/60">{desc}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function ProfileForm({
  org,
}: {
  org: {
    name: string;
    city: string | null;
    timezone: string;
    businessType: string;
    laborRateCents: number;
  };
}) {
  const [state, formAction] = useFormState(updateOrgProfile, initial);
  useToastEffect(state);
  return (
    <Section title="Business profile">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">
              Business name
            </label>
            <input id="name" name="name" defaultValue={org.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              defaultValue={org.city ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="businessType">
              Business type
            </label>
            <select
              id="businessType"
              name="businessType"
              defaultValue={org.businessType}
              className="input"
            >
              {BUSINESS_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="timezone">
              Timezone
            </label>
            <input
              id="timezone"
              name="timezone"
              defaultValue={org.timezone}
              className="input"
              placeholder="America/Chicago"
            />
          </div>
          <div>
            <label className="label" htmlFor="laborRate">
              Labor rate ($/hr)
            </label>
            <input
              id="laborRate"
              name="laborRate"
              inputMode="decimal"
              defaultValue={(org.laborRateCents / 100).toString()}
              className="input"
            />
            <p className="mt-1 text-xs text-content/40">
              Used to price downtime and labor cost.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <SubmitButton className="btn-primary" pendingText="Saving…">
            Save profile
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}

export function PinForm({ pinEnabled }: { pinEnabled: boolean }) {
  const [state, formAction] = useFormState(updatePin, initial);
  const [enabled, setEnabled] = useState(pinEnabled);
  useToastEffect(state);
  return (
    <Section
      title="Shop PIN"
      desc="Require a 4-digit PIN before techs can report problems from a QR scan. They enter it once per shift."
    >
      <form action={formAction} className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-content/80">
          <input
            type="checkbox"
            name="pinEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-content/30 text-safety focus:ring-safety"
          />
          Require a PIN on public report/meter pages
        </label>
        {enabled && (
          <div className="max-w-[160px]">
            <label className="label" htmlFor="pinCode">
              4-digit PIN
            </label>
            <input
              id="pinCode"
              name="pinCode"
              inputMode="numeric"
              maxLength={4}
              className="input text-center text-lg tracking-[0.4em]"
              placeholder="0000"
            />
          </div>
        )}
        <div className="flex justify-end">
          <SubmitButton className="btn-primary" pendingText="Saving…">
            Save PIN setting
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}

export function ChipsForm({ chips }: { chips: string[] }) {
  const [state, formAction] = useFormState(updateSymptomChips, initial);
  useToastEffect(state);
  return (
    <Section
      title="Symptom chips"
      desc="The quick-pick buttons techs tap when reporting a problem. Type one and press Enter to add it; click ✕ to remove."
    >
      <form action={formAction} className="space-y-4">
        <ChipsInput name="chips" initial={chips} />
        <div className="flex justify-end">
          <SubmitButton className="btn-primary" pendingText="Saving…">
            Save chips
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}

/** Tag/pill input. Chips render as removable pills; typing + Enter (or comma)
 *  adds one. Submits a single comma-joined hidden field the server splits. */
function ChipsInput({ name, initial }: { name: string; initial: string[] }) {
  const [chips, setChips] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const MAX = 20;

  function add(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (chips.length >= MAX) return;
    if (chips.some((c) => c.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setChips([...chips, value]);
    setDraft("");
  }

  function remove(index: number) {
    setChips(chips.filter((_, i) => i !== index));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && chips.length > 0) {
      remove(chips.length - 1);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={chips.join(",")} />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-content/20 bg-surface p-2.5 shadow-sm transition-shadow focus-within:border-safety focus-within:ring-2 focus-within:ring-safety/25">
        {chips.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-content/[0.06] py-1 pl-3 pr-1.5 text-sm font-medium text-content"
          >
            {chip}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${chip}`}
              className="flex h-4 w-4 items-center justify-center rounded-full text-content/40 transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                className="h-3 w-3"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={chips.length === 0 ? "e.g. Won't start, Leaking oil…" : "Add another…"}
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-1.5 py-1 text-sm text-content outline-none placeholder:text-content/40"
        />
      </div>
      <p className="mt-1.5 text-xs text-content/40">
        {chips.length}/{MAX} chips
      </p>
    </div>
  );
}

export function InviteForm() {
  const [state, formAction] = useFormState(inviteUser, initial);
  useToastEffect(state);
  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="label" htmlFor="inv-name">
          Name
        </label>
        <input id="inv-name" name="name" required className="input" />
      </div>
      <div className="flex-1">
        <label className="label" htmlFor="inv-email">
          Email
        </label>
        <input id="inv-email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="inv-role">
          Role
        </label>
        <select id="inv-role" name="role" defaultValue="tech" className="input">
          <option value="tech">Tech</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      <SubmitButton className="btn-primary shrink-0" pendingText="Inviting…">
        Invite
      </SubmitButton>
    </form>
  );
}
