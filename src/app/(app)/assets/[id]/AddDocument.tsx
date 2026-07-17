"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/Toast";
import type { ActionState } from "../actions";

const initial: ActionState = {};

export function AddDocument({
  action,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useFormState(action, initial);
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.push("Document added", "success");
      formRef.current?.reset();
    } else if (state.error) toast.push(state.error, "error");
  }, [state, toast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="card space-y-3 p-4 text-sm"
    >
      <h3 className="font-semibold text-content">Add a document</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="title"
          required
          className="input"
          placeholder="Calibration certificate"
        />
        <select name="kind" defaultValue="other" className="input">
          <option value="manual">Manual</option>
          <option value="certificate">Certificate</option>
          <option value="inspection">Inspection</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label text-xs" htmlFor="expiresAt">
            Expires (optional)
          </label>
          <input id="expiresAt" name="expiresAt" type="date" className="input" />
        </div>
        <div>
          <label className="label text-xs" htmlFor="file">
            File (PDF or image)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,image/*"
            required
            className="input"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton className="btn-secondary" pendingText="Uploading…">
          Upload
        </SubmitButton>
      </div>
    </form>
  );
}
