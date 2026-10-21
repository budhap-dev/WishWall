import "server-only";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/lib/env";
import { db } from "@/server/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter is typed against the classic `@prisma/client` export; the
  // generated Prisma 7 client is runtime-compatible.
  adapter: PrismaAdapter(db as never),
  // Database sessions: signing out (or deleting a Session row) takes effect
  // immediately, and the cookie holds only an opaque token.
  session: { strategy: "database" },
  secret: env.AUTH_SECRET,
  // Auth.js builds callback URLs from the request's Host header and refuses
  // to unless told it's trustworthy. Vercel and similar hosts set Host
  // themselves (Auth.js trusts Vercel automatically, but not `next start`
  // elsewhere), so trust it everywhere for consistent behaviour.
  trustHost: true,
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: { signIn: "/signin" },
  callbacks: {
    // Expose the user id to the app (it's not on session.user by default).
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
