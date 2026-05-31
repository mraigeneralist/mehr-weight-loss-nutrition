import Link from "next/link";
import { SignUpForm } from "@/components/site/sign-up-form";

export const metadata = { title: "Create account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <h1 className="font-display text-3xl font-bold">Create your account.</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        It takes about thirty seconds. Promise.
      </p>
      <div className="mt-8">
        <SignUpForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
