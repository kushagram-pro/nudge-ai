export default function MetricCard({ title, value, detail, icon: Icon, accent = "bg-slate-900" }) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <div className={`flex h-11 w-11 items-center justify-center rounded-md ${accent} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {detail ? <p className="mt-4 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}
