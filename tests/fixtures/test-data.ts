/**
 * Test Data Fixtures for Fantasy Football Analyzer
 * 
 * Comprehensive test data for ESPN API, Browser MCP, and AI services
 */

import { Player, Team, Position, InjuryStatus } from '../../src/types';

// Mock Player Data
export const mockPlayers: Player[] = [
  {
    id: 1,
    name: 'Christian McCaffrey',
    position: 'RB',
    team: 'SF',
    adp: 1.2,
    ppr: 24.8,
    standard: 21.3,
    halfPpr: 23.1,
    injury: 'Healthy',
    news: 'Expected to have another elite season',
    tier: 1,
  },
  {
    id: 2,
    name: 'CeeDee Lamb',
    position: 'WR',
    team: 'DAL',
    adp: 2.8,
    ppr: 22.4,
    standard: 18.9,
    halfPpr: 20.7,
    injury: 'Healthy',
    news: 'Top WR target with high ceiling',
    tier: 1,
  },
  {
    id: 3,
    name: 'Tyreek Hill',
    position: 'WR',
    team: 'MIA',
    adp: 3.1,
    ppr: 21.9,
    standard: 18.2,
    halfPpr: 20.1,
    injury: 'Questionable',
    news: 'Minor wrist injury, expected to play',
    tier: 1,
  },
  {
    id: 4,
    name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    adp: 4.2,
    ppr: 23.6,
    standard: 23.6,
    halfPpr: 23.6,
    injury: 'Healthy',
    news: 'Elite dual-threat quarterback',
    tier: 1,
  },
  {
    id: 5,
    name: 'Travis Kelce',
    position: 'TE',
    team: 'KC',
    adp: 8.5,
    ppr: 16.8,
    standard: 13.2,
    halfPpr: 15.0,
    injury: 'Healthy',
    news: 'Consistent TE1 option',
    tier: 1,
  },
];

// Mock Team Data
export const mockTeams: Team[] = [
  {
    id: 1,
    name: 'Team Alpha',
    owner: 'Alice Johnson',
    strategy: 'aggressive',
    tendencies: ['early_qb', 'handcuff_heavy'],
    rosterNeeds: {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      DEF: 1,
      K: 1,
    },
  },
  {
    id: 2,
    name: 'Team Beta',
    owner: 'Bob Smith',
    strategy: 'balanced',
    tendencies: ['follows_rankings', 'value_focused'],
    rosterNeeds: {
      QB: 1,
      RB: 3,
      WR: 2,
      TE: 1,
      DEF: 1,
      K: 1,
    },
  },
];

// ESPN API Mock Responses
export const espnApiMockResponses = {
  athletes: {
    items: [
      {
        id: '1',
        displayName: 'Christian McCaffrey',
        firstName: 'Christian',
        lastName: 'McCaffrey',
        position: {
          name: 'Running Back',
          abbreviation: 'RB',
        },
        team: {
          id: '25',
          name: 'San Francisco 49ers',
          abbreviation: 'SF',
        },
      },
      {
        id: '2',
        displayName: 'CeeDee Lamb',
        firstName: 'CeeDee',
        lastName: 'Lamb',
        position: {
          name: 'Wide Receiver',
          abbreviation: 'WR',
        },
        team: {
          id: '6',
          name: 'Dallas Cowboys',
          abbreviation: 'DAL',
        },
      },
    ],
  },
  teams: [
    {
      id: '25',
      name: 'San Francisco 49ers',
      displayName: 'San Francisco 49ers',
      shortDisplayName: '49ers',
      abbreviation: 'SF',
      location: 'San Francisco',
      color: '#AA0000',
      alternateColor: '#B3995D',
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
    },
  ],
  injuries: {
    articles: [
      {
        headline: 'Tyreek Hill dealing with minor wrist injury',
        description: 'Hill is expected to play despite wrist concern',
        published: new Date().toISOString(),
      },
    ],
  },
  rankings: [
    {
      playerId: '1',
      playerName: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      rank: 1,
      tier: 1,
      adp: 1.2,
      projectedPoints: 24.8,
    },
  ],
};

// Browser MCP Mock Responses
export const browserMCPMockResponses = {
  nflInjuries: [
    {
      playerId: 'tyreek-hill',
      playerName: 'Tyreek Hill',
      position: 'WR',
      team: 'MIA',
      status: 'Questionable',
      description: 'Wrist injury - limited in practice',
      updated: new Date(),
      source: 'NFL.com',
    },
  ],
  fantasyProRankings: [
    {
      playerId: 'christian-mccaffrey',
      playerName: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      rank: 1,
      tier: 1,
      adp: 1.2,
      projectedPoints: 24.8,
      updated: new Date(),
    },
  ],
  sleeperADP: [
    {
      playerId: 'cmccaffrey',
      playerName: 'Christian McCaffrey',
      position: 'RB',
      team: 'SF',
      adp: 1.15,
      adpChange: -0.05,
      updated: new Date(),
    },
  ],
};

// AI Service Mock Responses
export const aiServiceMockResponses = {
  draftAnalysis: {
    requestId: 'test-draft-123',
    backend: 'local' as const,
    response: `**Draft Analysis - Round 1, Pick 3**

🎯 **Recommended Pick: CeeDee Lamb (WR, DAL)**

**Reasoning:**
- Elite WR1 with 150+ target ceiling
- Excellent value at this draft position
- Cowboys offense should be high-powered
- Fills critical positional need

**Alternative Options:**
1. Tyreek Hill (WR, MIA) - Higher ceiling, injury concern
2. Bijan Robinson (RB, ATL) - Positional scarcity value

**Strategy Moving Forward:**
- Target RB depth in rounds 2-3
- Consider elite TE in round 4-5
- Build roster foundation early`,
    confidence: 92,
    responseTime: 1250,
    analysis: {
      playerRecommendations: [mockPlayers[1], mockPlayers[2]],
      strategyPoints: [
        'Focus on high-target WRs in PPR format',
        'Build depth at RB position next',
        'Consider positional scarcity',
      ],
      riskFactors: [
        'WR position historically volatile',
        'Consider handcuffing if selecting RB',
      ],
    },
    timestamp: new Date(),
  },
  playerAnalysis: {
    requestId: 'test-player-456',
    backend: 'cloud' as const,
    response: `**Christian McCaffrey Analysis**

📊 **2024 Outlook: Elite RB1**

**Strengths:**
- Proven workhorse with 300+ touch ceiling
- Elite PPR upside with receiving ability
- 49ers offense supports RB production
- Healthy and motivated for 2024 season

**Concerns:**
- Age (28) and injury history
- Heavy workload sustainability
- Potential for regression

**Projection:** 1,400 rush yards, 80 receptions, 15+ TDs
**Confidence:** 88% chance of top-5 RB finish`,
    confidence: 88,
    responseTime: 2100,
    timestamp: new Date(),
  },
};

// Draft Simulation Data
export const mockDraftData = {
  currentPick: 3,
  currentRound: 1,
  totalRounds: 16,
  draftedPlayers: [1, 2], // Player IDs
  availablePlayers: mockPlayers.slice(2),
  userTeam: {
    roster: [] as Player[],
    picks: [3, 14, 19, 30], // Draft positions
  },
  timeRemaining: 90, // seconds
};

// Network Mock Responses
export const networkMockResponses = {
  espnSuccess: {
    status: 200,
    json: () => Promise.resolve(espnApiMockResponses.athletes),
  },
  espnFailure: {
    status: 500,
    statusText: 'Internal Server Error',
    json: () => Promise.reject(new Error('ESPN API Error')),
  },
  localGeminiSuccess: {
    status: 'healthy',
    latency: 120,
    model: 'gemini-2.5-flash',
    capabilities: ['chat', 'analysis', 'fantasy-advice'],
  },
  cloudFallback: {
    message: 'Local service unavailable, using cloud fallback',
    backend: 'cloud',
    responseTime: 2500,
  },
};

// Performance Benchmarks
export const performanceBenchmarks = {
  pageLoad: 3000, // 3 seconds max
  draftBoardRender: 2000, // 2 seconds max
  playerSearch: 500, // 500ms max
  aiResponse: 10000, // 10 seconds max
  apiCall: 5000, // 5 seconds max
  cacheHit: 100, // 100ms max
};

// Accessibility Test Data
export const accessibilityTestData = {
  requiredAriaLabels: [
    'player-search-input',
    'draft-board-table',
    'ai-chat-input',
    'navigation-tabs',
    'player-comparison-modal',
  ],
  keyboardNavigationPaths: [
    ['Tab', 'Enter'], // Basic navigation
    ['Tab', 'Tab', 'Space'], // Selection
    ['Escape'], // Modal close
    ['ArrowDown', 'ArrowDown', 'Enter'], // List navigation
  ],
  colorContrastTargets: [
    '.player-available',
    '.player-drafted',
    '.injury-status-out',
    '.tier-indicator',
    '.ai-message',
  ],
};

// Error Simulation Data
export const errorSimulations = {
  networkFailures: [
    { type: 'timeout', duration: 30000 },
    { type: 'connection_refused', code: 'ECONNREFUSED' },
    { type: 'dns_failure', code: 'ENOTFOUND' },
  ],
  apiErrors: [
    { status: 429, message: 'Rate limit exceeded' },
    { status: 503, message: 'Service temporarily unavailable' },
    { status: 400, message: 'Bad request' },
  ],
  browserErrors: [
    { type: 'selector_timeout', selector: '.non-existent-element' },
    { type: 'navigation_failure', url: 'https://invalid-domain.test' },
    { type: 'script_error', message: 'ReferenceError: undefined variable' },
  ],
};

// Visual Regression Data
export const visualRegressionTargets = [
  { name: 'homepage', path: '/', viewport: { width: 1280, height: 720 } },
  { name: 'draft-board', path: '/draft', viewport: { width: 1920, height: 1080 } },
  { name: 'player-comparison', path: '/comparison', viewport: { width: 1280, height: 720 } },
  { name: 'mobile-homepage', path: '/', viewport: { width: 375, height: 667 } },
];

// Export test utilities
export const testUtils = {
  // Generate random player data
  generateRandomPlayer: (id: number): Player => ({
    id,
    name: `Test Player ${id}`,
    position: (['QB', 'RB', 'WR', 'TE', 'DEF', 'K'] as Position[])[Math.floor(Math.random() * 6)],
    team: ['SF', 'DAL', 'KC', 'BUF', 'MIA'][Math.floor(Math.random() * 5)],
    adp: Math.random() * 200 + 1,
    ppr: Math.random() * 20 + 5,
    standard: Math.random() * 18 + 3,
    halfPpr: Math.random() * 19 + 4,
    injury: (['Healthy', 'Questionable', 'Doubtful', 'Out'] as InjuryStatus[])[Math.floor(Math.random() * 4)],
    news: `Test news for player ${id}`,
    tier: Math.ceil((Math.random() * 200) / 12),
  }),

  // Generate mock draft scenario
  generateDraftScenario: (round: number, pick: number) => ({
    ...mockDraftData,
    currentRound: round,
    currentPick: pick,
    draftedPlayers: Array.from({ length: pick - 1 }, (_, i) => i + 1),
  }),

  // Generate performance metrics
  generatePerformanceMetrics: () => ({
    loadTime: Math.random() * 5000 + 500,
    renderTime: Math.random() * 2000 + 100,
    memoryUsage: Math.random() * 50 + 10, // MB
    networkRequests: Math.floor(Math.random() * 20) + 5,
  }),
};