"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import { importAssetsCsv, type ActionState } from "../actions";

const initial: ActionState = {};
const SAMPLE = `name,category,location,purchase cost,purchase date
Vehicle Lift #1,Lift,Bay 1,4800,2021-03-14
80-gal Air Compressor,Compressor,Utility room,2100,2020-09-01`;

export function ImportForm() {
  const [state, formAction] = useFormState(importAssetsCsv, initial);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ta = document.getElementById("csv") as HTMLTextAreaElement | null;
      if (ta) ta.value = String(reader.result ?? "");
    };
    reader.readAsText(file);
  }

  return (
    <form action={formAction} className="card space-y-4 p-6">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="file">
          Upload a .csv file
        </label>
        <input
          id="file"
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="input"
        />
      </div>
      <div className="text-center text-xs uppercase tracking-wide text-graphite/40">
        or paste below
      </div>
      <div>
        <label className="label" htmlFor="csv">
          CSV content
        </label>
        <textarea
          id="csv"
          name="csv"
          className="input min-h-48 font-mono text-xs"
          placeholder={SAMPLE}
        />
        <p className="mt-1 text-xs text-graphite/50">
          Columns: <code>name</code> (required), <code>category</code>,{" "}
          <code>location</code>, <code>purchase cost</code>,{" "}
          <code>purchase date</code>.
        </p>
      </div>
      <div className="flex justify-end">
        <SubmitButton className="btn-primary" pendingText="Importing…">
          Import assets
        </SubmitButton>
      </div>
    </form>
  );
}
