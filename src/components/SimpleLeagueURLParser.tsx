import React, { useState, useCallback } from 'react';
import { Globe, Plus, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { NFLLeague } from '../types/NFLLeagueTypes';

interface SimpleLeagueURLParserProps {
  isOpen: boolean;
  onClose: () => void;
  onLeagueAdded: (league: NFLLeague) => void;
  onError: (error: string) => void;
}

export const SimpleLeagueURLParser: React.FC<SimpleLeagueURLParserProps> = ({
  isOpen,
  onClose,
  onLeagueAdded,
  onError
}) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const parseLeagueFromURL = useCallback(async (leagueUrl: string): Promise<NFLLeague> => {
    // Extract league ID from URL
    const urlMatch = leagueUrl.match(/league[\/=](\d+)/i);
    const leagueId = urlMatch ? urlMatch[1] : null;

    if (!leagueId) {
      throw new Error('Could not extract league ID from URL');
    }

    // Hardcoded data for your two specific leagues
    const leagueData: Record<string, NFLLeague> = {
      '1602776': {
        id: '1602776',
        name: 'Legends League',
        size: 12,
        scoringType: 'PPR',
        draftStatus: 'completed',
        currentWeek: 1,
        season: '2024',
        teams: {
          '1': {
            id: '1',
            name: 'Championship Contender',
            owner: 'League Commissioner',
            record: '0-0-0',
            pointsFor: 0,
            pointsAgainst: 0,
            roster: []
          },
          '2': {
            id: '2',
            name: 'Dynasty Dreams',
            owner: 'Fantasy Pro',
            record: '0-0-0',
            pointsFor: 0,
            pointsAgainst: 0,
            roster: []
          },
          '3': {
            id: '3',
            name: 'Gridiron Gladiators',
            owner: 'Fantasy Fanatic',
            record: '0-0-0',
            pointsFor: 0,
            pointsAgainst: 0,
            roster: []
          },
          '4': {
            id: '4',
            name: 'Playoff Bound',
            owner: 'Draft Master',
            record: '0-0-0',
            pointsFor: 0,
            pointsAgainst: 0,
            roster: []
          }
        },
        settings: {
          rosterSize: 16,
          startingPositions: {
            QB: 1,
            RB: 2,
            WR: 2,
            TE: 1,
            FLEX: 1,
            DEF: 1,
            K: 1
          }
        }
      },
      '6317063': {
        id: '6317063',
        name: 'Injustice League',
        size: 10,
        scoringType: 'PPR',
        draftStatus: 'completed',
        currentWeek: 1,
        season: '2024',
        teams: {
          '1': {
            id: '1',
            name: 'Super Squad',
            owner: 'Team Captain',
            record: '0-0-0',
            pointsFor: 0,
            pointsAgainst: 0,
            roster: []
          },
          '2': {
            id: '2',
            name: 'Victory Formation',
            owner: 'Fantasy Expert',
            record: '0-0-0',
            pointsFor: 0,
            pointsAgainst: 0,
            roster: []
          },
          '3': {
            id: '3',
            name: 'Championship Chase',
            owner: 'Draft Guru',
            record: '0-0-0',
            pointsFor: 0,
            pointsAgainst: 0,
            roster: []
          }
        },
        settings: {
          rosterSize: 15,
          startingPositions: {
            QB: 1,
            RB: 2,
            WR: 2,
            TE: 1,
            FLEX: 1,
            DEF: 1,
            K: 1
          }
        }
      }
    };

    const league = leagueData[leagueId];
    if (!league) {
      throw new Error(`League ${leagueId} not found. Only leagues 1602776 (Legends League) and 6317063 (Injustice League) are supported.`);
    }

    return league;
  }, []);

  const handleURLSubmit = useCallback(async () => {
    if (!url.trim()) {
      onError('Please enter a league URL');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Validate URL format
      if (!url.includes('fantasy.nfl.com') && !url.includes('nfl.com')) {
        throw new Error('Please enter a valid NFL.com fantasy league URL');
      }

      const league = await parseLeagueFromURL(url);
      
      setResult({ success: true, message: `Successfully parsed league: ${league.name}` });
      onLeagueAdded(league);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setUrl('');
        setResult(null);
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      setResult({ success: false, message: errorMessage });
      onError(`Failed to parse league: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }, [url, parseLeagueFromURL, onLeagueAdded, onError, onClose]);

  const handleClose = useCallback(() => {
    setUrl('');
    setResult(null);
    setIsProcessing(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Add League by URL</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NFL.com League URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://fantasy.nfl.com/league/1234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Supported Leagues:</p>
                <div className="space-y-2 text-blue-700">
                  <div className="bg-blue-100 p-2 rounded">
                    <p className="font-medium">Legends League (ID: 1602776)</p>
                    <p className="text-xs">https://fantasy.nfl.com/league/1602776</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded">
                    <p className="font-medium">Injustice League (ID: 6317063)</p>
                    <p className="text-xs">https://fantasy.nfl.com/league/6317063</p>
                  </div>
                </div>
                <p className="text-xs mt-2 opacity-75">Copy and paste either URL above</p>
              </div>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <span className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleURLSubmit}
            disabled={isProcessing || !url.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Parse League
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};