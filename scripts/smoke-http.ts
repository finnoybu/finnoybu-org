/**
 * HTTP-level smoke — the layer the lib smokes don't reach. Spawns `next dev`
 * against an isolated DIVE_DATA_DIR, drives the magic-link sign-in over the
 * dev-echo (no SMTP), and asserts the routing + a regression for the
 * v0.3.0_PATCH bug (POST /api/settings out-of-range → 400, not 500).
 *
 * Run: `npx tsx scripts/smoke-http.ts`  (exits 0 on pass, 1 on any failure)
 *
 * Designed for CI: isolated DB+dir under os.tmpdir(); random port in
 * 3100-3199; child process killed in finally; no shared host state touched.
 */

import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "dive-http-smoke-"));
const PORT = 3100 + Math.floor(Math.random() * 100);
const BASE = `http://localhost:${PORT}`;

const failures: string[] = [];
let child: ChildProcess | null = null;
let serverLog = "";

function check(label: string, cond: boolean): void {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}`);
    failures.push(label);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForReady(timeoutMs = 90_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/login`, { redirect: "manual" });
      if (r.status === 200 || r.status === 307) return;
    } catch {
      /* still warming */
    }
    await sleep(500);
  }
  throw new Error(`server didn't come up on ${BASE} within ${timeoutMs}ms`);
}

async function pollServerLogFor(re: RegExp, timeoutMs = 10_000): Promise<RegExpMatchArray | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const m = serverLog.match(re);
    if (m) return m;
    await sleep(200);
  }
  return null;
}

async function main(): Promise<void> {
  // Strip any AUTH_TOKEN inherited from the dev shell — we want a clean run
  // (and the adoption log line is noisy).
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.AUTH_TOKEN;
  env.DIVE_DATA_DIR = TMP;
  env.ADMIN_BOOTSTRAP_EMAIL = "smoke@test.local";
  env.DIVE_AUTH_DEV_ECHO = "true";
  env.DIVE_INSECURE_COOKIES = "true";
  env.DIVE_BASE_URL = BASE;
  // Disable rate limiting from a possible test-env config.
  env.RATE_LIMIT_ENABLED = "false";

  child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    // npx + nested package execs need a shell on Windows.
    shell: process.platform === "win32",
  });

  child.stdout?.on("data", (b: Buffer) => {
    serverLog += b.toString();
  });
  child.stderr?.on("data", (b: Buffer) => {
    serverLog += b.toString();
  });

  await waitForReady();
  console.log(`[smoke-http] server up on ${BASE} (data ${TMP})`);

  // --- 1. Magic-link sign-in (drives dev echo + cookie set) -------------
  const magic = await fetch(`${BASE}/api/auth/magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "smoke@test.local" }),
  });
  check("POST /api/auth/magic-link → 200", magic.status === 200);

  const m = await pollServerLogFor(/magic-link sign-in URL[^\n]*?token=([^\s]+)/);
  const token = m?.[1] ?? "";
  check("dev echo printed the magic link", !!token);

  const verify = await fetch(`${BASE}/auth/verify?token=${encodeURIComponent(token)}`, {
    redirect: "manual",
  });
  check("/auth/verify → 307", verify.status === 307);
  const setCookie = verify.headers.get("set-cookie") ?? "";
  const cookieMatch = setCookie.match(/dive_session=([^;]+)/);
  check("set-cookie carries dive_session", !!cookieMatch);
  const cookie = cookieMatch ? `dive_session=${cookieMatch[1]}` : "";

  // --- 2. Authenticated nav -------------------------------------------
  for (const p of ["/domains", "/alerts", "/settings", "/license", "/account"]) {
    const r = await fetch(`${BASE}${p}`, { headers: { Cookie: cookie }, redirect: "manual" });
    check(`GET ${p} with cookie → 200`, r.status === 200);
  }

  // --- 3. Regression: v0.3.0_PATCH — out-of-range settings → 400 ------
  const oor = await fetch(`${BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action: "set_global", key: "monitor_interval_seconds", value: 5 }),
  });
  check("REGRESSION: set_global out-of-range → 400 (not 500)", oor.status === 400);
  const oorBody = (await oor.json()) as { code?: string; message?: string };
  check(
    "REGRESSION: response body carries the validation message",
    typeof oorBody.message === "string" && /must be an integer in/.test(oorBody.message),
  );

  // Happy path still works.
  const ok = await fetch(`${BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action: "set_global", key: "monitor_interval_seconds", value: 600 }),
  });
  check("happy-path set_global → 200", ok.status === 200);

  // --- 4. Unauthenticated + bogus-bearer must both 401 ----------------
  const noauth = await fetch(`${BASE}/api/snapshot`, { redirect: "manual" });
  check("GET /api/snapshot without auth → 401", noauth.status === 401);

  const bogus = await fetch(`${BASE}/api/snapshot`, {
    headers: { Authorization: "Bearer dive_pat_bogus" },
  });
  check("bogus bearer → 401 (fails closed, no fallthrough to cookie)", bogus.status === 401);

  // --- 5. /api/auth/logout clears the cookie + revokes the session ---
  const logout = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  check("POST /api/auth/logout → 200", logout.status === 200);

  const postLogout = await fetch(`${BASE}/domains`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  check("post-logout /domains with stale cookie → 307 to /login", postLogout.status === 307);
}

main()
  .catch((err) => {
    console.error("smoke-http fatal:", err);
    failures.push("fatal: " + (err instanceof Error ? err.message : String(err)));
    // Tail of server log on failure for CI debugging.
    if (serverLog) {
      const tail = serverLog.split("\n").slice(-40).join("\n");
      console.error("--- server log tail ---\n" + tail);
    }
  })
  .finally(async () => {
    if (child && child.pid && !child.killed) {
      try {
        // SIGTERM first; force kill after a beat if it lingers.
        child.kill();
        await sleep(500);
        if (!child.killed) child.kill("SIGKILL");
      } catch {
        /* best effort */
      }
    }
    try {
      fs.rmSync(TMP, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
    if (failures.length > 0) {
      console.error(`\n✗ smoke-http: ${failures.length} failure(s)`);
      process.exit(1);
    }
    console.log("\n✓ smoke-http: all checks passed");
    process.exit(0);
  });
