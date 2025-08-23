import { memo, useMemo, useCallback } from 'react';
import { Settings } from 'lucide-react';

interface SimulationSpeedControlsProps {
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

const SimulationSpeedControls = memo<SimulationSpeedControlsProps>(({ 
  simulationSpeed, 
  onSpeedChange, 
  disabled = false 
}) => {
  const speedOptions = useMemo(() => [
    { value: 500, label: 'Very Fast (0.5s)', description: 'Blazing speed' },
    { value: 1000, label: 'Fast (1s)', description: 'Quick simulation' },
    { value: 1500, label: 'Normal (1.5s)', description: 'Balanced pace' },
    { value: 2500, label: 'Slow (2.5s)', description: 'Easy to follow' },
    { value: 4000, label: 'Very Slow (4s)', description: 'Step by step' }
  ], []);

  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onSpeedChange(Number(e.target.value));
  }, [onSpeedChange]);

  const currentSpeedOption = useMemo(() => 
    speedOptions.find(option => option.value === simulationSpeed), 
    [speedOptions, simulationSpeed]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4 text-gray-600" />
        <label className="block text-sm font-medium text-gray-700">
          Simulation Speed
        </label>
      </div>
      
      <select
        value={simulationSpeed}
        onChange={handleSpeedChange}
        disabled={disabled}
        className={`w-full py-2 px-3 border rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 ${
          disabled 
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
        }`}
      >
        {speedOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {currentSpeedOption && (
        <p className="text-xs text-gray-500 mt-1">
          {currentSpeedOption.description}
        </p>
      )}
    </div>
  );
});

SimulationSpeedControls.displayName = 'SimulationSpeedControls';

export { SimulationSpeedControls };