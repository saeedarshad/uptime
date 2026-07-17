"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-dom";
import { submitReportAction, type PublicState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: PublicState = {};
const MAX_DIM = 1600;

// Downscale + re-encode the chosen photo client-side so uploads stay small.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8),
  );
  if (!blob) return file;
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export function ReportForm({
  publicId,
  symptoms,
  names,
}: {
  publicId: string;
  symptoms: string[];
  names: string[];
}) {
  const bound = submitReportAction.bind(null, publicId);
  const [state, formAction] = useFormState(bound, initial);
  const [symptom, setSymptom] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const compressed = await compressImage(file);
    // Replace the input's file list with the compressed version so the form
    // submits the smaller image.
    const dt = new DataTransfer();
    dt.items.add(compressed);
    if (fileRef.current) fileRef.current.files = dt.files;
    setPreview(URL.createObjectURL(compressed));
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}

      <div>
        <div className="label">What&apos;s wrong?</div>
        <div className="flex flex-wrap gap-2">
          {symptoms.map((s) => {
            const active = s === symptom;
            return (
              <button
                type="button"
                key={s}
                onClick={() => setSymptom(active ? "" : s)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-safety bg-safety text-white"
                    : "border-content/20 bg-surface text-content hover:border-safety"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="symptom" value={symptom} />
      </div>

      <div>
        <label className="label" htmlFor="note">
          Add a note (optional)
        </label>
        <textarea
          id="note"
          name="note"
          className="input min-h-20"
          placeholder="Anything else the tech should know?"
        />
      </div>

      <div>
        <label className="label" htmlFor="photo">
          Add a photo (optional)
        </label>
        <input
          id="photo"
          ref={fileRef}
          name="photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="input"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="mt-2 max-h-48 rounded-md border border-content/10"
          />
        )}
      </div>

      <div>
        <label className="label" htmlFor="reporterName">
          Your name
        </label>
        <input
          id="reporterName"
          name="reporterName"
          list="reporter-names"
          required
          className="input"
          placeholder="Pick or type your name"
        />
        <datalist id="reporter-names">
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>

      <SubmitButton className="btn-primary w-full py-4 text-base" pendingText="Submitting…">
        Submit report
      </SubmitButton>
    </form>
  );
}
