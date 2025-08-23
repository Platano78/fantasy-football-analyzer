import { memo, useEffect, useRef, useCallback } from 'react';
import { Clock, Play, Pause, RotateCcw, Volume2, VolumeX, SkipForward, AlertTriangle } from 'lucide-react';

interface DraftTimerProps {
  timeRemaining: number;
  isActive: boolean;
  isWarning: boolean;
  showExpired: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onTick: () => void;
  onExpired: () => void;
  audioEnabled?: boolean;
  timePerPick: number;
  currentPicker?: number;
  currentRound?: number;
  totalPicks?: number;
  currentPickNumber?: number;
  warningThreshold?: number;
  autoAdvance?: boolean;
  onSkip?: () => void;
  onAudioToggle?: (enabled: boolean) => void;
  className?: string;
  size?: 'compact' | 'normal' | 'large';
}

const DraftTimer = memo(({
  timeRemaining,
  isActive,
  isWarning,
  showExpired,
  onStart,
  onStop,
  onReset,
  onTick,
  onExpired,
  audioEnabled = true,
  timePerPick,
  currentPicker = 1,
  currentRound = 1,
  totalPicks,
  currentPickNumber,
  warningThreshold = 15,
  autoAdvance = true,
  onSkip,
  onAudioToggle,
  className = '',
  size = 'normal'
}: DraftTimerProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(timeRemaining);

  // Initialize AudioContext
  useEffect(() => {
    if (typeof window !== 'undefined' && audioEnabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not available:', error);
      }
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioEnabled]);

  // Audio alert functions
  const playWarningSound = useCallback(() => {
    if (!audioEnabled || !audioContextRef.current) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Warning sound failed:', error);
    }
  }, [audioEnabled]);

  const playExpiredSound = useCallback(() => {
    if (!audioEnabled || !audioContextRef.current) return;

    try {
      const audioContext = audioContextRef.current;
      
      // Play a sequence of beeps for expiration
      [0, 0.2, 0.4].forEach((delay, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600 - (index * 100), audioContext.currentTime + delay);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.15);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + 0.15);
      });
    } catch (error) {
      console.warn('Expired sound failed:', error);
    }
  }, [audioEnabled]);

  const playTickSound = useCallback(() => {
    if (!audioEnabled || !audioContextRef.current || timeRemaining > 5) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('Tick sound failed:', error);
    }
  }, [audioEnabled, timeRemaining]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        onTick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeRemaining, onTick]);

  // Handle timer events
  useEffect(() => {
    // Warning sound
    if (timeRemaining === warningThreshold && lastTickRef.current > warningThreshold) {
      playWarningSound();
    }

    // Expired sound and callback
    if (timeRemaining === 0 && lastTickRef.current > 0) {
      playExpiredSound();
      onExpired();
    }

    // Tick sound for final countdown
    if (timeRemaining <= 5 && timeRemaining > 0 && lastTickRef.current > timeRemaining) {
      playTickSound();
    }

    lastTickRef.current = timeRemaining;
  }, [timeRemaining, warningThreshold, playWarningSound, playExpiredSound, playTickSound, onExpired]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerStateClasses = () => {
    if (showExpired) {
      return 'bg-red-100 border-red-500 animate-pulse';
    }
    if (isWarning) {
      return 'bg-yellow-100 border-yellow-500';
    }
    if (isActive) {
      return 'bg-green-100 border-green-500';
    }
    return 'bg-gray-100 border-gray-300';
  };

  const getTextColorClasses = () => {
    if (showExpired) {
      return 'text-red-600';
    }
    if (isWarning) {
      return 'text-yellow-600';
    }
    if (isActive) {
      return 'text-green-600';
    }
    return 'text-gray-600';
  };

  const sizeClasses = {
    compact: {
      container: 'p-3',
      timer: 'text-2xl',
      info: 'text-xs',
      controls: 'gap-1',
      button: 'p-1',
      icon: 'w-3 h-3'
    },
    normal: {
      container: 'p-4',
      timer: 'text-4xl',
      info: 'text-sm',
      controls: 'gap-2',
      button: 'p-2',
      icon: 'w-4 h-4'
    },
    large: {
      container: 'p-6',
      timer: 'text-6xl',
      info: 'text-base',
      controls: 'gap-3',
      button: 'p-3',
      icon: 'w-5 h-5'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`bg-white rounded-lg shadow-md ${currentSize.container} ${className}`}>
      {/* Timer Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className={currentSize.icon} />
          Draft Timer
        </h3>
        <div className="flex items-center gap-3">
          {/* Audio Toggle */}
          {onAudioToggle && (
            <button
              onClick={() => onAudioToggle(!audioEnabled)}
              className={`p-1 rounded transition-colors ${
                audioEnabled 
                  ? 'text-green-600 hover:bg-green-50' 
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
              title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}
          
          {/* Timer Status Indicator */}
          <div className="flex items-center gap-2">
            {isActive ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`font-medium text-green-600 ${currentSize.info}`}>Running</span>
              </>
            ) : showExpired ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className={`font-medium text-red-600 ${currentSize.info}`}>Expired</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className={`font-medium text-gray-600 ${currentSize.info}`}>Stopped</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all mb-4 ${getTimerStateClasses()}`}>
        <Clock className={`${currentSize.icon} ${getTextColorClasses()}`} />
        
        <div className="flex-1 text-center">
          <div className={`${currentSize.timer} font-bold mb-1 ${getTextColorClasses()}`}>
            {showExpired ? 'TIME!' : formatTime(timeRemaining)}
          </div>
          
          <div className="text-gray-700">
            <div className={`font-medium ${currentSize.info}`}>
              Team {currentPicker} • Round {currentRound}
            </div>
            {(totalPicks || currentPickNumber) && (
              <div className={`${currentSize.info} text-gray-500`}>
                Pick {currentPickNumber || '?'} {totalPicks && `of ${totalPicks}`}
              </div>
            )}
          </div>
        </div>

        {/* Warning Indicator */}
        {isWarning && !showExpired && (
          <div className="flex flex-col items-center">
            <AlertTriangle className={`${currentSize.icon} text-yellow-600 animate-bounce`} />
            <span className={`${currentSize.info} text-yellow-600 font-medium mt-1`}>
              {timeRemaining}s
            </span>
          </div>
        )}
      </div>

      {/* Timer Controls */}
      <div className={`flex items-center justify-center ${currentSize.controls}`}>
        <button
          onClick={isActive ? onStop : onStart}
          className={`${currentSize.button} rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isActive 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          title={isActive ? 'Pause Timer' : 'Start Timer'}
        >
          {isActive ? <Pause className={currentSize.icon} /> : <Play className={currentSize.icon} />}
          {size !== 'compact' && (isActive ? 'Pause' : 'Start')}
        </button>
        
        <button
          onClick={onReset}
          className={`${currentSize.button} bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2`}
          title="Reset Timer"
        >
          <RotateCcw className={currentSize.icon} />
          {size !== 'compact' && 'Reset'}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            className={`${currentSize.button} bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2`}
            title="Skip to Next Pick"
          >
            <SkipForward className={currentSize.icon} />
            {size !== 'compact' && 'Skip'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {timePerPick > 0 && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${
                showExpired 
                  ? 'bg-red-500' 
                  : isWarning 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${(timeRemaining / timePerPick) * 100}%` }}
            />
          </div>
          <div className={`flex justify-between mt-1 ${currentSize.info} text-gray-500`}>
            <span>0:00</span>
            <span>{formatTime(timePerPick)}</span>
          </div>
        </div>
      )}

      {/* Auto-advance Notice */}
      {showExpired && autoAdvance && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-center">
          <p className={`text-red-700 ${currentSize.info}`}>
            ⏰ Auto-advancing to next pick in 3 seconds...
          </p>
        </div>
      )}
    </div>
  );
});

DraftTimer.displayName = 'DraftTimer';

export default DraftTimer;