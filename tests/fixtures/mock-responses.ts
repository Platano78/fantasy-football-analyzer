/**
 * Mock Response Fixtures for API and Service Testing
 * 
 * Comprehensive mocks for ESPN API, Browser MCP, and AI services
 */

import { Page, Route } from '@playwright/test';

// ESPN API Mock Handlers
export const espnApiMocks = {
  // Successful responses
  athletes: {
    url: '**/apis/site/v2/sports/football/nfl/athletes*',
    response: {
      items: [
        {
          id: '1',
          displayName: 'Christian McCaffrey',
          firstName: 'Christian',
          lastName: 'McCaffrey',
          position: { name: 'Running Back', abbreviation: 'RB' },
          team: { id: '25', name: 'San Francisco 49ers', abbreviation: 'SF' },
          age: 28,
          height: 71,
          weight: 205,
          jersey: '23',
          headshot: { href: 'https://example.com/mccaffrey.jpg' },
        },
        {
          id: '2',
          displayName: 'CeeDee Lamb',
          firstName: 'CeeDee',
          lastName: 'Lamb',
          position: { name: 'Wide Receiver', abbreviation: 'WR' },
          team: { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL' },
          age: 25,
          height: 74,
          weight: 198,
          jersey: '88',
        },
      ],
    },
  },

  teams: {
    url: '**/apis/site/v2/sports/football/nfl/teams*',
    response: {
      sports: [
        {
          leagues: [
            {
              teams: [
                {
                  id: '25',
                  name: 'San Francisco 49ers',
                  displayName: 'San Francisco 49ers',
                  abbreviation: 'SF',
                  location: 'San Francisco',
                  color: '#AA0000',
                  logo: 'https://example.com/sf-logo.png',
                },
              ],
            },
          ],
        },
      ],
    },
  },

  fantasyProjections: {
    url: '**/apis/site/v2/sports/football/nfl/fantasy/ffl*',
    response: {
      items: [
        {
          playerId: '1',
          playerName: 'Christian McCaffrey',
          position: 'RB',
          team: 'SF',
          projectedPoints: {
            standard: 21.3,
            ppr: 24.8,
            halfPpr: 23.1,
          },
          stats: {
            rushingYards: 1400,
            rushingTouchdowns: 12,
            receptions: 85,
            receivingYards: 750,
            receivingTouchdowns: 3,
          },
        },
      ],
    },
  },

  injuries: {
    url: '**/apis/site/v2/sports/football/nfl/news/injuries*',
    response: {
      articles: [
        {
          headline: 'Tyreek Hill dealing with minor wrist injury',
          description: 'Expected to play despite wrist concern',
          published: new Date().toISOString(),
        },
      ],
    },
  },

  // Error responses
  timeout: {
    url: '**/apis/site/v2/sports/football/nfl/**',
    delay: 35000, // Force timeout
  },

  rateLimit: {
    url: '**/apis/site/v2/sports/football/nfl/**',
    status: 429,
    response: { error: 'Rate limit exceeded' },
  },

  serverError: {
    url: '**/apis/site/v2/sports/football/nfl/**',
    status: 500,
    response: { error: 'Internal server error' },
  },
};

// Local Gemini Advanced Bridge Mock Handlers
export const localGeminiMocks = {
  // Health check
  health: {
    url: '**/health',
    response: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 12345,
      model: 'gemini-2.5-flash',
      capabilities: ['chat', 'analysis', 'fantasy-advice'],
    },
  },

  // Fantasy AI endpoint
  fantasyAI: {
    url: '**/api/fantasy-ai',
    response: {
      requestId: 'mock-request-123',
      backend: 'local',
      response: `**Mock AI Analysis**

This is a test response from the Local Gemini Advanced service.

🎯 **Key Insights:**
- Player analysis completed
- Recommendations generated
- Strategy points identified

**Confidence:** 95%`,
      confidence: 95,
      responseTime: 1200,
      analysis: {
        playerRecommendations: [
          {
            id: 1,
            name: 'Christian McCaffrey',
            position: 'RB',
            reasoning: 'Elite RB1 with consistent production',
          },
        ],
        strategyPoints: [
          'Focus on consistent producers',
          'Consider positional scarcity',
        ],
      },
      timestamp: new Date().toISOString(),
    },
  },

  // WebSocket connection mock
  websocket: {
    url: 'ws://localhost:3001/ws',
    // Playwright doesn't directly mock WebSocket, 
    // but we can test the fallback to HTTP
  },

  // Error scenarios
  unavailable: {
    url: '**/health',
    status: 503,
    response: { error: 'Service unavailable' },
  },

  timeout: {
    url: '**/api/fantasy-ai',
    delay: 35000,
  },
};

// Cloud Gemini Enterprise Mock Handlers
export const cloudGeminiMocks = {
  // Netlify function endpoint
  fantasyAICoach: {
    url: '**/.netlify/functions/fantasy-ai-coach',
    response: {
      requestId: 'cloud-request-456',
      backend: 'cloud',
      response: `**Cloud AI Analysis**

This is a test response from the Cloud Gemini Enterprise service.

📊 **Advanced Analytics:**
- Market analysis completed
- Trend identification active
- Risk assessment performed

**Confidence:** 88%`,
      confidence: 88,
      responseTime: 2500,
      analysis: {
        playerRecommendations: [
          {
            id: 2,
            name: 'CeeDee Lamb',
            position: 'WR',
            reasoning: 'High-target volume with TD upside',
          },
        ],
        strategyPoints: [
          'Target high-volume players',
          'Monitor injury reports closely',
        ],
        riskFactors: [
          'Weather conditions for outdoor games',
        ],
      },
      timestamp: new Date().toISOString(),
    },
  },

  // Error scenarios
  cloudError: {
    url: '**/.netlify/functions/fantasy-ai-coach',
    status: 500,
    response: { error: 'Cloud function error' },
  },

  cloudTimeout: {
    url: '**/.netlify/functions/fantasy-ai-coach',
    delay: 40000,
  },
};

// Browser MCP Mock Handlers
export const browserMCPMocks = {
  // NFL injury scraping
  nflInjuries: {
    mockData: [
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
      {
        playerId: 'cooper-kupp',
        playerName: 'Cooper Kupp',
        position: 'WR',
        team: 'LAR',
        status: 'Doubtful',
        description: 'Ankle injury - did not practice',
        updated: new Date(),
        source: 'NFL.com',
      },
    ],
  },

  // FantasyPros rankings
  fantasyProRankings: {
    mockData: [
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
      {
        playerId: 'ceedee-lamb',
        playerName: 'CeeDee Lamb',
        position: 'WR',
        team: 'DAL',
        rank: 2,
        tier: 1,
        adp: 2.8,
        projectedPoints: 22.4,
        updated: new Date(),
      },
    ],
  },

  // Sleeper ADP data
  sleeperADP: {
    mockData: [
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
  },
};

// Mock Setup Utilities
export class MockManager {
  private page: Page;
  private activeMocks: Map<string, Route> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  // Set up ESPN API mocks
  async setupESPNMocks(scenarios: string[] = ['success']): Promise<void> {
    for (const scenario of scenarios) {
      switch (scenario) {
        case 'success':
          await this.mockRoute(espnApiMocks.athletes);
          await this.mockRoute(espnApiMocks.teams);
          await this.mockRoute(espnApiMocks.fantasyProjections);
          await this.mockRoute(espnApiMocks.injuries);
          break;
        
        case 'timeout':
          await this.mockRoute(espnApiMocks.timeout);
          break;
        
        case 'rateLimit':
          await this.mockRoute(espnApiMocks.rateLimit);
          break;
        
        case 'serverError':
          await this.mockRoute(espnApiMocks.serverError);
          break;
      }
    }
  }

  // Set up Local Gemini mocks
  async setupLocalGeminiMocks(scenarios: string[] = ['available']): Promise<void> {
    for (const scenario of scenarios) {
      switch (scenario) {
        case 'available':
          await this.mockRoute(localGeminiMocks.health);
          await this.mockRoute(localGeminiMocks.fantasyAI);
          break;
        
        case 'unavailable':
          await this.mockRoute(localGeminiMocks.unavailable);
          break;
        
        case 'timeout':
          await this.mockRoute(localGeminiMocks.timeout);
          break;
      }
    }
  }

  // Set up Cloud Gemini mocks
  async setupCloudGeminiMocks(scenarios: string[] = ['available']): Promise<void> {
    for (const scenario of scenarios) {
      switch (scenario) {
        case 'available':
          await this.mockRoute(cloudGeminiMocks.fantasyAICoach);
          break;
        
        case 'error':
          await this.mockRoute(cloudGeminiMocks.cloudError);
          break;
        
        case 'timeout':
          await this.mockRoute(cloudGeminiMocks.cloudTimeout);
          break;
      }
    }
  }

  // Set up Browser MCP mocks
  async setupBrowserMCPMocks(): Promise<void> {
    // Browser MCP mocks are handled via service layer mocking
    // since they don't make external HTTP requests
    await this.page.addInitScript(() => {
      // Mock the Browser MCP service responses
      (window as any).__mockBrowserMCPData = {
        injuries: [
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
        rankings: [
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
      };
    });
  }

  // Generic mock route setup
  private async mockRoute(mockConfig: any): Promise<void> {
    const route = await this.page.route(mockConfig.url, async (route) => {
      const { delay, status = 200, response } = mockConfig;
      
      if (delay) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    this.activeMocks.set(mockConfig.url, route);
  }

  // Network condition simulation
  async simulateNetworkConditions(condition: 'slow3g' | 'offline' | 'fast'): Promise<void> {
    const conditions = {
      slow3g: {
        offline: false,
        downloadThroughput: 500 * 1024 / 8, // 500kb/s
        uploadThroughput: 500 * 1024 / 8,
        latency: 400, // 400ms
      },
      offline: {
        offline: true,
      },
      fast: {
        offline: false,
        downloadThroughput: 50 * 1024 * 1024 / 8, // 50MB/s
        uploadThroughput: 10 * 1024 * 1024 / 8, // 10MB/s
        latency: 20, // 20ms
      },
    };

    await this.page.context().setNetworkConditions(conditions[condition]);
  }

  // Error injection
  async injectError(type: 'network' | 'javascript' | 'timeout'): Promise<void> {
    switch (type) {
      case 'network':
        await this.page.route('**/*', route => route.abort('connectionfailed'));
        break;
      
      case 'javascript':
        await this.page.addInitScript(() => {
          setTimeout(() => {
            throw new Error('Injected JavaScript error for testing');
          }, 1000);
        });
        break;
      
      case 'timeout':
        await this.page.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, 35000));
          await route.continue();
        });
        break;
    }
  }

  // Clean up mocks
  async cleanup(): Promise<void> {
    for (const [url, route] of this.activeMocks) {
      await route.unroute();
    }
    this.activeMocks.clear();
    await this.page.unrouteAll();
  }
}

// Export convenience functions
export const createMockManager = (page: Page): MockManager => new MockManager(page);

// Performance mock data
export const performanceMockData = {
  metrics: {
    loadTime: 2500,
    renderTime: 800,
    memoryUsage: 35.6,
    networkRequests: 12,
    cacheHitRate: 0.75,
  },
  
  // Slow performance scenario
  slowMetrics: {
    loadTime: 8000,
    renderTime: 3500,
    memoryUsage: 85.2,
    networkRequests: 45,
    cacheHitRate: 0.2,
  },
};