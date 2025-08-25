/**
 * AI-Powered News Analysis Panel
 * 
 * Integrates with AIService to provide intelligent fantasy football news analysis
 * with league-specific impact scoring and actionable advice.
 */

import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  RefreshCw,
  Lightbulb,
  Target
} from 'lucide-react';
import { aiService, NewsImpact, LeagueContext } from '@/services/AIService';
import { storageService } from '@/services/StorageService';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  content?: string;
  source: string;
  publishedAt: Date;
  category: string;
  affectedPlayers: Array<{
    playerId: string;
    playerName: string;
    position: string;
    team: string;
  }>;
}

interface AINewsAnalysisPanelProps {
  newsItems: NewsItem[];
  leagueContexts: LeagueContext[];
  onAnalysisComplete: (impacts: NewsImpact[]) => void;
}

export const AINewsAnalysisPanel: React.FC<AINewsAnalysisPanelProps> = memo(({
  newsItems,
  leagueContexts,
  onAnalysisComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<NewsImpact[]>([]);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [aiProvider, setAiProvider] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Memoize recent news filtering to avoid recalculation
  const recentNewsItems = useMemo(() => {
    if (newsItems.length === 0) return [];
    
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    return newsItems.filter(item => 
      item.publishedAt.getTime() > thirtyMinutesAgo
    );
  }, [newsItems]);

  // Memoize league context validation
  const hasValidLeagueContexts = useMemo(() => {
    return leagueContexts.length > 0 && leagueContexts.every(ctx => ctx.leagueId && ctx.name);
  }, [leagueContexts]);

  const analyzeNews = useCallback(async () => {
    if (newsItems.length === 0 || !hasValidLeagueContexts) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('🤖 Starting AI analysis of news impact...');
      
      // Check if AI service is ready
      if (!aiService.isReady()) {
        await aiService.initialize();
      }
      
      // Analyze news with AI
      const impacts = await aiService.analyzeNews(newsItems, leagueContexts);
      
      setAnalysisResults(impacts);
      setLastAnalyzed(new Date());
      setAiProvider(aiService.getCurrentProvider());
      
      // Batch storage operations for better performance
      const storagePromises = impacts.map(impact => 
        storageService.storeNewsArticle({
          articleId: `news_${impact.playerId}_${Date.now()}`,
          headline: `Impact Analysis: ${impact.playerName}`,
          content: impact.actionableAdvice,
          source: 'AI Analysis',
          publishedAt: new Date(),
          impactAnalysis: [impact],
          leagueRelevance: {
            legends: impact.leagueRelevance.legends === 'high' ? 10 : 
                     impact.leagueRelevance.legends === 'medium' ? 5 : 2,
            injustice: impact.leagueRelevance.injustice === 'high' ? 10 : 
                       impact.leagueRelevance.injustice === 'medium' ? 5 : 2
          },
          affectedPlayers: [{
            playerId: impact.playerId,
            playerName: impact.playerName,
            impactType: impact.fantasyImpact.shortTerm.includes('positive') ? 'positive' : 
                       impact.fantasyImpact.shortTerm.includes('negative') ? 'negative' : 'neutral',
            shortTermImpact: impact.fantasyImpact.shortTerm,
            longTermImpact: impact.fantasyImpact.longTerm
          }],
          aiSummary: impact.actionableAdvice,
          keyTakeaways: impact.affectedLineupDecisions,
          actionableAdvice: [impact.actionableAdvice],
          archivedAt: new Date()
        })
      );
      
      // Execute storage operations in parallel
      await Promise.allSettled(storagePromises);
      
      onAnalysisComplete(impacts);
      console.log(`✅ AI analysis complete using ${aiService.getCurrentProvider()}`);
      
    } catch (error) {
      console.error('❌ AI news analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [newsItems, leagueContexts, onAnalysisComplete, hasValidLeagueContexts]);

  // Debounced auto-analyze to prevent excessive AI calls
  useEffect(() => {
    if (recentNewsItems.length > 0 && hasValidLeagueContexts) {
      // Debounce AI analysis calls by 2 seconds
      const debounceTimer = setTimeout(() => {
        analyzeNews();
      }, 2000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [recentNewsItems.length, hasValidLeagueContexts, analyzeNews]); // Include analyzeNews in dependencies

  // Memoize utility functions to prevent recreation on every render
  const getImpactIcon = useCallback((relevance: 'high' | 'medium' | 'low' | 'none') => {
    switch (relevance) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  }, []);

  const getImpactColor = useCallback((relevance: 'high' | 'medium' | 'low' | 'none') => {
    switch (relevance) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md border border-blue-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI News Impact Analysis</h3>
              <p className="text-sm text-gray-600">
                Powered by {aiProvider || 'Claude'} • League-specific insights
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {lastAnalyzed && (
              <span className="text-xs text-gray-500">
                Last: {lastAnalyzed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={analyzeNews}
              disabled={isAnalyzing}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Impact'}
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Analysis Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Using offline calculations as fallback
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      <div className="p-4">
        {isAnalyzing ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">AI analyzing news impact...</p>
            <p className="text-sm text-gray-500 mt-1">
              Processing {newsItems.length} articles for fantasy relevance
            </p>
          </div>
        ) : analysisResults.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                Impact Analysis for Your Leagues
              </span>
            </div>
            
            {analysisResults.map((impact, index) => (
              <div key={index} className="border rounded-lg p-4">
                {/* Player Impact Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{impact.playerName}</h4>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getImpactColor(impact.leagueRelevance.legends)}`}>
                        Legends: {impact.leagueRelevance.legends}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getImpactColor(impact.leagueRelevance.injustice)}`}>
                        Injustice: {impact.leagueRelevance.injustice}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {getImpactIcon(impact.leagueRelevance.legends === 'high' || impact.leagueRelevance.injustice === 'high' ? 'high' : 
                                   impact.leagueRelevance.legends === 'medium' || impact.leagueRelevance.injustice === 'medium' ? 'medium' : 'low')}
                    <span className="text-xs text-gray-500">
                      {Math.round(impact.fantasyImpact.confidenceLevel * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Fantasy Impact Analysis */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">Fantasy Impact</h5>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>This Week:</strong> {impact.fantasyImpact.shortTerm}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Rest of Season:</strong> {impact.fantasyImpact.longTerm}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actionable Advice */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="font-medium text-blue-900 mb-1">Actionable Advice</h5>
                        <p className="text-sm text-blue-800">{impact.actionableAdvice}</p>
                        
                        {impact.affectedLineupDecisions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-blue-700 mb-1">Lineup Decisions:</p>
                            <ul className="text-xs text-blue-700 space-y-1">
                              {impact.affectedLineupDecisions.map((decision, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span>•</span>
                                  <span>{decision}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">Ready for AI Analysis</h4>
            <p className="text-gray-600 mb-4">
              Click "Analyze Impact" to get AI-powered insights on how news affects your leagues
            </p>
            <p className="text-sm text-gray-500">
              AI will analyze {newsItems.length} articles for fantasy relevance
            </p>
          </div>
        )}
      </div>

      {/* AI Status Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${aiService.getCurrentProvider() !== 'offline' ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span>
              AI Provider: {aiService.getCurrentProvider() || 'Claude'} 
              {aiService.getCurrentProvider() === 'offline' ? ' (Offline Mode)' : ' (Online)'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>{analysisResults.length} impacts analyzed</span>
            <span>Leagues: {leagueContexts.map(l => l.name).join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Custom comparison function for better debugging
const AINewsAnalysisPanelComparison = (prevProps: AINewsAnalysisPanelProps, nextProps: AINewsAnalysisPanelProps) => {
  // Check if newsItems have actually changed
  const newsItemsChanged = prevProps.newsItems.length !== nextProps.newsItems.length ||
    prevProps.newsItems.some((item, index) => {
      const nextItem = nextProps.newsItems[index];
      return !nextItem || item.id !== nextItem.id || item.headline !== nextItem.headline;
    });
  
  // Check if league contexts have changed
  const leagueContextsChanged = prevProps.leagueContexts.length !== nextProps.leagueContexts.length ||
    prevProps.leagueContexts.some((ctx, index) => {
      const nextCtx = nextProps.leagueContexts[index];
      return !nextCtx || ctx.leagueId !== nextCtx.leagueId || ctx.name !== nextCtx.name;
    });
  
  // Check if callback has changed (should be stable with useCallback)
  const callbackChanged = prevProps.onAnalysisComplete !== nextProps.onAnalysisComplete;
  
  if (newsItemsChanged || leagueContextsChanged || callbackChanged) {
    console.log('🔄 AINewsAnalysisPanel re-rendering:', {
      newsItemsChanged,
      leagueContextsChanged, 
      callbackChanged,
      newsItemCount: nextProps.newsItems.length,
      leagueCount: nextProps.leagueContexts.length
    });
    return false; // Re-render
  }
  
  return true; // Skip re-render
};

// Create memoized component with custom comparison
const MemoizedAINewsAnalysisPanel = memo(AINewsAnalysisPanel, AINewsAnalysisPanelComparison);

// Set display name for better debugging
MemoizedAINewsAnalysisPanel.displayName = 'AINewsAnalysisPanel';

export default MemoizedAINewsAnalysisPanel;