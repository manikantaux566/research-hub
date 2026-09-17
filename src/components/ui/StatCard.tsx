import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  href,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  href?: string;
  tone?: "indigo" | "green" | "amber" | "red" | "blue" | "gray";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    blue: "bg-sky-50 text-sky-700",
    gray: "bg-surface-muted text-foreground",
  };
  const content: ReactNode = (
    <>
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${tones[tone]}`}>
        <span className="text-lg font-bold">{value}</span>
      </span>
      <span className="mt-2 text-xs font-medium text-muted">{label}</span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className="flex flex-col rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm"
      >
        {content}
      </a>
    );
  }
  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface p-4">
      {content}
    </div>
  );
}