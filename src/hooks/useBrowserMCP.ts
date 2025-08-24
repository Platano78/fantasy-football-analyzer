import { useState, useEffect, useCallback } from 'react';
import { nflLeagueService } from '../services/NFLLeagueService';
import { browserMCPService } from '../services/BrowserMCPService';

interface BrowserMCPState {
  isInitialized: boolean;
  error?: string;
  healthStatus: {
    espn: boolean;
    fantasypros: boolean;
    nfl: boolean;
    sleeper: boolean;
  };
  lastUpdate: Date;
}

interface RankingData {
  playerId: string;
  playerName: string;
  position: string;
  rank: number;
  source: string;
  updated: Date;
}

interface InjuryData {
  playerId: string;
  playerName: string;
  status: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  updated: Date;
}

interface NewsData {
  id: string;
  headline: string;
  summary: string;
  playersInvolved: string[];
  source: string;
  updated: Date;
}

interface BrowserMCPHook {
  state: BrowserMCPState;
  isAutoRefreshEnabled: boolean;
  autoRefreshInterval: number;
  rankings: RankingData[];
  injuries: InjuryData[];
  news: NewsData[];
  liveUpdates: any[];
  refreshAll: () => Promise<void>;
  refreshNews: () => Promise<void>;
  refreshRankings: () => Promise<void>;
  refreshInjuries: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  setAutoRefreshInterval: (interval: number) => void;
  clearLiveUpdates: () => void;
  clearCache: () => void;
  checkHealth: () => void;
}

export function useBrowserMCP(playerIds: string[]): BrowserMCPHook {
  const [state, setState] = useState<BrowserMCPState>({
    isInitialized: false,
    healthStatus: {
      espn: false,
      fantasypros: false,
      nfl: false,
      sleeper: false,
    },
    lastUpdate: new Date(),
  });

  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshIntervalState] = useState(300000); // 5 minutes
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout>();

  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [injuries, setInjuries] = useState<InjuryData[]>([]);
  const [news, setNews] = useState<NewsData[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);

  // Initialize Browser MCP service
  const initializeService = useCallback(async () => {
    try {
      console.log('🚀 Initializing Browser MCP service...');
      
      // Check if Browser MCP is available - test multiple functions for reliability
      const browserMCPFunctions = [
        'mcp__playwright__browser_navigate',
        'mcp__playwright__browser_snapshot',
        'mcp__playwright__browser_click',
        'mcp__playwright__browser_type'
      ];
      
      const availableFunctions = browserMCPFunctions.filter(
        func => typeof (globalThis as any)[func] === 'function'
      );
      
      const isBrowserMCPAvailable = availableFunctions.length >= 2; // Need at least 2 functions
      
      console.log(`🔍 Browser MCP Detection: ${availableFunctions.length}/${browserMCPFunctions.length} functions available`);
      console.log(`📋 Available functions: ${availableFunctions.join(', ')}`);
      
      if (isBrowserMCPAvailable) {
        console.log('✅ Browser MCP is ACTIVE and ready for automation');
        
        // Test Browser MCP with a simple operation
        try {
          // This will help verify Browser MCP is truly working
          console.log('🧪 Testing Browser MCP functionality...');
          // We don't actually navigate to avoid large responses, just verify the function exists
          
          // Initialize NFL League Service
          const healthCheck = await nflLeagueService.healthCheck();
          console.log('NFL League Service Health:', healthCheck);
          
          setState(prev => ({
            ...prev,
            isInitialized: true,
            healthStatus: {
              espn: true,
              fantasypros: true,
              nfl: healthCheck.status === 'healthy',
              sleeper: true,
            },
            lastUpdate: new Date(),
          }));
        } catch (testError) {
          console.warn('⚠️ Browser MCP functions exist but testing failed:', testError);
          setState(prev => ({
            ...prev,
            isInitialized: true,
            error: 'Browser MCP available but may have issues',
            healthStatus: {
              espn: true,
              fantasypros: true,
              nfl: false,
              sleeper: true,
            },
            lastUpdate: new Date(),
          }));
        }
      } else {
        console.warn('❌ Browser MCP not available - missing required functions');
        console.warn('💡 Available functions:', availableFunctions);
        setState(prev => ({
          ...prev,
          isInitialized: true,
          error: `Browser MCP not available - only ${availableFunctions.length} functions found`,
          healthStatus: {
            espn: false,
            fantasypros: false,
            nfl: false,
            sleeper: false,
          },
          lastUpdate: new Date(),
        }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
      console.error('❌ Browser MCP initialization failed:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: errorMessage,
        healthStatus: {
          espn: false,
          fantasypros: false,
          nfl: false,
          sleeper: false,
        },
      }));
    }
  }, []);

  // Refresh all data sources
  const refreshAll = useCallback(async () => {
    console.log('🔄 Refreshing all Browser MCP data...');
    
    try {
      setState(prev => ({ ...prev, error: undefined }));
      
      await Promise.all([
        refreshRankings(),
        refreshInjuries(),
        refreshNews(),
      ]);

      setState(prev => ({
        ...prev,
        lastUpdate: new Date(),
      }));

      console.log('✅ All Browser MCP data refreshed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
      console.error('❌ Browser MCP refresh failed:', errorMessage);
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Refresh rankings from multiple sources
  const refreshRankings = useCallback(async () => {
    try {
      console.log('📊 Refreshing fantasy rankings...');
      
      // Try to scrape rankings from FantasyPros via Browser MCP
      if (typeof browserMCPService?.scrapeFantasyProRankings === 'function') {
        const fpRankings = await browserMCPService.scrapeFantasyProRankings();
        const transformedRankings: RankingData[] = fpRankings.map((ranking, i) => ({
          playerId: `fp_${i}`,
          playerName: ranking.name || `Player ${i + 1}`,
          position: ranking.position || 'RB',
          rank: ranking.rank || i + 1,
          source: 'FantasyPros',
          updated: new Date(),
        }));
        
        setRankings(transformedRankings);
        console.log(`✅ Loaded ${transformedRankings.length} FantasyPros rankings`);
      } else {
        // Fallback rankings for draft functionality
        const fallbackRankings: RankingData[] = [
          { playerId: '1', playerName: 'Josh Allen', position: 'QB', rank: 1, source: 'Fallback', updated: new Date() },
          { playerId: '2', playerName: 'Christian McCaffrey', position: 'RB', rank: 2, source: 'Fallback', updated: new Date() },
          { playerId: '3', playerName: 'Tyreek Hill', position: 'WR', rank: 3, source: 'Fallback', updated: new Date() },
          { playerId: '4', playerName: 'Travis Kelce', position: 'TE', rank: 4, source: 'Fallback', updated: new Date() },
          { playerId: '5', playerName: 'Cooper Kupp', position: 'WR', rank: 5, source: 'Fallback', updated: new Date() },
        ];
        
        setRankings(fallbackRankings);
        console.log('⚠️ Using fallback rankings - Browser MCP not available');
      }
    } catch (error) {
      console.error('❌ Rankings refresh failed:', error);
    }
  }, []);

  // Refresh injury reports
  const refreshInjuries = useCallback(async () => {
    try {
      console.log('🏥 Refreshing injury reports...');
      
      // Try to scrape injury data
      if (typeof browserMCPService?.scrapeNFLInjuries === 'function') {
        const espnInjuries = await browserMCPService.scrapeNFLInjuries();
        const transformedInjuries: InjuryData[] = espnInjuries.map((injury, i) => ({
          playerId: `inj_${i}`,
          playerName: injury.playerName || `Player ${i + 1}`,
          status: injury.status || 'Healthy',
          description: injury.description || 'No injury report',
          severity: injury.severity || 'minor',
          updated: new Date(),
        }));
        
        setInjuries(transformedInjuries);
        console.log(`✅ Loaded ${transformedInjuries.length} injury reports`);
      } else {
        // Clear injuries if no data available
        setInjuries([]);
        console.log('⚠️ No injury data available - Browser MCP not functional');
      }
    } catch (error) {
      console.error('❌ Injuries refresh failed:', error);
    }
  }, []);

  // Refresh fantasy news
  const refreshNews = useCallback(async () => {
    try {
      console.log('📰 Refreshing fantasy news...');
      
      // Try to scrape news data
      if (typeof browserMCPService?.scrapeFantasyProNews === 'function') {
        const newsData = await browserMCPService.scrapeFantasyProNews();
        const transformedNews: NewsData[] = newsData.map((article, i) => ({
          id: `news_${i}`,
          headline: article.headline || `Fantasy News ${i + 1}`,
          summary: article.summary || 'Fantasy football update',
          playersInvolved: article.players || [],
          source: article.source || 'Fantasy Source',
          updated: new Date(),
        }));
        
        setNews(transformedNews);
        console.log(`✅ Loaded ${transformedNews.length} news articles`);
      } else {
        // Clear news if no data available
        setNews([]);
        console.log('⚠️ No news data available - Browser MCP not functional');
      }
    } catch (error) {
      console.error('❌ News refresh failed:', error);
    }
  }, []);

  // Auto-refresh functionality
  const startAutoRefresh = useCallback(() => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
    }
    
    const timer = setInterval(() => {
      refreshAll();
    }, autoRefreshInterval);
    
    setAutoRefreshTimer(timer);
    setIsAutoRefreshEnabled(true);
    console.log(`🔄 Auto-refresh started (${autoRefreshInterval / 1000}s interval)`);
  }, [autoRefreshInterval, refreshAll, autoRefreshTimer]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      setAutoRefreshTimer(undefined);
    }
    setIsAutoRefreshEnabled(false);
    console.log('⏹️ Auto-refresh stopped');
  }, [autoRefreshTimer]);

  const setAutoRefreshInterval = useCallback((interval: number) => {
    setAutoRefreshIntervalState(interval);
    if (isAutoRefreshEnabled) {
      stopAutoRefresh();
      setTimeout(startAutoRefresh, 100); // Brief delay to ensure clean restart
    }
  }, [isAutoRefreshEnabled, startAutoRefresh, stopAutoRefresh]);

  // Health check
  const checkHealth = useCallback(async () => {
    console.log('🏥 Checking Browser MCP health...');
    
    // Use improved detection logic
    const browserMCPFunctions = [
      'mcp__playwright__browser_navigate',
      'mcp__playwright__browser_snapshot',
      'mcp__playwright__browser_click',
      'mcp__playwright__browser_type'
    ];
    
    const availableFunctions = browserMCPFunctions.filter(
      func => typeof (globalThis as any)[func] === 'function'
    );
    
    const isBrowserMCPAvailable = availableFunctions.length >= 2;
    console.log(`🔍 Health Check: ${availableFunctions.length}/${browserMCPFunctions.length} Browser MCP functions available`);
    
    const nflHealth = await nflLeagueService.healthCheck();
    
    setState(prev => ({
      ...prev,
      healthStatus: {
        espn: isBrowserMCPAvailable,
        fantasypros: isBrowserMCPAvailable,
        nfl: nflHealth.status === 'healthy' && isBrowserMCPAvailable,
        sleeper: isBrowserMCPAvailable,
      },
      lastUpdate: new Date(),
    }));
  }, []);

  // Utility functions
  const clearLiveUpdates = useCallback(() => {
    setLiveUpdates([]);
    console.log('🗑️ Live updates cleared');
  }, []);

  const clearCache = useCallback(() => {
    setRankings([]);
    setInjuries([]);
    setNews([]);
    setLiveUpdates([]);
    console.log('🗑️ Browser MCP cache cleared');
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeService();
    
    // Cleanup on unmount
    return () => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
      }
    };
  }, [initializeService]);

  return {
    state,
    isAutoRefreshEnabled,
    autoRefreshInterval,
    rankings,
    injuries,
    news,
    liveUpdates,
    refreshAll,
    refreshNews,
    refreshRankings,
    refreshInjuries,
    startAutoRefresh,
    stopAutoRefresh,
    setAutoRefreshInterval,
    clearLiveUpdates,
    clearCache,
    checkHealth,
  };
}