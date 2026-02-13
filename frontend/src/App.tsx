import { useEffect, useState } from "react";
import "./App.css";
import Healthbar from "./components/healthbar";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

function App() {
  const [health, setHealth] = useState(100);
  const [ram, setRam] = useState(32);
  const [ping, setPing] = useState(20);
  const [challenge, setChallenge] = useState("");
  const [nonce, setNonce] = useState("");
  const [attackStatus, setAttackStatus] = useState("");

  const getChallenge = async () => {
    try {
      setAttackStatus("Fetching challenge...");
      const response = await fetch("http://localhost:3000/challenge");
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setChallenge(data.challenge);
      setAttackStatus("Challenge received!");
    } catch (error: any) {
      console.error("Error fetching challenge:", error);
      setAttackStatus(`Error: ${error.message}. Is backend running?`);
    }
  };

  const restartGame = async () => {
    const reposne = await fetch("http://localhost:3000/start", {
      method: "POST",
    });
    const data = await reposne.json();
    if (reposne.ok) {
      setHealth(data.health);
      setAttackStatus("System rebooted. Health reset to 100%.");
    } else {
      setAttackStatus("Failed to reboot system");
    }
  };

  const repairSystem = async () => {
    try {
      setAttackStatus("Initiating repair...");
      const response = await fetch("http://localhost:3000/repair", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setAttackStatus(`Repair successful! Health: ${data.health}%`);
      } else {
        setAttackStatus("Repair failed");
      }
    } catch (error: any) {
      console.error("Error repairing:", error);
      setAttackStatus("Network error during repair");
    }
  };

  const sendAttack = async () => {
    if (!challenge || !nonce) {
      setAttackStatus("Need challenge and nonce");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/attack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-challenge": challenge,
          "x-nonce": nonce,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAttackStatus("Attack successful! Health: " + data.health);
        setChallenge("");
        setNonce("");
      } else {
        setAttackStatus("Attack failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error sending attack:", error);
      setAttackStatus("Network error during attack");
    }
  };

  useEffect(() => {
    const healthRef = ref(db, "health");
    const unsubscribe = onValue(
      healthRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setHealth(snapshot.val());
        } else {
          setHealth(0);
        }
      },
      (error) => {
        console.log("Firebase error:", error);
        setHealth(0);
      },
    );

    const interval = setInterval(() => {
      setRam(Math.floor(Math.random() * (64 - 16 + 1) + 16)); // 16-64GB
      setPing(Math.floor(Math.random() * (32 - 10 + 1) + 10));
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white font-mono p-8">
      <div className="mb-12 text-center">
        <h1 className="text-8xl font-bold tracking-tighter mb-4 text-green-500">
          HEALTH: {health}%
        </h1>
        <div className="text-gray-500 tracking-[0.5em] uppercase text-sm">
          System Operational
        </div>
        {health > 0 && health < 100 && (
          <button
            onClick={repairSystem}
            className="mt-6 px-8 py-2 bg-blue-900 hover:bg-blue-800 border border-blue-700 text-white text-xs uppercase tracking-widest transition-all font-bold rounded"
          >
            MANUAL REPAIR (+5%)
          </button>
        )}
      </div>

      <div className="w-full max-w-3xl mb-12">
        <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase tracking-widest">
          <span>{health <= 0 ? "System Failure" : "System Integrity"}</span>
          <span
            className={
              health <= 0 ? "text-red-500 animate-pulse" : "text-green-500"
            }
          >
            {health <= 0 ? "CRITICAL" : "Stable"}
          </span>
        </div>
        <Healthbar health={health} />
        {health <= 0 && (
          <button
            onClick={restartGame}
            className="w-full mt-4 py-3 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest transition-all animate-bounce"
          >
            REBOOT SYSTEM (RESTART)
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-3xl text-center border-t border-gray-900 pt-8">
        <div>
          <div className="text-gray-600 text-xs uppercase tracking-widest mb-1">
            RAM LOA
          </div>
          <div className="text-3xl font-bold">{ram} GB</div>
        </div>
        <div>
          <div className="text-gray-600 text-xs uppercase tracking-widest mb-1">
            UPTIME
          </div>
          <div className="text-3xl font-bold">99.9%</div>
        </div>
        <div>
          <div className="text-gray-600 text-xs uppercase tracking-widest mb-1">
            PING
          </div>
          <div className="text-3xl font-bold">{ping} ms</div>
        </div>
      </div>

      <div className="w-full max-w-3xl mt-12 p-6 border border-gray-900 bg-gray-950 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-red-500 uppercase tracking-widest">
          Infiltration Module
        </h2>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <button
              onClick={getChallenge}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs uppercase tracking-widest transition-colors font-bold"
            >
              Get PoW Challenge
            </button>
            <div className="flex-1 bg-black border border-gray-900 p-2 text-xs font-mono text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">
              Challenge: {challenge || "none"}
            </div>
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter Nonce..."
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="flex-1 bg-black border border-gray-800 p-2 text-sm font-mono focus:outline-none focus:border-red-900 text-white"
            />
            <button
              onClick={sendAttack}
              className="px-8 py-2 bg-red-900 hover:bg-red-800 text-white text-xs uppercase tracking-widest transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!challenge || !nonce}
            >
              Execute Attack
            </button>
          </div>

          {attackStatus && (
            <div
              className={`text-xs mt-2 uppercase tracking-widest font-bold ${attackStatus.includes("Error") || attackStatus.includes("failed") ? "text-red-500" : "text-green-500"}`}
            >
              {attackStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
