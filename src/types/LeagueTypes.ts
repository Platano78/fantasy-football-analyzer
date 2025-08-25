/**
 * Enhanced League Context Types for AI Integration
 * 
 * These types extend the existing NFLLeagueTypes to support AI-powered
 * fantasy football analysis across multiple leagues with intelligent
 * data structures and performance optimizations.
 */

import { Player, ScoringSystem, DraftPick, Position, InjuryStatus } from './index';
import { NFLLeague, FantasyTeam, LeagueSettings as BaseLeagueSettings } from './NFLLeagueTypes';

/**
 * AI-Enhanced Player with additional analytics and prediction data
 */
export interface AIEnhancedPlayer extends Player {
  // AI-generated insights
  aiInsights?: {
    weeklyPrediction: number;
    confidenceScore: number; // 0-100
    riskFactors: string[];
    upside: 'low' | 'medium' | 'high';
    consistency: number; // 0-100
    trendDirection: 'up' | 'down' | 'stable';
  };
  
  // League-specific context
  leagueRelevance?: {
    [leagueId: string]: {
      owned: boolean;
      ownerTeamId?: string;
      waiversPriority?: number;
      tradable?: boolean;
    };
  };
  
  // Enhanced metadata
  lastAIAnalysisTime?: Date;
  newsAnalysisSummary?: string;
  socialSentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * Intelligent roster composition with AI-powered analysis
 */
export interface AIRoster {
  starters: AIEnhancedPlayer[];
  bench: AIEnhancedPlayer[];
  
  // AI-generated roster analysis
  analysis?: {
    weeklyProjection: number;
    strengthsByPosition: Record<Position, number>; // 0-100 strength score
    weeknessesIdentified: Position[];
    suggestedMoves: {
      action: 'trade' | 'waiver' | 'drop' | 'start';
      player: string;
      reasoning: string;
      urgency: 'low' | 'medium' | 'high';
    }[];
    optimalLineup?: AIEnhancedPlayer[];
  };
  
  // Performance tracking
  lastUpdated: Date;
  weeklyHistory?: {
    week: number;
    projection: number;
    actual?: number;
    accuracy?: number;
  }[];
}

/**
 * League-specific team with enhanced AI context
 */
export interface LeagueTeam extends Omit<FantasyTeam, 'roster'> {
  roster: AIRoster;
  
  // AI-powered team analysis
  aiMetrics?: {
    powerRanking: number; // 1-N where N is league size
    projectedRecord: { wins: number; losses: number; ties: number };
    strengthOfSchedule: number; // 0-100
    championshipOdds: number; // 0-100
    playoffOdds: number; // 0-100
  };
  
  // Trading and competitive analysis
  tradingProfile?: {
    activity: 'active' | 'moderate' | 'passive';
    preferences: Position[]; // Positions they typically target
    unwillingToTrade: string[]; // Player IDs they won't trade
    needsAssessment: Record<Position, 'critical' | 'moderate' | 'satisfied'>;
  };
  
  // League-specific metadata
  leagueId: string;
  rivalries?: string[]; // Team IDs of rivals
  lastAIAnalysis?: Date;
}

/**
 * Extended league settings with AI integration preferences
 */
export interface EnhancedLeagueSettings extends BaseLeagueSettings {
  // AI-specific configurations
  aiPreferences?: {
    analysisFrequency: 'real-time' | 'daily' | 'weekly' | 'manual';
    notificationTypes: ('trades' | 'waivers' | 'injuries' | 'news' | 'lineup')[];
    riskTolerance: 'conservative' | 'balanced' | 'aggressive';
    focusAreas: Position[]; // Positions to prioritize in analysis
  };
  
  // Enhanced league metadata
  competitiveLevel: 'casual' | 'competitive' | 'expert';
  leaguePersonality: string; // AI-generated league culture description
  historicalData?: {
    avgPointsPerWeek: number;
    championshipScore: number;
    mostActiveTrader: string;
    volatilityIndex: number; // How much scores vary week to week
  };
}

/**
 * Core League interface with AI integration
 * 
 * This is the main data structure for managing individual leagues
 * with full AI-powered analysis and multi-league context awareness.
 */
export interface League extends Omit<NFLLeague, 'teams' | 'settings' | 'myTeam'> {
  // Override with enhanced types
  teams: LeagueTeam[];
  myTeam?: LeagueTeam;
  settings: EnhancedLeagueSettings;
  
  // AI-powered league analysis
  leagueAnalytics?: {
    competitiveBalance: number; // 0-100, higher = more competitive
    averagePlayerKnowledge: 'novice' | 'intermediate' | 'expert';
    tradeFrequency: number; // trades per week
    waiversActivity: number; // claims per week
    leagueTrends: {
      hotPositions: Position[];
      undervaluedPlayers: string[]; // Player IDs
      emergingStrategies: string[];
    };
  };
  
  // Multi-league comparison context
  comparisonMetrics?: {
    relativeDifficulty: number; // vs other leagues in collection
    uniqueOpportunities: string[]; // What makes this league special
    crossLeaguePlayerOverlap?: {
      [otherLeagueId: string]: string[]; // Shared player IDs
    };
  };
  
  // Real-time AI coaching state
  aiCoachingState?: {
    currentFocus: 'draft' | 'waivers' | 'trades' | 'lineups' | 'playoffs';
    activeRecommendations: AIRecommendation[];
    conversationHistory: AIChatMessage[];
    lastInteraction: Date;
  };
}

/**
 * Multi-league management with AI orchestration
 */
export interface LeagueCollection {
  leagues: Record<string, League>;
  activeLeagueId: string | null;
  
  // Cross-league AI analysis
  crossLeagueInsights?: {
    playerValueDifferences: {
      playerId: string;
      leagueValues: Record<string, number>; // league ID -> value score
      arbitrageOpportunities: string[];
    }[];
    
    strategicAdvantages: {
      leagueId: string;
      advantages: string[];
      exploitationStrategy: string;
    }[];
    
    timeManagement: {
      priorityOrder: string[]; // league IDs in order of attention priority
      conflictAlerts: {
        type: 'draft' | 'trade_deadline' | 'waivers';
        leagues: string[];
        resolution: string;
      }[];
    };
  };
  
  // Synchronized operations
  lastGlobalSync: Date;
  syncCoordination: {
    inProgress: boolean;
    queuedOperations: {
      leagueId: string;
      operation: 'refresh' | 'analyze' | 'sync';
      priority: number;
    }[];
  };
}

/**
 * AI recommendation system interfaces
 */
export interface AIRecommendation {
  id: string;
  type: 'lineup' | 'trade' | 'waiver' | 'drop' | 'draft';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  reasoning: string[];
  
  // Actionable data
  playersInvolved: string[]; // Player IDs
  expectedImpact: {
    pointsGain: number;
    confidenceLevel: number;
    timeframe: 'immediate' | 'short_term' | 'long_term';
  };
  
  // Execution tracking
  status: 'pending' | 'accepted' | 'rejected' | 'executed' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  executedAt?: Date;
  outcome?: {
    success: boolean;
    actualImpact: number;
    lessons: string[];
  };
}

/**
 * AI chat integration for natural language interaction
 */
export interface AIChatMessage {
  id: string;
  timestamp: Date;
  sender: 'user' | 'ai';
  message: string;
  
  // Enhanced context
  leagueContext?: {
    leagueId: string;
    relevantPlayers: string[];
    contextType: 'general' | 'lineup' | 'trade' | 'waiver' | 'news';
  };
  
  // AI processing metadata
  aiMetadata?: {
    confidence: number;
    processingTime: number;
    dataSourcesUsed: ('espn' | 'news' | 'projections' | 'league_history')[];
    recommendationIds: string[]; // Generated recommendations
  };
  
  // Threading support
  threadId?: string;
  replyToId?: string;
}

/**
 * Real-time league data streams
 */
export interface LeagueDataStream {
  leagueId: string;
  lastUpdate: Date;
  
  // Data freshness tracking
  dataFreshness: {
    rosters: Date;
    transactions: Date;
    scores: Date;
    news: Date;
    projections: Date;
  };
  
  // Change detection
  pendingUpdates: {
    type: 'roster_change' | 'trade' | 'waiver' | 'score_update';
    data: any;
    detectedAt: Date;
    processed: boolean;
  }[];
  
  // Stream health
  connectionStatus: 'active' | 'reconnecting' | 'error' | 'paused';
  errorCount: number;
  lastError?: string;
}

/**
 * League context for AI operations
 * 
 * This provides the complete context needed for AI to make
 * intelligent recommendations across all leagues.
 */
export interface LeagueAIContext {
  // Current state
  activeLeague: League;
  allLeagues: LeagueCollection;
  currentWeek: number;
  
  // User preferences and history
  userProfile: {
    riskPreference: 'conservative' | 'moderate' | 'aggressive';
    positionPreferences: Position[];
    tradingStyle: 'active' | 'moderate' | 'passive';
    decisionHistory: {
      action: string;
      outcome: 'positive' | 'negative' | 'neutral';
      timestamp: Date;
    }[];
  };
  
  // External data integration
  externalData: {
    news: any[];
    injuries: any[];
    weatherReports: any[];
    depthCharts: any[];
    expertRankings: any[];
  };
  
  // AI service state
  aiState: {
    currentModel: 'claude' | 'gemini' | 'deepseek' | 'offline';
    fallbackAvailable: boolean;
    responseTime: number;
    accuracy: number;
    lastModelSwitch?: Date;
  };
}

/**
 * Performance optimization types for AI operations
 */
export interface LeagueDataCache {
  // Cached computations
  playerProjections: Map<string, { value: number; timestamp: Date; ttl: number }>;
  teamAnalytics: Map<string, { value: any; timestamp: Date; ttl: number }>;
  leagueInsights: Map<string, { value: any; timestamp: Date; ttl: number }>;
  
  // Cache management
  size: number;
  maxSize: number;
  hitRate: number;
  lastCleanup: Date;
}

/**
 * Type utilities for league operations
 */
export type LeagueId = string;
export type TeamId = string;
export type PlayerId = string;

export type LeagueEventType = 
  | 'player_added'
  | 'player_dropped' 
  | 'trade_completed'
  | 'waiver_claimed'
  | 'lineup_changed'
  | 'score_updated'
  | 'ai_recommendation'
  | 'news_alert';

export interface LeagueEvent {
  id: string;
  leagueId: LeagueId;
  type: LeagueEventType;
  timestamp: Date;
  data: any;
  processed: boolean;
  aiRelevance: number; // 0-100 how relevant for AI analysis
}

/**
 * Validation and type guards
 */
export const isValidLeague = (obj: any): obj is League => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.teams) &&
    obj.settings &&
    typeof obj.currentWeek === 'number'
  );
};

export const isAIEnhancedPlayer = (obj: any): obj is AIEnhancedPlayer => {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.position === 'string'
  );
};