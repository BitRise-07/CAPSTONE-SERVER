export default function LoadingState({ label = "Loading data" }) {
  return (
    <div className="panel grid min-h-[280px] place-items-center rounded-lg p-8 text-sm text-slate-500">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-mint" />
        {label}
      </div>
    </div>
  );
}

