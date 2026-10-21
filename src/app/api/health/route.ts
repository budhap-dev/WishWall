import { connection } from "next/server";
import { db } from "@/server/db";

/** Liveness + database connectivity check: GET /api/health */
export async function GET() {
  // Opt out of prerendering: this must run per request.
  await connection();

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json(
      { status: "error", database: "unreachable" },
      { status: 503 },
    );
  }
}
