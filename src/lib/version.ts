import "server-only";
import { version } from "../../package.json";

// Vercel sets this for every deployment; it's absent locally.
const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

/**
 * The running version, e.g. "v0.1.0 (a1b2c3d)": package.json's version plus
 * the deployed commit, so a bug report can name the exact build.
 */
export const versionLabel = commit ? `v${version} (${commit})` : `v${version}`;
