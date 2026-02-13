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
get(child(ref(db), 'health')).then((snapshot) => {
	if (snapshot.exists()) {
		health = snapshot.val();
	} else {
		set(ref(db, 'health'), health);
	}
});

get(child(ref(db), 'gameActive')).then((snapshot) => {
	if (snapshot.exists()) {
		gameActive = snapshot.val();
	} else {
		set(ref(db, 'gameActive'), gameActive);
	}
});

// Helper to update health based on time
const updateGameState = async () => {
    try {
        const [healthSnap, activeSnap, lastUpdateSnap] = await Promise.all([
            get(child(ref(db), 'health')),
            get(child(ref(db), 'gameActive')),
            get(child(ref(db), 'lastUpdate'))
        ]);

        let currentHealth = healthSnap.exists() ? healthSnap.val() : 100;
        let isActive = activeSnap.exists() ? activeSnap.val() : true;
        let lastUpdate = lastUpdateSnap.exists() ? lastUpdateSnap.val() : Date.now();

        if (isActive && currentHealth > 0) {
            const now = Date.now();
            const elapsed = now - lastUpdate;
            if (elapsed >= 1000) { // Update every 1 second
                const ticks = Math.floor(elapsed / 1000);
                if (ticks > 0) {
                    currentHealth = Math.max(0, currentHealth - ticks);
                    await set(ref(db, 'health'), currentHealth);
                    await set(ref(db, 'lastUpdate'), now);
                }
            }
        }
        return currentHealth;
    } catch (e) {
        console.error("Error updating game state:", e);
        return 0;
    }
};

app.post("/start", (req, res) => {
	gameActive = true;
	health = 100;
	set(ref(db, 'health'), health);
	set(ref(db, 'gameActive'), gameActive);
    set(ref(db, 'lastUpdate'), Date.now());
	res.json({ message: "Game started", health });
});

app.get("/health", async (req, res) => {
	try {
        // Trigger generic update
        await updateGameState();

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

app.post("/repair", async (req: express.Request, res: express.Response) => {
    await updateGameState();
    // Get latest state first
    const snapshot = await get(child(ref(db), 'health'));
    if (snapshot.exists()) {
        health = snapshot.val();
    }

	health = Math.min(100, health + 5);
	set(ref(db, 'health'), health);

	res.json({ message: "Repair initiated", health });
});

app.post("/attack", verifyPoW, async (req: express.Request, res: express.Response) => {
    await updateGameState();
    // Get latest state first
    const snapshot = await get(child(ref(db), 'health'));
    if (snapshot.exists()) {
        health = snapshot.val();
    }

	health = Math.max(0, health - 10);
	set(ref(db, 'health'), health);

	res.json({ message: "Attack launched", health });
});

if (process.env.NODE_ENV !== 'production') {
	app.listen(port, () => {
		console.log(`Listening on port ${port}...`);
	});
}

export default app;
