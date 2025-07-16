import React, { useEffect, useState } from 'react';
import { getAllTeams, getTeamHelmetLogo } from '../lib/teamHelmetLogos';

// NFLTeam object structure:
// {
//   abbreviation: team abbreviation (e.g., "KC", "DAL")
//   name: full team name (e.g., "Kansas City Chiefs")
//   helmetsLogo: URL to helmet logo image
// }

const TeamsDemo = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = getAllTeams();
        setTeams(teamsData);
      } catch (err) {
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">NFL Teams - Helmet Logos Demo</h1>
        
        {error && (
          <div className="text-red-600 mb-4">{error}</div>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">New Helmet Logo Integration</h2>
          <p className="text-gray-600 mb-4">
            Now using ESPN CDN for consistent, high-quality helmet logos across all interfaces.
          </p>
          <div className="flex items-center space-x-4">
            <img src={getTeamHelmetLogo('KC')} alt="Kansas City Chiefs" className="w-16 h-16 object-contain" />
            <img src={getTeamHelmetLogo('DAL')} alt="Dallas Cowboys" className="w-16 h-16 object-contain" />
            <img src={getTeamHelmetLogo('NE')} alt="New England Patriots" className="w-16 h-16 object-contain" />
            <img src={getTeamHelmetLogo('SF')} alt="San Francisco 49ers" className="w-16 h-16 object-contain" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teams.map((team) => (
            <div key={team.abbreviation} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src={team.helmetsLogo} 
                  alt={team.name}
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h3 className="font-bold text-lg">{team.abbreviation}</h3>
                  <p className="text-gray-600 text-sm">{team.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default TeamsDemo;