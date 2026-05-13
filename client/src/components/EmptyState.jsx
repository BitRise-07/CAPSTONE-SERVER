export default function EmptyState({ title = "No data yet", description }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </p>
        {description && (
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}
