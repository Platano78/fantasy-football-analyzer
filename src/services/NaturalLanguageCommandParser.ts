/**
 * Natural Language Command Parser
 * 
 * Intelligent parser that converts natural language fantasy football queries
 * into structured commands and data operations using Gemini AI.
 * 
 * Features:
 * - Context-aware command recognition
 * - League-specific entity extraction
 * - Multi-intent handling
 * - Confidence scoring
 * - Fallback command suggestions
 */

import { 
  League, 
  LeagueAIContext, 
  AIEnhancedPlayer,
  Position 
} from '../types/LeagueTypes';
import { Player } from '../types';

// ============================================================================
// COMMAND TYPES AND INTERFACES
// ============================================================================

export type CommandType = 
  | 'player_analysis'
  | 'player_comparison'  
  | 'lineup_optimization'
  | 'roster_analysis'
  | 'waiver_recommendations'
  | 'trade_evaluation'
  | 'matchup_analysis'
  | 'injury_impact'
  | 'draft_strategy'
  | 'league_standings'
  | 'season_outlook'
  | 'general_advice';

export interface ParsedCommand {
  type: CommandType;
  confidence: number; // 0-100
  entities: {
    players?: string[]; // Player names mentioned
    positions?: Position[]; // Positions mentioned
    teams?: string[]; // Team names mentioned
    timeframe?: 'this_week' | 'rest_of_season' | 'next_week' | 'playoffs';
    action?: 'start' | 'sit' | 'trade' | 'drop' | 'pick_up' | 'compare';
    league?: string; // League context if specified
  };
  parameters: {
    [key: string]: any; // Command-specific parameters
  };
  originalQuery: string;
  processedQuery: string; // Cleaned and normalized query
  suggestedFollowUp?: string[];
  ambiguities?: Array<{
    entity: string;
    possibleValues: string[];
    clarificationNeeded: string;
  }>;
}

export interface CommandIntent {
  intent: CommandType;
  patterns: string[]; // Regex patterns for matching
  keywords: string[];
  requiredEntities: string[];
  optionalEntities: string[];
  examples: string[];
}

export interface ParserContext {
  leagueContext: LeagueAIContext;
  availablePlayers: AIEnhancedPlayer[];
  userRoster: AIEnhancedPlayer[];
  recentQueries: ParsedCommand[];
  conversationHistory: string[];
}

// ============================================================================
// COMMAND INTENT DEFINITIONS
// ============================================================================

const COMMAND_INTENTS: CommandIntent[] = [
  {
    intent: 'player_analysis',
    patterns: [
      /(?:analyze|tell me about|how is|what about|thoughts on)\s+(.+?)(?:\s|$)/i,
      /(?:should i start|is|how good is)\s+(.+?)(?:\s|$)/i
    ],
    keywords: ['analyze', 'tell me about', 'how is', 'what about', 'thoughts', 'should i start'],
    requiredEntities: ['players'],
    optionalEntities: ['timeframe', 'league'],
    examples: [
      'Analyze Josh Allen this week',
      'Tell me about Christian McCaffrey',
      'How is Tyreek Hill looking?',
      'Should I start Derrick Henry?'
    ]
  },
  {
    intent: 'player_comparison',
    patterns: [
      /(?:compare|vs|versus)\s+(.+?)\s+(?:to|with|and|vs|versus)\s+(.+?)(?:\s|$)/i,
      /(?:who should i start|who is better)\s+(.+?)\s+(?:or|vs)\s+(.+?)(?:\s|$)/i
    ],
    keywords: ['compare', 'vs', 'versus', 'or', 'better', 'who should i start'],
    requiredEntities: ['players'],
    optionalEntities: ['timeframe', 'league', 'action'],
    examples: [
      'Compare Josh Allen vs Lamar Jackson',
      'Who should I start, CMC or Saquon?',
      'Tyreek Hill versus Stefon Diggs this week'
    ]
  },
  {
    intent: 'lineup_optimization',
    patterns: [
      /(?:optimize|set|best)\s+(?:my\s+)?(?:lineup|team)/i,
      /(?:who should i start|start sit|lineup help)/i
    ],
    keywords: ['optimize', 'lineup', 'team', 'start', 'sit', 'best lineup'],
    requiredEntities: [],
    optionalEntities: ['positions', 'timeframe', 'league'],
    examples: [
      'Optimize my lineup for this week',
      'Who should I start this week?',
      'Best lineup for Week 10',
      'Start/sit recommendations'
    ]
  },
  {
    intent: 'waiver_recommendations',
    patterns: [
      /(?:waiver|pickup|add|grab|target)\s+(?:wire|pickups|targets|recommendations)/i,
      /(?:who should i pick up|drop and add)/i
    ],
    keywords: ['waiver', 'pickup', 'add', 'grab', 'target', 'wire', 'drop'],
    requiredEntities: [],
    optionalEntities: ['positions', 'league'],
    examples: [
      'Best waiver wire pickups this week',
      'Who should I pick up?',
      'Waiver targets for my team',
      'Drop and add recommendations'
    ]
  },
  {
    intent: 'trade_evaluation',
    patterns: [
      /(?:trade|should i trade)\s+(.+?)\s+(?:for|to get)\s+(.+?)(?:\s|$)/i,
      /(?:trade value|worth trading)/i
    ],
    keywords: ['trade', 'for', 'worth', 'value', 'should i trade'],
    requiredEntities: ['players'],
    optionalEntities: ['league', 'action'],
    examples: [
      'Should I trade CMC for Josh Allen?',
      'Trade Tyreek Hill for two WRs?',
      'What is Josh Allen\'s trade value?'
    ]
  },
  {
    intent: 'roster_analysis',
    patterns: [
      /(?:analyze|review|rate|grade)\s+(?:my\s+)?(?:roster|team)/i,
      /(?:how is my team|team analysis|roster help)/i
    ],
    keywords: ['analyze', 'review', 'rate', 'grade', 'roster', 'team', 'my team'],
    requiredEntities: [],
    optionalEntities: ['league', 'timeframe'],
    examples: [
      'Analyze my roster',
      'How is my team looking?',
      'Rate my team for playoffs',
      'Roster analysis for my Legends league'
    ]
  },
  {
    intent: 'matchup_analysis',
    patterns: [
      /(?:matchup|opponent|against|vs)\s+(?:analysis|preview)/i,
      /(?:who am i playing|this week\'s matchup)/i
    ],
    keywords: ['matchup', 'opponent', 'against', 'vs', 'playing'],
    requiredEntities: [],
    optionalEntities: ['teams', 'league', 'timeframe'],
    examples: [
      'Matchup analysis this week',
      'Who am I playing against?',
      'Preview my matchup',
      'Opponent analysis'
    ]
  }
];

// ============================================================================
// NATURAL LANGUAGE COMMAND PARSER
// ============================================================================

export class NaturalLanguageCommandParser {
  private context: ParserContext;
  private playerNameMap: Map<string, AIEnhancedPlayer>;
  private teamNameMap: Map<string, string>;
  
  // Gemini AI integration for complex parsing
  private geminiAvailable: boolean = false;

  constructor(context: ParserContext) {
    this.context = context;
    this.playerNameMap = this.buildPlayerNameMap();
    this.teamNameMap = this.buildTeamNameMap();
    this.checkGeminiAvailability();
  }

  /**
   * Main parsing method - converts natural language to structured command
   */
  async parseCommand(query: string): Promise<ParsedCommand> {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Try pattern-based parsing first (fast)
    const patternResult = await this.parseWithPatterns(normalizedQuery);
    
    // If confidence is low, try Gemini AI parsing (more accurate)
    if (patternResult.confidence < 70 && this.geminiAvailable) {
      const geminiResult = await this.parseWithGemini(normalizedQuery);
      if (geminiResult.confidence > patternResult.confidence) {
        return geminiResult;
      }
    }
    
    // Enhance result with context
    return this.enhanceWithContext(patternResult);
  }

  /**
   * Pattern-based parsing for common queries
   */
  private async parseWithPatterns(query: string): Promise<ParsedCommand> {
    let bestMatch: Partial<ParsedCommand> = {
      type: 'general_advice',
      confidence: 0,
      entities: {},
      parameters: {},
      originalQuery: query,
      processedQuery: query
    };

    // Try each intent pattern
    for (const intent of COMMAND_INTENTS) {
      for (const pattern of intent.patterns) {
        const match = pattern.exec(query);
        if (match) {
          const confidence = this.calculatePatternConfidence(intent, query, match);
          
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              type: intent.intent,
              confidence,
              entities: this.extractEntities(query, intent, match),
              parameters: this.extractParameters(query, intent, match),
              originalQuery: query,
              processedQuery: query
            };
          }
        }
      }
    }

    // Ensure we return a complete ParsedCommand
    return {
      type: bestMatch.type || 'general_advice',
      confidence: bestMatch.confidence || 0,
      entities: bestMatch.entities || {},
      parameters: bestMatch.parameters || {},
      originalQuery: query,
      processedQuery: query,
      suggestedFollowUp: this.generateFollowUpSuggestions(bestMatch.type || 'general_advice'),
      ambiguities: this.detectAmbiguities(query, bestMatch.entities || {})
    };
  }

  /**
   * Gemini AI-powered parsing for complex queries
   */
  private async parseWithGemini(query: string): Promise<ParsedCommand> {
    try {
      const prompt = this.buildGeminiPrompt(query);
      
      // This would integrate with the actual Gemini service
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseGeminiResponse(response, query);
      
    } catch (error) {
      console.error('❌ Gemini parsing failed:', error);
      // Fallback to pattern-based result
      return this.parseWithPatterns(query);
    }
  }

  /**
   * Extract entities (players, positions, teams) from query
   */
  private extractEntities(query: string, intent: CommandIntent, match: RegExpExecArray): ParsedCommand['entities'] {
    const entities: ParsedCommand['entities'] = {};
    
    // Extract player names
    const players = this.extractPlayerNames(query);
    if (players.length > 0) {
      entities.players = players;
    }
    
    // Extract positions
    const positions = this.extractPositions(query);
    if (positions.length > 0) {
      entities.positions = positions;
    }
    
    // Extract timeframe
    const timeframe = this.extractTimeframe(query);
    if (timeframe) {
      entities.timeframe = timeframe;
    }
    
    // Extract action
    const action = this.extractAction(query);
    if (action) {
      entities.action = action;
    }
    
    // Extract league context
    const league = this.extractLeagueReference(query);
    if (league) {
      entities.league = league;
    }
    
    return entities;
  }

  private extractPlayerNames(query: string): string[] {
    const players: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Check for players in our context
    for (const [playerName, player] of this.playerNameMap) {
      if (queryLower.includes(playerName.toLowerCase())) {
        players.push(player.name);
      }
    }
    
    // Also check for common nickname patterns
    const nicknamePatterns = [
      /\b(cmc|cmac)\b/i, // Christian McCaffrey
      /\b(jt|taylor)\b/i, // Jonathan Taylor
      /\b(dk|metcalf)\b/i, // DK Metcalf
      /\b(davante|adams)\b/i, // Davante Adams
    ];
    
    // Map nicknames to full names
    const nicknameMap: Record<string, string> = {
      'cmc': 'Christian McCaffrey',
      'cmac': 'Christian McCaffrey',
      'jt': 'Jonathan Taylor',
      'taylor': 'Jonathan Taylor',
      'dk': 'DK Metcalf',
      'metcalf': 'DK Metcalf',
    };
    
    for (const pattern of nicknamePatterns) {
      const match = pattern.exec(queryLower);
      if (match) {
        const nickname = match[1].toLowerCase();
        if (nicknameMap[nickname]) {
          players.push(nicknameMap[nickname]);
        }
      }
    }
    
    return [...new Set(players)]; // Remove duplicates
  }

  private extractPositions(query: string): Position[] {
    const positions: Position[] = [];
    const positionPatterns = {
      QB: /\b(?:qb|quarterback|quarterbacks)\b/i,
      RB: /\b(?:rb|running\s*back|running\s*backs)\b/i,
      WR: /\b(?:wr|wide\s*receiver|wide\s*receivers|receiver|receivers)\b/i,
      TE: /\b(?:te|tight\s*end|tight\s*ends)\b/i,
      K: /\b(?:k|kicker|kickers)\b/i,
      DEF: /\b(?:def|defense|defenses|dst)\b/i
    };
    
    for (const [position, pattern] of Object.entries(positionPatterns)) {
      if (pattern.test(query)) {
        positions.push(position as Position);
      }
    }
    
    return positions;
  }

  private extractTimeframe(query: string): ParsedCommand['entities']['timeframe'] {
    if (/\bthis\s+week\b/i.test(query)) return 'this_week';
    if (/\bnext\s+week\b/i.test(query)) return 'next_week';
    if (/\bplayoffs?\b/i.test(query)) return 'playoffs';
    if (/\brest\s+of\s+(?:the\s+)?season\b/i.test(query)) return 'rest_of_season';
    return undefined;
  }

  private extractAction(query: string): ParsedCommand['entities']['action'] {
    if (/\bstart\b/i.test(query)) return 'start';
    if (/\bsit\b/i.test(query)) return 'sit';
    if (/\btrade\b/i.test(query)) return 'trade';
    if (/\bdrop\b/i.test(query)) return 'drop';
    if (/\bpick\s*up|add\b/i.test(query)) return 'pick_up';
    if (/\bcompare\b/i.test(query)) return 'compare';
    return undefined;
  }

  private extractLeagueReference(query: string): string | undefined {
    // Check for explicit league mentions
    if (/\blegends?\s+league\b/i.test(query)) return 'Legends League';
    if (/\binjustice\s+league\b/i.test(query)) return 'Injustice League';
    
    // Otherwise use current active league
    return this.context.leagueContext.activeLeague.name;
  }

  private extractParameters(query: string, intent: CommandIntent, match: RegExpExecArray): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Intent-specific parameter extraction
    switch (intent.intent) {
      case 'player_comparison':
        if (match[1] && match[2]) {
          parameters.player1 = match[1].trim();
          parameters.player2 = match[2].trim();
        }
        break;
        
      case 'trade_evaluation':
        if (match[1] && match[2]) {
          parameters.givingUp = match[1].trim();
          parameters.gettingBack = match[2].trim();
        }
        break;
        
      default:
        // Extract general parameters
        if (match[1]) {
          parameters.primaryEntity = match[1].trim();
        }
        break;
    }
    
    return parameters;
  }

  private calculatePatternConfidence(intent: CommandIntent, query: string, match: RegExpExecArray): number {
    let confidence = 50; // Base confidence
    
    // Boost for keyword matches
    const keywordMatches = intent.keywords.filter(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    confidence += keywordMatches * 10;
    
    // Boost for entity matches
    const entities = this.extractEntities(query, intent, match);
    if (entities.players && entities.players.length > 0) confidence += 20;
    if (entities.positions && entities.positions.length > 0) confidence += 10;
    if (entities.timeframe) confidence += 10;
    
    // Penalize if required entities are missing
    for (const requiredEntity of intent.requiredEntities) {
      if (!entities[requiredEntity as keyof ParsedCommand['entities']]) {
        confidence -= 30;
      }
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  private enhanceWithContext(command: ParsedCommand): ParsedCommand {
    // Add context from recent queries
    if (this.context.recentQueries.length > 0) {
      const lastQuery = this.context.recentQueries[this.context.recentQueries.length - 1];
      
      // If current query lacks specificity, inherit from previous
      if (!command.entities.league && lastQuery.entities.league) {
        command.entities.league = lastQuery.entities.league;
      }
      
      if (!command.entities.timeframe && lastQuery.entities.timeframe) {
        command.entities.timeframe = lastQuery.entities.timeframe;
      }
    }
    
    // Validate player names against available players
    if (command.entities.players) {
      command.entities.players = this.validatePlayerNames(command.entities.players);
    }
    
    return command;
  }

  private validatePlayerNames(playerNames: string[]): string[] {
    return playerNames.filter(name => {
      const found = Array.from(this.playerNameMap.keys()).some(key => 
        key.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(key.toLowerCase())
      );
      return found;
    });
  }

  private generateFollowUpSuggestions(commandType: CommandType): string[] {
    const suggestions: Record<CommandType, string[]> = {
      player_analysis: [
        'Compare this player to alternatives',
        'Check matchup difficulty this week',
        'See injury risk assessment'
      ],
      player_comparison: [
        'Analyze rest of season outlook',
        'Check trade value for both players',
        'See upcoming schedule strength'
      ],
      lineup_optimization: [
        'Get waiver wire recommendations',
        'Analyze tough lineup decisions',
        'Check injury report impact'
      ],
      roster_analysis: [
        'Identify trade targets',
        'Find waiver wire upgrades',
        'Analyze playoff schedule'
      ],
      waiver_recommendations: [
        'Analyze drop candidates',
        'Check FAAB bid suggestions',
        'See long-term value picks'
      ],
      trade_evaluation: [
        'Find alternative trade targets',
        'Check positional needs',
        'Analyze team fit'
      ],
      matchup_analysis: [
        'Get start/sit recommendations',
        'Analyze key player matchups',
        'Check weather impacts'
      ],
      injury_impact: [
        'Find handcuff recommendations',
        'Check waiver wire replacements',
        'Analyze timeline for return'
      ],
      draft_strategy: [
        'Analyze remaining draft board',
        'Check positional runs timing',
        'See value-based recommendations'
      ],
      league_standings: [
        'Analyze playoff scenarios',
        'Check strength of schedule',
        'See trade deadline strategy'
      ],
      season_outlook: [
        'Identify buy-low candidates',
        'Check sell-high opportunities',
        'Analyze championship path'
      ],
      general_advice: [
        'Ask about specific players',
        'Get lineup optimization help',
        'Check waiver wire targets'
      ]
    };
    
    return suggestions[commandType] || suggestions.general_advice;
  }

  private detectAmbiguities(query: string, entities: ParsedCommand['entities']): Array<{entity: string, possibleValues: string[], clarificationNeeded: string}> {
    const ambiguities = [];
    
    // Check for ambiguous player references
    if (entities.players) {
      for (const playerName of entities.players) {
        const possibleMatches = Array.from(this.playerNameMap.keys()).filter(name =>
          name.toLowerCase().includes(playerName.toLowerCase()) &&
          name.toLowerCase() !== playerName.toLowerCase()
        );
        
        if (possibleMatches.length > 1) {
          ambiguities.push({
            entity: playerName,
            possibleValues: possibleMatches,
            clarificationNeeded: `Did you mean one of these players: ${possibleMatches.join(', ')}?`
          });
        }
      }
    }
    
    return ambiguities;
  }

  // Helper methods for building context maps
  private buildPlayerNameMap(): Map<string, AIEnhancedPlayer> {
    const map = new Map();
    
    for (const player of this.context.availablePlayers) {
      map.set(player.name, player);
      
      // Add common variations
      const nameParts = player.name.split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        map.set(lastName, player); // Last name only
        map.set(`${firstName} ${lastName}`, player); // First + Last
      }
    }
    
    return map;
  }

  private buildTeamNameMap(): Map<string, string> {
    const teams = [
      'Cardinals', 'Falcons', 'Ravens', 'Bills', 'Panthers', 'Bears', 'Bengals', 'Browns',
      'Cowboys', 'Broncos', 'Lions', 'Packers', 'Texans', 'Colts', 'Jaguars', 'Chiefs',
      'Raiders', 'Chargers', 'Rams', 'Dolphins', 'Vikings', 'Patriots', 'Saints', 'Giants',
      'Jets', 'Eagles', 'Steelers', '49ers', 'Seahawks', 'Buccaneers', 'Titans', 'Commanders'
    ];
    
    const map = new Map();
    teams.forEach(team => map.set(team.toLowerCase(), team));
    return map;
  }

  // Placeholder methods for Gemini integration
  private async checkGeminiAvailability(): Promise<void> {
    try {
      // This would check if Gemini service is available
      // For now, we'll assume it's available in production
      this.geminiAvailable = true;
    } catch {
      this.geminiAvailable = false;
    }
  }

  private buildGeminiPrompt(query: string): string {
    return `Parse this fantasy football query into structured data:
Query: "${query}"

Available context:
- Active League: ${this.context.leagueContext.activeLeague.name}
- User has ${this.context.userRoster.length} players rostered
- Recent queries: ${this.context.recentQueries.slice(-3).map(q => q.originalQuery).join(', ')}

Return JSON with:
- command_type: one of [${COMMAND_INTENTS.map(i => i.intent).join(', ')}]
- confidence: 0-100
- entities: {players, positions, timeframe, action, league}
- parameters: command-specific parameters
- clarifications_needed: any ambiguities to resolve`;
  }

  private async callGeminiAPI(prompt: string): Promise<any> {
    // This would integrate with actual Gemini API
    // For now, return a mock response
    return {
      command_type: 'general_advice',
      confidence: 75,
      entities: {},
      parameters: {},
      clarifications_needed: []
    };
  }

  private parseGeminiResponse(response: any, originalQuery: string): ParsedCommand {
    return {
      type: response.command_type || 'general_advice',
      confidence: response.confidence || 50,
      entities: response.entities || {},
      parameters: response.parameters || {},
      originalQuery,
      processedQuery: originalQuery,
      suggestedFollowUp: this.generateFollowUpSuggestions(response.command_type),
      ambiguities: response.clarifications_needed || []
    };
  }

  private normalizeQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Update parser context with new data
   */
  updateContext(newContext: Partial<ParserContext>): void {
    this.context = { ...this.context, ...newContext };
    if (newContext.availablePlayers) {
      this.playerNameMap = this.buildPlayerNameMap();
    }
  }

  /**
   * Get command examples for a specific intent
   */
  getExamplesForIntent(intent: CommandType): string[] {
    const intentDef = COMMAND_INTENTS.find(i => i.intent === intent);
    return intentDef?.examples || [];
  }

  /**
   * Get all supported command types
   */
  getSupportedCommands(): CommandType[] {
    return COMMAND_INTENTS.map(i => i.intent);
  }
}

// Export singleton factory
export const createNaturalLanguageParser = (context: ParserContext): NaturalLanguageCommandParser => {
  return new NaturalLanguageCommandParser(context);
};