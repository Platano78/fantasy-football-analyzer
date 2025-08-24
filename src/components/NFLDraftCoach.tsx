import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  NFLLeague,
  NFLDraftContext,
  NFLDraftRecommendation,
  NFLPlayer,
  FantasyTeam
} from '@/types/NFLLeagueTypes';
import { 
  hybridAIService, 
  FantasyAIRequest, 
  FantasyAIResponse,
  AIBackend 
} from '@/services/HybridAIService';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  MessageCircle,
  Camera,
  Zap,
  Brain,
  Shield,
  Play,
  Pause,
  RefreshCw,
  Settings
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface NFLDraftCoachProps {
  league: NFLLeague;
  className?: string;
  enableScreenshots?: boolean;
  debugMode?: boolean;
  aiService?: 'gemini-advanced' | 'gemini-enterprise' | 'hybrid';
  onDraftUpdate?: (context: NFLDraftContext) => void;
  onRecommendationReceived?: (recommendation: NFLDraftRecommendation) => void;
}

type DraftStrategy = 'balanced' | 'zero_rb' | 'rb_heavy' | 'late_round_qb';

interface DraftTimer {
  timeRemaining: number;
  isMyPick: boolean;
  currentPick: number;
  currentRound: number;
  totalTime: number;
  isActive: boolean;
}

interface QuickQuery {
  id: string;
  text: string;
  icon: React.ReactNode;
  context: string;
}

export const NFLDraftCoach: React.FC<NFLDraftCoachProps> = ({
  league,
  className = '',
  enableScreenshots = false,
  debugMode = false,
  aiService = 'hybrid',
  onDraftUpdate,
  onRecommendationReceived
}) => {
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [draftContext, setDraftContext] = useState<NFLDraftContext | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<NFLDraftRecommendation | null>(null);
  const [draftTimer, setDraftTimer] = useState<DraftTimer>({
    timeRemaining: 90,
    isMyPick: false,
    currentPick: 1,
    currentRound: 1,
    totalTime: 90,
    isActive: false
  });

  // AI state
  const [aiStatus, setAiStatus] = useState<Record<AIBackend, any>>({});
  const [isRequestingAI, setIsRequestingAI] = useState(false);
  const [lastAIResponse, setLastAIResponse] = useState<FantasyAIResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Strategy and recommendations
  const [selectedStrategy, setSelectedStrategy] = useState<DraftStrategy>('balanced');
  const [availablePlayers, setAvailablePlayers] = useState<NFLPlayer[]>([]);
  const [draftedPlayers, setDraftedPlayers] = useState<NFLPlayer[]>([]);
  const [myRoster, setMyRoster] = useState<NFLPlayer[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'recommendations' | 'strategy' | 'chat' | 'debug'>('recommendations');
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'user' | 'ai'; content: string; timestamp: Date }>>([]);
  const [customQuery, setCustomQuery] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // Refs
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastRequestId = useRef<string>('');

  // Draft strategies configuration
  const strategies = {
    balanced: {
      name: 'Balanced Approach',
      description: 'Mix of RB/WR early, QB mid-rounds',
      icon: <Shield className="w-5 h-5" />,
      color: 'blue',
      riskLevel: 'Moderate'
    },
    zero_rb: {
      name: 'Zero RB Strategy',
      description: 'WR-heavy early, find RB value later',
      icon: <Zap className="w-5 h-5" />,
      color: 'purple',
      riskLevel: 'Aggressive'
    },
    rb_heavy: {
      name: 'RB Heavy',
      description: 'Prioritize RBs early, secure backfield',
      icon: <Target className="w-5 h-5" />,
      color: 'green',
      riskLevel: 'Conservative'
    },
    late_round_qb: {
      name: 'Late Round QB',
      description: 'Wait on QB, maximize skill positions',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'orange',
      riskLevel: 'Value-focused'
    }
  };

  // Quick query templates
  const quickQueries: QuickQuery[] = [
    {
      id: 'best-pick',
      text: 'Who should I pick right now?',
      icon: <Target className="w-4 h-4" />,
      context: 'draft_analysis'
    },
    {
      id: 'next-round',
      text: 'What positions to target next round?',
      icon: <TrendingUp className="w-4 h-4" />,
      context: 'strategy_advice'
    },
    {
      id: 'sleeper-picks',
      text: 'Any sleeper picks available?',
      icon: <Brain className="w-4 h-4" />,
      context: 'player_analysis'
    },
    {
      id: 'risk-assessment',
      text: 'Should I reach for need vs. best available?',
      icon: <AlertTriangle className="w-4 h-4" />,
      context: 'strategy_advice'
    }
  ];

  // Initialize draft context
  useEffect(() => {
    if (league && isActive) {
      const context: NFLDraftContext = {
        league,
        availablePlayers: availablePlayers,
        draftedPlayers: draftedPlayers,
        myRoster: myRoster,
        currentPick: draftTimer.isMyPick ? {
          round: draftTimer.currentRound,
          pick: draftTimer.currentPick,
          isMyPick: true,
          timeRemaining: draftTimer.timeRemaining
        } : undefined,
        positionalNeeds: calculatePositionalNeeds(),
        draftStrategy: selectedStrategy
      };

      setDraftContext(context);
      onDraftUpdate?.(context);
    }
  }, [league, isActive, availablePlayers, draftedPlayers, myRoster, draftTimer, selectedStrategy]);

  // AI status monitoring
  useEffect(() => {
    const subscription = hybridAIService.subscribe('aiStatus', (status) => {
      setAiStatus(status);
    });

    return () => {
      hybridAIService.unsubscribe('aiStatus');
    };
  }, []);

  // Timer management
  useEffect(() => {
    if (draftTimer.isActive && draftTimer.timeRemaining > 0) {
      timerInterval.current = setInterval(() => {
        setDraftTimer(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [draftTimer.isActive, draftTimer.timeRemaining]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Core functions
  const calculatePositionalNeeds = useCallback((): Record<NFLPlayer['position'], number> => {
    const rosterSettings = league.settings.rosterSettings;
    const currentRoster = myRoster.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {} as Record<NFLPlayer['position'], number>);

    return {
      QB: Math.max(0, rosterSettings.qb - (currentRoster.QB || 0)),
      RB: Math.max(0, (rosterSettings.rb + rosterSettings.flex) - (currentRoster.RB || 0)),
      WR: Math.max(0, (rosterSettings.wr + rosterSettings.flex) - (currentRoster.WR || 0)),
      TE: Math.max(0, rosterSettings.te - (currentRoster.TE || 0)),
      K: Math.max(0, rosterSettings.k - (currentRoster.K || 0)),
      DEF: Math.max(0, rosterSettings.def - (currentRoster.DEF || 0))
    };
  }, [league.settings.rosterSettings, myRoster]);

  const requestAIRecommendation = useCallback(async (customContext?: string) => {
    if (!draftContext) return;

    setIsRequestingAI(true);
    setAiError(null);

    try {
      const requestId = `draft-rec-${Date.now()}`;
      lastRequestId.current = requestId;

      const request: FantasyAIRequest = {
        type: 'draft_analysis',
        context: {
          players: availablePlayers.slice(0, 50), // Top 50 available
          scoringSystem: league.settings.scoringType,
          leagueSettings: league.settings,
          currentRound: draftTimer.currentRound,
          draftedPlayers: draftedPlayers.slice(-10), // Recent 10 picks
          userPreferences: {
            strategy: selectedStrategy,
            riskTolerance: strategies[selectedStrategy].riskLevel.toLowerCase(),
            customContext
          }
        },
        query: customContext || `I'm ${draftTimer.isMyPick ? 'on the clock' : 'coming up'} in round ${draftTimer.currentRound}. Based on my ${selectedStrategy} strategy, who should I target? My roster: ${myRoster.map(p => `${p.name} (${p.position})`).join(', ')}. Available top players: ${availablePlayers.slice(0, 10).map(p => `${p.name} (${p.position})`).join(', ')}.`,
        requestId
      };

      console.log('🤖 Requesting AI recommendation:', request);
      const response = await hybridAIService.query(request);
      
      // Only process if this is still the latest request
      if (lastRequestId.current === requestId) {
        setLastAIResponse(response);
        
        if (response.analysis) {
          const recommendation: NFLDraftRecommendation = {
            recommendedPlayers: response.analysis.playerRecommendations?.slice(0, 5).map((player, i) => ({
              player: availablePlayers.find(p => p.name.includes(player.name)) || availablePlayers[i],
              reasoning: `AI Recommendation: ${response.response}`,
              confidence: response.confidence,
              tier: Math.ceil((i + 1) / 2),
              alternativePositions: []
            })) || [],
            strategyAdvice: {
              currentRoundStrategy: response.response.split('\n')[0] || 'Focus on best available player',
              nextRoundConsiderations: response.analysis.strategyPoints || [],
              positionPriorities: Object.keys(calculatePositionalNeeds()),
              riskFactors: response.analysis.riskFactors || []
            },
            rosterAnalysis: {
              strengths: ['AI-powered analysis'],
              weaknesses: ['Based on current roster'],
              upcomingNeeds: Object.keys(calculatePositionalNeeds()) as NFLPlayer['position'][],
              flexibilityRating: 75
            }
          };

          setCurrentRecommendation(recommendation);
          onRecommendationReceived?.(recommendation);
        }
      }

    } catch (error) {
      console.error('❌ AI recommendation failed:', error);
      setAiError(error instanceof Error ? error.message : 'AI request failed');
    } finally {
      setIsRequestingAI(false);
    }
  }, [draftContext, availablePlayers, draftedPlayers, myRoster, draftTimer, selectedStrategy, league]);

  const captureScreenshot = useCallback(async () => {
    if (!enableScreenshots) return;

    try {
      console.log('📷 Capturing draft board screenshot...');
      
      // Use Browser MCP screenshot
      if (typeof (globalThis as any).mcp__playwright__browser_take_screenshot === 'function') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `draft-board-${timestamp}.png`;
        
        await (globalThis as any).mcp__playwright__browser_take_screenshot({
          filename,
          fullPage: true
        });
        
        setScreenshotUrl(`/screenshots/${filename}`);
        console.log('✅ Screenshot captured:', filename);
      } else {
        console.warn('📷 Browser MCP screenshot not available');
      }
    } catch (error) {
      console.error('📷 Screenshot capture failed:', error);
    }
  }, [enableScreenshots]);

  const handleQuickQuery = useCallback(async (query: QuickQuery) => {
    setChatMessages(prev => [...prev, {
      type: 'user',
      content: query.text,
      timestamp: new Date()
    }]);

    setIsRequestingAI(true);
    try {
      const response = await hybridAIService.query({
        type: query.context as any,
        context: draftContext as any,
        query: query.text,
        requestId: `quick-${Date.now()}`
      });

      setChatMessages(prev => [...prev, {
        type: 'ai',
        content: response.response,
        timestamp: new Date()
      }]);

    } catch (error) {
      setChatMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsRequestingAI(false);
    }
  }, [draftContext]);

  const handleCustomQuery = useCallback(async () => {
    if (!customQuery.trim()) return;

    const userMessage = customQuery;
    setCustomQuery('');
    
    setChatMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    await requestAIRecommendation(userMessage);
  }, [customQuery, requestAIRecommendation]);

  const startCoaching = useCallback(() => {
    setIsActive(true);
    setDraftTimer(prev => ({ ...prev, isActive: true }));
    
    // Initialize with available players (mock data for demo)
    const mockPlayers: NFLPlayer[] = [
      { id: 'cmc', name: 'Christian McCaffrey', position: 'RB', team: 'SF', projectedPoints: 22.1 },
      { id: 'hill', name: 'Tyreek Hill', position: 'WR', team: 'MIA', projectedPoints: 18.7 },
      { id: 'kelce', name: 'Travis Kelce', position: 'TE', team: 'KC', projectedPoints: 16.2 },
      { id: 'allen', name: 'Josh Allen', position: 'QB', team: 'BUF', projectedPoints: 24.8 }
    ];
    
    setAvailablePlayers(mockPlayers);
    
    // Capture initial screenshot
    captureScreenshot();
    
    console.log('🏈 Draft coaching started');
  }, [captureScreenshot]);

  const stopCoaching = useCallback(() => {
    setIsActive(false);
    setDraftTimer(prev => ({ ...prev, isActive: false }));
    console.log('⏹️ Draft coaching stopped');
  }, []);

  const getTimerColor = () => {
    if (!draftTimer.isMyPick) return 'text-gray-600';
    if (draftTimer.timeRemaining <= 15) return 'text-red-600';
    if (draftTimer.timeRemaining <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">NFL Draft Coach</h2>
              <p className="text-gray-600">AI-powered real-time draft assistance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* AI Status Indicators */}
            <div className="flex items-center gap-2 text-sm">
              {Object.entries(aiStatus).map(([backend, status]) => (
                <div key={backend} className={`px-2 py-1 rounded-full text-xs ${
                  status?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {backend}: {status?.available ? '🟢' : '🔴'}
                </div>
              ))}
            </div>
            
            {!isActive ? (
              <button
                onClick={startCoaching}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Coaching
              </button>
            ) : (
              <button
                onClick={stopCoaching}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {!isActive ? (
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">🏈</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Draft Day</h3>
          <p className="text-gray-600 mb-6">
            AI-powered coaching will provide real-time recommendations, strategy advice, and draft analysis.
          </p>
          
          {/* Strategy Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Select Your Draft Strategy</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {Object.entries(strategies).map(([key, strategy]) => (
                <button
                  key={key}
                  onClick={() => setSelectedStrategy(key as DraftStrategy)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedStrategy === key
                      ? `border-${strategy.color}-500 bg-${strategy.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {strategy.icon}
                    <span className="font-medium">{strategy.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{strategy.description}</p>
                  <span className={`text-xs px-2 py-1 rounded-full bg-${strategy.color}-100 text-${strategy.color}-800`}>
                    {strategy.riskLevel}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={startCoaching}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <Play className="w-5 h-5" />
            Start Coaching Session
          </button>
        </div>
      ) : (
        <>
          {/* Draft Status Bar */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500">Round</div>
                <div className="font-semibold">{draftTimer.currentRound}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Pick</div>
                <div className="font-semibold">{draftTimer.currentPick}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Timer</div>
                <div className={`font-semibold ${getTimerColor()}`}>
                  {Math.floor(draftTimer.timeRemaining / 60)}:{(draftTimer.timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className={`font-semibold ${draftTimer.isMyPick ? 'text-green-600' : 'text-gray-600'}`}>
                  {draftTimer.isMyPick ? 'On Clock' : 'Waiting'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Strategy</div>
                <div className="font-semibold text-blue-600">{strategies[selectedStrategy].name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">My Team</div>
                <div className="font-semibold">{myRoster.length} players</div>
              </div>
            </div>
            
            {draftTimer.isMyPick && draftTimer.timeRemaining <= 30 && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Time Warning:</span> {draftTimer.timeRemaining}s remaining on your pick
                </div>
              </div>
            )}
          </div>

          {/* Main Content Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'recommendations', name: 'Recommendations', icon: <Target className="w-4 h-4" /> },
                { id: 'strategy', name: 'Strategy', icon: <TrendingUp className="w-4 h-4" /> },
                { id: 'chat', name: 'AI Assistant', icon: <MessageCircle className="w-4 h-4" /> },
                ...(debugMode ? [{ id: 'debug', name: 'Debug', icon: <Settings className="w-4 h-4" /> }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Player Recommendations</h3>
                  <div className="flex items-center gap-2">
                    {enableScreenshots && (
                      <button
                        onClick={captureScreenshot}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                      >
                        <Camera className="w-4 h-4" />
                        Screenshot
                      </button>
                    )}
                    <button
                      onClick={() => requestAIRecommendation()}
                      disabled={isRequestingAI}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isRequestingAI ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Get Recommendations
                    </button>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-800 text-sm">{aiError}</div>
                  </div>
                )}

                {isRequestingAI && (
                  <div className="text-center py-8">
                    <LoadingSpinner />
                    <p className="text-gray-600 mt-2">Analyzing draft board and generating recommendations...</p>
                  </div>
                )}

                {currentRecommendation && !isRequestingAI && (
                  <div className="space-y-4">
                    {/* Recommended Players */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Top Recommendations</h4>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {currentRecommendation.recommendedPlayers.map((rec, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900">{rec.player.name}</h5>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{rec.player.position}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(rec.confidence)}`}>
                                  {rec.confidence}%
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {rec.player.team} • Tier {rec.tier}
                            </div>
                            <div className="text-sm text-gray-700">
                              {rec.reasoning}
                            </div>
                            {rec.player.projectedPoints && (
                              <div className="text-sm text-blue-600 mt-1">
                                Projected: {rec.player.projectedPoints.toFixed(1)} pts
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strategy Advice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Current Round Strategy</h4>
                      <p className="text-blue-800">{currentRecommendation.strategyAdvice.currentRoundStrategy}</p>
                      
                      {currentRecommendation.strategyAdvice.nextRoundConsiderations.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-blue-900 mb-1">Next Round Considerations:</h5>
                          <ul className="text-blue-800 text-sm space-y-1">
                            {currentRecommendation.strategyAdvice.nextRoundConsiderations.map((consideration, i) => (
                              <li key={i}>• {consideration}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Risk Factors */}
                    {currentRecommendation.strategyAdvice.riskFactors.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Risk Factors
                        </h4>
                        <ul className="text-yellow-800 text-sm space-y-1">
                          {currentRecommendation.strategyAdvice.riskFactors.map((risk, i) => (
                            <li key={i}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'strategy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Draft Strategy Dashboard</h3>
                
                {/* Current Strategy */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {strategies[selectedStrategy].icon}
                    <div>
                      <h4 className="font-semibold text-gray-900">{strategies[selectedStrategy].name}</h4>
                      <p className="text-gray-600">{strategies[selectedStrategy].description}</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-sm bg-${strategies[selectedStrategy].color}-100 text-${strategies[selectedStrategy].color}-800`}>
                      {strategies[selectedStrategy].riskLevel}
                    </span>
                  </div>
                </div>

                {/* Position Needs */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Positional Needs</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {Object.entries(calculatePositionalNeeds()).map(([position, need]) => (
                      <div key={position} className={`p-3 rounded-lg border-2 ${
                        need > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                      }`}>
                        <div className="font-medium text-gray-900">{position}</div>
                        <div className={`text-sm ${need > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {need > 0 ? `Need ${need}` : 'Filled'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* My Roster */}
                {myRoster.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">My Roster ({myRoster.length})</h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {myRoster.map((player, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {player.position}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{player.name}</div>
                            <div className="text-sm text-gray-600">{player.team}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                
                {/* Quick Queries */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Quick Questions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {quickQueries.map((query) => (
                      <button
                        key={query.id}
                        onClick={() => handleQuickQuery(query)}
                        disabled={isRequestingAI}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-start gap-2 text-sm"
                      >
                        {query.icon}
                        <span>{query.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Ask me anything about your draft strategy!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((message, i) => (
                        <div key={i} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 opacity-70`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

                {/* Custom Query Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomQuery()}
                    placeholder="Ask a specific question about your draft..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isRequestingAI}
                  />
                  <button
                    onClick={handleCustomQuery}
                    disabled={!customQuery.trim() || isRequestingAI}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isRequestingAI ? <LoadingSpinner size="sm" /> : 'Send'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'debug' && debugMode && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Debug Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Draft Context</h4>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(draftContext, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">AI Status</h4>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(aiStatus, null, 2)}
                    </pre>
                  </div>
                  
                  {lastAIResponse && (
                    <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                      <h4 className="font-semibold mb-2">Last AI Response</h4>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(lastAIResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Emergency Controls */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEmergencyMode(!emergencyMode)}
                  className={`px-3 py-1 text-sm rounded ${
                    emergencyMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'
                  }`}
                >
                  Emergency Mode
                </button>
                
                {screenshotUrl && (
                  <a 
                    href={screenshotUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-4 h-4" />
                    View Screenshot
                  </a>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                Backend: {lastAIResponse?.backend || 'None'} • 
                Confidence: {lastAIResponse?.confidence || 0}% • 
                Response: {lastAIResponse?.responseTime || 0}ms
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NFLDraftCoach;