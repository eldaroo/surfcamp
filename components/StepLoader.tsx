const placeholderRows = [
  'w-3/4',
  'w-full',
  'w-5/6'
];

export default function StepLoader() {
  return (
    <div className="card border border-slate-700/70 bg-slate-900/60 p-6 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-5 w-32 rounded-full bg-slate-700/60" />
        {placeholderRows.map((width) => (
          <div key={width} className={`h-4 ${width} rounded-full bg-slate-800/60`} />
        ))}
        <div className="mt-2 h-10 w-32 rounded-2xl bg-slate-800/70" />
      </div>
    </div>
  );
}
