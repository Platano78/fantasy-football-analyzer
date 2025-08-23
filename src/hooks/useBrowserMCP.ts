// Custom hook for Browser MCP integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { browserMCPService, type NewsItem, type LiveUpdate, type InjuryReport, type PlayerRanking } from '@/services/BrowserMCPService';

export interface BrowserMCPState {
  isInitialized: boolean;
  isLoading: boolean;
  lastUpdate: Date;
  healthStatus: Record<string, boolean>;
  error: string | null;
}

export interface BrowserMCPHookReturn {
  // State
  state: BrowserMCPState;
  
  // News functionality
  news: NewsItem[];
  refreshNews: () => Promise<void>;
  
  // Rankings functionality  
  rankings: PlayerRanking[];
  refreshRankings: () => Promise<void>;
  
  // Injury reports
  injuries: InjuryReport[];
  refreshInjuries: () => Promise<void>;
  
  // Live updates
  liveUpdates: LiveUpdate[];
  clearLiveUpdates: () => void;
  
  // Auto-refresh controls
  isAutoRefreshEnabled: boolean;
  autoRefreshInterval: number;
  startAutoRefresh: (intervalSeconds?: number) => void;
  stopAutoRefresh: () => void;
  setAutoRefreshInterval: (seconds: number) => void;
  
  // Manual refresh
  refreshAll: () => Promise<void>;
  
  // Health monitoring
  checkHealth: () => Promise<void>;
  
  // Cache management
  clearCache: () => void;
}

export function useBrowserMCP(myPlayerIds: string[] = []): BrowserMCPHookReturn {
  // Core state
  const [state, setState] = useState<BrowserMCPState>({
    isInitialized: false,
    isLoading: false,
    lastUpdate: new Date(),
    healthStatus: {},
    error: null
  });

  // Data state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);

  // Auto-refresh state
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(300); // 5 minutes

  // Refs for cleanup
  const subscriptionRefs = useRef<(() => void)[]>([]);

  // Initialize Browser MCP service
  useEffect(() => {
    let isMounted = true;

    const initService = async () => {
      if (!isMounted) return;
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const initialized = await browserMCPService.initialize();
        if (!isMounted) return;
        
        if (initialized) {
          const health = await browserMCPService.healthCheck();
          if (!isMounted) return;
          
          setState(prev => ({
            ...prev,
            isInitialized: true,
            isLoading: false,
            healthStatus: health,
            lastUpdate: new Date()
          }));

          // Set up data subscriptions
          setupSubscriptions();
        } else {
          setState(prev => ({
            ...prev,
            isInitialized: false,
            isLoading: false,
            error: 'Failed to initialize Browser MCP service'
          }));
        }
      } catch (error) {
        if (!isMounted) return;
        setState(prev => ({
          ...prev,
          isInitialized: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Initialization failed'
        }));
      }
    };

    initService();

    return () => {
      isMounted = false;
      cleanupSubscriptions();
    };
  }, []);

  // Set up real-time data subscriptions
  const setupSubscriptions = useCallback(() => {
    // Subscribe to news updates
    const newsUnsub = browserMCPService.subscribe('news', (newsData: NewsItem[]) => {
      setNews(newsData);
      
      // Create live update for significant news
      const significantNews = newsData.filter(item => item.impactScore >= 4);
      if (significantNews.length > 0) {
        const updates = significantNews.map(item => ({
          id: `news-${item.id}`,
          type: 'news' as const,
          playerName: item.affectedPlayers[0]?.playerName,
          message: `Breaking: ${item.headline}`,
          timestamp: new Date(),
          severity: item.severity === 'urgent' ? 'high' as const : 
                   item.severity === 'high' ? 'medium' as const : 'low' as const
        }));
        
        setLiveUpdates(prev => [...updates, ...prev].slice(0, 50));
      }
    });

    // Subscribe to rankings updates
    const rankingsUnsub = browserMCPService.subscribe('rankings', (rankingData: PlayerRanking[]) => {
      setRankings(prev => {
        // Check for significant ranking changes
        const changes: LiveUpdate[] = [];
        rankingData.forEach(newRank => {
          const oldRank = prev.find(r => r.playerId === newRank.playerId);
          if (oldRank && Math.abs(oldRank.rank - newRank.rank) >= 5) {
            changes.push({
              id: `ranking-${newRank.playerId}-${Date.now()}`,
              type: 'ranking',
              playerName: newRank.playerName,
              message: `${newRank.playerName} moved from #${oldRank.rank} to #${newRank.rank}`,
              timestamp: new Date(),
              severity: Math.abs(oldRank.rank - newRank.rank) >= 10 ? 'high' : 'medium'
            });
          }
        });

        if (changes.length > 0) {
          setLiveUpdates(prev => [...changes, ...prev].slice(0, 50));
        }

        return rankingData;
      });
    });

    // Subscribe to injury reports
    const injuriesUnsub = browserMCPService.subscribe('injuries', (injuryData: InjuryReport[]) => {
      setInjuries(prev => {
        // Check for new/changed injury status
        const changes: LiveUpdate[] = [];
        injuryData.forEach(newInjury => {
          const oldInjury = prev.find(i => i.playerId === newInjury.playerId);
          if (!oldInjury || oldInjury.status !== newInjury.status) {
            const severity = newInjury.status === 'Out' || newInjury.status === 'IR' ? 'high' :
                           newInjury.status === 'Doubtful' ? 'medium' : 'low';
            
            changes.push({
              id: `injury-${newInjury.playerId}-${Date.now()}`,
              type: 'injury',
              playerName: newInjury.playerName,
              message: `${newInjury.playerName} status updated to ${newInjury.status}`,
              timestamp: new Date(),
              severity: severity as 'low' | 'medium' | 'high'
            });
          }
        });

        if (changes.length > 0) {
          setLiveUpdates(prev => [...changes, ...prev].slice(0, 50));
        }

        return injuryData;
      });
    });

    // Store unsubscribe functions
    subscriptionRefs.current = [newsUnsub, rankingsUnsub, injuriesUnsub];
  }, []);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(() => {
    subscriptionRefs.current.forEach(unsub => unsub());
    subscriptionRefs.current = [];
  }, []);

  // Manual data refresh functions
  const refreshNews = useCallback(async () => {
    if (!state.isInitialized) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const newsData = await browserMCPService.getConsolidatedNews(myPlayerIds);
      setNews(newsData);
      setState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to refresh news'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isInitialized, myPlayerIds]);

  const refreshRankings = useCallback(async () => {
    if (!state.isInitialized) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const rankingData = await browserMCPService.getConsolidatedRankings();
      setRankings(rankingData);
      setState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to refresh rankings'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isInitialized]);

  const refreshInjuries = useCallback(async () => {
    if (!state.isInitialized) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const injuryData = await browserMCPService.getAllInjuryReports();
      setInjuries(injuryData);
      setState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to refresh injuries'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isInitialized]);

  const refreshAll = useCallback(async () => {
    if (!state.isInitialized) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await Promise.all([
        refreshNews(),
        refreshRankings(),
        refreshInjuries()
      ]);
      setState(prev => ({ ...prev, lastUpdate: new Date() }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to refresh data'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isInitialized, refreshNews, refreshRankings, refreshInjuries]);

  // Auto-refresh controls
  const startAutoRefresh = useCallback((intervalSeconds: number = autoRefreshInterval) => {
    if (!state.isInitialized) return;
    
    setIsAutoRefreshEnabled(true);
    browserMCPService.startAutoRefresh(intervalSeconds);
    
    // Add live update about auto-refresh
    setLiveUpdates(prev => [{
      id: `auto-refresh-start-${Date.now()}`,
      type: 'news' as const,
      message: `Auto-refresh enabled (every ${intervalSeconds} seconds)`,
      timestamp: new Date(),
      severity: 'low' as const
    }, ...prev].slice(0, 50));
  }, [state.isInitialized, autoRefreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(false);
    browserMCPService.stopAutoRefresh();
    
    // Add live update about auto-refresh stop
    setLiveUpdates(prev => [{
      id: `auto-refresh-stop-${Date.now()}`,
      type: 'news' as const,
      message: 'Auto-refresh disabled',
      timestamp: new Date(),
      severity: 'low' as const
    }, ...prev].slice(0, 50));
  }, []);

  const handleSetAutoRefreshInterval = useCallback((seconds: number) => {
    setAutoRefreshInterval(seconds);
    
    // Restart auto-refresh with new interval if it's currently enabled
    if (isAutoRefreshEnabled) {
      stopAutoRefresh();
      setTimeout(() => startAutoRefresh(seconds), 100);
    }
  }, [isAutoRefreshEnabled, startAutoRefresh, stopAutoRefresh]);

  // Health check
  const checkHealth = useCallback(async () => {
    if (!state.isInitialized) return;
    
    try {
      const health = await browserMCPService.healthCheck();
      setState(prev => ({ ...prev, healthStatus: health }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Health check failed'
      }));
    }
  }, [state.isInitialized]);

  // Live updates management
  const clearLiveUpdates = useCallback(() => {
    setLiveUpdates([]);
  }, []);

  // Cache management
  const clearCache = useCallback(() => {
    browserMCPService.clearCache();
    setLiveUpdates(prev => [{
      id: `cache-clear-${Date.now()}`,
      type: 'news' as const,
      message: 'Cache cleared - fresh data will be fetched on next update',
      timestamp: new Date(),
      severity: 'low' as const
    }, ...prev].slice(0, 50));
  }, []);

  // Initial data load
  useEffect(() => {
    if (state.isInitialized) {
      refreshAll();
    }
  }, [state.isInitialized, refreshAll]);

  // Periodic health checks
  useEffect(() => {
    if (!state.isInitialized) return;

    const healthInterval = setInterval(checkHealth, 30000); // Every 30 seconds
    return () => clearInterval(healthInterval);
  }, [state.isInitialized, checkHealth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      cleanupSubscriptions();
    };
  }, [stopAutoRefresh, cleanupSubscriptions]);

  return {
    // State
    state,
    
    // Data
    news,
    rankings,
    injuries,
    liveUpdates,
    
    // Manual refresh functions
    refreshNews,
    refreshRankings,
    refreshInjuries,
    refreshAll,
    
    // Auto-refresh controls
    isAutoRefreshEnabled,
    autoRefreshInterval,
    startAutoRefresh,
    stopAutoRefresh,
    setAutoRefreshInterval: handleSetAutoRefreshInterval,
    
    // Live updates
    clearLiveUpdates,
    
    // Health and maintenance
    checkHealth,
    clearCache
  };
}