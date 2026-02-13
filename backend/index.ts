import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { createHash, randomBytes } from "crypto";
import { db } from "./firebase.js";
import { ref, push, set, get, child, serverTimestamp } from "firebase/database";

const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "x-challenge", "x-nonce"]
}));
app.use(express.json());
const port = 3000;

let health = 100;
let gameActive = true;

// Sync initial state
get(child(ref(db), 'status')).then((snapshot) => {
	if (snapshot.exists()) {
		const data = snapshot.val();
		health = data.health;
		gameActive = data.gameActive;
	} else {
		set(ref(db, 'status'), { health, gameActive });
	}
});

// NOTE: setInterval might not run reliably on Serverless (Vercel)
// Consider using a scheduled task (Cron) or timestamp-based calculation for production
setInterval(async () => {
    // Refresh state from DB to ensure we have latest allowed/blocked status (if multiple instances)
    const snapshot = await get(child(ref(db), 'status'));
    if(snapshot.exists()) {
        const data = snapshot.val();
        gameActive = data.gameActive;
        health = data.health;
    }

	if (gameActive && health > 0) {
		health = Math.max(0, health - 1);
		// Update DB
        set(ref(db, 'status'), { health, gameActive });
	}
}, 2000);

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

const DIFFICULTY = 4; // Number of leading zeros required (adjust for load)
const PREFIX = "0".repeat(DIFFICULTY);
const activeChallenges = new Set<string>();

app.get("/challenge", (req, res) => {
	const challenge = randomBytes(16).toString("hex");
	activeChallenges.add(challenge);

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
		activeChallenges.delete(challenge);
		next();
	} else {
		res.status(403).json({ error: "Invalid Proof of Work solution" });
	}
};

app.post("/start", (req, res) => {
	gameActive = true;
	health = 100;
	set(ref(db, 'status'), { health, gameActive });
	res.json({ message: "Game started", health });
});

app.get("/health", async (req, res) => {
	try {
		const snapshot = await get(child(ref(db), 'status'));
        let currentHealth = health;
        let currentGameActive = gameActive;

		if (snapshot.exists()) {
            const data = snapshot.val();
            currentHealth = data.health;
            currentGameActive = data.gameActive;
            
            // Sync local memory
            health = currentHealth;
            gameActive = currentGameActive;
        }

		if (currentHealth <= 0) {
			res.json({ status: "SYSTEM DOWN", health: 0 });
		} else {
			res.json({ status: "OK", health: currentHealth });
		}
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch health status" });
	}
});

app.post("/repair", async (req: express.Request, res: express.Response) => {
    // Get latest state first
    const snapshot = await get(child(ref(db), 'status'));
    if (snapshot.exists()) {
        health = snapshot.val().health;
        gameActive = snapshot.val().gameActive;
    }

	health = Math.min(100, health + 5);
	set(ref(db, 'status'), { health, gameActive });

	res.json({ message: "Repair initiated", health });
});

app.post("/attack", verifyPoW, async (req: express.Request, res: express.Response) => {
    // Get latest state first
    const snapshot = await get(child(ref(db), 'status'));
    if (snapshot.exists()) {
        health = snapshot.val().health;
        gameActive = snapshot.val().gameActive;
    }

	health = Math.max(0, health - 10);
	set(ref(db, 'status'), { health, gameActive });

	res.json({ message: "Attack launched", health });
});

if (process.env.NODE_ENV !== 'production') {
	app.listen(port, () => {
		console.log(`Listening on port ${port}...`);
	});
}

export default app;
