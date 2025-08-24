import React, { useState, useCallback } from 'react';
import {
  NFLLeague,
  ManualLeagueEntry as ManualLeagueEntryType,
  NFLPlayer,
  FantasyTeam,
  LeagueSettings
} from '@/types/NFLLeagueTypes';
import { 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Settings,
  FileText,
  Import,
  Save
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ManualLeagueEntryProps {
  onLeagueCreated: (league: NFLLeague) => void;
  onCancel: () => void;
  existingLeague?: Partial<NFLLeague>;
  mode: 'create' | 'edit' | 'import';
  className?: string;
}

interface FormErrors {
  leagueName?: string;
  leagueId?: string;
  teamName?: string;
  ownerName?: string;
  teamCount?: string;
  players?: string[];
}

interface PlayerInput {
  name: string;
  position: NFLPlayer['position'];
  team: string;
  isValid: boolean;
}

export const ManualLeagueEntry: React.FC<ManualLeagueEntryProps> = ({
  onLeagueCreated,
  onCancel,
  existingLeague,
  mode,
  className = ''
}) => {
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // League info state
  const [leagueName, setLeagueName] = useState(existingLeague?.name || '');
  const [leagueId, setLeagueId] = useState(existingLeague?.leagueKey || '');
  const [teamCount, setTeamCount] = useState(existingLeague?.settings?.size || 12);
  const [scoringType, setScoringType] = useState<LeagueSettings['scoringType']>(
    existingLeague?.settings?.scoringType || 'PPR'
  );
  
  // Team info state
  const [teamName, setTeamName] = useState(existingLeague?.myTeam?.name || '');
  const [ownerName, setOwnerName] = useState(existingLeague?.myTeam?.ownerName || '');
  const [draftPosition, setDraftPosition] = useState(existingLeague?.myTeam?.draftPosition || 1);
  
  // Roster state
  const [rosterMethod, setRosterMethod] = useState<'manual' | 'import'>('manual');
  const [players, setPlayers] = useState<PlayerInput[]>(() => {
    if (existingLeague?.myTeam?.roster) {
      return existingLeague.myTeam.roster.map(p => ({
        name: p.name,
        position: p.position,
        team: p.team,
        isValid: true
      }));
    }
    return [
      { name: '', position: 'QB', team: '', isValid: false },
      { name: '', position: 'RB', team: '', isValid: false },
      { name: '', position: 'RB', team: '', isValid: false },
      { name: '', position: 'WR', team: '', isValid: false },
      { name: '', position: 'WR', team: '', isValid: false },
      { name: '', position: 'TE', team: '', isValid: false },
      { name: '', position: 'K', team: '', isValid: false },
      { name: '', position: 'DEF', team: '', isValid: false }
    ];
  });

  // Opponents state
  const [includeOpponents, setIncludeOpponents] = useState(false);
  const [opponents, setOpponents] = useState<Array<{ teamName: string; ownerName: string; draftPosition: number }>>([]);

  const steps = [
    { id: 1, name: 'League Info', description: 'Basic league details' },
    { id: 2, name: 'My Team', description: 'Your team information' },
    { id: 3, name: 'Roster', description: 'Your current roster' },
    { id: 4, name: 'Review', description: 'Confirm and create' }
  ];

  const positions: NFLPlayer['position'][] = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  const nflTeams = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
    'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA',
    'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB',
    'TEN', 'WAS'
  ];

  // Validation functions
  const validateStep1 = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!leagueName.trim()) {
      newErrors.leagueName = 'League name is required';
    }
    
    if (!leagueId.trim()) {
      newErrors.leagueId = 'League ID is required';
    }
    
    if (teamCount < 4 || teamCount > 20) {
      newErrors.teamCount = 'Team count must be between 4 and 20';
    }
    
    return newErrors;
  }, [leagueName, leagueId, teamCount]);

  const validateStep2 = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }
    
    if (!ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    return newErrors;
  }, [teamName, ownerName]);

  const validateStep3 = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    const playerErrors: string[] = [];
    
    players.forEach((player, index) => {
      if (!player.name.trim()) {
        playerErrors[index] = 'Player name required';
      } else if (!player.team.trim()) {
        playerErrors[index] = 'Team required';
      }
    });
    
    if (playerErrors.length > 0) {
      newErrors.players = playerErrors;
    }
    
    return newErrors;
  }, [players]);

  // Navigation functions
  const goToNextStep = useCallback(() => {
    let stepErrors: FormErrors = {};
    
    switch (currentStep) {
      case 1:
        stepErrors = validateStep1();
        break;
      case 2:
        stepErrors = validateStep2();
        break;
      case 3:
        stepErrors = validateStep3();
        break;
    }
    
    setErrors(stepErrors);
    
    if (Object.keys(stepErrors).length === 0) {
      setCurrentStep(prev => Math.min(4, prev + 1));
    }
  }, [currentStep, validateStep1, validateStep2, validateStep3]);

  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setErrors({});
  }, []);

  // Player management functions
  const addPlayer = useCallback(() => {
    setPlayers(prev => [
      ...prev,
      { name: '', position: 'RB', team: '', isValid: false }
    ]);
  }, []);

  const removePlayer = useCallback((index: number) => {
    if (players.length > 1) {
      setPlayers(prev => prev.filter((_, i) => i !== index));
    }
  }, [players.length]);

  const updatePlayer = useCallback((index: number, field: keyof PlayerInput, value: string) => {
    setPlayers(prev => prev.map((player, i) => {
      if (i === index) {
        const updated = { ...player, [field]: value };
        updated.isValid = !!(updated.name.trim() && updated.team.trim());
        return updated;
      }
      return player;
    }));
  }, []);

  // Import/Export functions
  const exportRoster = useCallback(() => {
    const rosterData = {
      teamName,
      ownerName,
      players: players.filter(p => p.isValid)
    };
    
    const blob = new Blob([JSON.stringify(rosterData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teamName.replace(/\s+/g, '-')}-roster.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [teamName, ownerName, players]);

  const importRoster = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.teamName) setTeamName(data.teamName);
        if (data.ownerName) setOwnerName(data.ownerName);
        if (data.players && Array.isArray(data.players)) {
          const importedPlayers = data.players.map((p: any) => ({
            name: p.name || '',
            position: positions.includes(p.position) ? p.position : 'RB',
            team: p.team || '',
            isValid: !!(p.name && p.team)
          }));
          setPlayers(importedPlayers);
        }
      } catch (error) {
        console.error('Failed to import roster:', error);
        alert('Failed to import roster file. Please check the format.');
      }
    };
    reader.readAsText(file);
  }, [positions]);

  // Opponent management
  const addOpponent = useCallback(() => {
    setOpponents(prev => [...prev, { teamName: '', ownerName: '', draftPosition: prev.length + 2 }]);
  }, []);

  const removeOpponent = useCallback((index: number) => {
    setOpponents(prev => prev.filter((_, i) => i !== index).map((opp, i) => ({
      ...opp,
      draftPosition: i + 2
    })));
  }, []);

  const updateOpponent = useCallback((index: number, field: string, value: string | number) => {
    setOpponents(prev => prev.map((opp, i) => 
      i === index ? { ...opp, [field]: value } : opp
    ));
  }, []);

  // Form submission
  const handleSubmit = useCallback(async () => {
    const finalErrors = {
      ...validateStep1(),
      ...validateStep2(),
      ...validateStep3()
    };
    
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create manual league entry
      const entry: ManualLeagueEntryType = {
        leagueInfo: {
          name: leagueName.trim(),
          leagueId: leagueId.trim(),
          teamCount: teamCount,
          scoringType: scoringType
        },
        myTeamInfo: {
          teamName: teamName.trim(),
          ownerName: ownerName.trim(),
          draftPosition: draftPosition
        },
        rosterEntry: {
          method: rosterMethod,
          players: players.filter(p => p.isValid).map(p => ({
            name: p.name.trim(),
            position: p.position,
            team: p.team.trim(),
            id: `${p.name.toLowerCase().replace(/\s+/g, '-')}-${p.team}`,
            projectedPoints: 0,
            rostered: true
          } as Partial<NFLPlayer>))
        },
        opponentsInfo: includeOpponents ? opponents.filter(o => o.teamName.trim() && o.ownerName.trim()) : undefined
      };

      // Convert to NFLLeague
      const league: NFLLeague = {
        id: `manual-${Date.now()}`,
        name: leagueName,
        leagueKey: leagueId,
        season: new Date().getFullYear(),
        currentWeek: 1,
        gameWeek: 1,
        url: `https://fantasy.nfl.com/league/${leagueId}`,
        settings: {
          name: leagueName,
          size: teamCount,
          scoringType: scoringType,
          rosterSettings: {
            qb: 1, rb: 2, wr: 2, te: 1, flex: 1, k: 1, def: 1, bench: 6
          }
        },
        draftSettings: {
          isDrafted: false,
          draftType: 'Snake',
          draftStatus: 'Scheduled',
          myDraftPosition: draftPosition,
          totalRounds: 16,
          timePerPick: 90
        },
        teams: createTeamsFromEntry(entry),
        myTeam: createMyTeamFromEntry(entry),
        lastSyncTime: new Date(),
        syncStatus: 'never',
        authStatus: 'unauthenticated',
        manualOverrides: {
          roster: true,
          settings: true,
          draftPosition: true
        }
      };

      console.log('✅ Manual league created:', league);
      onLeagueCreated(league);
      
    } catch (error) {
      console.error('❌ Failed to create manual league:', error);
      alert('Failed to create league. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateStep1, validateStep2, validateStep3, leagueName, leagueId, teamCount, 
    scoringType, teamName, ownerName, draftPosition, rosterMethod, players, 
    includeOpponents, opponents, onLeagueCreated
  ]);

  // Helper functions
  const createTeamsFromEntry = (entry: ManualLeagueEntryType): FantasyTeam[] => {
    const teams: FantasyTeam[] = [];
    
    // Add user's team
    teams.push({
      id: 'my_team',
      name: entry.myTeamInfo.teamName,
      ownerName: entry.myTeamInfo.ownerName,
      ownerId: 'me',
      record: { wins: 0, losses: 0, ties: 0 },
      points: { total: 0, average: 0, rank: 1 },
      roster: entry.rosterEntry.players as NFLPlayer[],
      draftPosition: entry.myTeamInfo.draftPosition,
      isCurrentUser: true
    });

    // Add opponent teams
    if (entry.opponentsInfo) {
      entry.opponentsInfo.forEach((opponent, i) => {
        teams.push({
          id: `opponent_${i + 1}`,
          name: opponent.teamName,
          ownerName: opponent.ownerName,
          ownerId: `opponent_${i + 1}`,
          record: { wins: 0, losses: 0, ties: 0 },
          points: { total: 0, average: 0, rank: i + 2 },
          roster: [],
          draftPosition: opponent.draftPosition,
          isCurrentUser: false
        });
      });
    }

    // Fill remaining teams if needed
    while (teams.length < entry.leagueInfo.teamCount) {
      const teamNum = teams.length + 1;
      teams.push({
        id: `team_${teamNum}`,
        name: `Team ${teamNum}`,
        ownerName: `Owner ${teamNum}`,
        ownerId: `owner_${teamNum}`,
        record: { wins: 0, losses: 0, ties: 0 },
        points: { total: 0, average: 0, rank: teamNum },
        roster: [],
        draftPosition: teamNum,
        isCurrentUser: false
      });
    }

    return teams;
  };

  const createMyTeamFromEntry = (entry: ManualLeagueEntryType): FantasyTeam => {
    return {
      id: 'my_team',
      name: entry.myTeamInfo.teamName,
      ownerName: entry.myTeamInfo.ownerName,
      ownerId: 'me',
      record: { wins: 0, losses: 0, ties: 0 },
      points: { total: 0, average: 0, rank: 1 },
      roster: entry.rosterEntry.players as NFLPlayer[],
      draftPosition: entry.myTeamInfo.draftPosition,
      isCurrentUser: true
    };
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'create' && 'Create Manual League'}
                {mode === 'edit' && 'Edit League'}
                {mode === 'import' && 'Import League Data'}
              </h2>
              <p className="text-gray-600">
                {mode === 'create' && 'Enter your league details manually when browser sync fails'}
                {mode === 'edit' && 'Update your existing league information'}
                {mode === 'import' && 'Import league data from file or paste'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {/* Step 1: League Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">League Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    League Name *
                  </label>
                  <input
                    type="text"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    placeholder="My Fantasy League"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.leagueName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.leagueName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.leagueName}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NFL.com League ID *
                  </label>
                  <input
                    type="text"
                    value={leagueId}
                    onChange={(e) => setLeagueId(e.target.value)}
                    placeholder="123456789"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.leagueId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.leagueId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.leagueId}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Count
                  </label>
                  <select
                    value={teamCount}
                    onChange={(e) => setTeamCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 17 }, (_, i) => i + 4).map(count => (
                      <option key={count} value={count}>{count} teams</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scoring Type
                  </label>
                  <select
                    value={scoringType}
                    onChange={(e) => setScoringType(e.target.value as LeagueSettings['scoringType'])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="PPR">PPR (Point Per Reception)</option>
                    <option value="Half-PPR">Half PPR</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: My Team */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Team Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="My Team"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.teamName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.teamName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.teamName}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Your Name"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ownerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ownerName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.ownerName}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draft Position
                  </label>
                  <select
                    value={draftPosition}
                    onChange={(e) => setDraftPosition(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: teamCount }, (_, i) => i + 1).map(pos => (
                      <option key={pos} value={pos}>Pick #{pos}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Optional Opponents Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Opponent Information (Optional)</h4>
                  <p className="text-sm text-gray-600">Add details about other teams in your league</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeOpponents}
                    onChange={(e) => setIncludeOpponents(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include opponents</span>
                </label>
              </div>

              {includeOpponents && (
                <div className="space-y-3">
                  {opponents.map((opponent, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={opponent.teamName}
                        onChange={(e) => updateOpponent(index, 'teamName', e.target.value)}
                        placeholder="Team name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={opponent.ownerName}
                        onChange={(e) => updateOpponent(index, 'ownerName', e.target.value)}
                        placeholder="Owner name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={opponent.draftPosition}
                        onChange={(e) => updateOpponent(index, 'draftPosition', Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: teamCount }, (_, i) => i + 1).map(pos => (
                          <option key={pos} value={pos}>Pick #{pos}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeOpponent(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={addOpponent}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Opponent
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Roster */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">My Roster</h3>
              
              <div className="flex items-center gap-2">
                <label className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importRoster}
                    className="sr-only"
                  />
                  <div className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    Import
                  </div>
                </label>
                
                <button
                  onClick={exportRoster}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    placeholder="Player name"
                    className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.players?.[index] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  
                  <select
                    value={player.position}
                    onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  
                  <select
                    value={player.team}
                    onChange={(e) => updatePlayer(index, 'team', e.target.value)}
                    className={`px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.players?.[index] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select team</option>
                    {nflTeams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center gap-2">
                    {player.isValid && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {players.length > 1 && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={addPlayer}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </button>
            
            {errors.players && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Please fill in all required player information
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* League Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">League Details</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {leagueName}</div>
                  <div><span className="font-medium">ID:</span> {leagueId}</div>
                  <div><span className="font-medium">Teams:</span> {teamCount}</div>
                  <div><span className="font-medium">Scoring:</span> {scoringType}</div>
                </div>
              </div>
              
              {/* Team Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">My Team</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Team:</span> {teamName}</div>
                  <div><span className="font-medium">Owner:</span> {ownerName}</div>
                  <div><span className="font-medium">Draft Position:</span> #{draftPosition}</div>
                  <div><span className="font-medium">Players:</span> {players.filter(p => p.isValid).length}</div>
                </div>
              </div>
            </div>
            
            {/* Roster Summary */}
            {players.filter(p => p.isValid).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Roster ({players.filter(p => p.isValid).length} players)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {players.filter(p => p.isValid).map((player, i) => (
                    <div key={i} className="p-2 bg-gray-100 rounded text-sm">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-gray-600">{player.position} - {player.team}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Opponents Summary */}
            {includeOpponents && opponents.filter(o => o.teamName && o.ownerName).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Opponents ({opponents.filter(o => o.teamName && o.ownerName).length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {opponents.filter(o => o.teamName && o.ownerName).map((opp, i) => (
                    <div key={i} className="p-2 bg-gray-100 rounded text-sm">
                      <div className="font-medium">{opp.teamName}</div>
                      <div className="text-gray-600">{opp.ownerName} (Pick #{opp.draftPosition})</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={goToPreviousStep}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <button
                onClick={goToNextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating League...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create League
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualLeagueEntry;