/**
 * Usage Example for StatsComparisonView Component
 * 
 * This file demonstrates how to properly use the extracted StatsComparisonView
 * component in various contexts like modals, comparison panels, or standalone views.
 */

import React, { useState } from 'react';
import StatsComparisonView from './StatsComparisonView';
import { Player, ScoringSystem } from '../../types/index';

// Example usage in a comparison modal
const ComparisonModalExample: React.FC = () => {
  const [selectedPlayers] = useState<Player[]>([
    {
      id: 1,
      name: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      adp: 1.1,
      ppr: 25.8,
      standard: 20.3,
      halfPpr: 23.1,
      injury: 'Healthy',
      news: 'PPR + bonus scoring monster',
      tier: 1
    },
    {
      id: 2,
      name: 'Austin Ekeler',
      position: 'RB',
      team: 'LAC',
      adp: 2.3,
      ppr: 22.4,
      standard: 16.8,
      halfPpr: 19.6,
      injury: 'Questionable',
      news: '70+ catches = PPR gold',
      tier: 1
    },
    {
      id: 3,
      name: 'Derrick Henry',
      position: 'RB',
      team: 'BAL',
      adp: 2.8,
      ppr: 19.2,
      standard: 18.9,
      halfPpr: 19.1,
      injury: 'Healthy',
      news: '100+ yard game bonuses',
      tier: 1
    }
  ]);

  const [scoringSystem, setScoringSystem] = useState<ScoringSystem>('ppr');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Player Comparison
          </h3>
          <div className="mt-2">
            <label className="text-sm text-gray-600">Scoring System:</label>
            <select
              value={scoringSystem}
              onChange={(e) => setScoringSystem(e.target.value as ScoringSystem)}
              className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="ppr">PPR</option>
              <option value="halfPpr">Half PPR</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <StatsComparisonView 
            players={selectedPlayers}
            scoringSystem={scoringSystem}
          />
        </div>
      </div>
    </div>
  );
};

// Example usage in a side panel
const SidePanelExample: React.FC = () => {
  const [comparingPlayers] = useState<Player[]>([
    {
      id: 4,
      name: 'Davante Adams',
      position: 'WR',
      team: 'LV',
      adp: 8.2,
      ppr: 18.9,
      standard: 14.2,
      halfPpr: 16.6,
      injury: 'Healthy',
      news: 'Target monster in PPR',
      tier: 1
    },
    {
      id: 5,
      name: 'Tyreek Hill',
      position: 'WR',
      team: 'MIA',
      adp: 6.1,
      ppr: 19.4,
      standard: 15.8,
      halfPpr: 17.6,
      injury: 'Healthy',
      news: 'Big play upside',
      tier: 1
    }
  ]);

  return (
    <div className="w-96 bg-gray-50 border-l border-gray-200 p-4">
      <h4 className="text-md font-semibold mb-4">Quick Compare</h4>
      <StatsComparisonView 
        players={comparingPlayers}
        scoringSystem="ppr"
      />
    </div>
  );
};

// Export examples (not used in production, just for reference)
export { ComparisonModalExample, SidePanelExample };

/**
 * KEY PERFORMANCE FEATURES:
 * 
 * 1. React.memo: Prevents re-renders when props haven't changed
 * 2. useMemo: Caches expensive chart data calculations
 * 3. Proper key props: Ensures efficient list rendering
 * 4. Optimized Recharts: Configured for performance with minimal re-renders
 * 
 * USAGE PATTERNS:
 * 
 * - Import: import { StatsComparisonView } from '../components/comparison/StatsComparisonView';
 * - Props: Pass players array and scoringSystem
 * - Responsive: Component adapts to different screen sizes
 * - Accessible: Proper ARIA labels and semantic HTML
 * 
 * INTEGRATION EXAMPLES:
 * 
 * 1. In PlayerComparisonModal.tsx:
 *    <StatsComparisonView players={selectedPlayers} scoringSystem={scoringSystem} />
 * 
 * 2. In ComparisonView.tsx:
 *    <StatsComparisonView players={playersToCompare} scoringSystem="ppr" />
 * 
 * 3. In Draft interface:
 *    <StatsComparisonView players={shortlistedPlayers} scoringSystem={userPreference} />
 */