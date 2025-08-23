import { memo } from 'react';
import { X, Users, Star } from 'lucide-react';
import { Player, ScoringSystem } from '@/types';

interface PlayerComparisonModalProps {
  isOpen: boolean;
  players: Player[];
  scoringSystem: ScoringSystem;
  onClose: () => void;
  onExport?: () => void;
}

const PlayerComparisonModal = memo(({
  isOpen,
  players,
  scoringSystem,
  onClose,
  onExport
}: PlayerComparisonModalProps) => {
  if (!isOpen || players.length < 2) return null;

  const sortedPlayers = [...players].sort((a, b) => b[scoringSystem] - a[scoringSystem]);
  const best = sortedPlayers[0];
  const avgPoints = players.reduce((sum, p) => sum + p[scoringSystem], 0) / players.length;
  const avgADP = players.reduce((sum, p) => sum + p.adp, 0) / players.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Player Comparison ({scoringSystem.toUpperCase()})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{best.name}</div>
              <div className="text-sm text-gray-600">Highest Projected</div>
              <div className="text-lg font-semibold text-green-800">{best[scoringSystem].toFixed(1)} pts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{avgPoints.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average Points</div>
              <div className="text-lg font-semibold text-blue-800">per game</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{avgADP.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average ADP</div>
              <div className="text-lg font-semibold text-purple-800">draft position</div>
            </div>
          </div>
        </div>

        {/* Player Details */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg border-2 ${
                  index === 0 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {index === 0 && <Star className="w-5 h-5 text-green-600" />}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.position} • {player.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {player[scoringSystem].toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">projected pts/game</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ADP:</span>
                    <span className="ml-1 text-gray-600">{player.adp}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tier:</span>
                    <span className="ml-1 text-gray-600">{player.tier}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">PPR:</span>
                    <span className="ml-1 text-gray-600">{player.ppr.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Standard:</span>
                    <span className="ml-1 text-gray-600">{player.standard.toFixed(1)}</span>
                  </div>
                </div>

                {player.news && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{player.news}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Comparing {players.length} players • Sorted by {scoringSystem.toUpperCase()} scoring
          </div>
          <div className="flex gap-3">
            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PlayerComparisonModal.displayName = 'PlayerComparisonModal';

export default PlayerComparisonModal;