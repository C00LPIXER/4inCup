/**
 * copy-prod-to-test.cjs
 *
 * Copies ALL production Firestore data → test_ collections.
 *
 * Collections copied:
 *   championships  → test_championships
 *   players        → test_players
 *   teams          → test_teams
 *   matches        → test_matches
 *   admins         → test_admins  (requires admin sign-in for auth)
 *
 * Usage:
 *   node scripts/copy-prod-to-test.cjs
 *
 * Requires .env with VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID
 */

"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── .env loader ──────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
  return env;
}

// ─── HTTPS request helper ─────────────────────────────────────────────────────
function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Firestore REST helpers ───────────────────────────────────────────────────
const FS_HOST = "firestore.googleapis.com";

/** Extract doc ID from Firestore resource name */
function docId(name) {
  return name.split("/").pop();
}

/** List ALL documents in a collection (handles pagination) */
async function listCollection(projectId, collection, apiKey, authToken) {
  const docs = [];
  let pageToken = null;
  do {
    let p = `/v1/projects/${projectId}/databases/(default)/documents/${collection}?key=${apiKey}&pageSize=300`;
    if (pageToken) p += `&pageToken=${encodeURIComponent(pageToken)}`;
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
    const res = await request({ hostname: FS_HOST, path: p, method: "GET", headers });
    if (res.status !== 200) {
      console.warn(`  ⚠️  List ${collection} → HTTP ${res.status}: ${JSON.stringify(res.body).slice(0, 120)}`);
      break;
    }
    if (res.body.documents) docs.push(...res.body.documents);
    pageToken = res.body.nextPageToken || null;
  } while (pageToken);
  return docs;
}

/** Delete a document by its full Firestore resource name */
async function deleteDocument(projectId, resourceName, apiKey, authToken) {
  // resourceName = "projects/P/databases/(default)/documents/COLL/ID"
  const p = `/v1/${resourceName}?key=${apiKey}`;
  const headers = {};
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await request({ hostname: FS_HOST, path: p, method: "DELETE", headers });
  return res.status === 200 || res.status === 204;
}

/** Write (PATCH) a document with the given fields */
async function writeDocument(projectId, collection, id, fields, apiKey, authToken) {
  const p = `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}?key=${apiKey}`;
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await request({ hostname: FS_HOST, path: p, method: "PATCH", headers }, { fields });
  return res.status === 200;
}

// ─── Sign-in helper ───────────────────────────────────────────────────────────
async function signIn(apiKey, email, password) {
  const res = await request(
    {
      hostname: "identitytoolkit.googleapis.com",
      path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email, password, returnSecureToken: true }
  );
  if (res.status === 200) return res.body.idToken;
  throw new Error(`Sign-in failed: ${JSON.stringify(res.body)}`);
}

// ─── Copy one collection ──────────────────────────────────────────────────────
async function copyCollection(projectId, fromColl, toColl, apiKey, authToken, opts = {}) {
  console.log(`\n📦  ${fromColl}  →  ${toColl}`);

  // 1. Read production docs
  process.stdout.write("     Reading production... ");
  const prodDocs = await listCollection(projectId, fromColl, apiKey, authToken);
  console.log(`${prodDocs.length} docs found.`);

  if (prodDocs.length === 0) {
    console.log("     ⏭️  Nothing to copy.");
    return { copied: 0, deleted: 0 };
  }

  // 2. Clear existing test docs (optional but default)
  if (opts.clearFirst !== false) {
    process.stdout.write("     Clearing test collection... ");
    const testDocs = await listCollection(projectId, toColl, apiKey, authToken);
    let delCount = 0;
    for (const d of testDocs) {
      // d.name = "projects/P/databases/(default)/documents/COLL/ID"
      const ok = await deleteDocument(projectId, d.name, apiKey, authToken);
      if (ok) delCount++;
    }
    console.log(`${delCount}/${testDocs.length} deleted.`);
  }

  // 3. Write production docs to test collection
  process.stdout.write(`     Copying ${prodDocs.length} docs`);
  let copied = 0;
  let failed = 0;
  for (const d of prodDocs) {
    const id = docId(d.name);
    const ok = await writeDocument(projectId, toColl, id, d.fields || {}, apiKey, authToken);
    if (ok) {
      copied++;
      if (copied % 10 === 0) process.stdout.write(".");
    } else {
      failed++;
      console.warn(`\n     ❌  Failed to copy doc ${id}`);
    }
  }
  console.log(` ✅  ${copied} copied${failed > 0 ? `, ${failed} failed` : ""}.`);
  return { copied, failed };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();
  const API_KEY = env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const ADMIN_EMAIL = "4indegree@4incup.com";
  const ADMIN_PASSWORD = "11223344";

  if (!API_KEY || !PROJECT_ID) {
    console.error("❌  Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in .env");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║    4inCup  — Production → Test Data Copy     ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`   Project : ${PROJECT_ID}`);

  // Sign in as admin (needed for admins/test_admins collection)
  console.log("\n🔐  Signing in as admin to access protected collections...");
  let authToken = null;
  try {
    authToken = await signIn(API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log("   ✅  Signed in.");
  } catch (e) {
    console.warn(`   ⚠️  Could not sign in: ${e.message}`);
    console.warn("        admins collection will be skipped (requires auth).");
  }

  const results = {};

  // ── Open collections (no auth required by Firestore rules) ─────────────────
  for (const coll of ["championships", "players", "teams", "matches"]) {
    try {
      results[coll] = await copyCollection(PROJECT_ID, coll, `test_${coll}`, API_KEY, null);
    } catch (e) {
      console.error(`   ❌  Error copying ${coll}: ${e.message}`);
      results[coll] = { error: e.message };
    }
  }

  // ── Admins (requires auth token) ────────────────────────────────────────────
  if (authToken) {
    try {
      results["admins"] = await copyCollection(PROJECT_ID, "admins", "test_admins", API_KEY, authToken);
    } catch (e) {
      console.error(`   ❌  Error copying admins: ${e.message}`);
      results["admins"] = { error: e.message };
    }
  } else {
    console.log("\n⏭️   Skipping admins (no auth token).");
    results["admins"] = { skipped: true };
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║                   Summary                   ║");
  console.log("╚══════════════════════════════════════════════╝");
  const cols = ["championships", "players", "teams", "matches", "admins"];
  let totalCopied = 0;
  for (const c of cols) {
    const r = results[c];
    if (!r) continue;
    if (r.skipped) {
      console.log(`   ⏭️  ${c.padEnd(16)} skipped`);
    } else if (r.error) {
      console.log(`   ❌  ${c.padEnd(16)} ERROR: ${r.error}`);
    } else {
      totalCopied += r.copied || 0;
      const status = (r.failed || 0) > 0 ? "⚠️ " : "✅ ";
      console.log(`   ${status} ${c.padEnd(16)} ${r.copied} docs copied${r.failed ? `, ${r.failed} failed` : ""}`);
    }
  }
  console.log(`\n   🎉  Done! ${totalCopied} total docs copied to test collections.`);
  console.log("        Switch to test by setting VITE_DATASET=test in .env\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
