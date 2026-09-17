export type BadgeTone =
  | "gray"
  | "indigo"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "cyan"
  | "rose"
  | "pink"
  | "teal"
  | "orange"
  | "lime"
  | "fuchsia";

const tones: Record<BadgeTone, string> = {
  gray: "bg-surface-muted text-muted ring-border",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/15",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  purple: "bg-violet-50 text-violet-700 ring-violet-600/15",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-600/15",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/15",
  pink: "bg-pink-50 text-pink-700 ring-pink-600/15",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/15",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/15",
  lime: "bg-lime-50 text-lime-700 ring-lime-600/15",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15",
};

export function Badge({
  label,
  tone = "gray",
  className = "",
  dot = false,
  title,
}: {
  label: string;
  tone?: BadgeTone;
  className?: string;
  dot?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4 ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {dot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
        />
      )}
      {label}
    </span>
  );
}
