import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';

const RulesPage = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* The Game Section */}
        <div className="bg-gray-800 text-white rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">The Game</h2>
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="space-y-4 text-gray-200 leading-relaxed">
              <p>
                Each week on ThePool website, there will be a page displaying all games for that week. This 
                includes the favored team, the underdog team, and the point spread taken from Tuesday 
                morning's Vegas line. All spreads that are even numbers will have a half-point added to them to 
                eliminate tie games.
              </p>
              
              <p>
                You must pick a winner for every game and provide the total points (sum of both teams' 
                scores) for the Monday night game. The Monday night total is used only in case of a tie for 
                most games won that week. In that case, the player closest to the correct score will win that 
                week's prize. If both players have an equal difference, the prize will be split.
              </p>
              
              <p>
                Prizes are awarded to weekly winners, and weekly wins are totaled with prizes given to the top 
                finishers at the end of the season. Additionally, each player receives a square in the square 
                pools during the post-season. Last season we had two weekly winners (1st and 2nd place) and 
                gave season-end prizes to 1st, 2nd, 3rd, 4th, 5th, and 50th place finishers.
              </p>
            </div>
          </div>
        </div>

        {/* The Rules Section */}
        <div className="bg-gray-800 text-white rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">The Rules</h2>
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <p className="text-white font-bold mb-4">
                  You must submit your picks every week. All picks must be submitted before game time.
                </p>
              </div>
              
              <div>
                <h3 className="text-green-400 text-xl font-bold mb-3">Thursday Games</h3>
                <p className="text-gray-200">
                  All picks must be submitted before Thursday's games start. At that time we close the picks and 
                  then reopen them after the Thursday games, usually early Friday morning.
                </p>
              </div>
              
              <div>
                <h3 className="text-green-400 text-xl font-bold mb-3">Saturday Games</h3>
                <p className="text-gray-200">
                  If there is a Saturday game, all your picks must be submitted before Saturday's game time. The 
                  picks will not be reopened between Saturday and Sunday's games.
                </p>
              </div>
              
              <div>
                <h3 className="text-green-400 text-xl font-bold mb-3">Missed Deadlines</h3>
                <div className="bg-red-800 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-center font-bold">
                    If picks are not submitted by the deadline, all games missed will be counted as 
                    losses. Picks are considered submitted when you visit ThePool website and 
                    submit your picks online. Emails are not accepted.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-green-400 text-xl font-bold mb-3">Pick Recap</h3>
                <p className="text-gray-200">
                  At game time on ThePool website, there will be a recap of all players' picks for that week.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cost and Entry Section */}
        <div className="bg-gray-800 text-white rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">Cost and Entry</h2>
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="bg-green-700 rounded-lg p-6 inline-block">
                <div className="text-4xl font-bold text-green-300 mb-2">$200</div>
                <div className="text-green-200">Per player for the entire year</div>
              </div>
            </div>
            
            <div className="space-y-4 text-gray-200">
              <p className="font-bold">This includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chances to win in the 18 regular season games</li>
                <li>Prizes for the top finishers at the end of the season</li>
                <li>A square in 7 post-season square pools</li>
              </ul>
              
              <p className="mt-6">
                The exact breakdown of prizes for all games will be decided when the final number of players is 
                determined.
              </p>
              
              <div className="bg-cyan-800 border-l-4 border-cyan-400 p-4 rounded mt-6">
                <p className="text-center font-bold text-cyan-200">
                  The first 100 players to pay are in; all others must watch from the sidelines.
                </p>
              </div>
              
              <div className="bg-yellow-700 border border-yellow-500 rounded-lg p-4 mt-6">
                <p className="text-center italic text-yellow-200">
                  Now get ready to play the most exciting and depressing, the most exhilarating and 
                  frustrating game designed by modern man.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payoffs Section */}
        <div className="bg-gray-800 text-white rounded-lg p-6 mb-6">
          <h2 className="text-3xl font-bold text-cyan-400 text-center mb-6">Payoffs (Based on 100 Players)</h2>
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="space-y-8">
              {/* Regular Season */}
              <div className="bg-yellow-700 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-green-400 text-2xl font-bold mb-4">Regular Season</h3>
                
                <div className="mb-6">
                  <h4 className="text-yellow-200 text-lg font-bold mb-3">Weekly Prizes</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-600 rounded-lg p-4 text-center">
                      <div className="font-bold text-white mb-1">1st Place</div>
                      <div className="text-2xl font-bold text-yellow-300">$450</div>
                    </div>
                    <div className="bg-gray-600 rounded-lg p-4 text-center">
                      <div className="font-bold text-white mb-1">2nd Place</div>
                      <div className="text-2xl font-bold text-yellow-300">$200</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-yellow-200 text-lg font-bold mb-3">End of Season</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-gray-600 rounded-lg p-3 text-center">
                      <div className="font-bold text-white text-sm">1st Place</div>
                      <div className="text-lg font-bold text-yellow-300">$1,700</div>
                    </div>
                    <div className="bg-gray-600 rounded-lg p-3 text-center">
                      <div className="font-bold text-white text-sm">2nd Place</div>
                      <div className="text-lg font-bold text-yellow-300">$1,000</div>
                    </div>
                    <div className="bg-gray-600 rounded-lg p-3 text-center">
                      <div className="font-bold text-white text-sm">3rd Place</div>
                      <div className="text-lg font-bold text-yellow-300">$750</div>
                    </div>
                    <div className="bg-gray-600 rounded-lg p-3 text-center">
                      <div className="font-bold text-white text-sm">4th Place</div>
                      <div className="text-lg font-bold text-yellow-300">$400</div>
                    </div>
                    <div className="bg-gray-600 rounded-lg p-3 text-center">
                      <div className="font-bold text-white text-sm">5th Place</div>
                      <div className="text-lg font-bold text-yellow-300">$200</div>
                    </div>
                    <div className="bg-gray-600 rounded-lg p-3 text-center">
                      <div className="font-bold text-white text-sm">50th Place</div>
                      <div className="text-lg font-bold text-yellow-300">$200</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Post Season */}
              <div className="bg-yellow-700 border border-yellow-500 rounded-lg p-6">
                <h3 className="text-green-400 text-2xl font-bold mb-4">Post Season (Square Pools)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-600 rounded-lg p-4 text-center">
                    <div className="font-bold text-white mb-1">Wildcard Weekend</div>
                    <div className="text-xl font-bold text-yellow-300">$200 each</div>
                    <div className="text-xs text-gray-300">(2 games final score)</div>
                  </div>
                  <div className="bg-gray-600 rounded-lg p-4 text-center">
                    <div className="font-bold text-white mb-1">Divisional Weekend</div>
                    <div className="text-xl font-bold text-yellow-300">$300 each</div>
                    <div className="text-xs text-gray-300">(2 games final score)</div>
                  </div>
                  <div className="bg-gray-600 rounded-lg p-4 text-center">
                    <div className="font-bold text-white mb-1">Championship Weekend</div>
                    <div className="text-xl font-bold text-yellow-300">$350 each</div>
                    <div className="text-xs text-gray-300">(2 games final score)</div>
                  </div>
                  <div className="bg-yellow-600 rounded-lg p-4 text-center">
                    <div className="font-bold text-black mb-1">Super Bowl Game</div>
                    <div className="text-xl font-bold text-black">$500 each</div>
                    <div className="text-xs text-gray-800">(2 winners: halftime and final score)</div>
                    <div className="text-sm font-bold text-black mt-1">$1,000 total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;