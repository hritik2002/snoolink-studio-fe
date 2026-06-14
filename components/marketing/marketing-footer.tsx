import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/page-shell-layout";
import { bodyLg } from "@/lib/cg-classes";
import { cn } from "@/lib/utils";

const SOCIAL = [
  {
    label: "X (Twitter)",
    href: "https://twitter.com/SnoolinkStudio",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/snoolink",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
] as const;

const FOOTER_LINKS = [
  { label: "Join Newsletter", href: "#newsletter" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

export function MarketingFooter() {
  return (
    <footer className="bg-cg-bg border-t border-cg-line">
      <Container className="py-14 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-16">
          {/* Brand column */}
          <div className="max-w-md text-left">
            <Link href="/" className="inline-flex items-center gap-2 mb-5">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="size-8 object-contain"
              />
              <span className="font-ui text-body font-medium text-cg-ink">
                Snoolink
              </span>
            </Link>

            <p className={cn(bodyLg, "text-cg-ink-3 mb-6 max-w-sm")}>
              Turn any video and image into structured, searchable context —
              ready for AI.
            </p>

            <a
              href="mailto:hello@snoolink.com"
              className="font-body text-body text-cg-ink-2 hover:text-cg-ink transition-colors duration-200 ease-cg"
            >
              hello@snoolink.com
            </a>
          </div>

          {/* Trust badge placeholder */}
          <div className="hidden lg:flex items-start justify-end">
            <div
              className="rounded-badge border border-cg-line bg-cg-bg-alt px-4 py-3 text-left max-w-[11rem]"
              aria-label="Security compliance in progress"
            >
              <p className="font-body text-[10px] font-semibold uppercase tracking-wide text-cg-ink-4 leading-snug">
                Enterprise-ready
              </p>
              <p className="font-body text-xs text-cg-ink-3 mt-1 leading-snug">
                Secure media indexing &amp; search
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-cg-line flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {SOCIAL.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-full border border-cg-line bg-cg-surface flex items-center justify-center text-cg-ink-3 hover:text-cg-ink hover:border-cg-line-3 transition-colors duration-200 ease-cg"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>

          <nav
            className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-2"
            aria-label="Footer"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-body text-sm text-cg-ink-3 hover:text-cg-ink transition-colors duration-200 ease-cg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="font-body text-xs text-cg-ink-4 mt-8 text-center sm:text-left">
          © {new Date().getFullYear()} Snoolink
        </p>
      </Container>
    </footer>
  );
}
