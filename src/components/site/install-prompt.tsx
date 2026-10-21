"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

/** Chrome's install event (not in TypeScript's DOM types). */
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "ww-install-dismissed";

type Hint = "ios" | "android" | null;

/**
 * What this browser can be offered: iOS has no install prompt, so it gets
 * Share → Add to Home Screen instructions; Android gets an Install button once
 * Chrome says it's installable. Nothing on desktop, inside the installed
 * app, or after the visitor dismissed the banner.
 */
function hintForThisBrowser(): Hint {
  const standalone =
    matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;
  if (standalone || !matchMedia("(pointer: coarse)").matches) return null;
  try {
    if (localStorage.getItem(DISMISSED_KEY) === "1") return null;
  } catch {
    // Storage blocked (private mode): just show the banner.
  }
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "android";
}

const noSubscription = () => () => {};

/** A dismissible banner inviting phone visitors to add WishWall to their home screen. */
export function InstallPrompt() {
  // Read on the client only (null during server rendering and hydration).
  const hint = useSyncExternalStore(
    noSubscription,
    hintForThisBrowser,
    () => null,
  );
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (hint !== "android") return;
    const onInstallable = (event: Event) => {
      event.preventDefault(); // We show our own banner instead of Chrome's.
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setClosed(true);
    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [hint]);

  if (closed || !hint || (hint === "android" && !installEvent)) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Not remembered; it hides for this visit only.
    }
    setClosed(true);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    // The event can only be used once, whatever the visitor chose.
    setClosed(true);
  }

  return (
    <aside
      aria-label="Install WishWall"
      className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-lg print:hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static icon */}
      <img
        src="/icons/icon-192.png"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-lg"
      />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Get the WishWall app</p>
        {hint === "ios" ? (
          <p className="text-muted-foreground">
            Tap{" "}
            <Share
              className="inline size-4 align-text-bottom"
              aria-label="Share"
            />{" "}
            then “Add to Home Screen”.
          </p>
        ) : (
          <p className="text-muted-foreground">Add it to your home screen.</p>
        )}
      </div>
      {hint === "android" ? (
        <Button size="sm" onClick={() => void install()}>
          Install
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        onClick={dismiss}
      >
        <X />
      </Button>
    </aside>
  );
}
