export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-60 items-center justify-center">
      <div className="grid justify-items-center gap-3 text-sm font-medium text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
        <span>{label}</span>
      </div>
    </div>
  );
}
