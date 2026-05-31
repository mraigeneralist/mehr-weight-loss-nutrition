export default function AccountLoading() {
  return (
    <div className="container-prose animate-pulse py-10 md:py-14">
      <div className="mb-10 flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-sand" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-sand" />
          <div className="h-6 w-40 rounded bg-sand" />
          <div className="h-3 w-56 rounded bg-sand" />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-sand" />
          ))}
        </aside>
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-sand" />
            <div className="h-3 w-72 rounded bg-sand" />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-sand" />
              <div className="h-10 rounded-md bg-sand" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-sand" />
              <div className="h-10 rounded-md bg-sand" />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="h-3 w-20 rounded bg-sand" />
            <div className="h-10 rounded-md bg-sand" />
          </div>
        </div>
      </div>
    </div>
  );
}
