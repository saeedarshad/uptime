"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import { formatMoney } from "@/lib/format";
import type { WoState } from "../actions";

const initial: WoState = {};
type Action = (prev: WoState, fd: FormData) => Promise<WoState>;

export interface WoData {
  id: string;
  status: string;
  title: string;
  description: string | null;
  priority: string;
  partsCostCents: number;
  laborHours: number;
  laborCostCents: number;
  downtimeHours: number;
  assignedToUserId: string | null;
}

export function EditPanel({
  wo,
  users,
  laborRateCents,
  action,
}: {
  wo: WoData;
  users: { id: string; name: string }[];
  laborRateCents: number;
  action: Action;
}) {
  const [state, formAction] = useFormState(action, initial);
  const toast = useToast();
  const [hours, setHours] = useState(String(wo.laborHours));

  useEffect(() => {
    if (state.ok) toast.push("Work order saved", "success");
    else if (state.error) toast.push(state.error, "error");
  }, [state, toast]);

  const autoLabor = Math.round((Number(hours) || 0) * laborRateCents);
  const closed = wo.status === "done" || wo.status === "cancelled";

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-content/50">
        Details
      </h2>
      <div>
        <label className="label" htmlFor="title">
          Issue
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={wo.title}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={wo.description ?? ""}
          className="input min-h-20"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={closed ? "open" : wo.status}
            disabled={closed}
            className="input disabled:opacity-60"
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {closed && (
            <p className="mt-1 text-xs text-content/40">
              Reopen below to change status.
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={wo.priority}
            className="input"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="assignedToUserId">
            Assigned to
          </label>
          <select
            id="assignedToUserId"
            name="assignedToUserId"
            defaultValue={wo.assignedToUserId ?? ""}
            className="input"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="partsCost">
            Parts cost ($)
          </label>
          <input
            id="partsCost"
            name="partsCost"
            inputMode="decimal"
            defaultValue={
              wo.partsCostCents ? (wo.partsCostCents / 100).toString() : ""
            }
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="laborHours">
            Labor hours
          </label>
          <input
            id="laborHours"
            name="laborHours"
            inputMode="decimal"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="laborCostOverride">
            Labor cost ($)
          </label>
          <input
            id="laborCostOverride"
            name="laborCostOverride"
            inputMode="decimal"
            defaultValue={
              wo.laborCostCents ? (wo.laborCostCents / 100).toString() : ""
            }
            className="input"
          />
          <p className="mt-1 text-xs text-content/40">
            Auto: {formatMoney(autoLabor)} at{" "}
            {formatMoney(laborRateCents)}/hr. Leave to override.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton className="btn-primary" pendingText="Saving…">
          Save
        </SubmitButton>
      </div>
    </form>
  );
}

export function ClosePanel({
  status,
  closeAction,
  reopenAction,
}: {
  status: string;
  closeAction: Action;
  reopenAction: () => Promise<void>;
}) {
  const [state, formAction] = useFormState(closeAction, initial);
  const toast = useToast();
  useEffect(() => {
    if (state.ok) toast.push("Work order closed", "success");
    else if (state.error) toast.push(state.error, "error");
  }, [state, toast]);

  if (status === "done") {
    return (
      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-content/50">
          Closed
        </h2>
        <p className="text-sm text-content/60">
          This work order is done. Reopen it to make further changes.
        </p>
        <form action={reopenAction}>
          <button className="btn-secondary">Reopen work order</button>
        </form>
      </div>
    );
  }

  return (
    <form action={formAction} className="card space-y-3 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-content/50">
        Close work order
      </h2>
      <div>
        <label className="label" htmlFor="downtimeHours">
          How long was this asset unusable? (hours)
        </label>
        <input
          id="downtimeHours"
          name="downtimeHours"
          inputMode="decimal"
          defaultValue="0"
          className="input"
        />
        <p className="mt-1 text-xs text-content/40">
          Used to price downtime against your labor rate.
        </p>
      </div>
      <SubmitButton className="btn-dark w-full" pendingText="Closing…">
        Mark done
      </SubmitButton>
    </form>
  );
}

export function AddPhotoPanel({
  action,
}: {
  action: Action;
}) {
  const [state, formAction] = useFormState(action, initial);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.push("Photo added", "success");
      if (fileRef.current) fileRef.current.value = "";
    } else if (state.error) toast.push(state.error, "error");
  }, [state, toast]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.8),
    );
    if (!blob) return;
    const dt = new DataTransfer();
    dt.items.add(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    if (fileRef.current) fileRef.current.files = dt.files;
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        ref={fileRef}
        name="photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileChange}
        className="input"
      />
      <SubmitButton className="btn-secondary shrink-0" pendingText="Uploading…">
        Add
      </SubmitButton>
    </form>
  );
}
