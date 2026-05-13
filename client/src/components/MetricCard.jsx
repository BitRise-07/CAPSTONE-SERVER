export default function MetricCard({ label, value, tone = "text-slate-900 dark:text-white" }) {
  return (
    <div className="metric">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
