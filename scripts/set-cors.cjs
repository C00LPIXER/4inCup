// Apply CORS configuration to Firebase Storage bucket
// Reads token from firebase-tools configstore

const https = require("https");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BUCKET = "netflix-bde1c.appspot.com";

const CORS_CONFIG = {
  cors: [
    {
      origin: ["*"],
      method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
      responseHeader: [
        "Content-Type",
        "Authorization",
        "x-goog-resumable",
        "x-goog-meta-firebaseStorageDownloadTokens",
      ],
      maxAgeSeconds: 3600,
    },
  ],
};

async function main() {
  // Read token from firebase-tools configstore
  console.log("Reading Firebase credentials...");
  const configPath = path.join(
    os.homedir(),
    ".config",
    "configstore",
    "firebase-tools.json"
  );

  if (!fs.existsSync(configPath)) {
    console.error("Firebase config not found at:", configPath);
    console.error("Make sure you ran: npx firebase-tools login");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const token = config?.tokens?.access_token;

  if (!token) {
    console.error("No access token found. Make sure you ran: npx firebase-tools login");
    process.exit(1);
  }

  console.log("Token obtained. Applying CORS config to bucket:", BUCKET);

  const body = JSON.stringify(CORS_CONFIG);
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(BUCKET)}?fields=cors`;

  const options = {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  await new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log("✅ CORS config applied successfully!");
          console.log("Response:", JSON.parse(data));
          resolve(data);
        } else {
          console.error("❌ Failed to apply CORS config. Status:", res.statusCode);
          console.error("Response:", data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
