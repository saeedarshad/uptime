// Money is stored in integer cents everywhere; format only at the edges.

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatMoneyPrecise(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Format a date in the org's timezone. Dates are always stored UTC. */
export function formatDate(date: Date | string, timezone: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string, timezone: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} hr${rounded === 1 ? "" : "s"}`;
}

export function daysUntil(date: Date, now: Date): number {
  const ms = date.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
