import Link from "next/link";
import { User2 } from "lucide-react";

type Props = {
  email: string;
  displayName: string | null;
};

export function AccountMenu({ email, displayName }: Props) {
  const initials = (displayName || email)
    .split(/[ @]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <Link
      href="/account"
      aria-label="My account"
      className="grid h-9 w-9 place-items-center rounded-full bg-sand text-sm font-semibold text-ink hover:bg-sand/80 transition-colors"
    >
      {initials || <User2 className="h-4 w-4" />}
    </Link>
  );
}
