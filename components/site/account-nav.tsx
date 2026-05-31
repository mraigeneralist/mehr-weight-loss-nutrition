"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, User2, MapPin, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon };

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/account", label: "Profile", icon: User2 },
    { href: "/account/orders", label: "Orders", icon: Package },
    { href: "/account/addresses", label: "Addresses", icon: MapPin },
  ];
  if (isAdmin) items.push({ href: "/admin", label: "Admin", icon: ShieldCheck });

  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/account" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sand font-medium text-foreground"
                : "text-muted-foreground hover:bg-sand/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
