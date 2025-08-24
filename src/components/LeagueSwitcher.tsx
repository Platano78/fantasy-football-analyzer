import React, { useState, useCallback } from 'react';
import { 
  NFLLeague, 
  NFLLeagueCollection, 
  LeagueSwitcherProps,
  SyncStage 
} from '@/types/NFLLeagueTypes';
import { ChevronDown, Plus, Settings, Trash2, RefreshCw, Users, Trophy, Calendar } from 'lucide-react';

interface ExtendedLeagueSwitcherProps extends LeagueSwitcherProps {
  leagueCollection: NFLLeagueCollection;
  onLeagueCollectionUpdate: (collection: NFLLeagueCollection) => void;
  syncStatuses?: Record<string, { stage: SyncStage; progress: number; lastSync?: Date }>;
  onSyncLeague?: (leagueId: string) => void;
}

export const LeagueSwitcher: React.FC<ExtendedLeagueSwitcherProps> = ({
  leagues,
  activeLeagueId,
  onLeagueChange,
  onAddLeague,
  onRemoveLeague,
  showSyncStatus = true,
  leagueCollection,
  onLeagueCollectionUpdate,
  syncStatuses = {},
  onSyncLeague,
  className = ''
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLeagueDetails, setShowLeagueDetails] = useState<string | null>(null);

  const activeLeague = activeLeagueId ? leagues[activeLeagueId] : null;
  const leagueList = Object.values(leagues);
  const sortedLeagues = leagueList.sort((a, b) => {
    // Sort by priority: active leagues first, then by sync status, then by name
    if (a.syncStatus === 'success' && b.syncStatus !== 'success') return -1;
    if (b.syncStatus === 'success' && a.syncStatus !== 'success') return 1;
    return a.name.localeCompare(b.name);
  });

  const handleLeagueSelect = useCallback((leagueId: string) => {
    onLeagueChange(leagueId);
    setIsDropdownOpen(false);
    
    // Update active league in collection
    onLeagueCollectionUpdate({
      ...leagueCollection,
      activeLeagueId: leagueId
    });
  }, [onLeagueChange, leagueCollection, onLeagueCollectionUpdate]);

  const handleRemoveLeague = useCallback((leagueId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (onRemoveLeague && window.confirm('Are you sure you want to remove this league?')) {
      onRemoveLeague(leagueId);
      
      // Update collection
      const updatedLeagues = { ...leagues };
      delete updatedLeagues[leagueId];
      
      const newActiveId = leagueId === activeLeagueId 
        ? Object.keys(updatedLeagues)[0] || null 
        : activeLeagueId;
      
      onLeagueCollectionUpdate({
        ...leagueCollection,
        leagues: updatedLeagues,
        activeLeagueId: newActiveId,
        syncOrder: leagueCollection.syncOrder.filter(id => id !== leagueId)
      });
    }
  }, [onRemoveLeague, leagues, activeLeagueId, leagueCollection, onLeagueCollectionUpdate]);

  const handleSyncLeague = useCallback((leagueId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onSyncLeague?.(leagueId);
  }, [onSyncLeague]);

  const getSyncStatusColor = (league: NFLLeague) => {
    const syncStatus = syncStatuses[league.id];
    if (syncStatus?.stage === 'complete' || league.syncStatus === 'success') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (syncStatus?.stage === 'error' || league.syncStatus === 'error') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (syncStatus && syncStatus.stage !== 'authenticating') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getSyncStatusText = (league: NFLLeague) => {
    const syncStatus = syncStatuses[league.id];
    if (syncStatus) {
      if (syncStatus.stage === 'complete') return 'Synced';
      if (syncStatus.stage === 'error') return 'Error';
      return `${Math.round(syncStatus.progress)}%`;
    }
    
    switch (league.syncStatus) {
      case 'success': return 'Synced';
      case 'error': return 'Error';
      case 'syncing': return 'Syncing';
      case 'partial': return 'Partial';
      case 'never': return 'Never';
      default: return 'Unknown';
    }
  };

  const getLeagueIcon = (league: NFLLeague) => {
    if (league.draftSettings.isDrafted) return '🏆';
    if (league.draftSettings.draftStatus === 'In Progress') return '🎯';
    if (league.draftSettings.draftStatus === 'Scheduled') return '📅';
    return '🏈';
  };

  const formatLastSync = (lastSync?: Date) => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getTeamSummary = (league: NFLLeague) => {
    const myTeam = league.myTeam;
    if (!myTeam) return null;
    
    return {
      name: myTeam.name,
      record: myTeam.record,
      draftPosition: myTeam.draftPosition,
      rosterCount: myTeam.roster.length
    };
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Dropdown Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center gap-3">
          {activeLeague ? (
            <>
              <span className="text-2xl">{getLeagueIcon(activeLeague)}</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">{activeLeague.name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Users size={14} />
                  {activeLeague.teams.length} teams
                  {showSyncStatus && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${getSyncStatusColor(activeLeague)}`}>
                        {getSyncStatusText(activeLeague)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏈</span>
              <div>
                <div className="font-semibold text-gray-900">Select League</div>
                <div className="text-sm text-gray-500">No league selected</div>
              </div>
            </div>
          )}
        </div>
        
        <ChevronDown 
          size={20} 
          className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  Choose League ({leagueList.length})
                </span>
                {onAddLeague && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsDropdownOpen(false);
                      onAddLeague();
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Add New League"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* League List */}
            <div className="py-1">
              {sortedLeagues.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-2xl mb-2">🏈</div>
                  <div>No leagues configured</div>
                  {onAddLeague && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDropdownOpen(false);
                        onAddLeague();
                      }}
                      className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Your First League
                    </button>
                  )}
                </div>
              ) : (
                sortedLeagues.map((league) => {
                  const isActive = league.id === activeLeagueId;
                  const teamSummary = getTeamSummary(league);
                  const syncStatus = syncStatuses[league.id];
                  
                  return (
                    <div
                      key={league.id}
                      className={`group hover:bg-gray-50 ${isActive ? 'bg-blue-50' : ''}`}
                    >
                      <button
                        onClick={() => handleLeagueSelect(league.id)}
                        className="w-full p-3 text-left flex items-center gap-3 hover:bg-gray-50"
                      >
                        <span className="text-xl">{getLeagueIcon(league)}</span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                              {league.name}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {league.teams.length} teams
                            </span>
                            
                            <span className="flex items-center gap-1">
                              <Trophy size={12} />
                              {league.settings.scoringType}
                            </span>
                            
                            {league.currentWeek && (
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Week {league.currentWeek}
                              </span>
                            )}
                          </div>
                          
                          {teamSummary && (
                            <div className="text-xs text-gray-500 mt-1">
                              My Team: {teamSummary.name}
                              {teamSummary.draftPosition && (
                                <span> (Pick #{teamSummary.draftPosition})</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {showSyncStatus && (
                            <span className={`px-2 py-1 text-xs rounded-full border ${getSyncStatusColor(league)}`}>
                              {getSyncStatusText(league)}
                            </span>
                          )}
                          
                          {league.lastSyncTime && (
                            <span className="text-xs text-gray-500">
                              {formatLastSync(league.lastSyncTime)}
                            </span>
                          )}
                        </div>
                      </button>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 px-3 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => setShowLeagueDetails(
                            showLeagueDetails === league.id ? null : league.id
                          )}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                          title="League Details"
                        >
                          <Settings size={14} />
                        </button>
                        
                        {onSyncLeague && (
                          <button
                            onClick={(e) => handleSyncLeague(league.id, e)}
                            className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                            title="Sync League"
                            disabled={syncStatus && syncStatus.stage !== 'complete' && syncStatus.stage !== 'error'}
                          >
                            <RefreshCw size={14} className={syncStatus && syncStatus.stage !== 'complete' && syncStatus.stage !== 'error' ? 'animate-spin' : ''} />
                          </button>
                        )}
                        
                        {onRemoveLeague && (
                          <button
                            onClick={(e) => handleRemoveLeague(league.id, e)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                            title="Remove League"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      {/* Expanded Details */}
                      {showLeagueDetails === league.id && (
                        <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                          <div className="pt-3 text-sm space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-gray-700">League ID:</span>
                                <div className="text-gray-600 font-mono text-xs">{league.leagueKey}</div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Season:</span>
                                <div className="text-gray-600">{league.season}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium text-gray-700">Draft Status:</span>
                                <div className="text-gray-600">{league.draftSettings.draftStatus}</div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Auth Status:</span>
                                <div className={`text-sm ${
                                  league.authStatus === 'authenticated' ? 'text-green-600' :
                                  league.authStatus === 'expired' ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {league.authStatus}
                                </div>
                              </div>
                            </div>
                            
                            {league.syncErrors && league.syncErrors.length > 0 && (
                              <div>
                                <span className="font-medium text-red-700">Recent Errors:</span>
                                <div className="text-red-600 text-xs mt-1 max-h-16 overflow-y-auto">
                                  {league.syncErrors.slice(0, 3).map((error, i) => (
                                    <div key={i}>• {error}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {league.url && (
                              <div>
                                <span className="font-medium text-gray-700">League URL:</span>
                                <a 
                                  href={league.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs block truncate"
                                >
                                  {league.url}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeagueSwitcher;