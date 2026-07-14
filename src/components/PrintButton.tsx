"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button className="btn-primary no-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
