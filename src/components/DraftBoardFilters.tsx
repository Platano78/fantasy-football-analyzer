import { memo, useCallback } from 'react';
import { Search, Filter, X, UserCheck } from 'lucide-react';
import { Position, ScoringSystem } from '@/types';

interface DraftBoardFiltersProps {
  searchTerm: string;
  positionFilter: Position | 'ALL';
  scoringSystem: ScoringSystem;
  isCompareMode: boolean;
  selectedPlayersCount: number;
  showTierFilter?: boolean;
  selectedTier?: number;
  onSearchChange: (term: string) => void;
  onPositionFilterChange: (position: Position | 'ALL') => void;
  onScoringSystemChange: (system: ScoringSystem) => void;
  onToggleCompareMode: () => void;
  onOpenComparison?: () => void;
  onTierFilterChange?: (tier: number | undefined) => void;
  onClearFilters?: () => void;
}

const DraftBoardFilters = memo(({
  searchTerm,
  positionFilter,
  scoringSystem,
  isCompareMode,
  selectedPlayersCount,
  showTierFilter = false,
  selectedTier,
  onSearchChange,
  onPositionFilterChange,
  onScoringSystemChange,
  onToggleCompareMode,
  onOpenComparison,
  onTierFilterChange,
  onClearFilters
}: DraftBoardFiltersProps) => {
  const clearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const hasActiveFilters = searchTerm || positionFilter !== 'ALL' || selectedTier;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Draft Board Filters
        </h3>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Players
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search names, teams..."
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Position Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <select
            value={positionFilter}
            onChange={(e) => onPositionFilterChange(e.target.value as Position | 'ALL')}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Positions</option>
            <option value="QB">Quarterbacks</option>
            <option value="RB">Running Backs</option>
            <option value="WR">Wide Receivers</option>
            <option value="TE">Tight Ends</option>
            <option value="DEF">Defenses</option>
            <option value="K">Kickers</option>
          </select>
        </div>

        {/* Tier Filter (Optional) */}
        {showTierFilter && onTierFilterChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier
            </label>
            <select
              value={selectedTier || ''}
              onChange={(e) => onTierFilterChange(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tiers</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tier => (
                <option key={tier} value={tier}>Tier {tier}</option>
              ))}
            </select>
          </div>
        )}

        {/* Scoring System */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scoring System
          </label>
          <select
            value={scoringSystem}
            onChange={(e) => onScoringSystemChange(e.target.value as ScoringSystem)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ppr">Full PPR</option>
            <option value="halfPpr">Half PPR</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {/* Compare Mode Controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onToggleCompareMode}
          className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
            isCompareMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Compare Mode {isCompareMode && '(Active)'}
        </button>

        {isCompareMode && selectedPlayersCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
              {selectedPlayersCount} of 4 players selected
            </div>
            {selectedPlayersCount >= 2 && onOpenComparison && (
              <button
                onClick={onOpenComparison}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Compare Selected Players
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Search: "{searchTerm}"
                <button onClick={clearSearch} className="hover:text-blue-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {positionFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Position: {positionFilter}
                <button onClick={() => onPositionFilterChange('ALL')} className="hover:text-green-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTier && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Tier: {selectedTier}
                <button 
                  onClick={() => onTierFilterChange?.(undefined)} 
                  className="hover:text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

DraftBoardFilters.displayName = 'DraftBoardFilters';

export default DraftBoardFilters;