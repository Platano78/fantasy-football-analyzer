/**
 * Rich Storage Service - IndexedDB for Offline Fantasy Football Intelligence
 * 
 * Comprehensive data storage system supporting:
 * - Player performance databases with historical data
 * - League context memory for both leagues
 * - AI analysis caching for offline use
 * - News archive with fantasy impact scores
 * - Offline calculation data for no-internet scenarios
 */

import { Player, Position } from '@/types';
import { LeagueContext, NewsImpact, WeeklyReport, LineupAdvice, TradeAdvice } from './AIService';

// Storage database schema
interface PlayerPerformanceData {
  playerId: string;
  playerName: string;
  position: Position;
  team: string;
  weeklyStats: {
    week: number;
    points: number;
    projectedPoints: number;
    actualStats: Record<string, number>;
    opponent: string;
    gameScript: 'positive' | 'neutral' | 'negative';
  }[];
  seasonProjections: {
    totalPoints: number;
    averagePoints: number;
    consistency: number;
    upside: number;
    floor: number;
    ceiling: number;
  };
  aiInsights: {
    insight: string;
    confidence: number;
    category: 'trend' | 'opportunity' | 'risk' | 'outlook';
    generatedAt: Date;
  }[];
  lastUpdated: Date;
}

interface LeagueStorageData {
  leagueId: '1602776' | '6317063';
  leagueName: string;
  
  // Current league state
  currentContext: LeagueContext;
  
  // Historical data
  weeklyStandings: {
    week: number;
    standings: {
      teamId: string;
      teamName: string;
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
      pointsAgainst: number;
    }[];
  }[];
  
  // Transaction history
  transactions: {
    week: number;
    type: 'waiver' | 'trade' | 'drop' | 'add';
    details: any;
    timestamp: Date;
  }[];
  
  // Matchup history
  matchups: {
    week: number;
    myOpponent: string;
    myScore: number;
    opponentScore: number;
    result: 'win' | 'loss' | 'tie';
    keyPlayers: string[];
  }[];
  
  lastSyncTime: Date;
}

interface AIAnalysisCache {
  analysisId: string;
  type: 'lineup' | 'trade' | 'news' | 'weekly_report' | 'question';
  leagueId?: string;
  week?: number;
  
  // Input parameters
  inputHash: string;
  parameters: any;
  
  // AI response
  result: any;
  confidence: number;
  provider: 'claude' | 'gemini' | 'deepseek' | 'offline';
  
  // Metadata
  generatedAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

interface NewsArchiveData {
  articleId: string;
  headline: string;
  content: string;
  source: string;
  publishedAt: Date;
  
  // Fantasy analysis
  impactAnalysis: NewsImpact[];
  leagueRelevance: {
    legends: number;  // 0-10 relevance score
    injustice: number;
  };
  
  // Player tags
  affectedPlayers: {
    playerId: string;
    playerName: string;
    impactType: 'positive' | 'negative' | 'neutral';
    shortTermImpact: string;
    longTermImpact: string;
  }[];
  
  // AI processing
  aiSummary: string;
  keyTakeaways: string[];
  actionableAdvice: string[];
  
  archivedAt: Date;
}

interface OfflineCalculationData {
  calculationType: string;
  inputData: any;
  result: any;
  algorithm: string;
  accuracy: number;
  lastCalculated: Date;
}

/**
 * Storage Service using IndexedDB for rich offline capabilities
 */
class StorageService {
  private static instance: StorageService;
  private db: IDBDatabase | null = null;
  private dbName = 'FantasyFootballAI';
  private dbVersion = 1;

  constructor() {
    this.initializeDatabase();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗄️ Initializing IndexedDB for fantasy football data storage...');
      
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        console.log('🔧 Setting up IndexedDB schema...');

        // Player performance store
        if (!db.objectStoreNames.contains('players')) {
          const playerStore = db.createObjectStore('players', { keyPath: 'playerId' });
          playerStore.createIndex('position', 'position');
          playerStore.createIndex('team', 'team');
          playerStore.createIndex('lastUpdated', 'lastUpdated');
        }

        // League data store
        if (!db.objectStoreNames.contains('leagues')) {
          const leagueStore = db.createObjectStore('leagues', { keyPath: 'leagueId' });
          leagueStore.createIndex('leagueName', 'leagueName');
          leagueStore.createIndex('lastSyncTime', 'lastSyncTime');
        }

        // AI analysis cache store
        if (!db.objectStoreNames.contains('aiAnalysis')) {
          const aiStore = db.createObjectStore('aiAnalysis', { keyPath: 'analysisId' });
          aiStore.createIndex('type', 'type');
          aiStore.createIndex('leagueId', 'leagueId');
          aiStore.createIndex('week', 'week');
          aiStore.createIndex('generatedAt', 'generatedAt');
          aiStore.createIndex('expiresAt', 'expiresAt');
        }

        // News archive store
        if (!db.objectStoreNames.contains('news')) {
          const newsStore = db.createObjectStore('news', { keyPath: 'articleId' });
          newsStore.createIndex('publishedAt', 'publishedAt');
          newsStore.createIndex('source', 'source');
          newsStore.createIndex('archivedAt', 'archivedAt');
        }

        // Offline calculations store
        if (!db.objectStoreNames.contains('calculations')) {
          const calcStore = db.createObjectStore('calculations', { keyPath: 'calculationType' });
          calcStore.createIndex('lastCalculated', 'lastCalculated');
        }

        console.log('✅ IndexedDB schema setup complete');
      };
    });
  }

  /**
   * Player Performance Data Management
   */
  
  async storePlayerData(playerData: PlayerPerformanceData): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['players'], 'readwrite');
      const store = transaction.objectStore('players');
      
      const request = store.put(playerData);
      
      request.onsuccess = () => {
        console.log(`💾 Stored player data for ${playerData.playerName}`);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getPlayerData(playerId: string): Promise<PlayerPerformanceData | null> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['players'], 'readonly');
      const store = transaction.objectStore('players');
      
      const request = store.get(playerId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getPlayersByPosition(position: Position): Promise<PlayerPerformanceData[]> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['players'], 'readonly');
      const store = transaction.objectStore('players');
      const index = store.index('position');
      
      const request = index.getAll(position);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePlayerWeeklyStats(playerId: string, weekData: PlayerPerformanceData['weeklyStats'][0]): Promise<void> {
    const existingData = await this.getPlayerData(playerId);
    if (!existingData) return;

    // Update or add weekly stats
    const weekIndex = existingData.weeklyStats.findIndex(w => w.week === weekData.week);
    if (weekIndex >= 0) {
      existingData.weeklyStats[weekIndex] = weekData;
    } else {
      existingData.weeklyStats.push(weekData);
    }
    
    existingData.lastUpdated = new Date();
    
    await this.storePlayerData(existingData);
  }

  /**
   * League Context Management
   */
  
  async storeLeagueData(leagueData: LeagueStorageData): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['leagues'], 'readwrite');
      const store = transaction.objectStore('leagues');
      
      const request = store.put(leagueData);
      
      request.onsuccess = () => {
        console.log(`💾 Stored league data for ${leagueData.leagueName}`);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getLeagueData(leagueId: '1602776' | '6317063'): Promise<LeagueStorageData | null> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['leagues'], 'readonly');
      const store = transaction.objectStore('leagues');
      
      const request = store.get(leagueId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLeagueData(): Promise<LeagueStorageData[]> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['leagues'], 'readonly');
      const store = transaction.objectStore('leagues');
      
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * AI Analysis Caching
   */
  
  async cacheAIAnalysis(analysis: AIAnalysisCache): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiAnalysis'], 'readwrite');
      const store = transaction.objectStore('aiAnalysis');
      
      const request = store.put(analysis);
      
      request.onsuccess = () => {
        console.log(`🤖 Cached AI analysis: ${analysis.type} (${analysis.provider})`);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedAIAnalysis(inputHash: string, type: string): Promise<AIAnalysisCache | null> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiAnalysis'], 'readwrite');
      const store = transaction.objectStore('aiAnalysis');
      
      // Find by input hash and type, check if not expired
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.filter(
          (analysis: AIAnalysisCache) => 
            analysis.inputHash === inputHash && 
            analysis.type === type && 
            analysis.expiresAt > new Date()
        );
        
        if (results.length > 0) {
          const analysis = results[0];
          
          // Update access count and last accessed
          analysis.accessCount++;
          analysis.lastAccessed = new Date();
          
          store.put(analysis);
          resolve(analysis);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async cleanupExpiredAnalysis(): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['aiAnalysis'], 'readwrite');
      const store = transaction.objectStore('aiAnalysis');
      const index = store.index('expiresAt');
      
      const now = new Date();
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      
      let deletedCount = 0;
      
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🧹 Cleaned up ${deletedCount} expired AI analysis entries`);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * News Archive Management
   */
  
  async storeNewsArticle(newsData: NewsArchiveData): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['news'], 'readwrite');
      const store = transaction.objectStore('news');
      
      const request = store.put(newsData);
      
      request.onsuccess = () => {
        console.log(`📰 Archived news article: ${newsData.headline.substring(0, 50)}...`);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentNews(hours: number = 24): Promise<NewsArchiveData[]> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['news'], 'readonly');
      const store = transaction.objectStore('news');
      const index = store.index('publishedAt');
      
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const request = index.getAll(IDBKeyRange.lowerBound(cutoff));
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getNewsForPlayer(playerId: string): Promise<NewsArchiveData[]> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['news'], 'readonly');
      const store = transaction.objectStore('news');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result.filter(
          (article: NewsArchiveData) => 
            article.affectedPlayers.some(p => p.playerId === playerId)
        );
        
        resolve(results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()));
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Offline Calculations Storage
   */
  
  async storeCalculation(calculation: OfflineCalculationData): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readwrite');
      const store = transaction.objectStore('calculations');
      
      const request = store.put(calculation);
      
      request.onsuccess = () => {
        console.log(`🔢 Stored offline calculation: ${calculation.calculationType}`);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getCalculation(calculationType: string): Promise<OfflineCalculationData | null> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readonly');
      const store = transaction.objectStore('calculations');
      
      const request = store.get(calculationType);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Utility Methods
   */
  
  // Generate unique hash for input parameters
  generateInputHash(input: any): string {
    const str = JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Database maintenance
  async performMaintenance(): Promise<void> {
    console.log('🧹 Performing database maintenance...');
    
    await this.cleanupExpiredAnalysis();
    
    // Clean up old news (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['news'], 'readwrite');
      const store = transaction.objectStore('news');
      const index = store.index('archivedAt');
      
      const request = index.openCursor(IDBKeyRange.upperBound(thirtyDaysAgo));
      
      let deletedCount = 0;
      
      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🧹 Cleaned up ${deletedCount} old news articles`);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    players: number;
    leagues: number;
    aiAnalysis: number;
    news: number;
    calculations: number;
    estimatedSizeMB: number;
  }> {
    if (!this.db) await this.initializeDatabase();
    
    const stats = {
      players: 0,
      leagues: 0,
      aiAnalysis: 0,
      news: 0,
      calculations: 0,
      estimatedSizeMB: 0
    };

    // Count entries in each store
    const stores = ['players', 'leagues', 'aiAnalysis', 'news', 'calculations'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore('stores');
      
      const request = store.count();
      stats[storeName as keyof typeof stats] = await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    }

    // Estimate storage size (rough calculation)
    const totalEntries = Object.values(stats).reduce((sum, count) => sum + count, 0);
    stats.estimatedSizeMB = Math.round((totalEntries * 2) / 1024); // Rough estimate: 2KB per entry

    return stats;
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    if (!this.db) return;
    
    console.log('🗑️ Clearing all stored data...');
    
    const stores = ['players', 'leagues', 'aiAnalysis', 'news', 'calculations'];
    
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('✅ All data cleared');
  }

  // Export data for backup
  async exportData(): Promise<any> {
    const data = {
      players: [],
      leagues: [],
      news: [],
      calculations: []
    };

    if (!this.db) await this.initializeDatabase();

    for (const [storeName, collection] of Object.entries(data)) {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      collection.push(...await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      }));
    }

    return data;
  }

  // Import data from backup
  async importData(data: any): Promise<void> {
    console.log('📥 Importing backup data...');

    for (const [storeName, items] of Object.entries(data)) {
      if (!Array.isArray(items)) continue;
      
      for (const item of items) {
        try {
          if (storeName === 'players') {
            await this.storePlayerData(item as PlayerPerformanceData);
          } else if (storeName === 'leagues') {
            await this.storeLeagueData(item as LeagueStorageData);
          } else if (storeName === 'news') {
            await this.storeNewsArticle(item as NewsArchiveData);
          } else if (storeName === 'calculations') {
            await this.storeCalculation(item as OfflineCalculationData);
          }
        } catch (error) {
          console.error(`Error importing ${storeName} item:`, error);
        }
      }
    }

    console.log('✅ Data import complete');
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Export interfaces for type safety
export type {
  PlayerPerformanceData,
  LeagueStorageData,
  AIAnalysisCache,
  NewsArchiveData,
  OfflineCalculationData
};