import React, { useEffect, useState } from 'react';
import { fetchNFLTeams, getTeamInfo } from '../lib/theSportsDbApi';

interface NFLTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  strLogo: string;
  strBadge: string;
  strStadium: string;
  strLocation: string;
}

const TeamsDemo: React.FC = () => {
  const [teams, setTeams] = useState<NFLTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testTeam, setTestTeam] = useState<any>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await fetchNFLTeams();
        setTeams(teamsData.slice(0, 10)); // Show first 10 teams
        
        // Test getting specific team info
        const dallasInfo = await getTeamInfo('Dallas Cowboys');
        setTestTeam(dallasInfo);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">NFL Teams - TheSportsDB Integration Demo</h1>
        
        {error && (
          <div className="text-red-600 mb-4">{error}</div>
        )}

        {testTeam && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Test Team Info: {testTeam.name}</h2>
            <div className="flex items-center space-x-4">
              <img src={testTeam.logo} alt={testTeam.name} className="w-16 h-16 object-contain" />
              <div>
                <p><strong>Short Name:</strong> {testTeam.shortName}</p>
                <p><strong>Stadium:</strong> {testTeam.stadium}</p>
                <p><strong>Location:</strong> {testTeam.location}</p>
                <p><strong>Founded:</strong> {testTeam.founded}</p>
                <p><strong>Colors:</strong> {testTeam.colors.primary}, {testTeam.colors.secondary}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.idTeam} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-4 mb-4">
                {team.strLogo && (
                  <img 
                    src={team.strLogo} 
                    alt={team.strTeam}
                    className="w-12 h-12 object-contain"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg">{team.strTeam}</h3>
                  <p className="text-gray-600">{team.strTeamShort}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <p><strong>Stadium:</strong> {team.strStadium}</p>
                <p><strong>Location:</strong> {team.strLocation}</p>
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