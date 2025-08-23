/**
 * DraftStatus Component
 * 
 * A comprehensive draft status display component extracted from LegacyFantasyFootballAnalyzer.tsx
 * 
 * Features:
 * - Real-time timer display with visual states
 * - Current picker information
 * - Draft progress tracking
 * - Recent picks history
 * - Next up picker preview
 * - User turn notifications
 * - Timer expired modal
 * - Responsive design with compact mode
 * 
 * @author Team Delta - Agent 12
 */

import React, { useMemo } from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Target, 
  TrendingUp, 
  Users, 
  FileText,
  AlertTriangle,
  User
} from 'lucide-react';
import { Team, DraftPick, DraftSettings } from '@/types';

// Component interfaces
export interface DraftStatusProps {
  // Current draft state
  currentPicker: number;
  currentRound: number;
  currentPick: number;
  totalRounds: number;
  totalTeams: number;
  
  // Draft data
  teams: Team[];
  draftHistory: DraftPick[];
  isUserTurn: boolean;
  
  // Timer state
  timerState: {
    timeRemaining: number;
    isActive: boolean;
    isWarning: boolean;
    isExpired?: boolean;
  };
  
  // Draft settings
  draftSettings: DraftSettings;
  
  // Optional customization
  className?: string;
  showRecentPicks?: boolean;
  showNextUp?: boolean;
  compactMode?: boolean;
}

export interface TimerControlsProps {
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdvance?: () => void;
}

export interface DraftProgressProps {
  currentRound: number;
  currentPick: number;
  totalRounds: number;
  totalTeams: number;
  totalPicks: number;
}

export interface RecentPicksProps {
  draftHistory: DraftPick[];
  teams: Team[];
  maxPicks?: number;
}

export interface NextUpProps {
  currentPicker: number;
  teams: Team[];
  draftSettings: DraftSettings;
  nextPicksToShow?: number;
}

// Individual component implementations
const TimerDisplay: React.FC<{
  timeRemaining: number;
  isActive: boolean;
  isWarning: boolean;
  isExpired: boolean;
  currentPicker: number;
  currentRound: number;
  teams: Team[];
}> = ({ timeRemaining, isActive, isWarning, isExpired, currentPicker, currentRound, teams }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTeam = teams.find(t => t.id === currentPicker);
  const displayTime = isExpired ? 'TIME!' : formatTime(timeRemaining);

  const timerClasses = `flex items-center gap-3 px-4 py-2 rounded-lg border-2 transition-all ${
    isExpired 
      ? 'bg-red-100 border-red-500 animate-pulse' 
      : isWarning 
        ? 'bg-yellow-100 border-yellow-500' 
        : isActive
          ? 'bg-green-100 border-green-500'
          : 'bg-gray-100 border-gray-300'
  }`;

  const iconClasses = `w-5 h-5 ${
    isExpired 
      ? 'text-red-600' 
      : isWarning 
        ? 'text-yellow-600' 
        : isActive
          ? 'text-green-600'
          : 'text-gray-600'
  }`;

  const timeClasses = `text-2xl font-bold ${
    isExpired 
      ? 'text-red-600' 
      : isWarning 
        ? 'text-yellow-600' 
        : isActive
          ? 'text-green-600'
          : 'text-gray-600'
  }`;

  return (
    <div className={timerClasses}>
      {isExpired ? (
        <AlertTriangle className={iconClasses} />
      ) : (
        <Clock className={iconClasses} />
      )}
      <div className="text-center">
        <div className={timeClasses}>{displayTime}</div>
        <div className="text-xs text-gray-600">
          {currentTeam?.name || `Team ${currentPicker}`} • Round {currentRound}
        </div>
      </div>
    </div>
  );
};

const TimerControls: React.FC<TimerControlsProps> = ({ 
  isActive, 
  onStart, 
  onPause, 
  onReset, 
  onAdvance 
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={isActive ? onPause : onStart}
      className={`p-2 rounded-lg transition-colors ${
        isActive 
          ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
          : 'bg-green-600 hover:bg-green-700 text-white'
      }`}
      title={isActive ? 'Pause Timer' : 'Start Timer'}
    >
      {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
    </button>
    
    <button
      onClick={onReset}
      className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
      title="Reset Timer"
    >
      <RotateCcw className="w-4 h-4" />
    </button>

    {onAdvance && (
      <button
        onClick={onAdvance}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        title="Advance to Next Pick"
      >
        <Target className="w-4 h-4 inline mr-1" />
        Next
      </button>
    )}
  </div>
);

const CurrentPickerCard: React.FC<{
  currentPicker: number;
  teams: Team[];
  isUserTurn: boolean;
  currentRound: number;
  currentPick: number;
}> = ({ currentPicker, teams, isUserTurn, currentRound, currentPick }) => {
  const currentTeam = teams.find(t => t.id === currentPicker);

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      isUserTurn 
        ? 'bg-green-50 border-green-500 shadow-lg' 
        : 'bg-blue-50 border-blue-300'
    }`}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className={`w-6 h-6 ${isUserTurn ? 'text-green-600' : 'text-blue-600'}`} />
          <span className={`text-xl font-bold ${
            isUserTurn ? 'text-green-800' : 'text-blue-800'
          }`}>
            {isUserTurn ? 'YOUR TURN!' : 'Current Picker'}
          </span>
        </div>
        
        <div className="text-lg font-semibold text-gray-900 mb-1">
          {currentTeam?.name || `Team ${currentPicker}`}
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          Owner: {currentTeam?.owner || 'Unknown'}
        </div>
        
        <div className="text-sm text-gray-500">
          Round {currentRound}, Pick {currentPick}
        </div>
        
        {isUserTurn ? (
          <div className="mt-2 text-sm font-medium text-green-700">
            Select a player to draft
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-600">
            AI is deciding...
          </div>
        )}
      </div>
    </div>
  );
};

const DraftProgress: React.FC<DraftProgressProps> = ({ 
  currentRound, 
  currentPick,
  totalRounds, 
  totalTeams, 
  totalPicks 
}) => {
  const progressStats = useMemo(() => {
    const totalDraftPicks = totalTeams * totalRounds;
    const completionPercentage = Math.round((totalPicks / totalDraftPicks) * 100);
    const remainingPicks = totalDraftPicks - totalPicks;
    const roundProgress = Math.round((currentPick / totalTeams) * 100);
    
    return {
      totalDraftPicks,
      completionPercentage,
      remainingPicks,
      roundProgress
    };
  }, [totalTeams, totalRounds, totalPicks, currentPick]);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Draft Progress
      </h4>
      
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <div className="text-2xl font-bold text-blue-600">{currentRound}</div>
          <div className="text-sm text-gray-600">Current Round</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{totalPicks}</div>
          <div className="text-sm text-gray-600">Players Drafted</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">{progressStats.remainingPicks}</div>
          <div className="text-sm text-gray-600">Remaining</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>{progressStats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressStats.completionPercentage}%` }}
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Round {currentRound} Progress</span>
            <span>{progressStats.roundProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressStats.roundProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentPicks: React.FC<RecentPicksProps> = ({ draftHistory, teams, maxPicks = 5 }) => {
  const recentPicks = draftHistory.slice(-maxPicks).reverse();

  if (draftHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Recent Picks
      </h4>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentPicks.map((pick) => {
          const team = teams.find(t => t.id === pick.teamId);
          return (
            <div key={pick.overallPick} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                  {pick.overallPick}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {typeof pick.playerId === 'string' ? pick.playerId : 'Player Selected'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {team?.name || `Team ${pick.teamId}`}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                R{pick.round}.{pick.pick}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NextUp: React.FC<NextUpProps> = ({ currentPicker, teams, draftSettings, nextPicksToShow = 3 }) => {
  const nextPicks = useMemo(() => {
    const picks = [];
    const totalTeams = draftSettings.totalTeams;
    
    // Generate next few picks in draft order
    for (let i = 1; i <= nextPicksToShow; i++) {
      let nextTeamId;
      
      // Simple snake draft logic approximation
      // This is a simplified version - would need actual draft order for precision
      nextTeamId = ((currentPicker + i - 1) % totalTeams) + 1;
      
      const team = teams.find(t => t.id === nextTeamId);
      if (team) {
        picks.push({
          position: i,
          team,
          isUser: nextTeamId === draftSettings.position
        });
      }
    }
    
    return picks;
  }, [currentPicker, teams, draftSettings, nextPicksToShow]);

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Next Up
      </h4>
      
      <div className="space-y-2">
        {nextPicks.map((pick, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-2 rounded-lg ${
              pick.isUser ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                {pick.position}
              </div>
              <div>
                <div className={`font-medium ${pick.isUser ? 'text-green-800' : 'text-gray-900'}`}>
                  {pick.team.name}
                </div>
                <div className="text-sm text-gray-600">
                  {pick.team.owner}
                </div>
              </div>
            </div>
            {pick.isUser && (
              <div className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                Your Turn
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main DraftStatus Component
const DraftStatus: React.FC<DraftStatusProps> = ({
  currentPicker,
  currentRound,
  currentPick,
  totalRounds,
  totalTeams,
  teams,
  draftHistory,
  isUserTurn,
  timerState,
  draftSettings,
  className = '',
  showRecentPicks = true,
  showNextUp = true,
  compactMode = false
}) => {
  const overallPick = ((currentRound - 1) * totalTeams) + currentPick;
  
  if (compactMode) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Draft Status</h3>
            <div className="text-sm text-gray-600">
              Round {currentRound} • Pick {overallPick} of {totalTeams * totalRounds}
            </div>
          </div>
          <TimerDisplay
            timeRemaining={timerState.timeRemaining}
            isActive={timerState.isActive}
            isWarning={timerState.isWarning}
            isExpired={timerState.isExpired || false}
            currentPicker={currentPicker}
            currentRound={currentRound}
            teams={teams}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <CurrentPickerCard
              currentPicker={currentPicker}
              teams={teams}
              isUserTurn={isUserTurn}
              currentRound={currentRound}
              currentPick={currentPick}
            />
          </div>
          
          <DraftProgress
            currentRound={currentRound}
            currentPick={currentPick}
            totalRounds={totalRounds}
            totalTeams={totalTeams}
            totalPicks={draftHistory.length}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Status Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6" />
              Draft Status
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              Live draft tracking and progress
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <TimerDisplay
              timeRemaining={timerState.timeRemaining}
              isActive={timerState.isActive}
              isWarning={timerState.isWarning}
              isExpired={timerState.isExpired || false}
              currentPicker={currentPicker}
              currentRound={currentRound}
              teams={teams}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <CurrentPickerCard
            currentPicker={currentPicker}
            teams={teams}
            isUserTurn={isUserTurn}
            currentRound={currentRound}
            currentPick={currentPick}
          />
          
          <DraftProgress
            currentRound={currentRound}
            currentPick={currentPick}
            totalRounds={totalRounds}
            totalTeams={totalTeams}
            totalPicks={draftHistory.length}
          />
        </div>
      </div>

      {/* Recent Picks and Next Up */}
      {(showRecentPicks || showNextUp) && (
        <div className="grid md:grid-cols-2 gap-6">
          {showRecentPicks && (
            <RecentPicks 
              draftHistory={draftHistory}
              teams={teams}
              maxPicks={5}
            />
          )}
          
          {showNextUp && (
            <NextUp
              currentPicker={currentPicker}
              teams={teams}
              draftSettings={draftSettings}
              nextPicksToShow={3}
            />
          )}
        </div>
      )}

      {/* Time Expired Modal Overlay */}
      {timerState.isExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-pulse">
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">TIME EXPIRED!</h2>
            <p className="text-gray-600 mb-4">
              {teams.find(t => t.id === currentPicker)?.name || `Team ${currentPicker}`}'s time is up. 
              Advancing to next picker...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Auto-advancing in 3 seconds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftStatus;

// Named exports for individual components
export {
  TimerDisplay,
  TimerControls,
  CurrentPickerCard,
  DraftProgress,
  RecentPicks,
  NextUp
};