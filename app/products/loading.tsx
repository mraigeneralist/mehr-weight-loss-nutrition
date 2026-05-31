export default function ProductsLoading() {
  return (
    <div className="container-prose animate-pulse py-12 md:py-16">
      <header className="mb-10 space-y-3">
        <div className="h-3 w-24 rounded bg-sand" />
        <div className="h-10 w-72 rounded bg-sand" />
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-sand" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square rounded-2xl bg-sand" />
            <div className="h-3 w-14 rounded bg-sand" />
            <div className="h-5 w-3/4 rounded bg-sand" />
            <div className="h-3 w-1/2 rounded bg-sand" />
            <div className="h-9 rounded-md bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}
