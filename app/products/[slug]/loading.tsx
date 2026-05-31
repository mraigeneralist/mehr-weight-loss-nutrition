export default function ProductDetailLoading() {
  return (
    <div className="container-prose animate-pulse py-10 md:py-16">
      <div className="h-3 w-48 rounded bg-sand" />

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl bg-sand" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-16 rounded-lg bg-sand" />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="h-3 w-20 rounded bg-sand" />
          <div className="h-10 w-3/4 rounded bg-sand" />
          <div className="h-8 w-32 rounded bg-sand" />
          <div className="space-y-2 pt-2">
            <div className="h-3 rounded bg-sand" />
            <div className="h-3 w-11/12 rounded bg-sand" />
            <div className="h-3 w-3/4 rounded bg-sand" />
          </div>
          <div className="h-11 w-40 rounded-md bg-sand" />
          <div className="grid gap-5 pt-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-sand" />
                <div className="mt-2 h-3 w-full rounded bg-sand" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
