import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { signInWithGoogleAction } from "@/server/actions/auth";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

// Auth.js error codes we expect to see (?error=...). Anything else gets the generic message.
const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Access was denied. If the app is in testing mode, ask the owner to add you as a test user.",
  Configuration:
    "Sign-in isn't configured correctly on the server. Check the AUTH_* environment variables.",
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method.",
};

export default function SignInPage({ searchParams }: PageProps<"/signin">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">
            Sign in to WishWall
          </CardTitle>
          <CardDescription>
            You need an account to create boards. Contributors can post without
            one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <SignInForm searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function SignInForm({
  searchParams,
}: Pick<PageProps<"/signin">, "searchParams">) {
  const params = await searchParams;
  const callbackUrl = safeRedirectPath(first(params.callbackUrl));
  const errorCode = first(params.error);

  if (await getCurrentUser()) redirect(callbackUrl);

  return (
    <form action={signInWithGoogleAction} className="space-y-4">
      {errorCode ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {ERROR_MESSAGES[errorCode] ??
            "Something went wrong signing you in. Please try again."}
        </p>
      ) : null}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button type="submit" size="lg" variant="outline" className="w-full">
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}
