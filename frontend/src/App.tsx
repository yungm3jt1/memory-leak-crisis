import { useEffect, useState } from "react";
import "./App.css";
import Healthbar from "./components/healthbar";
import healthApi from "./api/health";

function App() {
  const [health, setHealth] = useState(100);
  const [ram, setRam] = useState(32);
  const [ping, setPing] = useState(20);
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await healthApi.getHealth();
        setHealth(parseInt(response.data.status));
      } catch (error) {
        setHealth(0);
        console.log("jakis blad");
      }
    };
    checkHealth();

    const interval = setInterval(() => {
      setRam(Math.floor(Math.random() * (64 - 16 + 1) + 16)); // 16-64GB
      setPing(Math.floor(Math.random() * (32 - 10 + 1) + 10));
    }, 2000);
    return () => clearInterval(interval);
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
      </div>

      <div className="w-full max-w-3xl mb-12">
        <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase tracking-widest">
          <span>System Integrity</span>
          <span>Stable</span>
        </div>
        <Healthbar health={health} />
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
    </div>
  );
}

export default App;
