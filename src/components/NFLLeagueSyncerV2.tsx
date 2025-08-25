import React, { useState, useCallback, useEffect } from 'react';
import { Monitor, Smartphone, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { 
  NFLLeague, 
  SyncProgress, 
  SyncResult, 
  NFLSyncConfig,
  NFLLeagueCollection,
  NFLSyncError
} from '../types/NFLLeagueTypes';
import { 
  detectEnvironment, 
  EnvironmentCapabilities, 
  getEnvironmentDescription, 
  getSyncMethodDescription,
  canAutoSync
} from '../utils/environmentDetection';
import { 
  LeagueDataExtractor, 
  LeagueDataExtractorFactory, 
  NFLCredentials, 
  ExtractionProgress 
} from '../interfaces/LeagueDataExtractor';
import { ClaudeDesktopLeagueEntry } from './ClaudeDesktopLeagueEntry';

interface NFLLeagueSyncerV2Props {
  initialLeagues?: Record<string, NFLLeague>;
  onSyncComplete?: (results: SyncResult[]) => void;
  onSyncProgress?: (progress: SyncProgress) => void;
  onSyncError?: (error: NFLSyncError) => void;
  onLeagueCollectionUpdate?: (leagueCollection: NFLLeagueCollection) => void;
  config?: Partial<NFLSyncConfig>;
  className?: string;
}

export const NFLLeagueSyncerV2: React.FC<NFLLeagueSyncerV2Props> = ({
  initialLeagues = {},
  onSyncComplete,
  onSyncProgress,
  onSyncError,
  onLeagueCollectionUpdate,
  config = {},
  className = ''
}) => {
  // Environment detection
  const [environment, setEnvironment] = useState<EnvironmentCapabilities>(() => detectEnvironment());
  const [extractor, setExtractor] = useState<LeagueDataExtractor | null>(null);

  // State management
  const [leagueCollection, setLeagueCollection] = useState<NFLLeagueCollection>({
    leagues: initialLeagues,
    activeLeagueId: null,
    syncOrder: []
  });

  const [syncProgress, setSyncProgress] = useState<ExtractionProgress | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [credentials, setCredentials] = useState<NFLCredentials>({});
  const [extractionResults, setExtractionResults] = useState<string[]>([]);

  // Initialize extractor based on environment
  useEffect(() => {
    const newExtractor = LeagueDataExtractorFactory.createExtractor(
      environment,
      handleExtractionProgress,
      handleExtractionError,
      () => setShowManualEntry(true)
    );
    setExtractor(newExtractor);
  }, [environment]);

  // Re-detect environment periodically (in case Browser MCP becomes available)
  useEffect(() => {
    const interval = setInterval(() => {
      const newEnv = detectEnvironment();
      if (newEnv.environment !== environment.environment) {
        setEnvironment(newEnv);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [environment]);

  const handleExtractionProgress = useCallback((progress: ExtractionProgress) => {
    setSyncProgress(progress);
    
    // Convert to SyncProgress format for backward compatibility
    const syncProgressData: SyncProgress = {
      stage: progress.stage === 'complete' ? 'completed' : progress.stage === 'extracting' ? 'syncing' : 'authenticating',
      message: progress.message,
      progress: progress.progress,
      startTime: new Date(),
      currentLeague: progress.currentLeague || '',
      errors: [],
      warnings: []
    };
    
    onSyncProgress?.(syncProgressData);
  }, [onSyncProgress]);

  const handleExtractionError = useCallback((error: string) => {
    const errorData: NFLSyncError = {
      type: 'EXTRACTION_ERROR',
      message: error,
      timestamp: new Date(),
      leagueId: syncProgress?.currentLeague || 'unknown'
    };
    
    setExtractionResults(prev => [...prev, `❌ ${error}`]);
    onSyncError?.(errorData);
  }, [syncProgress, onSyncError]);

  const handleStartExtraction = useCallback(async () => {
    if (!extractor) return;

    setIsExtracting(true);
    setExtractionResults([]);
    setShowManualEntry(false);

    try {
      const result = await extractor.extractLeagues(credentials);
      
      if (result.success) {
        const updatedCollection = {
          ...leagueCollection,
          leagues: { ...leagueCollection.leagues, ...result.leagues },
          activeLeagueId: leagueCollection.activeLeagueId || Object.keys(result.leagues)[0] || null
        };

        setLeagueCollection(updatedCollection);
        onLeagueCollectionUpdate?.(updatedCollection);

        const syncResults: SyncResult[] = Object.values(result.leagues).map(league => ({
          leagueId: league.id,
          success: true,
          data: league,
          errors: [],
          warnings: result.warnings,
          duration: 0,
          timestamp: result.timestamp
        }));

        onSyncComplete?.(syncResults);
        setExtractionResults(prev => [...prev, `✅ Successfully extracted ${Object.keys(result.leagues).length} league(s)`]);
      } else {
        setExtractionResults(prev => [...prev, ...result.errors.map(err => `❌ ${err}`)]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      handleExtractionError(errorMessage);
    } finally {
      setIsExtracting(false);
      setSyncProgress(null);
    }
  }, [extractor, credentials, leagueCollection, onLeagueCollectionUpdate, onSyncComplete]);

  const handleManualDataSubmit = useCallback((leagues: Record<string, NFLLeague>) => {
    const updatedCollection = {
      ...leagueCollection,
      leagues: { ...leagueCollection.leagues, ...leagues },
      activeLeagueId: leagueCollection.activeLeagueId || Object.keys(leagues)[0] || null
    };

    setLeagueCollection(updatedCollection);
    onLeagueCollectionUpdate?.(updatedCollection);

    const syncResults: SyncResult[] = Object.values(leagues).map(league => ({
      leagueId: league.id,
      success: true,
      data: league,
      errors: [],
      warnings: [],
      duration: 0,
      timestamp: new Date()
    }));

    onSyncComplete?.(syncResults);
    setShowManualEntry(false);
    setExtractionResults([`✅ Successfully imported ${Object.keys(leagues).length} league(s) manually`]);
  }, [leagueCollection, onLeagueCollectionUpdate, onSyncComplete]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Environment Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {environment.hasBrowserMCP ? (
              <Monitor className="w-6 h-6 text-green-600" />
            ) : (
              <Smartphone className="w-6 h-6 text-blue-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                NFL League Sync - Dual Environment
              </h3>
              <p className="text-sm text-gray-600">
                {getEnvironmentDescription(environment)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {environment.hasBrowserMCP ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Browser MCP Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-blue-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Manual Entry Mode</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">
            <strong>Current Method:</strong> {getSyncMethodDescription(environment)}
          </p>
          
          {extractor && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Instructions:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                {extractor.getInstructions().map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span>
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Credentials Input (for Browser MCP only) */}
      {canAutoSync(environment) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">NFL.com Credentials</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={credentials.email || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your.email@example.com"
                disabled={isExtracting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password || ''}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                disabled={isExtracting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {canAutoSync(environment) && (
          <button
            onClick={handleStartExtraction}
            disabled={isExtracting || !credentials.email || !credentials.password}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExtracting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                Start Automated Sync
              </>
            )}
          </button>
        )}

        <button
          onClick={() => setShowManualEntry(true)}
          disabled={isExtracting}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Smartphone className="w-4 h-4" />
          Manual Entry
        </button>
      </div>

      {/* Progress Display */}
      {syncProgress && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Extraction Progress</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {syncProgress.message}
              </span>
              <span className="text-sm text-gray-600">
                {syncProgress.progress.toFixed(0)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress.progress}%` }}
              />
            </div>

            <div className="text-sm text-gray-600">
              Stage: <span className="font-medium capitalize">{syncProgress.stage}</span>
              {syncProgress.currentLeague && (
                <span className="ml-4">
                  Current League: <span className="font-medium">{syncProgress.currentLeague}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {extractionResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Extraction Results</h4>
          <div className="space-y-2">
            {extractionResults.map((result, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2 text-sm ${
                  result.startsWith('✅') ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.startsWith('✅') ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{result.substring(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Manual League Entry</h2>
              <button
                onClick={() => setShowManualEntry(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isExtracting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ClaudeDesktopLeagueEntry
                onLeagueDataSubmit={handleManualDataSubmit}
                onError={handleExtractionError}
              />
            </div>
          </div>
        </div>
      )}

      {/* Current Leagues Summary */}
      {Object.keys(leagueCollection.leagues).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Current Leagues ({Object.keys(leagueCollection.leagues).length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(leagueCollection.leagues).map((league: any) => (
              <div key={league.id} className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900">{league.name}</h5>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <p>Teams: {league.size}</p>
                  <p>Scoring: {league.scoringType}</p>
                  <p>Status: {league.draftStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};