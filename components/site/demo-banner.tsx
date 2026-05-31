import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-sage-deep/20 bg-sage-deep/5">
      <div className="container-prose flex items-start gap-3 py-2.5 text-sm text-sage-deep">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed">
          <span className="font-semibold">Demo mode.</span> The catalog is
          rendered from static seed data. Add Supabase env vars in Vercel
          (see <code className="rounded bg-sage-deep/10 px-1.5 py-0.5 text-xs">SETUP.md</code>
          ) to enable cart, accounts, checkout, and the admin dashboard.
        </p>
      </div>
    </div>
  );
}
