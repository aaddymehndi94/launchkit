import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "brand"
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  tone?: "brand" | "blue" | "amber" | "slate";
}) {
  const toneClass = {
    brand: "bg-soft text-brand",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700"
  }[tone];

  return (
    <div className="rounded-lg border border-line bg-paper p-4 shadow-panel transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-semibold text-ink">{value}</p>
          {detail ? <p className="mt-0.5 text-xs text-muted">{detail}</p> : null}
        </div>
      </div>
    </div>
  );
}
