/**
 * Environment Detection Utility
 * Determines whether we're running in Claude Code (Browser MCP) or Claude Desktop
 */

export type EnvironmentType = 'claude-code' | 'claude-desktop' | 'browser';

export interface EnvironmentCapabilities {
  hasBrowserMCP: boolean;
  hasPlaywright: boolean;
  requiresManualEntry: boolean;
  environment: EnvironmentType;
}

/**
 * Detects the current environment and available capabilities
 */
export function detectEnvironment(): EnvironmentCapabilities {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      hasBrowserMCP: false,
      hasPlaywright: false,
      requiresManualEntry: true,
      environment: 'browser'
    };
  }

  // Check for Browser MCP functions (only available during Claude Code automation)
  const hasBrowserMCPFunctions = typeof (window as any).mcp__playwright__browser_navigate === 'function' ||
                                  typeof (window as any).mcp__playwright__browser_snapshot === 'function' ||
                                  typeof (window as any).mcp__playwright__browser_click === 'function';

  // Check for Claude Code context indicators
  const hasClaudeCodeIndicators = 
    // Check for Claude Code specific user agent patterns
    navigator.userAgent.includes('Claude') ||
    // Check for Browser MCP global objects
    'mcp' in window ||
    // Check if we have actual Browser MCP functions available
    hasBrowserMCPFunctions;

  if (hasClaudeCodeIndicators && hasBrowserMCPFunctions) {
    return {
      hasBrowserMCP: true,
      hasPlaywright: true,
      requiresManualEntry: false,
      environment: 'claude-code'
    };
  }

  // Default to Claude Desktop mode (manual entry required)
  return {
    hasBrowserMCP: false,
    hasPlaywright: false,
    requiresManualEntry: true,
    environment: 'claude-desktop'
  };
}

/**
 * Gets user-friendly environment description
 */
export function getEnvironmentDescription(capabilities: EnvironmentCapabilities): string {
  switch (capabilities.environment) {
    case 'claude-code':
      return 'Claude Code with Browser MCP - Automated NFL.com sync available';
    case 'claude-desktop':
      return 'Claude Desktop - Manual league data entry required';
    case 'browser':
      return 'Browser mode - Manual league data entry required';
    default:
      return 'Unknown environment';
  }
}

/**
 * Gets appropriate sync method description based on environment
 */
export function getSyncMethodDescription(capabilities: EnvironmentCapabilities): string {
  if (capabilities.hasBrowserMCP) {
    return 'Claude will automatically navigate to NFL.com and extract your league data';
  }
  return 'Please copy your league data from NFL.com and paste it below';
}

/**
 * Determines if automated sync is available
 */
export function canAutoSync(capabilities: EnvironmentCapabilities): boolean {
  return capabilities.hasBrowserMCP && capabilities.hasPlaywright;
}