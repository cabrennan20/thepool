import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import LoginForm from '../components/LoginForm';
import { api, type RecapResponse, type RecapWeek } from '../lib/api';

const RecapPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [recapData, setRecapData] = useState<RecapResponse | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<RecapWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedSeason, setSelectedSeason] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [filterGame, setFilterGame] = useState<number | null>(null);

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
      } catch (err: any) {
        setError(err.message || 'Failed to load recap data');
        setRecapData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecapData();
  }, [user, selectedWeek, selectedSeason]);

  const handleWeekChange = (week: number) => {
    setSelectedWeek(week);
    setFilterMember('');
    setFilterGame(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRecapData = recapData ? recapData.recap_data.filter(member => {
    if (filterMember && !member.alias.toLowerCase().includes(filterMember.toLowerCase())) {
      return false;
    }
    return true;
  }) : [];

  const filteredGames = recapData ? recapData.games.filter(game => {
    if (filterGame && game.game_id !== filterGame) {
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
              <select
                value={filterGame || ''}
                onChange={(e) => setFilterGame(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Games</option>
                {recapData.games.map(game => (
                  <option key={game.game_id} value={game.game_id}>
                    {game.away_team} @ {game.home_team}
                  </option>
                ))}
              </select>
            )}
            
            {(filterMember || filterGame) && (
              <button
                onClick={() => {
                  setFilterMember('');
                  setFilterGame(null);
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
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

        {/* Recap Grid */}
        {recapData && !loading && (
          <div className="bg-white shadow rounded-lg overflow-hidden print:shadow-none print:rounded-none">
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

            {/* Grid Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 print:text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Member
                    </th>
                    {filteredGames.map(game => (
                      <th key={game.game_id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[100px]">
                        <div className="space-y-1">
                          <div>{game.away_team}</div>
                          <div className="text-gray-400">@</div>
                          <div>{game.home_team}</div>
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
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiebreaker
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecapData.map((member, idx) => (
                    <tr key={member.user_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="sticky left-0 z-10 px-3 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 bg-inherit">
                        {member.alias}
                      </td>
                      {filteredGames.map(game => {
                        const pick = member.picks[game.game_id];
                        return (
                          <td key={game.game_id} className="px-2 py-4 text-sm text-center border-r border-gray-200">
                            {pick ? (
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                pick === game.home_team 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {pick}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">No Pick</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-4 text-sm text-center">
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