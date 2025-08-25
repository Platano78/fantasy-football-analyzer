import { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { 
  Newspaper, 
  AlertCircle, 
  TrendingUp, 
  RefreshCw, 
  Filter, 
  Clock, 
  User, 
  Activity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Share2,
  Bookmark,
  Wifi,
  WifiOff,
  Brain,
  Zap
} from 'lucide-react';
import { useFantasyFootball } from '@/contexts/FantasyFootballContext';
import AINewsAnalysisPanel from '@/components/AINewsAnalysisPanel';
import { LeagueContext, NewsImpact } from '@/services/AIService';
import { espnAPIService, ESPNNewsItem } from '@/services/ESPNAPIService';

// News item interfaces
interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  content?: string;
  impactScore: 1 | 2 | 3 | 4 | 5; // Fantasy impact rating
  affectedPlayers: {
    playerId: string;
    playerName: string;
    position: string;
    team: string;
    impactType: 'positive' | 'negative' | 'neutral';
  }[];
  category: 'injury' | 'trade' | 'depth_chart' | 'performance' | 'breaking' | 'analysis';
  timestamp: Date;
  source: string;
  sourceUrl?: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  isMyPlayer: boolean;
  tags: string[];
  readTime: number; // minutes
  trending: boolean;
}

// News filtering interface
interface NewsFilters {
  category: string;
  severity: string;
  myPlayersOnly: boolean;
  impactScore: number;
  timeFrame: 'all' | 'today' | 'week' | 'month';
  sortBy: 'timestamp' | 'impact' | 'trending';
}

// Memoized news item component
const NewsItemComponent = memo(({ 
  item, 
  onToggleExpand,
  isExpanded,
  onPlayerClick,
  onBookmark,
  onShare
}: {
  item: NewsItem;
  onToggleExpand: (id: string) => void;
  isExpanded: boolean;
  onPlayerClick: (playerId: string) => void;
  onBookmark: (id: string) => void;
  onShare: (id: string) => void;
}) => {
  const getImpactColor = (score: number) => {
    if (score >= 4) return 'text-red-600 bg-red-50';
    if (score >= 3) return 'text-orange-600 bg-orange-50';
    if (score >= 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'injury': return 'bg-red-100 text-red-800';
      case 'trade': return 'bg-purple-100 text-purple-800';
      case 'depth_chart': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'breaking': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Activity className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${
      item.isMyPlayer ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
    } hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            {getSeverityIcon(item.severity)}
            {item.trending && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(item.category)}`}>
                {item.category.toUpperCase()}
              </span>
              <div className={`px-2 py-1 text-xs font-bold rounded ${getImpactColor(item.impactScore)}`}>
                Impact: {item.impactScore}/5
              </div>
              {item.isMyPlayer && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  <User className="w-3 h-3" />
                  My Player
                </div>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => onToggleExpand(item.id)}>
              {item.headline}
            </h3>
            
            <p className="text-sm text-gray-600 mb-2">{item.summary}</p>
            
            {/* Affected Players */}
            {item.affectedPlayers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {item.affectedPlayers.map((player, index) => (
                  <button
                    key={index}
                    onClick={() => onPlayerClick(player.playerId)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      player.impactType === 'positive' ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100' :
                      player.impactType === 'negative' ? 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100' :
                      'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {player.playerName} ({player.position}, {player.team})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={() => onBookmark(item.id)}
            className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
            title="Bookmark"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShare(item.id)}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleExpand(item.id)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && item.content && (
        <div className="border-t pt-3 mt-3">
          <div className="prose prose-sm max-w-none text-gray-700 mb-3">
            {item.content}
          </div>
          
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Read full article <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
        <div className="flex items-center gap-3">
          <span>{item.source}</span>
          <span>{item.timestamp.toLocaleTimeString()}</span>
          <span>{item.readTime} min read</span>
        </div>
        
        {item.trending && (
          <div className="flex items-center gap-1 text-orange-600">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">Trending</span>
          </div>
        )}
      </div>
    </div>
  );
});

NewsItemComponent.displayName = 'NewsItemComponent';

// Memoized news filters
const NewsFilters = memo(({ 
  filters, 
  onFiltersChange,
  myPlayerCount,
  totalNewsCount 
}: {
  filters: NewsFilters;
  onFiltersChange: (newFilters: Partial<NewsFilters>) => void;
  myPlayerCount: number;
  totalNewsCount: number;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">News Filters</h3>
        <span className="text-sm text-gray-500">({totalNewsCount} articles)</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFiltersChange({ category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="injury">Injuries</option>
            <option value="trade">Trades</option>
            <option value="depth_chart">Depth Chart</option>
            <option value="performance">Performance</option>
            <option value="breaking">Breaking News</option>
            <option value="analysis">Analysis</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select
            value={filters.severity}
            onChange={(e) => onFiltersChange({ severity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severity</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Impact Score Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Impact</label>
          <select
            value={filters.impactScore}
            onChange={(e) => onFiltersChange({ impactScore: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1+ Impact</option>
            <option value={2}>2+ Impact</option>
            <option value={3}>3+ Impact</option>
            <option value={4}>4+ Impact</option>
            <option value={5}>5 Impact Only</option>
          </select>
        </div>

        {/* Time Frame */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Frame</label>
          <select
            value={filters.timeFrame}
            onChange={(e) => onFiltersChange({ timeFrame: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Toggles */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => onFiltersChange({ myPlayersOnly: !filters.myPlayersOnly })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filters.myPlayersOnly
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          My Players Only ({myPlayerCount})
        </button>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="timestamp">Latest</option>
            <option value="impact">Impact Score</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>
    </div>
  );
});

NewsFilters.displayName = 'NewsFilters';

// News statistics component
const NewsStats = memo(({ 
  totalNews, 
  myPlayerNews, 
  urgentNews, 
  lastUpdated,
  onRefresh,
  isRefreshing 
}: {
  totalNews: number;
  myPlayerNews: number;
  urgentNews: number;
  lastUpdated: Date;
  onRefresh: () => void;
  isRefreshing: boolean;
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{totalNews}</div>
        <div className="text-xs text-gray-600">Total News</div>
      </div>
      
      <div className="bg-green-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{myPlayerNews}</div>
        <div className="text-xs text-gray-600">My Players</div>
      </div>
      
      <div className="bg-red-50 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-red-600">{urgentNews}</div>
        <div className="text-xs text-gray-600">Urgent Updates</div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-full text-center hover:bg-gray-100 rounded transition-colors"
        >
          <RefreshCw className={`w-6 h-6 mx-auto mb-1 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <div className="text-xs text-gray-600">
            {isRefreshing ? 'Updating...' : 'Refresh'}
          </div>
        </button>
      </div>
    </div>
  );
});

NewsStats.displayName = 'NewsStats';

// Main NewsView component
export default function NewsView() {
  const { state } = useFantasyFootball();
  
  // Get my player IDs for personalized news
  const myPlayerIds = useMemo(() => {
    return Array.from(state.draftedPlayers).map(id => id.toString());
  }, [state.draftedPlayers]);

  // Mock Browser MCP for demonstration (removed actual integration)
  const browserMCP = {
    news: [],
    state: { isInitialized: false, lastUpdate: new Date(), isLoading: false },
    isAutoRefreshEnabled: false,
    autoRefreshInterval: 300,
    refreshNews: async () => {}
  };
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<NewsFilters>({
    category: 'all',
    severity: 'all',
    myPlayersOnly: false,
    impactScore: 1,
    timeFrame: 'all',
    sortBy: 'timestamp'
  });

  // AI Analysis State
  const [aiAnalysisResults, setAiAnalysisResults] = useState<NewsImpact[]>([]);
  const [showAiAnalysis, setShowAiAnalysis] = useState(true);

  // ESPN API News State
  const [espnNews, setEspnNews] = useState<ESPNNewsItem[]>([]);
  const [isLoadingEspnNews, setIsLoadingEspnNews] = useState(false);
  const [espnNewsError, setEspnNewsError] = useState<string | null>(null);

  // Memoize player lookup for better performance
  const playerLookup = useMemo(() => {
    const lookup = new Map();
    state.players.forEach(player => {
      lookup.set(player.name.toLowerCase(), player);
    });
    return lookup;
  }, [state.players]);

  // Combined news from ESPN API and Browser MCP with optimized processing
  const combinedNewsItems = useMemo(() => {
    // Convert ESPN news to the NewsItem format for compatibility
    const espnNewsAsNewsItems: NewsItem[] = espnNews.map(item => {
      // Optimized player matching using lookup table
      const isMyPlayer = item.affectedPlayers.some(player => {
        return myPlayerIds.includes(player.playerId) || 
               playerLookup.has(player.playerName.toLowerCase());
      });

      return {
        id: item.id,
        headline: item.headline,
        summary: item.summary,
        content: item.content,
        impactScore: item.impactScore,
        affectedPlayers: item.affectedPlayers,
        category: item.category,
        timestamp: item.publishedAt,
        source: item.source,
        sourceUrl: item.sourceUrl,
        severity: item.severity,
        isMyPlayer,
        tags: item.tags,
        readTime: item.readTime,
        trending: item.severity === 'urgent' || item.impactScore >= 4
      };
    });

    // Combine ESPN news with Browser MCP news, removing duplicates
    const browserMcpNews = browserMCP.news || [];
    const combinedNews = [...espnNewsAsNewsItems];
    
    // Optimized duplicate detection using Set for better performance
    const espnHeadlines = new Set(
      espnNewsAsNewsItems.map(item => item.headline.toLowerCase().substring(0, 30))
    );
    
    browserMcpNews.forEach(mcpItem => {
      const mcpHeadlineKey = mcpItem.headline.toLowerCase().substring(0, 30);
      const isDuplicate = espnHeadlines.has(mcpHeadlineKey);
      
      if (!isDuplicate) {
        combinedNews.push(mcpItem);
      }
    });

    return combinedNews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [espnNews, browserMCP.news, myPlayerIds, playerLookup]);

  // Fetch ESPN news - stable reference with proper dependencies
  const fetchEspnNews = useCallback(async () => {
    try {
      setIsLoadingEspnNews(true);
      setEspnNewsError(null);
      
      console.log('📰 Fetching latest news from ESPN API...');
      const newsItems = await espnAPIService.getLatestNews(50); // Get latest 50 articles
      
      setEspnNews(newsItems);
      console.log(`✅ Successfully loaded ${newsItems.length} news items from ESPN`);
    } catch (error) {
      console.error('❌ Failed to fetch ESPN news:', error);
      setEspnNewsError(error instanceof Error ? error.message : 'Failed to load news');
    } finally {
      setIsLoadingEspnNews(false);
    }
  }, []); // Empty deps is fine here since we're only using state setters (React guarantees they're stable)

  // Fetch news on mount and setup periodic refresh
  useEffect(() => {
    // Fetch initial news
    fetchEspnNews();
    
    // Setup periodic refresh (5 minutes)
    const newsRefreshInterval = setInterval(() => {
      fetchEspnNews();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(newsRefreshInterval);
  }, []); // Empty dependency array - we only want this to run once on mount

  // Create league contexts for AI analysis
  const leagueContexts = useMemo((): LeagueContext[] => {
    // For now, we'll create mock league contexts based on the current fantasy state
    // This will be enhanced when we have real league data from ESPN API
    const legendsLeague: LeagueContext = {
      leagueId: '1602776',
      name: 'Legends League',
      teams: [], // Will be populated from real league data
      myTeam: {
        teamId: 'user_team_legends',
        teamName: 'My Legends Team',
        roster: Array.from(state.draftedPlayers).map(playerId => {
          const player = state.players.find(p => p.id === playerId);
          return player || {} as any; // Fallback for missing players
        }).filter(p => p.id), // Remove empty objects
        draftPosition: state.draftSettings?.position || 1,
        record: { wins: 0, losses: 0, ties: 0 },
        playoffPosition: 0
      },
      settings: {
        size: state.draftSettings?.totalTeams || 12,
        scoringType: state.scoringSystem === 'ppr' ? 'PPR' : 
                    state.scoringSystem === 'standard' ? 'Standard' : 'Half-PPR',
        rosterPositions: {
          QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1, FLEX: 1, BE: 6
        },
        playoffTeams: 6,
        tradingEnabled: true
      },
      currentWeek: 1
    };

    const injusticeLeague: LeagueContext = {
      leagueId: '6317063',
      name: 'Injustice League',
      teams: [], // Will be populated from real league data
      myTeam: {
        teamId: 'user_team_injustice',
        teamName: state.draftSettings?.leagueName || 'My Injustice Team',
        roster: Array.from(state.draftedPlayers).map(playerId => {
          const player = state.players.find(p => p.id === playerId);
          return player || {} as any;
        }).filter(p => p.id),
        draftPosition: state.draftSettings?.position || 1,
        record: { wins: 0, losses: 0, ties: 0 },
        playoffPosition: 0
      },
      settings: {
        size: state.draftSettings?.totalTeams || 12,
        scoringType: state.scoringSystem === 'ppr' ? 'PPR' : 
                    state.scoringSystem === 'standard' ? 'Standard' : 'Half-PPR',
        rosterPositions: {
          QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1, FLEX: 1, BE: 6
        },
        playoffTeams: 6,
        tradingEnabled: true
      },
      currentWeek: 1
    };

    return [legendsLeague, injusticeLeague];
  }, [state.draftedPlayers, state.players, state.draftSettings, state.scoringSystem]);

  // Memoize AI news items to prevent unnecessary re-renders of AINewsAnalysisPanel
  const aiNewsItems = useMemo(() => {
    return combinedNewsItems.map(item => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      content: item.content,
      source: item.source,
      publishedAt: item.timestamp,
      category: item.category,
      affectedPlayers: item.affectedPlayers.map(player => ({
        playerId: player.playerId,
        playerName: player.playerName,
        position: player.position,
        team: player.team
      }))
    }));
  }, [combinedNewsItems]);

  // Use combined news data from ESPN API and Browser MCP
  const newsItems = combinedNewsItems;

  // Filter and sort news items
  const filteredNews = useMemo(() => {
    let filtered = [...newsItems];

    // Apply filters
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    
    if (filters.severity !== 'all') {
      filtered = filtered.filter(item => item.severity === filters.severity);
    }
    
    if (filters.myPlayersOnly) {
      filtered = filtered.filter(item => item.isMyPlayer);
    }
    
    filtered = filtered.filter(item => item.impactScore >= filters.impactScore);

    // Apply time frame filter
    const now = Date.now();
    switch (filters.timeFrame) {
      case 'today':
        filtered = filtered.filter(item => now - item.timestamp.getTime() < 24 * 60 * 60 * 1000);
        break;
      case 'week':
        filtered = filtered.filter(item => now - item.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filtered = filtered.filter(item => now - item.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'impact':
        filtered.sort((a, b) => b.impactScore - a.impactScore);
        break;
      case 'trending':
        filtered.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
      default: // timestamp
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
    }

    return filtered;
  }, [newsItems, filters]);

  // Calculate statistics
  const stats = useMemo(() => ({
    total: newsItems.length,
    myPlayerNews: newsItems.filter(item => item.isMyPlayer).length,
    urgentNews: newsItems.filter(item => item.severity === 'urgent').length
  }), [newsItems]);

  // Event handlers
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<NewsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handlePlayerClick = useCallback((playerId: string) => {
    console.log('Navigate to player:', playerId);
    // In production, this would navigate to player details
  }, []);

  // Throttle refresh calls to prevent excessive API usage
  const lastRefreshTimeRef = useRef(0);
  
  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    const minRefreshInterval = 30 * 1000; // 30 seconds minimum between refreshes
    
    if (now - lastRefreshTimeRef.current < minRefreshInterval) {
      console.log('🚫 Refresh throttled - too soon since last refresh');
      return;
    }
    
    lastRefreshTimeRef.current = now;
    
    try {
      // Refresh both ESPN news and Browser MCP news in parallel
      const [espnResult, mcpResult] = await Promise.allSettled([
        fetchEspnNews(),
        browserMCP.refreshNews()
      ]);
      
      // Log any failures without throwing
      if (espnResult.status === 'rejected') {
        console.warn('ESPN news refresh failed:', espnResult.reason);
      }
      if (mcpResult.status === 'rejected') {
        console.warn('Browser MCP refresh failed:', mcpResult.reason);
      }
      
    } catch (error) {
      console.error('News refresh error:', error);
    }
  }, [browserMCP, fetchEspnNews]); // Removed lastRefreshTime from deps since we're using ref

  const handleBookmark = useCallback((id: string) => {
    console.log('Bookmark news item:', id);
  }, []);

  const handleShare = useCallback((id: string) => {
    console.log('Share news item:', id);
  }, []);

  // AI Analysis Handlers
  const handleAiAnalysisComplete = useCallback((impacts: NewsImpact[]) => {
    setAiAnalysisResults(impacts);
    console.log('✅ AI Analysis completed:', impacts.length, 'impacts found');
  }, []);

  const handleToggleAiAnalysis = useCallback(() => {
    setShowAiAnalysis(prev => !prev);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            NFL News & Fantasy Impact
          </h3>
          <div className="flex items-center gap-4">
            {/* AI Analysis Toggle */}
            <button
              onClick={handleToggleAiAnalysis}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAiAnalysis
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Brain className="w-4 h-4" />
              AI Analysis {showAiAnalysis ? 'ON' : 'OFF'}
            </button>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" />
              <span>Live Updates</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <NewsStats
          totalNews={stats.total}
          myPlayerNews={stats.myPlayerNews}
          urgentNews={stats.urgentNews}
          lastUpdated={browserMCP.state.lastUpdate}
          onRefresh={handleRefresh}
          isRefreshing={browserMCP.state.isLoading || isLoadingEspnNews}
        />
      </div>

      {/* Filters */}
      <NewsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        myPlayerCount={stats.myPlayerNews}
        totalNewsCount={filteredNews.length}
      />

      {/* AI News Analysis Panel */}
      {showAiAnalysis && (
        <AINewsAnalysisPanel
          newsItems={aiNewsItems}
          leagueContexts={leagueContexts}
          onAnalysisComplete={handleAiAnalysisComplete}
        />
      )}

      {/* News Feed */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No News Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters to see more news items.
            </p>
            <button
              onClick={() => setFilters({
                category: 'all',
                severity: 'all',
                myPlayersOnly: false,
                impactScore: 1,
                timeFrame: 'all',
                sortBy: 'timestamp'
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredNews.map(item => (
            <NewsItemComponent
              key={item.id}
              item={item}
              onToggleExpand={handleToggleExpand}
              isExpanded={expandedItems.has(item.id)}
              onPlayerClick={handlePlayerClick}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))
        )}
      </div>

      {/* News Sources Status */}
      <div className="space-y-4">
        {/* ESPN API Status */}
        <div className={`border rounded-lg p-4 ${
          !espnNewsError 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {!espnNewsError ? (
              <div className="w-6 h-6 text-green-600 mt-1">📡</div>
            ) : (
              <div className="w-6 h-6 text-red-600 mt-1">⚠️</div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold ${
                  !espnNewsError ? 'text-green-900' : 'text-red-900'
                }`}>
                  ESPN API News Feed {!espnNewsError ? 'Connected' : 'Error'}
                </h4>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium ${
                    !espnNewsError
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {espnNews.length} articles loaded
                  </span>
                  {isLoadingEspnNews && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>
              
              <p className={`text-sm ${
                !espnNewsError ? 'text-green-800' : 'text-red-800'
              }`}>
                {!espnNewsError ? (
                  `Successfully fetching latest NFL news directly from ESPN API with intelligent impact scoring for fantasy relevance. ${espnNews.length} articles available for AI analysis.`
                ) : (
                  `ESPN API connection error: ${espnNewsError}. Using fallback news sources.`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Browser MCP Status */}
        <div className={`border rounded-lg p-4 ${
          browserMCP.state.isInitialized 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-start gap-3">
          {browserMCP.state.isInitialized ? (
            <Wifi className="w-6 h-6 text-blue-600 mt-1" />
          ) : (
            <WifiOff className="w-6 h-6 text-red-600 mt-1" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold ${
                browserMCP.state.isInitialized ? 'text-blue-900' : 'text-red-900'
              }`}>
                Browser MCP Integration {browserMCP.state.isInitialized ? 'Active' : 'Disconnected'}
              </h4>
              
              {/* Auto-refresh controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => browserMCP.isAutoRefreshEnabled 
                    ? browserMCP.stopAutoRefresh() 
                    : browserMCP.startAutoRefresh()
                  }
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    browserMCP.isAutoRefreshEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  Auto-refresh {browserMCP.isAutoRefreshEnabled ? 'ON' : 'OFF'}
                </button>
                
                <select
                  value={browserMCP.autoRefreshInterval}
                  onChange={(e) => browserMCP.setAutoRefreshInterval(Number(e.target.value))}
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value={60}>1 min</option>
                  <option value={300}>5 min</option>
                  <option value={600}>10 min</option>
                  <option value={900}>15 min</option>
                </select>
              </div>
            </div>
            
            <p className={`text-sm mb-3 ${
              browserMCP.state.isInitialized ? 'text-blue-800' : 'text-red-800'
            }`}>
              {browserMCP.state.isInitialized ? (
                'Browser MCP is actively collecting live NFL news and analyzing fantasy impact from FantasyPros, ESPN, NFL.com, and other trusted sources. News items are automatically scored for fantasy relevance and filtered based on your roster.'
              ) : (
                browserMCP.state.error || 'Browser MCP service is not available. Using cached data.'
              )}
            </p>
            
            {browserMCP.state.isInitialized && (
              <>
                <div className="flex items-center gap-4 text-xs mb-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      browserMCP.state.healthStatus.fantasypros ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span>FantasyPros</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      browserMCP.state.healthStatus.espn ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span>ESPN</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      browserMCP.state.healthStatus.nfl ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span>NFL.com</span>
                  </div>
                </div>
                
                <div className={`text-xs ${
                  browserMCP.state.isInitialized ? 'text-blue-700' : 'text-red-700'
                }`}>
                  <span>Last update: {browserMCP.state.lastUpdate.toLocaleTimeString()}</span>
                  <span className="mx-2">•</span>
                  <span>Next update: {browserMCP.isAutoRefreshEnabled ? `Every ${browserMCP.autoRefreshInterval / 60} minutes` : 'Manual only'}</span>
                </div>
              </>
            )}
            
            {!browserMCP.state.isInitialized && (
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
          </div> {/* Close flex items-start gap-3 */}
        </div>
      </div> {/* End News Sources Status */}
    </div>
  );
}