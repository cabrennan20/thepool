import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { api } from '../lib/api';

const RecapPage = () => {
  const { user, isLoading } = useAuth();
  const [recapData, setRecapData] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [mobileView, setMobileView] = useState('cards');
  const [selectedMember, setSelectedMember] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showGameDropdown, setShowGameDropdown] = useState(false);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGameDropdown && !event.target.closest('[data-game-dropdown]')) {
        setShowGameDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGameDropdown]);

  useEffect(() => {
    const fetchAvailableWeeks = async () => {
      if (!user) return;
      
      try {
        setError('');
        const weeksData = await api.getRecapWeeks(selectedSeason);
        setAvailableWeeks(weeksData.weeks);
        
        // Set selected week to current week or latest available
        if (weeksData.weeks.length > 0) {
          const currentWeek = weeksData.weeks.find(w => w.recap_available) || weeksData.weeks[0];
          setSelectedWeek(currentWeek.week);
        }
      } catch (err) {
        setError('Failed to load available weeks');
        console.error('Available weeks error:', err);
      }
    };

    fetchAvailableWeeks();
  }, [user, selectedSeason]);

  useEffect(() => {
    const fetchRecapData = async () => {
      if (!user || !selectedWeek) return;
      
      try {
        setLoading(true);
        setError('');
        
        const data = await api.getRecapData(selectedWeek, selectedSeason);
        setRecapData(data);
      } catch (err) {
        setError(err.message || 'Failed to load recap data');
        setRecapData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecapData();
  }, [user, selectedWeek, selectedSeason]);

  const handleWeekChange = (week) => {
    setSelectedWeek(week);
    setFilterMember('');
    setSelectedGameIds([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGameToggle = (gameId) => {
    setSelectedGameIds(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const handleSelectAllGames = () => {
    if (selectedGameIds.length === recapData?.games.length) {
      setSelectedGameIds([]);
    } else {
      setSelectedGameIds(recapData?.games.map(game => game.game_id) || []);
    }
  };

  const clearFilters = () => {
    setFilterMember('');
    setSelectedGameIds([]);
  };

  const filteredRecapData = recapData ? recapData.recap_data.filter(member => {
    if (filterMember && !member.alias.toLowerCase().includes(filterMember.toLowerCase())) {
      return false;
    }
    return true;
  }) : [];

  const filteredGames = recapData ? recapData.games.filter(game => {
    if (selectedGameIds.length > 0 && !selectedGameIds.includes(game.game_id)) {
      return false;
    }
    return true;
  }) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const selectedWeekData = availableWeeks.find(w => w.week === selectedWeek);

  // Helper function to extract team nickname from full team name
  const getTeamNickname = (fullTeamName) => {
    if (!fullTeamName) return fullTeamName;
    
    // Split by space and take the last word as nickname
    // For teams like "New England Patriots" -> "Patriots"
    // For teams like "Los Angeles Rams" -> "Rams"
    const words = fullTeamName.trim().split(' ');
    return words[words.length - 1];
  };

  // Helper function to determine if a team is favored based on spread
  const isTeamFavored = (team, game) => {
    if (!game.spread) return null;
    
    // Negative spread means home team is favored
    // Positive spread means away team is favored
    if (team === game.home_team) {
      return game.spread < 0; // Home team favored if spread is negative
    } else {
      return game.spread > 0; // Away team favored if spread is positive
    }
  };

  // Helper function to get team pick styling with favorite/underdog colors
  const getTeamPickStyling = (pick, game) => {
    const isFavorite = isTeamFavored(pick, game);
    
    if (isFavorite === true) {
      // Favorite - light blue
      return 'bg-blue-100 text-blue-800';
    } else if (isFavorite === false) {
      // Underdog - light pink
      return 'bg-pink-100 text-pink-800';
    } else {
      // No spread data available - default styling
      return pick === game.home_team ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 print:mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 print:text-xl">
                Weekly Picks Recap
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 print:text-sm">
                Complete transparency of all member picks for Week {selectedWeek}, {selectedSeason}
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3 print:hidden">
              <select
                value={selectedWeek}
                onChange={(e) => handleWeekChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {availableWeeks.map(week => (
                  <option key={week.week} value={week.week}>
                    Week {week.week} {week.recap_available ? '' : '(Not Available)'}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Print
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3 print:hidden">
            <input
              type="text"
              placeholder="Filter by member..."
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            
            {recapData && (
              <div className="relative" data-game-dropdown>
                <button
                  onClick={() => setShowGameDropdown(!showGameDropdown)}
                  className={`px-3 py-2 border rounded-md text-sm flex items-center gap-2 min-w-[120px] justify-between ${
                    selectedGameIds.length > 0 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>
                    {selectedGameIds.length === 0 
                      ? 'Filter Games' 
                      : `${selectedGameIds.length} Game${selectedGameIds.length === 1 ? '' : 's'}`
                    }
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showGameDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showGameDropdown && (
                  <div className="absolute z-50 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGameIds.length === recapData.games.length}
                            onChange={handleSelectAllGames}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {selectedGameIds.length === recapData.games.length ? 'Deselect All' : 'Select All'}
                          </span>
                        </label>
                        <button
                          onClick={() => setShowGameDropdown(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {recapData.games.map(game => (
                        <label 
                          key={game.game_id} 
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGameIds.includes(game.game_id)}
                            onChange={() => handleGameToggle(game.game_id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {getTeamNickname(game.away_team)} @ {getTeamNickname(game.home_team)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(game.game_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {(filterMember || selectedGameIds.length > 0) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800">{error}</div>
            {selectedWeekData && !selectedWeekData.recap_available && (
              <div className="mt-2 text-sm text-red-600">
                Picks close at: {new Date(selectedWeekData.first_game_date).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading recap data...</div>
          </div>
        )}

        {/* Pick Consensus Overview */}
        {recapData && !loading && (
          <div className="mb-6 bg-white rounded-lg shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pick Consensus Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                {recapData.games.map(game => {
                  const percentages = recapData.pick_percentages[game.game_id];
                  if (!percentages) return null;
                  
                  // Determine if teams are favored for color coding
                  const awayTeamFavored = isTeamFavored(game.away_team, game);
                  const homeTeamFavored = isTeamFavored(game.home_team, game);
                  
                  // Get color styling for percentages based on favorite/underdog status
                  const getPercentageColor = (team, isFavorite) => {
                    if (isFavorite === true) {
                      return 'bg-blue-100 text-blue-800'; // Favorite - light blue
                    } else if (isFavorite === false) {
                      return 'bg-pink-100 text-pink-800'; // Underdog - light pink  
                    } else {
                      return 'bg-gray-100 text-gray-800'; // No spread data
                    }
                  };
                  
                  return (
                    <div key={game.game_id} className="border border-gray-200 rounded-lg p-2">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 truncate">{getTeamNickname(game.away_team)}</span>
                          <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            getPercentageColor(game.away_team, awayTeamFavored)
                          }`}>
                            {percentages.away_team_percentage}%
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 truncate">{getTeamNickname(game.home_team)}</span>
                          <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            getPercentageColor(game.home_team, homeTeamFavored)
                          }`}>
                            {percentages.home_team_percentage}%
                          </div>
                        </div>
                        {percentages.is_upset && (
                          <div className="text-center">
                            <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs font-bold">
                              UPSET!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mobile View Selector */}
        {recapData && !loading && isMobile && (
          <div className="mb-4 bg-white rounded-lg shadow p-4 print:hidden">
            <div className="flex flex-col space-y-3">
              <label className="text-sm font-medium text-gray-700">Mobile View:</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMobileView('cards')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mobileView === 'cards' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setMobileView('member')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mobileView === 'member' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  By Member
                </button>
                <button
                  onClick={() => setMobileView('grid')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mobileView === 'grid' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Grid
                </button>
              </div>
              
              {/* Member Selector for 'member' view */}
              {mobileView === 'member' && (
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select a member...</option>
                  {filteredRecapData.map(member => (
                    <option key={member.user_id} value={member.alias}>
                      {member.alias}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Recap Content */}
        {recapData && !loading && (
          <div className={`bg-white shadow rounded-lg overflow-hidden print:shadow-none print:rounded-none ${
            isMobile && mobileView !== 'grid' ? 'hidden md:block' : ''
          }`}>
            {/* Summary Info */}
            <div className="p-4 border-b border-gray-200 print:p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Week:</span> {recapData.week}
                </div>
                <div>
                  <span className="font-medium">Season:</span> {recapData.season}
                </div>
                <div>
                  <span className="font-medium">Members:</span> {filteredRecapData.length}
                </div>
                <div>
                  <span className="font-medium">Games:</span> {filteredGames.length}
                </div>
              </div>
            </div>

            {/* Grid Container - Enhanced for mobile */}
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y divide-gray-200 print:text-xs ${
                isMobile ? 'text-xs' : ''
              }`}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`sticky left-0 z-10 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 ${
                      isMobile ? 'px-2 py-2 min-w-[80px]' : 'px-3 py-3'
                    }`}>
                      Member
                    </th>
                    {filteredGames.map(game => (
                      <th key={game.game_id} className={`text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 ${
                        isMobile ? 'px-1 py-2 min-w-[80px]' : 'px-2 py-3 min-w-[100px]'
                      }`}>
                        <div className="space-y-1">
                          <div>{getTeamNickname(game.away_team)}</div>
                          <div className="text-gray-400">@</div>
                          <div>{getTeamNickname(game.home_team)}</div>
                          <div className="text-xs text-gray-400 font-normal">
                            {new Date(game.game_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className={`text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      isMobile ? 'px-2 py-2' : 'px-3 py-3'
                    }`}>
                      {isMobile ? 'TB' : 'Tiebreaker'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecapData.map((member, idx) => (
                    <tr key={member.user_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className={`sticky left-0 z-10 font-medium text-gray-900 border-r border-gray-200 bg-inherit ${
                        isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-4 text-sm'
                      }`}>
                        <div className={isMobile ? 'truncate max-w-[70px]' : ''}>{member.alias}</div>
                      </td>
                      {filteredGames.map(game => {
                        const pick = member.picks[game.game_id];
                        return (
                          <td key={game.game_id} className={`text-center border-r border-gray-200 ${
                            isMobile ? 'px-1 py-2 text-xs' : 'px-2 py-4 text-sm'
                          }`}>
                            {pick ? (
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                getTeamPickStyling(pick, game)
                              }`}>
                                {getTeamNickname(pick)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">No Pick</span>
                            )}
                          </td>
                        );
                      })}
                      <td className={`text-center ${
                        isMobile ? 'px-2 py-2 text-xs' : 'px-3 py-4 text-sm'
                      }`}>
                        {member.tiebreaker_points !== null ? (
                          <span className="font-medium">{member.tiebreaker_points}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-gray-200 text-xs text-gray-500 print:p-2">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  Generated on {new Date().toLocaleString()}
                </div>
                <div>
                  Tiebreaker: Total points in {recapData.final_game.away_team} @ {recapData.final_game.home_team}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        {recapData && !loading && isMobile && mobileView === 'cards' && (
          <div className="space-y-4 md:hidden">
            {filteredGames.map(game => (
              <div key={game.game_id} className="bg-white shadow rounded-lg p-4">
                {/* Game Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="font-medium text-sm">{getTeamNickname(game.away_team)}</div>
                      <div className="text-xs text-gray-500">@</div>
                      <div className="font-medium text-sm">{getTeamNickname(game.home_team)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {new Date(game.game_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                {/* Picks Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {filteredRecapData.map(member => {
                    const pick = member.picks[game.game_id];
                    return (
                      <div key={member.user_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-900 truncate pr-2">{member.alias}</span>
                        {pick ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            getTeamPickStyling(pick, game)
                          }`}>
                            {getTeamNickname(pick)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No Pick</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile Member View */}
        {recapData && !loading && isMobile && mobileView === 'member' && selectedMember && (
          <div className="md:hidden">
            {(() => {
              const member = filteredRecapData.find(m => m.alias === selectedMember);
              if (!member) return null;
              
              return (
                <div className="bg-white shadow rounded-lg p-4">
                  {/* Member Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{member.alias}</h3>
                    {member.tiebreaker_points !== null && (
                      <div className="text-sm text-gray-600">
                        Tiebreaker: <span className="font-medium">{member.tiebreaker_points}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Member's Picks */}
                  <div className="space-y-3">
                    {filteredGames.map(game => {
                      const pick = member.picks[game.game_id];
                      return (
                        <div key={game.game_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {getTeamNickname(game.away_team)} @ {getTeamNickname(game.home_team)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(game.game_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="ml-3">
                            {pick ? (
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                getTeamPickStyling(pick, game)
                              }`}>
                                {getTeamNickname(pick)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">No Pick</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
            }
          </div>
        )}

        {/* Mobile Member Selection Prompt */}
        {recapData && !loading && isMobile && mobileView === 'member' && !selectedMember && (
          <div className="md:hidden bg-white shadow rounded-lg p-8 text-center">
            <div className="text-gray-500">
              <div className="text-lg mb-2">👆</div>
              <div>Select a member above to view their picks</div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          
          .print\\:text-xl {
            font-size: 1.25rem !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:p-2 {
            padding: 0.5rem !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default RecapPage;