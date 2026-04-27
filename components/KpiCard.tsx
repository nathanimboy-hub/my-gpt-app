interface KpiCardProps {
  label: string;
  value: string;
}

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
