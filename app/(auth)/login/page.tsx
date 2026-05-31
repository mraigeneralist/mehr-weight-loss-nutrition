import Link from "next/link";
import { LoginForm } from "@/components/site/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <h1 className="font-display text-3xl font-bold">Welcome back.</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to track orders and check out faster.
      </p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
