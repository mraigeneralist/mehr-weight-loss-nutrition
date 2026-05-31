export default function CategoryLoading() {
  return (
    <>
      <section className="bg-sand/60">
        <div className="container-prose grid animate-pulse gap-10 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-6 flex flex-col justify-center space-y-4">
            <div className="h-3 w-12 rounded bg-sand" />
            <div className="h-12 w-2/3 rounded bg-sand" />
            <div className="h-3 w-3/4 rounded bg-sand" />
            <div className="h-3 w-24 rounded bg-sand" />
          </div>
          <div className="md:col-span-6">
            <div className="aspect-[5/3] rounded-3xl bg-sand" />
          </div>
        </div>
      </section>

      <section className="container-prose animate-pulse py-14">
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
      </section>
    </>
  );
}
