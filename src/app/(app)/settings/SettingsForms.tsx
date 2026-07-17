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
      desc="The quick-pick buttons techs tap when reporting a problem. One per line."
    >
      <form action={formAction} className="space-y-4">
        <textarea
          name="chips"
          defaultValue={chips.join("\n")}
          className="input min-h-40 font-mono text-sm"
        />
        <div className="flex justify-end">
          <SubmitButton className="btn-primary" pendingText="Saving…">
            Save chips
          </SubmitButton>
        </div>
      </form>
    </Section>
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
