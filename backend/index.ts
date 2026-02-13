import express from "express";
import rateLimit from "express-rate-limit";
import { createHash, randomBytes } from "crypto";
import { db } from "./firebase";
import { ref, push, set, get, child, serverTimestamp } from "firebase/database";

const app = express();
app.use(express.json()); // Enable JSON body parsing for the solution
const port = 3000;

// Game State
let health = 100;

// Initialize health from DB
get(child(ref(db), 'health')).then((snapshot) => {
  if (snapshot.exists()) {
    health = snapshot.val();
  } else {
    set(ref(db, 'health'), health);
  }
});

// Decay logic: -1% every 2 seconds
setInterval(() => {
  if (health > 0) {
    health = Math.max(0, health - 1);
    set(ref(db, 'health'), health);
  }
}, 2000);

// Rate limiter: 100 requests per 15 minutes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(limiter);

// --- Proof of Work Implementation ---
const DIFFICULTY = 4; // Number of leading zeros required (adjust for load)
const PREFIX = "0".repeat(DIFFICULTY);
const activeChallenges = new Set<string>();

app.get("/challenge", (req, res) => {
  const challenge = randomBytes(16).toString("hex");
  activeChallenges.add(challenge);
  
  // Expire challenge after 2 minutes
  setTimeout(() => activeChallenges.delete(challenge), 2 * 60 * 1000);
  
  res.json({ challenge, difficulty: DIFFICULTY });
});

const verifyPoW = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const challenge = req.headers["x-challenge"] as string;
  const nonce = req.headers["x-nonce"] as string;

  if (!challenge || !nonce) {
     res.status(400).json({ error: "Missing Proof of Work headers (x-challenge, x-nonce)" });
     return;
  }

  if (!activeChallenges.has(challenge)) {
     res.status(403).json({ error: "Invalid or expired challenge" });
     return;
  }

  const hash = createHash("sha256").update(challenge + nonce).digest("hex");
  
  if (hash.startsWith(PREFIX)) {
    activeChallenges.delete(challenge); // Prevent replay
    next();
  } else {
    res.status(403).json({ error: "Invalid Proof of Work solution" });
  }
};

app.get("/health", async (req, res) => {
  try {
    const snapshot = await get(child(ref(db), 'health'));
    const currentHealth = snapshot.exists() ? snapshot.val() : health;
    
    // Sync local state if needed
    if (snapshot.exists()) health = currentHealth;

    if (currentHealth <= 0) {
      res.json({ status: "SYSTEM DOWN", health: 0 });
    } else {
      res.json({ status: "OK", health: currentHealth });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch health status" });
  }
});

app.post("/repair", (req, res) => {
  health = Math.min(100, health + 5);
  set(ref(db, 'health'), health);
  
  res.json({ message: "Repair initiated", health });
});

app.post("/attack", verifyPoW, (req, res) => {
  health = Math.max(0, health - 10);
  set(ref(db, 'health'), health);

  res.json({ message: "Attack launched", health });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
