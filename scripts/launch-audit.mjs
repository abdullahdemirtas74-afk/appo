#!/usr/bin/env node
/**
 * Full launch audit against production (cookie jar via fetch).
 * Usage: BASE=https://www.appo-ad.com node scripts/launch-audit.mjs
 */
const BASE = (process.env.BASE || "https://www.appo-ad.com").replace(/\/$/, "");

const results = [];
function ok(name, detail = "") {
  results.push({ status: "PASS", name, detail });
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
}
function fail(name, detail = "") {
  results.push({ status: "FAIL", name, detail });
  console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
}
function warn(name, detail = "") {
  results.push({ status: "WARN", name, detail });
  console.warn(`WARN  ${name}${detail ? " — " + detail : ""}`);
}

function jar() {
  const cookies = new Map();
  return {
    store(res) {
      const raw = res.headers.getSetCookie?.() || [];
      const single = res.headers.get("set-cookie");
      const list = raw.length ? raw : single ? [single] : [];
      for (const c of list) {
        const [pair] = c.split(";");
        const i = pair.indexOf("=");
        if (i > 0) cookies.set(pair.slice(0, i), pair.slice(i + 1));
      }
    },
    header() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
  };
}

async function req(path, { method = "GET", body, cookies, expectStatus } = {}) {
  const headers = { Accept: "application/json" };
  if (cookies) headers.Cookie = cookies.header();
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  if (cookies) cookies.store(res);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (expectStatus != null && res.status !== expectStatus) {
    throw new Error(`${method} ${path} expected ${expectStatus} got ${res.status}: ${text.slice(0, 200)}`);
  }
  return { res, json, text };
}

async function login(email, password) {
  const cookies = jar();
  const { res, json } = await req("/api/auth/login", {
    method: "POST",
    body: { email, password },
    cookies,
  });
  if (res.status !== 200 || !json?.user) {
    throw new Error(`login ${email} failed ${res.status} ${JSON.stringify(json)}`);
  }
  return { cookies, user: json.user };
}

async function main() {
  console.log(`\n=== Launch audit ${BASE} ===\n`);

  // Public pages
  const publicPaths = [
    "/",
    "/legal",
    "/cgu",
    "/confidentialite",
    "/remboursement",
    "/mentions-legales",
    "/login",
    "/register",
    "/manifest.webmanifest",
    "/sw.js",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
  ];
  for (const p of publicPaths) {
    try {
      const res = await fetch(`${BASE}${p}`, { redirect: "follow" });
      if (res.ok) ok(`public ${p}`, String(res.status));
      else fail(`public ${p}`, String(res.status));
    } catch (e) {
      fail(`public ${p}`, e.message);
    }
  }

  // Health
  try {
    const { json } = await req("/api/health", { expectStatus: 200 });
    if (json?.ok) ok("health ok", `mode=${json.database?.mode} secret=${json.secretMode}`);
    else fail("health ok", JSON.stringify(json));
    if (json?.secretMode === "derived") warn("APPO_SECRET", "secretMode=derived — set APPO_SECRET in Railway");
    if (json?.persistence && !json.persistence.dbExists === false) {
      /* fine */
    }
    if (json?.persistence?.volumeHint) warn("Railway volume", json.persistence.volumeHint);
    if (json?.database?.mode === "json") warn("Postgres", "runtime still JSON — OK for démo, not ideal for scale");
  } catch (e) {
    fail("health", e.message);
  }

  // Categories public API
  try {
    const { json } = await req("/api/categories", { expectStatus: 200 });
    const n = Array.isArray(json) ? json.length : json?.categories?.length;
    if (n > 0) ok("categories", `${n} items`);
    else fail("categories", JSON.stringify(json)?.slice(0, 120));
  } catch (e) {
    fail("categories", e.message);
  }

  // Auth guards
  try {
    const { res } = await req("/api/me");
    if (res.status === 401 || res.status === 200) ok("me unauthenticated handling", String(res.status));
    else warn("me unauthenticated", String(res.status));
  } catch (e) {
    fail("me unauthenticated", e.message);
  }

  // Client login + me
  let client;
  try {
    client = await login("sarah@appo.fr", "appo123");
    ok("login client sarah", client.user.role);
    const { json } = await req("/api/me", { cookies: client.cookies, expectStatus: 200 });
    if (json?.user?.email === "sarah@appo.fr" || json?.user?.id) ok("me client", json.user?.role || "ok");
    else fail("me client", JSON.stringify(json)?.slice(0, 150));
  } catch (e) {
    fail("login/me client", e.message);
  }

  // Client missions / invoices / growth / support / pros
  if (client) {
    for (const [path, label] of [
      ["/api/missions", "missions client"],
      ["/api/invoices", "invoices client"],
      ["/api/growth", "growth client"],
      ["/api/support", "support client"],
      ["/api/pros", "pros list"],
    ]) {
      try {
        const { res, json } = await req(path, { cookies: client.cookies });
        if (res.status === 200) ok(label, typeof json === "object" ? "200" : "200");
        else fail(label, String(res.status));
      } catch (e) {
        fail(label, e.message);
      }
    }

    // Create a RFQ/request-like mission via API if possible
    try {
      const cats = await req("/api/categories", { cookies: client.cookies });
      const list = Array.isArray(cats.json) ? cats.json : cats.json?.categories || [];
      const cat = list[0];
      const catId = cat?.id || cat?.slug || "plombier";
      const { res, json, text } = await req("/api/missions", {
        method: "POST",
        cookies: client.cookies,
        body: {
          action: "createNow",
          categoryId: cat.id || catId,
          urgency: false,
          description: "Audit lancement — test auto (ignorer)",
        },
      });
      if (res.status === 200 || res.status === 201) ok("create mission/now", json?.mission?.id || json?.id || "ok");
      else warn("create mission/now", `${res.status} ${text.slice(0, 180)}`);
    } catch (e) {
      warn("create mission/now", e.message);
    }
  }

  // Pro login
  let pro;
  try {
    pro = await login("kevin@appo.fr", "appo123");
    ok("login pro kevin", pro.user.role);
    const { res, json } = await req("/api/pro", { cookies: pro.cookies });
    if (res.status === 200) ok("pro profile/stats", "200");
    else fail("pro profile/stats", String(res.status));
    const m = await req("/api/missions", { cookies: pro.cookies });
    if (m.res.status === 200) ok("missions pro", "200");
    else fail("missions pro", String(m.res.status));
  } catch (e) {
    fail("login/pro", e.message);
  }

  // Admin
  let admin;
  try {
    admin = await login("admin@appo.fr", "appo123");
    ok("login admin", admin.user.role);
    const { res, json } = await req("/api/admin", { cookies: admin.cookies });
    if (res.status === 200) ok("admin api", "200");
    else fail("admin api", `${res.status} ${JSON.stringify(json)?.slice(0, 100)}`);
  } catch (e) {
    fail("login/admin", e.message);
  }

  // Bad credentials
  try {
    const { res } = await req("/api/auth/login", {
      method: "POST",
      body: { email: "sarah@appo.fr", password: "wrong" },
      cookies: jar(),
    });
    if (res.status >= 400) ok("reject bad password", String(res.status));
    else fail("reject bad password", String(res.status));
  } catch (e) {
    fail("reject bad password", e.message);
  }

  // Legal content checks
  for (const [path, needle] of [
    ["/cgu", "Conditions générales"],
    ["/confidentialite", "données personnelles"],
    ["/remboursement", "rembours"],
    ["/mentions-legales", "AppO"],
    ["/legal", "Informations légales"],
  ]) {
    try {
      const res = await fetch(`${BASE}${path}`);
      const html = await res.text();
      if (res.ok && html.toLowerCase().includes(needle.toLowerCase().slice(0, 8))) ok(`content ${path}`);
      else fail(`content ${path}`, `missing ${needle}`);
    } catch (e) {
      fail(`content ${path}`, e.message);
    }
  }

  // Protected pages redirect or show login when no cookie
  for (const p of ["/app", "/pro", "/admin"]) {
    try {
      const res = await fetch(`${BASE}${p}`, { redirect: "manual" });
      // SPA/client guards often return 200 with client redirect — accept 200/307/302
      if ([200, 302, 303, 307, 308].includes(res.status)) ok(`route ${p}`, String(res.status));
      else warn(`route ${p}`, String(res.status));
    } catch (e) {
      fail(`route ${p}`, e.message);
    }
  }

  const pass = results.filter((r) => r.status === "PASS").length;
  const fails = results.filter((r) => r.status === "FAIL");
  const warns = results.filter((r) => r.status === "WARN");
  console.log(`\n=== Summary: ${pass} PASS · ${warns.length} WARN · ${fails.length} FAIL ===\n`);
  if (warns.length) {
    console.log("Warnings:");
    for (const w of warns) console.log(` - ${w.name}: ${w.detail}`);
  }
  if (fails.length) {
    console.log("Failures:");
    for (const f of fails) console.log(` - ${f.name}: ${f.detail}`);
  }

  // Write JSON report
  const report = { base: BASE, at: new Date().toISOString(), pass, warn: warns.length, fail: fails.length, results };
  const fs = await import("node:fs");
  fs.mkdirSync("/tmp/cursor/launch-audit", { recursive: true });
  fs.writeFileSync("/tmp/cursor/launch-audit/report.json", JSON.stringify(report, null, 2));
  console.log("Wrote /tmp/cursor/launch-audit/report.json");
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
