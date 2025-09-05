import admin from "firebase-admin";
import { createRequire } from "module";

let initializedAdmin = null;

try {
  if (!admin.apps.length) {
    const require = createRequire(import.meta.url);
    const serviceAccount = require("./serviceAccountKey.json");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("[Server] ✅ Firebase Admin SDK initialized successfully.");
  }

  initializedAdmin = admin;
} catch (error) {
  console.error("[Server] ❌ CRITICAL: Firebase Admin SDK initialization failed.");
  console.error(error.message);
}

export default initializedAdmin;
