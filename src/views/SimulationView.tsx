import { memo, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Users, 
  Clock, 
  FileText,
  TrendingUp
} from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import { useDraftSimulation } from '@/hooks/useDraftSimulation';
import { SimulationSpeedControls, DraftProgressIndicator } from '@/components';
import { SimulationPerformanceAnalyzer } from '@/components/SimulationPerformanceAnalyzer';
import { Team, DraftPick, Player } from '@/types';

// Performance-optimized simulation controls
const SimulationControls = memo(() => {
  const {
    isDraftActive,
    isUserTurn,
    currentRound,
    currentOverallPick,
    simulationSpeed,
    startSimulation,
    stopSimulation,
    resetDraft,
    setSimulationSpeed
  } = useDraftSimulation();
  
  const { state } = useFantasyFootball();

  const simulationStatus = useMemo(() => {
    if (!isDraftActive) return { status: 'READY', color: 'gray' };
    if (isUserTurn) return { status: 'YOUR PICK', color: 'green' };
    return { status: 'LIVE', color: 'blue' };
  }, [isDraftActive, isUserTurn]);

  const currentTeam = useMemo(() => 
    state.teams.find(t => t.id === state.currentPicker), 
    [state.teams, state.currentPicker]
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Play className="w-5 h-5" />
          Draft Simulation Engine
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            simulationStatus.color === 'blue' ? 'bg-blue-500 animate-pulse' :
            simulationStatus.color === 'green' ? 'bg-green-500 animate-pulse' :
            'bg-gray-400'
          }`} />
          <span className="text-sm font-medium">{simulationStatus.status}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Draft Status */}
        <DraftProgressIndicator
          currentRound={currentRound}
          currentOverallPick={currentOverallPick}
          totalRounds={state.draftSettings.rounds}
          totalTeams={state.draftSettings.totalTeams}
          totalPicks={state.draftHistory.length}
          isDraftActive={isDraftActive}
          isUserTurn={isUserTurn}
          currentTeamName={currentTeam?.name}
        />

        {/* Simulation Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {!isDraftActive ? (
              <button
                onClick={startSimulation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Simulation
              </button>
            ) : (
              <button
                onClick={stopSimulation}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            
            <button
              onClick={resetDraft}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          <SimulationSpeedControls
            simulationSpeed={simulationSpeed}
            onSpeedChange={setSimulationSpeed}
            disabled={isDraftActive}
          />
        </div>
      </div>
    </div>
  );
});

SimulationControls.displayName = 'SimulationControls';

// Performance-optimized team card
const TeamCard = memo<{ 
  team: Team; 
  index: number; 
  isCurrentPicker: boolean; 
  isUser: boolean; 
  teamPicks: DraftPick[];
  isDraftActive: boolean;
  players: Player[];
}>(({ team, index, isCurrentPicker, isUser, teamPicks, isDraftActive, players }) => {
  const cardClassName = useMemo(() => 
    `p-3 rounded-lg border-2 transition-all ${
      isCurrentPicker 
        ? 'border-blue-500 bg-blue-50 shadow-md' 
        : isUser 
        ? 'border-green-500 bg-green-50' 
        : 'border-gray-200 bg-gray-50'
    }`, [isCurrentPicker, isUser]);

  const latestPick = useMemo(() => 
    teamPicks.length > 0 ? teamPicks[teamPicks.length - 1] : null, 
    [teamPicks]
  );

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900">
          {index + 1}. {team.name}
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
          {teamPicks.length} picks
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        {team.owner} • {team.strategy.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </div>
      
      {latestPick && (
        <div className="text-xs text-gray-500">
          Latest: {players.find(p => p.id === latestPick.playerId)?.name || 'Unknown'}
        </div>
      )}
      
      {isCurrentPicker && isDraftActive && (
        <div className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          On the clock
        </div>
      )}
    </div>
  );
});

TeamCard.displayName = 'TeamCard';

// Performance-optimized teams grid
const TeamsGrid = memo(() => {
  const { state } = useFantasyFootball();
  const { isDraftActive, currentPicker } = useDraftSimulation();

  const teamsWithData = useMemo(() => 
    state.teams.map((team, index) => {
      const isCurrentPicker = isDraftActive && team.id === currentPicker;
      const isUser = team.id === state.draftSettings.position;
      const teamPicks = state.draftHistory.filter(pick => pick.teamId === team.id);
      
      return {
        team,
        index,
        isCurrentPicker,
        isUser,
        teamPicks,
        key: team.id
      };
    }), [state.teams, isDraftActive, currentPicker, state.draftSettings.position, state.draftHistory]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Draft Order & Teams
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamsWithData.map(({ team, index, isCurrentPicker, isUser, teamPicks, key }) => (
          <TeamCard
            key={key}
            team={team}
            index={index}
            isCurrentPicker={isCurrentPicker}
            isUser={isUser}
            teamPicks={teamPicks}
            isDraftActive={isDraftActive}
            players={state.players}
          />
        ))}
      </div>
    </div>
  );
});

TeamsGrid.displayName = 'TeamsGrid';

// Performance-optimized draft pick component
const DraftPickCard = memo<{ 
  pick: DraftPick; 
  player: Player;
  team: Team | undefined;
}>(({ pick, player, team }) => (
  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
        {pick.overallPick}
      </div>
      <div>
        <div className="font-semibold text-gray-900">{player.name}</div>
        <div className="text-sm text-gray-600">
          {player.position} • {team?.name || 'Unknown Team'}
        </div>
      </div>
    </div>
    <div className="text-right text-sm text-gray-500">
      R{pick.round}.{pick.pick}
    </div>
  </div>
));

DraftPickCard.displayName = 'DraftPickCard';

// Performance-optimized recent picks
const RecentPicks = memo(() => {
  const { state } = useFantasyFootball();

  const recentPicksData = useMemo(() => 
    state.draftHistory
      .slice(-10)
      .reverse()
      .map(pick => ({
        pick,
        player: state.players.find(p => p.id === pick.playerId)!,
        team: state.teams.find(t => t.id === pick.teamId),
        key: `${pick.teamId}-${pick.overallPick}`
      }))
      .filter(item => item.player), // Only include picks with valid players
    [state.draftHistory, state.players, state.teams]);

  if (recentPicksData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Recent Picks
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentPicksData.map(({ pick, player, team, key }) => (
          <DraftPickCard
            key={key}
            pick={pick}
            player={player}
            team={team}
          />
        ))}
      </div>
    </div>
  );
});

RecentPicks.displayName = 'RecentPicks';

// Performance-optimized draft analytics
const DraftAnalytics = memo(() => {
  const { state } = useFantasyFootball();

  const analytics = useMemo(() => {
    const totalPicks = state.draftHistory.length;
    const totalPositions = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0, K: 0 };
    
    state.draftHistory.forEach(pick => {
      const player = state.players.find(p => p.id === pick.playerId);
      if (player) {
        totalPositions[player.position]++;
      }
    });

    const remainingPicks = (state.draftSettings.totalTeams * state.draftSettings.rounds) - totalPicks;
    const completionPercentage = Math.round((totalPicks / (state.draftSettings.totalTeams * state.draftSettings.rounds)) * 100);

    return {
      totalPicks,
      totalPositions,
      remainingPicks,
      completionPercentage
    };
  }, [state.draftHistory, state.players, state.draftSettings]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Draft Analytics
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analytics.totalPicks}</div>
          <div className="text-xs text-gray-600">Total Picks</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{analytics.remainingPicks}</div>
          <div className="text-xs text-gray-600">Remaining</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{analytics.completionPercentage}%</div>
          <div className="text-xs text-gray-600">Complete</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{state.currentRoundState}</div>
          <div className="text-xs text-gray-600">Current Round</div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Position Breakdown</h4>
        {Object.entries(analytics.totalPositions).map(([position, count]) => (
          <div key={position} className="flex justify-between items-center">
            <span className="font-medium text-gray-700">{position}</span>
            <span className="text-gray-600">{count} drafted</span>
          </div>
        ))}
      </div>
    </div>
  );
});

DraftAnalytics.displayName = 'DraftAnalytics';

// Main SimulationView component
const SimulationView = memo(() => {
  return (
    <div className="space-y-6">
      <SimulationControls />
      <TeamsGrid />
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentPicks />
        <DraftAnalytics />
      </div>
      <SimulationPerformanceAnalyzer />
    </div>
  );
});

SimulationView.displayName = 'SimulationView';

export default SimulationView;