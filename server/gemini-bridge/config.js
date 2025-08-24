// Local Gemini Advanced Bridge Server Configuration
// Environment configuration and fantasy football intelligence

const config = {
  // Server configuration
  server: {
    host: process.env.BRIDGE_HOST || 'localhost',
    port: parseInt(process.env.BRIDGE_PORT) || 3001,
    environment: process.env.NODE_ENV || 'development'
  },

  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],

  // MCP Discovery configuration
  discovery: {
    endpoints: [
      'http://localhost:8000',  // Primary Gemini MCP
      'http://localhost:8001',  // Secondary Gemini MCP
      'http://127.0.0.1:8000',  // Fallback primary
      'http://127.0.0.1:8001',  // Fallback secondary
    ],
    timeout: 5000,              // 5 seconds
    retryInterval: 30000,       // 30 seconds
    maxRetries: 3
  },

  // Health monitoring
  healthCheckInterval: 60000,    // 1 minute
  heartbeatInterval: 30000,      // 30 seconds
  requestTimeout: 120000,        // 2 minutes for complex analysis

  // Message queue configuration
  queueProcessingInterval: 1000, // 1 second
  maxQueueSize: 100,
  maxMessageSize: 1024 * 1024,   // 1MB

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,    // 15 minutes
    maxRequests: 1000,           // Per IP per window
    skipSuccessfulRequests: false
  },

  // Fantasy Football Prompts and Intelligence
  fantasyPrompts: {
    // System context for all queries
    systemContext: `You are an expert Fantasy Football AI assistant with deep knowledge of NFL players, teams, strategies, and analytics. You provide actionable insights for fantasy football managers.

KEY EXPERTISE AREAS:
- Player valuations and tier rankings
- Draft strategy and positional scarcity
- Weekly matchup analysis and start/sit decisions
- Injury impact assessment and handcuff strategies
- Trade evaluation and fairness analysis
- Waiver wire pickups and streaming strategies
- Championship run planning and playoff preparation

ANALYSIS PHILOSOPHY:
- Prioritize opportunity (target share, snap count, red zone usage)
- Consider matchup strength and game script implications
- Factor in injury history and player durability
- Evaluate coaching tendencies and offensive systems
- Account for weather conditions and venue factors
- Emphasize risk-adjusted value and floor/ceiling projections`,

    // Draft strategy template
    draftStrategy: `DRAFT ANALYSIS REQUEST

Current Draft Position: {position}
Available Players: {availablePlayers}

Please provide comprehensive draft strategy including:

1. BEST VALUE PICKS (Top 3-5 recommendations)
   - Player name, position, and ADP vs current value
   - Reasoning for why they're undervalued at this spot
   - Risk/reward assessment

2. POSITIONAL STRATEGY
   - Which positions to prioritize vs wait on
   - Handcuff and stacking opportunities
   - Late-round sleepers to target

3. TIER ANALYSIS
   - Current tier you're drafting in for each position
   - When the next tier drop occurs
   - Players to avoid (potential busts)

4. GAME SCRIPT CONSIDERATIONS
   - Team offensive outlook and projected game scripts
   - Red zone opportunities and target distribution
   - Injury concerns and backup options

Provide specific, actionable advice with confidence levels.`,

    // Player valuation template
    playerValuation: `PLAYER EVALUATION REQUEST

Players to Analyze: {players}
Current Week: {week}
Scoring System: {scoring}

For each player, provide:

1. WEEKLY PROJECTION
   - Points projection with confidence interval
   - Floor (worst-case realistic scenario)
   - Ceiling (best-case realistic scenario)

2. MATCHUP ANALYSIS
   - Opponent defensive ranking vs position
   - Key defensive players to watch
   - Weather/venue impact

3. USAGE EXPECTATIONS
   - Expected snap count and target/carry share
   - Red zone opportunities
   - Game script implications

4. INJURY/REST CONCERNS
   - Current health status
   - Workload management expectations
   - Handcuff recommendations

5. RANKING
   - Position ranking for the week
   - Overall flex ranking
   - Start/sit recommendation with confidence

Focus on actionable insights for lineup decisions.`,

    // Trade analysis template
    tradeAnalysis: `TRADE EVALUATION REQUEST

Proposed Trade: {tradeDetails}
Current Team Roster: {roster}
League Settings: {leagueSettings}

Provide comprehensive trade analysis:

1. TRADE VALUE ASSESSMENT
   - Fair market value of each player
   - Who wins the trade and by how much
   - Position of strength/weakness impact

2. TEAM FIT ANALYSIS
   - How trade improves/weakens starting lineup
   - Depth considerations and backup options
   - Positional balance after trade

3. ROS (REST OF SEASON) OUTLOOK
   - Schedule strength analysis
   - Injury risk factors
   - Playoff implications

4. ALTERNATIVE TARGETS
   - Other players to consider instead
   - Potential counter-offers
   - Buy-low/sell-high opportunities

5. RECOMMENDATION
   - Accept, decline, or counter with specific terms
   - Confidence level in recommendation
   - Timeline considerations`,

    // Waiver wire template
    waiverWire: `WAIVER WIRE ANALYSIS REQUEST

Available Players: {availablePlayers}
Current Roster Needs: {rosterNeeds}
FAAB Budget Remaining: {faabBudget}

For top waiver targets, provide:

1. PRIORITY RANKINGS
   - Order of acquisition priority
   - FAAB bid recommendations (% of budget)
   - Roster percentage owned trends

2. OPPORTUNITY ANALYSIS
   - Path to meaningful fantasy production
   - Injury situations creating opportunities
   - Depth chart movement and role changes

3. USAGE PROJECTION
   - Expected snap count and touch distribution
   - Red zone and target opportunities
   - Sustainability of role

4. SCHEDULE ANALYSIS
   - Next 4 weeks matchup difficulty
   - Playoff schedule (weeks 15-17)
   - Bye week considerations

5. DROP CANDIDATES
   - Players to consider dropping
   - IR stash opportunities
   - Handcuff value assessment

Prioritize players with immediate impact potential.`,

    // Analysis instructions for all prompts
    analysisInstructions: `ANALYSIS REQUIREMENTS:

1. Be specific and actionable - avoid generic advice
2. Include confidence levels (High/Medium/Low) for major recommendations
3. Consider both floor and ceiling outcomes
4. Factor in recent trends and usage patterns
5. Account for injury situations and depth chart changes
6. Provide numerical projections where relevant
7. Consider league context (standard, PPR, dynasty, etc.)
8. Include risk assessment for major decisions
9. Mention key stats and metrics supporting recommendations
10. Keep response well-structured and easy to scan

RESPONSE FORMAT:
- Use clear headings and bullet points
- Bold key players and recommendations
- Include brief reasoning for each major point
- End with a clear summary/recommendation section

Focus on winning championships, not just weekly matchups.`
  },

  // Player position mappings
  positions: {
    QB: { priority: 3, draftRounds: [6, 7, 8, 9, 10] },
    RB: { priority: 1, draftRounds: [1, 2, 3, 4, 5] },
    WR: { priority: 1, draftRounds: [1, 2, 3, 4, 5] },
    TE: { priority: 2, draftRounds: [4, 5, 6, 7, 8] },
    DEF: { priority: 4, draftRounds: [14, 15, 16] },
    K: { priority: 4, draftRounds: [15, 16, 17] }
  },

  // Scoring system configurations
  scoringSystems: {
    standard: {
      passingTd: 4,
      passingYards: 0.04,
      rushingTd: 6,
      rushingYards: 0.1,
      receivingTd: 6,
      receivingYards: 0.1,
      receptions: 0,
      fumbles: -2,
      interceptions: -2
    },
    ppr: {
      passingTd: 4,
      passingYards: 0.04,
      rushingTd: 6,
      rushingYards: 0.1,
      receivingTd: 6,
      receivingYards: 0.1,
      receptions: 1,
      fumbles: -2,
      interceptions: -2
    },
    halfPpr: {
      passingTd: 4,
      passingYards: 0.04,
      rushingTd: 6,
      rushingYards: 0.1,
      receivingTd: 6,
      receivingYards: 0.1,
      receptions: 0.5,
      fumbles: -2,
      interceptions: -2
    }
  },

  // Team and matchup data
  nflTeams: {
    'BUF': { conference: 'AFC', division: 'East', strength: 'high' },
    'MIA': { conference: 'AFC', division: 'East', strength: 'medium' },
    'NE': { conference: 'AFC', division: 'East', strength: 'low' },
    'NYJ': { conference: 'AFC', division: 'East', strength: 'medium' },
    'BAL': { conference: 'AFC', division: 'North', strength: 'high' },
    'CIN': { conference: 'AFC', division: 'North', strength: 'high' },
    'CLE': { conference: 'AFC', division: 'North', strength: 'medium' },
    'PIT': { conference: 'AFC', division: 'North', strength: 'medium' },
    'HOU': { conference: 'AFC', division: 'South', strength: 'high' },
    'IND': { conference: 'AFC', division: 'South', strength: 'medium' },
    'JAX': { conference: 'AFC', division: 'South', strength: 'low' },
    'TEN': { conference: 'AFC', division: 'South', strength: 'low' },
    'DEN': { conference: 'AFC', division: 'West', strength: 'medium' },
    'KC': { conference: 'AFC', division: 'West', strength: 'high' },
    'LV': { conference: 'AFC', division: 'West', strength: 'low' },
    'LAC': { conference: 'AFC', division: 'West', strength: 'medium' },
    'DAL': { conference: 'NFC', division: 'East', strength: 'medium' },
    'NYG': { conference: 'NFC', division: 'East', strength: 'low' },
    'PHI': { conference: 'NFC', division: 'East', strength: 'high' },
    'WAS': { conference: 'NFC', division: 'East', strength: 'medium' },
    'CHI': { conference: 'NFC', division: 'North', strength: 'medium' },
    'DET': { conference: 'NFC', division: 'North', strength: 'high' },
    'GB': { conference: 'NFC', division: 'North', strength: 'medium' },
    'MIN': { conference: 'NFC', division: 'North', strength: 'medium' },
    'ATL': { conference: 'NFC', division: 'South', strength: 'medium' },
    'CAR': { conference: 'NFC', division: 'South', strength: 'low' },
    'NO': { conference: 'NFC', division: 'South', strength: 'medium' },
    'TB': { conference: 'NFC', division: 'South', strength: 'medium' },
    'ARI': { conference: 'NFC', division: 'West', strength: 'low' },
    'LAR': { conference: 'NFC', division: 'West', strength: 'medium' },
    'SF': { conference: 'NFC', division: 'West', strength: 'high' },
    'SEA': { conference: 'NFC', division: 'West', strength: 'medium' }
  },

  // Performance monitoring
  monitoring: {
    metricsInterval: 30000,      // 30 seconds
    logLevel: process.env.LOG_LEVEL || 'info',
    maxLogFiles: 10,
    maxLogSize: '10MB'
  },

  // Security settings
  security: {
    maxConcurrentConnections: 1000,
    rateLimitByIP: true,
    requireAPIKey: false,        // Set to true for production
    apiKeyHeader: 'X-API-Key',
    allowedIPRanges: ['127.0.0.1', '192.168.0.0/16', '10.0.0.0/8']
  },

  // Feature flags
  features: {
    enableWebSocket: true,
    enableBatchProcessing: true,
    enableCaching: true,
    enableMetrics: true,
    enableDraftMode: true,
    enableRealTimeUpdates: true
  }
};

// Environment-specific overrides
if (config.server.environment === 'production') {
  config.discovery.endpoints = [
    'http://gemini-mcp:8000',    // Docker service name
    'http://localhost:8000'      // Fallback
  ];
  
  config.corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['https://your-fantasy-app.com'];
    
  config.security.requireAPIKey = true;
  config.monitoring.logLevel = 'warn';
}

// Validation helper
function validateConfig() {
  const required = ['server.host', 'server.port', 'discovery.endpoints'];
  const missing = [];
  
  required.forEach(path => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (value === undefined || value === null) {
      missing.push(path);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  if (config.discovery.endpoints.length === 0) {
    console.warn('⚠️  No Gemini MCP endpoints configured - server will run in offline mode');
  }
}

// Validate configuration on load
validateConfig();

module.exports = config;