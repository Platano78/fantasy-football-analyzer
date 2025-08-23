import { memo, useMemo } from 'react';
import { Activity, Target, TrendingUp } from 'lucide-react';

interface DraftProgressIndicatorProps {
  currentRound: number;
  currentOverallPick: number;
  totalRounds: number;
  totalTeams: number;
  totalPicks: number;
  isDraftActive: boolean;
  isUserTurn: boolean;
  currentTeamName?: string;
}

const DraftProgressIndicator = memo<DraftProgressIndicatorProps>(({
  currentRound,
  currentOverallPick,
  totalRounds,
  totalTeams,
  totalPicks,
  isDraftActive,
  isUserTurn,
  currentTeamName
}) => {
  const progressStats = useMemo(() => {
    const totalDraftPicks = totalTeams * totalRounds;
    const completionPercentage = Math.round((totalPicks / totalDraftPicks) * 100);
    const remainingPicks = totalDraftPicks - totalPicks;
    const roundProgress = Math.round(((currentOverallPick - ((currentRound - 1) * totalTeams)) / totalTeams) * 100);
    
    return {
      totalDraftPicks,
      completionPercentage,
      remainingPicks,
      roundProgress
    };
  }, [currentRound, currentOverallPick, totalRounds, totalTeams, totalPicks]);

  const statusInfo = useMemo(() => {
    if (!isDraftActive) {
      return {
        status: 'Draft Ready',
        message: 'Click Start Simulation to begin',
        color: 'gray',
        icon: Target
      };
    }
    
    if (isUserTurn) {
      return {
        status: 'YOUR PICK!',
        message: 'Select a player from the draft board',
        color: 'green',
        icon: Activity
      };
    }
    
    return {
      status: 'AI Drafting',
      message: `${currentTeamName || 'Team'} is selecting...`,
      color: 'blue',
      icon: TrendingUp
    };
  }, [isDraftActive, isUserTurn, currentTeamName]);

  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
      {/* Main Status Display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <StatusIcon className={`w-6 h-6 ${
            statusInfo.color === 'green' ? 'text-green-600' :
            statusInfo.color === 'blue' ? 'text-blue-600' :
            'text-gray-600'
          }`} />
          <div className={`text-2xl font-bold ${
            statusInfo.color === 'green' ? 'text-green-600' :
            statusInfo.color === 'blue' ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            Round {currentRound}
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          Pick {currentOverallPick} of {progressStats.totalDraftPicks}
        </div>
        
        <div className={`text-lg font-semibold mb-1 ${
          statusInfo.color === 'green' ? 'text-green-600' :
          statusInfo.color === 'blue' ? 'text-blue-600' :
          'text-gray-600'
        }`}>
          {statusInfo.status}
        </div>
        
        <div className="text-sm text-gray-500">
          {statusInfo.message}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Overall Draft Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Draft Progress</span>
            <span>{progressStats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressStats.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Round Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Round {currentRound}</span>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{totalPicks}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{progressStats.remainingPicks}</div>
          <div className="text-xs text-gray-600">Remaining</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{currentRound}</div>
          <div className="text-xs text-gray-600">Round</div>
        </div>
      </div>
    </div>
  );
});

DraftProgressIndicator.displayName = 'DraftProgressIndicator';

export { DraftProgressIndicator };