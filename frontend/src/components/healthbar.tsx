interface HealthbarProps {
  health: number;
}

function Healthbar({ health }: HealthbarProps) {
  return (
    <div className="w-full h-8 bg-gray-900 border border-gray-800 p-1">
      <div
        className="h-full bg-white transition-all duration-700 ease-out"
        style={{ width: `${health}%` }}
      />
    </div>
  );
}

export default Healthbar;
