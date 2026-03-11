/**
 * seed-admin.cjs
 *
 * One-time script to:
 *  1. Create the admin user in Firebase Authentication
 *     (email: 4indegree@4incup.com / password: 11223344)
 *  2. Write their record to the Firestore "admins" collection
 *
 * Usage:
 *   node scripts/seed-admin.cjs
 *
 * Requires: VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID
 * in your .env file (or set as environment variables).
 */

"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── Read .env ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const env = {};
  if (fs.existsSync(envPath)) {
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
  }
  return env;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const env = loadEnv();

  const API_KEY = env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const DATASET = env.VITE_DATASET || process.env.VITE_DATASET || "production";
  const DB_PREFIX = DATASET === "test" ? "test_" : "";
  const adminsCollection = `${DB_PREFIX}admins`;

  if (!API_KEY || !PROJECT_ID) {
    console.error(
      "❌  Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID.\n" +
        "    Make sure your .env file exists in the project root."
    );
    process.exit(1);
  }

  const ADMIN_EMAIL = "4indegree@4incup.com";
  const ADMIN_PASSWORD = "11223344";
  const ADMIN_USERNAME = "4indegree";

  // ── Step 1: Create Firebase Auth user ───────────────────────────────────────
  console.log("⏳  Creating Firebase Auth user...");
  const signUpRes = await request(
    {
      hostname: "identitytoolkit.googleapis.com",
      path: `/v1/accounts:signUp?key=${API_KEY}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }
  );

  let uid;
  let idToken;
  if (signUpRes.status === 200) {
    uid = signUpRes.body.localId;
    idToken = signUpRes.body.idToken;
    console.log(`✅  Auth user created  (uid: ${uid})`);
  } else if (signUpRes.body.error?.message === "EMAIL_EXISTS") {
    console.log("ℹ️   Auth user already exists — signing in to get token...");
    const signInRes = await request(
      {
        hostname: "identitytoolkit.googleapis.com",
        path: `/v1/accounts:signInWithPassword?key=${API_KEY}`,
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true }
    );
    if (signInRes.status !== 200) {
      console.error("❌  Could not sign in:", JSON.stringify(signInRes.body));
      process.exit(1);
    }
    uid = signInRes.body.localId;
    idToken = signInRes.body.idToken;
    console.log(`✅  Existing uid: ${uid}`);
  } else {
    console.error("❌  Auth signup failed:", JSON.stringify(signUpRes.body));
    process.exit(1);
  }

  // ── Step 2: Write to Firestore "admins" collection ───────────────────────────
  console.log(`⏳  Writing to Firestore "${adminsCollection}" collection (dataset: ${DATASET})...`);

  const firestoreBody = {
    fields: {
      username: { stringValue: ADMIN_USERNAME },
      email: { stringValue: ADMIN_EMAIL },
      uid: { stringValue: uid },
      role: { stringValue: "admin" },
      createdAt: { integerValue: String(Date.now()) },
    },
  };

  const fsRes = await request(
    {
      hostname: "firestore.googleapis.com",
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${adminsCollection}/${uid}`,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
    },
    firestoreBody
  );

  if (fsRes.status === 200) {
    console.log("✅  Firestore admins record saved.");
  } else {
    console.error("❌  Firestore write failed:", JSON.stringify(fsRes.body));
    process.exit(1);
  }

  console.log("\n🎉  Admin seeded successfully!");
  console.log(`    Username : ${ADMIN_USERNAME}`);
  console.log(`    Email    : ${ADMIN_EMAIL}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log(
    "\n    You can now sign in at /admin (it will redirect to /admin/login)."
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
