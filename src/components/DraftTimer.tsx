import { memo } from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

interface DraftTimerProps {
  timeRemaining: number;
  isActive: boolean;
  isWarning: boolean;
  showExpired: boolean;
  currentPicker: number;
  currentRound: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const DraftTimer = memo(({
  timeRemaining,
  isActive,
  isWarning,
  showExpired,
  currentPicker,
  currentRound,
  onStart,
  onStop,
  onReset
}: DraftTimerProps) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Draft Timer
        </h3>
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Timer Running</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Timer Stopped</span>
            </>
          )}
        </div>
      </div>

      {/* Large Timer Display */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-4 text-center">
        <div className={`text-6xl font-bold mb-2 ${
          showExpired 
            ? 'text-red-600 animate-pulse' 
            : isWarning 
              ? 'text-yellow-600' 
              : isActive
                ? 'text-green-600'
                : 'text-gray-600'
        }`}>
          {showExpired ? 'TIME!' : formatTime(timeRemaining)}
        </div>
        <div className="text-lg font-semibold text-gray-700">
          Team {currentPicker} • Round {currentRound}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex gap-2 justify-center">
        {!isActive ? (
          <button
            onClick={onStart}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Pause className="w-4 h-4" />
            Stop
          </button>
        )}
        
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
});

DraftTimer.displayName = 'DraftTimer';

export default DraftTimer;