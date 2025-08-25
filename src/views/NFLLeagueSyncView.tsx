import React, { useState, useEffect, useCallback } from 'react';
import { 
  NFLLeague, 
  NFLLeagueCollection, 
  SyncResult, 
  SyncProgress,
  NFLSyncError 
} from '@/types/NFLLeagueTypes';
import { nflLeagueService } from '@/services/NFLLeagueService';
import { SimpleLeagueURLParser } from '@/components/SimpleLeagueURLParser';
import LeagueSwitcher from '@/components/LeagueSwitcher';
import NFLDraftCoach from '@/components/NFLDraftCoach';
import { ManualLeagueEntry } from '@/components/ManualLeagueEntry';
import { 
  Plus, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Brain,
  FileText,
  RotateCw,
  Globe
} from 'lucide-react';

type ActiveModal = 'url-parser' | 'manual-entry' | 'draft-coach' | 'settings' | null;

export const NFLLeagueSyncView: React.FC = () => {
  // State management
  const [leagueCollection, setLeagueCollection] = useState<NFLLeagueCollection>({
    leagues: {},
    activeLeagueId: null,
    syncOrder: []
  });
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, { stage: any; progress: number; lastSync?: Date }>>({});
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize service and load data
  useEffect(() => {
    const initializeService = async () => {
      try {
        console.log('🚀 Initializing NFL League Sync View');
        
        // Load existing league collection
        const collection = await nflLeagueService.getLeagueCollection();
        setLeagueCollection(collection);
        
        // Set up subscriptions
        nflLeagueService.subscribe('leagueCollection', handleLeagueCollectionUpdate);
        nflLeagueService.subscribe('syncComplete', handleSyncComplete);
        nflLeagueService.subscribe('syncError', handleSyncError);
        
        setIsInitialized(true);
        console.log('✅ NFL League Sync View initialized');
        
      } catch (error) {
        console.error('❌ Failed to initialize NFL League Sync View:', error);
      }
    };

    initializeService();

    return () => {
      // Cleanup subscriptions
      nflLeagueService.unsubscribe('leagueCollection');
      nflLeagueService.unsubscribe('syncComplete');
      nflLeagueService.unsubscribe('syncError');
    };
  }, []);

  // Event handlers
  const handleLeagueCollectionUpdate = useCallback((collection: NFLLeagueCollection) => {
    setLeagueCollection(collection);
  }, []);

  const handleSyncComplete = useCallback((result: SyncResult) => {
    setSyncResults(prev => {
      const filtered = prev.filter(r => r.leagueId !== result.leagueId);
      return [...filtered, result].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });
  }, []);

  const handleSyncError = useCallback((error: NFLSyncError) => {
    console.error('❌ NFL Sync Error:', error);
    // Handle error display
  }, []);

  const handleSyncProgress = useCallback((progress: SyncProgress) => {
    setSyncStatuses(prev => ({
      ...prev,
      [progress.currentLeague || 'unknown']: {
        stage: progress.stage,
        progress: progress.progress,
        lastSync: new Date()
      }
    }));
  }, []);

  const handleSyncLeague = useCallback(async (leagueId: string) => {
    try {
      console.log(`🔄 Starting manual sync for league: ${leagueId}`);
      // This would trigger individual league sync
      await nflLeagueService.syncLeague(leagueId);
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
    }
  }, []);

  const handleLeagueChange = useCallback((leagueId: string) => {
    setLeagueCollection(prev => ({
      ...prev,
      activeLeagueId: leagueId
    }));
  }, []);

  const handleAddLeague = useCallback(() => {
    setActiveModal('url-parser');
  }, []);

  const handleLeagueAdded = useCallback(async (league: NFLLeague) => {
    try {
      console.log('🔄 Adding league:', league.name);
      await nflLeagueService.addLeague(league);
      
      // Update local state and persist to service
      const updatedCollection = {
        ...leagueCollection,
        leagues: {
          ...leagueCollection.leagues,
          [league.id]: league
        },
        activeLeagueId: leagueCollection.activeLeagueId || league.id,
        syncOrder: [...leagueCollection.syncOrder, league.id]
      };
      
      // Persist the updated collection to trigger subscriptions
      await nflLeagueService.updateLeagueCollection(updatedCollection);
      setLeagueCollection(updatedCollection);
      console.log('✅ League added successfully:', league.name);
      setActiveModal(null);
    } catch (error) {
      console.error('❌ Failed to add league:', error);
    }
  }, [leagueCollection]);

  const handleRemoveLeague = useCallback(async (leagueId: string) => {
    try {
      await nflLeagueService.removeLeague(leagueId);
      console.log(`🗑️ Removed league: ${leagueId}`);
    } catch (error) {
      console.error('❌ Failed to remove league:', error);
    }
  }, []);

  const handleManualLeagueCreated = useCallback(async (league: NFLLeague) => {
    try {
      const updatedCollection = {
        ...leagueCollection,
        leagues: {
          ...leagueCollection.leagues,
          [league.id]: league
        },
        activeLeagueId: leagueCollection.activeLeagueId || league.id,
        syncOrder: [...leagueCollection.syncOrder, league.id]
      };
      
      await nflLeagueService.updateLeagueCollection(updatedCollection);
      setActiveModal(null);
      
      console.log('✅ Manual league created and added to collection');
    } catch (error) {
      console.error('❌ Failed to save manual league:', error);
    }
  }, [leagueCollection]);

  const handleOpenDraftCoach = useCallback(() => {
    if (leagueCollection.activeLeagueId && leagueCollection.leagues[leagueCollection.activeLeagueId]) {
      setActiveModal('draft-coach');
    } else {
      alert('Please select a league first to start draft coaching.');
    }
  }, [leagueCollection]);

  // Get active league
  const activeLeague = leagueCollection.activeLeagueId 
    ? leagueCollection.leagues[leagueCollection.activeLeagueId] 
    : null;

  const leagueCount = Object.keys(leagueCollection.leagues).length;
  const successfulSyncs = Object.values(leagueCollection.leagues).filter(l => l.syncStatus === 'success').length;

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing NFL League Sync...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">NFL.com League Sync</h1>
              <p className="text-blue-100">
                Multi-league management with Browser MCP automation and AI draft coaching
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold">{leagueCount}</div>
              <div className="text-sm text-blue-200">Leagues</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{successfulSyncs}</div>
              <div className="text-sm text-blue-200">Synced</div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleAddLeague}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add League
          </button>
          
          <button
            onClick={handleOpenDraftCoach}
            disabled={!activeLeague}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            AI Draft Coach
          </button>
          
          <button
            onClick={() => setActiveModal('settings')}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* League Switcher */}
      {leagueCount > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">League Management</h2>
          <LeagueSwitcher
            leagues={leagueCollection.leagues}
            activeLeagueId={leagueCollection.activeLeagueId}
            onLeagueChange={handleLeagueChange}
            onAddLeague={handleAddLeague}
            onRemoveLeague={handleRemoveLeague}
            showSyncStatus={true}
            leagueCollection={leagueCollection}
            onLeagueCollectionUpdate={setLeagueCollection}
            syncStatuses={syncStatuses}
            onSyncLeague={handleSyncLeague}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Simple League List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Your Leagues</h3>
              <button
                onClick={handleAddLeague}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add League
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {Object.keys(leagueCollection.leagues).length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Leagues Yet</h4>
                <p className="text-gray-600 mb-4">Add your first NFL.com fantasy league to get started</p>
                <button
                  onClick={handleAddLeague}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First League
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(leagueCollection.leagues).map((league: any) => (
                  <div key={league.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{league.name}</h4>
                      <button
                        onClick={() => handleRemoveLeague(league.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Teams:</span> {league.size}
                      </div>
                      <div>
                        <span className="font-medium">Scoring:</span> {league.scoringType}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {league.draftStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status & Information Panel */}
        <div className="space-y-6">
          {/* Active League Info */}
          {activeLeague ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{activeLeague.name}</h3>
                  <p className="text-gray-600">Current Active League</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Teams</div>
                  <div className="font-semibold">{activeLeague.teams.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Scoring</div>
                  <div className="font-semibold">{activeLeague.settings.scoringType}</div>
                </div>
                <div>
                  <div className="text-gray-500">Season</div>
                  <div className="font-semibold">{activeLeague.season}</div>
                </div>
                <div>
                  <div className="text-gray-500">Week</div>
                  <div className="font-semibold">{activeLeague.currentWeek}</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Sync Status</span>
                  <div className="flex items-center gap-2">
                    {activeLeague.syncStatus === 'success' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Synced</span>
                      </>
                    )}
                    {activeLeague.syncStatus === 'error' && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">Error</span>
                      </>
                    )}
                    {activeLeague.syncStatus === 'never' && (
                      <>
                        <RotateCw className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Not Synced</span>
                      </>
                    )}
                  </div>
                </div>
                
                {activeLeague.lastSyncTime && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last sync: {activeLeague.lastSyncTime.toLocaleString()}
                  </div>
                )}
              </div>

              {activeLeague.myTeam && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">My Team</h4>
                  <div className="text-sm">
                    <div><span className="font-medium">{activeLeague.myTeam.name}</span></div>
                    <div className="text-gray-600">{activeLeague.myTeam.ownerName}</div>
                    {activeLeague.myTeam.draftPosition && (
                      <div className="text-gray-600">Draft Position: #{activeLeague.myTeam.draftPosition}</div>
                    )}
                    <div className="text-gray-600">{activeLeague.myTeam.roster.length} players</div>
                  </div>
                </div>
              )}
            </div>
          ) : leagueCount === 0 ? (
            /* No Leagues State */
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leagues Yet</h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first NFL.com fantasy league for tomorrow's draft
              </p>
              <button
                onClick={handleAddLeague}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First League
              </button>
            </div>
          ) : (
            /* Select League State */
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a League</h3>
              <p className="text-gray-600">
                Choose an active league to view details and start draft coaching
              </p>
            </div>
          )}

          {/* Recent Sync Results */}
          {syncResults.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Results</h3>
              <div className="space-y-3">
                {syncResults.slice(0, 5).map((result, index) => {
                  const league = leagueCollection.leagues[result.leagueId];
                  return (
                    <div key={index} className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {league?.name || 'Unknown League'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs font-medium">
                            {(result.duration / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>
                      {result.errors.length > 0 && (
                        <div className="mt-2 text-xs text-red-600">
                          {result.errors[0]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SimpleLeagueURLParser
        isOpen={activeModal === 'url-parser'}
        onClose={() => setActiveModal(null)}
        onLeagueAdded={handleLeagueAdded}
        onError={(error) => console.error('URL Parser Error:', error)}
      />

      {activeModal === 'manual-entry' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ManualLeagueEntry
              mode="create"
              onLeagueCreated={handleManualLeagueCreated}
              onCancel={() => setActiveModal(null)}
            />
          </div>
        </div>
      )}

      {activeModal === 'draft-coach' && activeLeague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">NFL Draft Coach - {activeLeague.name}</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NFLDraftCoach
              league={activeLeague}
              enableScreenshots={true}
              debugMode={false}
              className="border-none shadow-none"
            />
          </div>
        </div>
      )}

      {activeModal === 'settings' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">NFL League Sync Settings</h2>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Settings panel coming soon...</p>
                <p className="text-sm mt-2">Configure sync intervals, credentials, and automation preferences</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFLLeagueSyncView;