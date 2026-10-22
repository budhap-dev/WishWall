import { cn } from "@/lib/utils";
import { BRAND_RED, HEART_PATH } from "@/lib/brand";

/** The app icon (a white heart on the brand red), sized by `className`. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
    >
      <rect width="100" height="100" rx="22" fill={BRAND_RED} />
      <path
        d={HEART_PATH}
        fill="#ffffff"
        transform="translate(19 21) scale(0.62)"
      />
    </svg>
  );
}

/** Logo mark plus the "WishWall" wordmark, in the surrounding text style. */
export function Logo({ markClassName }: { markClassName?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={markClassName} />
      <span>
        Wish<span className="text-primary">Wall</span>
      </span>
    </span>
  );
}
