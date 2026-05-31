import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  STORE_NAME,
  STORE_TAGLINE,
  STORE_PHONE,
  STORE_EMAIL,
  STORE_ADDRESS,
} from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-sand/40">
      <div className="container-prose grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2 max-w-sm">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight"
          >
            <Image
              src="/logo.png"
              alt={STORE_NAME}
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
            />
            {STORE_NAME}
          </Link>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {STORE_TAGLINE}. Your partners in lifelong wellness — combining the
            latest nutrition science with practical, everyday solutions for a
            healthier, more active life.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sage-deep" />
              <span>{STORE_ADDRESS}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-sage-deep" />
              <a href={`tel:${STORE_PHONE.replace(/\s/g, "")}`} className="hover:text-foreground">
                {STORE_PHONE}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-sage-deep" />
              <a href={`mailto:${STORE_EMAIL}`} className="hover:text-foreground">
                {STORE_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products" className="hover:text-foreground">All products</Link></li>
            <li><Link href="/categories/weight-management" className="hover:text-foreground">Weight Management</Link></li>
            <li><Link href="/categories/daily-wellness" className="hover:text-foreground">Daily Wellness</Link></li>
            <li><Link href="/categories/targeted-health" className="hover:text-foreground">Targeted Health</Link></li>
            <li><Link href="/categories/sports-energy" className="hover:text-foreground">Sports & Energy</Link></li>
            <li><Link href="/categories/skin-care" className="hover:text-foreground">Skin Care & Beauty</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link href="/sign-up" className="hover:text-foreground">Create account</Link></li>
            <li><Link href="/account/orders" className="hover:text-foreground">Track order</Link></li>
            <li><Link href="/cart" className="hover:text-foreground">Cart</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container-prose flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {STORE_NAME}. All rights reserved.</p>
          <p>Chennai, India. Shipped pan-India.</p>
        </div>
      </div>
    </footer>
  );
}
