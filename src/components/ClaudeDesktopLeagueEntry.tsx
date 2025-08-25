import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Copy, ExternalLink, Info } from 'lucide-react';
import { NFLLeague, NFLTeam, NFLPlayer } from '../types/NFLLeagueTypes';

interface ClaudeDesktopLeagueEntryProps {
  onLeagueDataSubmit: (leagues: Record<string, NFLLeague>) => void;
  onError: (error: string) => void;
  className?: string;
}

interface ParsedLeagueData {
  valid: boolean;
  leagues: Record<string, NFLLeague>;
  errors: string[];
}

export const ClaudeDesktopLeagueEntry: React.FC<ClaudeDesktopLeagueEntryProps> = ({
  onLeagueDataSubmit,
  onError,
  className = ''
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [parseResult, setParseResult] = useState<ParsedLeagueData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const sampleLeagueData = {
    "6317063": {
      "id": "6317063",
      "name": "Injustice League",
      "size": 12,
      "scoringType": "PPR",
      "draftStatus": "completed",
      "currentWeek": 1,
      "season": "2024",
      "teams": {
        "1": {
          "id": "1",
          "name": "Team Alpha",
          "owner": "Owner Name",
          "record": "0-0-0",
          "pointsFor": 0,
          "pointsAgainst": 0,
          "roster": []
        }
      },
      "settings": {
        "rosterSize": 16,
        "startingPositions": {
          "QB": 1,
          "RB": 2,
          "WR": 2,
          "TE": 1,
          "FLEX": 1,
          "DEF": 1,
          "K": 1
        }
      }
    }
  };

  const validateLeagueData = useCallback((data: any): ParsedLeagueData => {
    const errors: string[] = [];
    const leagues: Record<string, NFLLeague> = {};

    try {
      if (!data || typeof data !== 'object') {
        errors.push('Invalid JSON format - must be an object');
        return { valid: false, leagues, errors };
      }

      // Validate each league
      for (const [leagueId, leagueData] of Object.entries(data)) {
        const league = leagueData as any;
        
        // Required fields validation
        if (!league.id) errors.push(`League ${leagueId}: Missing 'id' field`);
        if (!league.name) errors.push(`League ${leagueId}: Missing 'name' field`);
        if (!league.size) errors.push(`League ${leagueId}: Missing 'size' field`);
        if (!league.scoringType) errors.push(`League ${leagueId}: Missing 'scoringType' field`);
        
        // Teams validation
        if (!league.teams || typeof league.teams !== 'object') {
          errors.push(`League ${leagueId}: Missing or invalid 'teams' object`);
        } else {
          const teamCount = Object.keys(league.teams).length;
          if (teamCount === 0) {
            errors.push(`League ${leagueId}: No teams found`);
          }
        }

        // Settings validation
        if (!league.settings || typeof league.settings !== 'object') {
          errors.push(`League ${leagueId}: Missing or invalid 'settings' object`);
        }

        // If validation passes, add to leagues
        if (errors.length === 0) {
          leagues[leagueId] = league as NFLLeague;
        }
      }

      return {
        valid: errors.length === 0,
        leagues,
        errors
      };
    } catch (error) {
      errors.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, leagues, errors };
    }
  }, []);

  const handleJsonSubmit = useCallback(async () => {
    if (!jsonInput.trim()) {
      onError('Please enter league data JSON');
      return;
    }

    setIsProcessing(true);

    try {
      const parsedData = JSON.parse(jsonInput);
      const validation = validateLeagueData(parsedData);
      
      setParseResult(validation);

      if (validation.valid) {
        onLeagueDataSubmit(validation.leagues);
      } else {
        onError(`Validation failed: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      setParseResult({
        valid: false,
        leagues: {},
        errors: [errorMessage]
      });
      onError(`JSON parsing failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [jsonInput, validateLeagueData, onLeagueDataSubmit, onError]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, []);

  const handleClearInput = useCallback(() => {
    setJsonInput('');
    setParseResult(null);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Instructions Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              Claude Desktop Manual Entry
            </h3>
            <p className="text-blue-800 text-sm mb-3">
              Since Browser MCP automation isn't available, please manually extract your league data from NFL.com and paste it below as JSON.
            </p>
            
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-sm text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
            >
              {showInstructions ? 'Hide' : 'Show'} detailed instructions
              <ExternalLink className="w-3 h-3" />
            </button>

            {showInstructions && (
              <div className="mt-4 p-3 bg-blue-100 rounded border space-y-3 text-sm">
                <div>
                  <p className="font-medium text-blue-900 mb-1">Step 1: Navigate to NFL.com</p>
                  <p className="text-blue-800">Go to <code className="bg-blue-200 px-1 rounded">fantasy.nfl.com</code> and log in to your account.</p>
                </div>
                
                <div>
                  <p className="font-medium text-blue-900 mb-1">Step 2: Extract League Data</p>
                  <p className="text-blue-800">
                    Visit each league's main page and copy the league information including teams, settings, and roster data.
                    Ask Claude to help format this data into the required JSON structure shown below.
                  </p>
                </div>

                <div>
                  <p className="font-medium text-blue-900 mb-1">Step 3: Format as JSON</p>
                  <p className="text-blue-800">
                    Use the sample format below as a template. Claude can help convert your league information into this structure.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sample Data Section */}
      <div className="border border-gray-300 rounded-lg">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Sample JSON Format</h4>
          <button
            onClick={() => copyToClipboard(JSON.stringify(sampleLeagueData, null, 2))}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy Sample
          </button>
        </div>
        <div className="p-4">
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto text-gray-700">
{JSON.stringify(sampleLeagueData, null, 2)}
          </pre>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label htmlFor="league-json" className="block text-sm font-medium text-gray-700 mb-2">
            League Data JSON
          </label>
          <textarea
            id="league-json"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your league data JSON here..."
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            disabled={isProcessing}
          />
        </div>

        {/* Validation Results */}
        {parseResult && (
          <div className={`p-4 rounded-lg border ${
            parseResult.valid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              {parseResult.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${
                  parseResult.valid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {parseResult.valid ? 'Validation Successful' : 'Validation Failed'}
                </h4>
                
                {parseResult.valid ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-green-800 text-sm">
                      Found {Object.keys(parseResult.leagues).length} valid league(s)
                    </p>
                    {Object.values(parseResult.leagues).map((league) => (
                      <div key={league.id} className="text-sm text-green-700">
                        • {league.name} ({league.size} teams, {league.scoringType})
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 space-y-1">
                    {parseResult.errors.map((error, index) => (
                      <p key={index} className="text-red-800 text-sm">• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleJsonSubmit}
            disabled={isProcessing || !jsonInput.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            {isProcessing ? 'Processing...' : 'Import Leagues'}
          </button>

          <button
            onClick={handleClearInput}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};