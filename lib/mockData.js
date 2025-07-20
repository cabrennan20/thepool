// Mock data for ThePool app when backend is not available
// Mock data types removed - using plain JavaScript objects

// Mock users data
export const mockUsers = [
  { user_id: 1, username: 'john_doe', alias: 'The Prophet', first_name: 'John', last_name: 'Doe', is_admin: false },
  { user_id: 2, username: 'jane_smith', alias: 'Upset Queen', first_name: 'Jane', last_name: 'Smith', is_admin: false },
  { user_id: 3, username: 'mike_jones', alias: 'Lucky Mike', first_name: 'Mike', last_name: 'Jones', is_admin: false },
  { user_id: 4, username: 'sarah_wilson', alias: 'Wildcard', first_name: 'Sarah', last_name: 'Wilson', is_admin: false },
  { user_id: 5, username: 'bob_garcia', alias: 'The Hammer', first_name: 'Bob', last_name: 'Garcia', is_admin: false },
  { user_id: 6, username: 'lisa_chen', alias: 'Ice Cold', first_name: 'Lisa', last_name: 'Chen', is_admin: false },
  { user_id: 7, username: 'david_brown', alias: 'Underdog', first_name: 'David', last_name: 'Brown', is_admin: false },
  { user_id: 8, username: 'emily_davis', alias: 'The Sage', first_name: 'Emily', last_name: 'Davis', is_admin: false },
];

// Mock games data - 2025 NFL Week 1 REAL schedule (16 games)
export const mockGames = [
  // Thursday Night Football - Season Opener
  {
    game_id: 1,
    season: 2025,
    week: 1,
    game_date: '2025-09-04T20:20:00Z', // 8:20 PM ET
    home_team: 'Philadelphia Eagles',
    away_team: 'Dallas Cowboys',
    home_score: undefined,
    away_score: undefined,
    spread: -7,
    game_status: 'scheduled'
  },
  
  // Friday Night Football - International Game in Brazil
  {
    game_id: 2,
    season: 2025,
    week: 1,
    game_date: '2025-09-05T20:00:00Z', // 8:00 PM ET
    home_team: 'Los Angeles Chargers',
    away_team: 'Kansas City Chiefs',
    home_score: undefined,
    away_score: undefined,
    spread: 2.5,
    game_status: 'scheduled'
  },
  
  // Sunday Early Games (1:00 PM ET)
  {
    game_id: 3,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'Atlanta Falcons',
    away_team: 'Tampa Bay Buccaneers',
    home_score: undefined,
    away_score: undefined,
    spread: 2,
    game_status: 'scheduled'
  },
  {
    game_id: 4,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'Cleveland Browns',
    away_team: 'Cincinnati Bengals',
    home_score: undefined,
    away_score: undefined,
    spread: 5.5,
    game_status: 'scheduled'
  },
  {
    game_id: 5,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'Indianapolis Colts',
    away_team: 'Miami Dolphins',
    home_score: undefined,
    away_score: undefined,
    spread: -1,
    game_status: 'scheduled'
  },
  {
    game_id: 6,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'New England Patriots',
    away_team: 'Las Vegas Raiders',
    home_score: undefined,
    away_score: undefined,
    spread: -3,
    game_status: 'scheduled'
  },
  {
    game_id: 7,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'New Orleans Saints',
    away_team: 'Arizona Cardinals',
    home_score: undefined,
    away_score: undefined,
    spread: 5.5,
    game_status: 'scheduled'
  },
  {
    game_id: 8,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'New York Jets',
    away_team: 'Pittsburgh Steelers',
    home_score: undefined,
    away_score: undefined,
    spread: 3,
    game_status: 'scheduled'
  },
  {
    game_id: 9,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'Washington Commanders',
    away_team: 'New York Giants',
    home_score: undefined,
    away_score: undefined,
    spread: -6.5,
    game_status: 'scheduled'
  },
  {
    game_id: 10,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T17:00:00Z',
    home_team: 'Jacksonville Jaguars',
    away_team: 'Carolina Panthers',
    home_score: undefined,
    away_score: undefined,
    spread: -3,
    game_status: 'scheduled'
  },
  
  // Sunday Late Games (4:05/4:25 PM ET)
  {
    game_id: 11,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T20:05:00Z',
    home_team: 'Denver Broncos',
    away_team: 'Tennessee Titans',
    home_score: undefined,
    away_score: undefined,
    spread: -8,
    game_status: 'scheduled'
  },
  {
    game_id: 12,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T20:05:00Z',
    home_team: 'Seattle Seahawks',
    away_team: 'San Francisco 49ers',
    home_score: undefined,
    away_score: undefined,
    spread: 3.5,
    game_status: 'scheduled'
  },
  {
    game_id: 13,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T20:25:00Z',
    home_team: 'Detroit Lions',
    away_team: 'Los Angeles Rams',
    home_score: undefined,
    away_score: undefined,
    spread: -4,
    game_status: 'scheduled'
  },
  {
    game_id: 14,
    season: 2025,
    week: 1,
    game_date: '2025-09-07T20:25:00Z',
    home_team: 'Green Bay Packers',
    away_team: 'Minnesota Vikings',
    home_score: undefined,
    away_score: undefined,
    spread: -2.5,
    game_status: 'scheduled'
  },
  
  // Sunday Night Football
  {
    game_id: 15,
    season: 2025,
    week: 1,
    game_date: '2025-09-08T00:20:00Z', // 8:20 PM ET
    home_team: 'Buffalo Bills',
    away_team: 'Baltimore Ravens',
    home_score: undefined,
    away_score: undefined,
    spread: -2.5,
    game_status: 'scheduled'
  },
  
  // Monday Night Football
  {
    game_id: 16,
    season: 2025,
    week: 1,
    game_date: '2025-09-09T00:15:00Z', // 8:15 PM ET
    home_team: 'Houston Texans',
    away_team: 'Chicago Bears',
    home_score: undefined,
    away_score: undefined,
    spread: -6,
    game_status: 'scheduled'
  }
];

// Mock weekly scores
export const mockWeeklyScores = [
  {
    user_id: 1,
    username: 'john_doe',
    alias: 'The Prophet',
    week: 1,
    correct_picks: 4,
    total_picks: 5,
    win_percentage: 80.0,
    weekly_rank: 1
  },
  {
    user_id: 2,
    username: 'jane_smith',
    alias: 'Upset Queen',
    week: 1,
    correct_picks: 3,
    total_picks: 5,
    win_percentage: 60.0,
    weekly_rank: 2
  },
  {
    user_id: 3,
    username: 'mike_jones',
    alias: 'Lucky Mike',
    week: 1,
    correct_picks: 3,
    total_picks: 5,
    win_percentage: 60.0,
    weekly_rank: 3
  },
  {
    user_id: 4,
    username: 'sarah_wilson',
    alias: 'Wildcard',
    week: 1,
    correct_picks: 2,
    total_picks: 5,
    win_percentage: 40.0,
    weekly_rank: 4
  },
  {
    user_id: 5,
    username: 'bob_garcia',
    alias: 'The Hammer',
    week: 1,
    correct_picks: 2,
    total_picks: 5,
    win_percentage: 40.0,
    weekly_rank: 5
  },
  {
    user_id: 6,
    username: 'lisa_chen',
    alias: 'Ice Cold',
    week: 1,
    correct_picks: 1,
    total_picks: 5,
    win_percentage: 20.0,
    weekly_rank: 6
  },
  {
    user_id: 7,
    username: 'david_brown',
    alias: 'Underdog',
    week: 1,
    correct_picks: 1,
    total_picks: 5,
    win_percentage: 20.0,
    weekly_rank: 7
  },
  {
    user_id: 8,
    username: 'emily_davis',
    alias: 'The Sage',
    week: 1,
    correct_picks: 1,
    total_picks: 5,
    win_percentage: 20.0,
    weekly_rank: 8
  }
];

// Mock recap data
export const mockRecapData = [
  {
    user_id: 1,
    alias: 'The Prophet',
    username: 'john_doe',
    picks: {
      1: 'Philadelphia Eagles',    // Favored -7, most will pick PHI
      2: 'Kansas City Chiefs',     // Road favorite +2.5, split picks
      3: 'Tampa Bay Buccaneers',   // Road favorite +2, close game
      4: 'Cincinnati Bengals',     // Road favorite +5.5
      5: 'Miami Dolphins',         // Road favorite, close spread -1
      6: 'New England Patriots',   // Home favorite -3
      7: 'New Orleans Saints',     // Home favorite -5.5
      8: 'Pittsburgh Steelers',    // Road favorite +3
      9: 'Washington Commanders',  // Home favorite -6.5
      10: 'Jacksonville Jaguars',  // Home favorite -3
      11: 'Denver Broncos',        // Home favorite -8
      12: 'San Francisco 49ers',   // Road favorite +3.5
      13: 'Detroit Lions',         // Home favorite -4
      14: 'Green Bay Packers',     // Home favorite -2.5
      15: 'Buffalo Bills',         // Home favorite -2.5
      16: 'Houston Texans'         // Home favorite -6
    },
    tiebreaker_points: 45
  },
  {
    user_id: 2,
    alias: 'Upset Queen',
    username: 'jane_smith',
    picks: {
      1: 'Dallas Cowboys',         // Upset pick - taking underdog
      2: 'Los Angeles Chargers',   // Taking home underdog
      3: 'Atlanta Falcons',        // Taking home underdog
      4: 'Cleveland Browns',       // Taking home underdog
      5: 'Indianapolis Colts',     // Taking home dog
      6: 'Las Vegas Raiders',      // Upset - taking road dog
      7: 'Arizona Cardinals',      // Upset - taking road dog
      8: 'New York Jets',          // Taking home underdog
      9: 'New York Giants',        // Upset - taking road dog
      10: 'Carolina Panthers',     // Upset - taking road dog
      11: 'Tennessee Titans',      // Upset - taking road dog
      12: 'Seattle Seahawks',      // Taking home dog
      13: 'Los Angeles Rams',      // Taking road dog
      14: 'Minnesota Vikings',     // Taking road dog
      15: 'Baltimore Ravens',      // Taking road dog
      16: 'Chicago Bears'          // Upset - taking road dog
    },
    tiebreaker_points: 41
  },
  {
    user_id: 3,
    alias: 'Lucky Mike',
    username: 'mike_jones',
    picks: {
      1: 'Philadelphia Eagles',
      2: 'Kansas City Chiefs',
      3: 'Tampa Bay Buccaneers',
      4: 'Cincinnati Bengals',
      5: 'Miami Dolphins',
      6: 'New England Patriots',
      7: 'New Orleans Saints',
      8: 'New York Jets',          // Taking home dog
      9: 'Washington Commanders',
      10: 'Jacksonville Jaguars',
      11: 'Denver Broncos',
      12: 'San Francisco 49ers',
      13: 'Detroit Lions',
      14: 'Minnesota Vikings',     // Taking road dog
      15: 'Buffalo Bills',
      16: 'Houston Texans'
    },
    tiebreaker_points: 38
  },
  {
    user_id: 4,
    alias: 'Wildcard',
    username: 'sarah_wilson',
    picks: {
      1: 'Philadelphia Eagles',
      2: 'Los Angeles Chargers',   // Home dog
      3: 'Atlanta Falcons',        // Home dog
      4: 'Cincinnati Bengals',
      5: 'Indianapolis Colts',     // Home dog
      6: 'New England Patriots',
      7: 'New Orleans Saints',
      8: 'Pittsburgh Steelers',
      9: 'Washington Commanders',
      10: 'Carolina Panthers',     // Road dog upset
      11: 'Denver Broncos',
      12: 'Seattle Seahawks',      // Home dog
      13: 'Detroit Lions',
      14: 'Green Bay Packers',
      15: 'Baltimore Ravens',      // Road dog
      16: 'Houston Texans'
    },
    tiebreaker_points: 52
  },
  {
    user_id: 5,
    alias: 'The Hammer',
    username: 'bob_garcia',
    picks: {
      1: 'Philadelphia Eagles',
      2: 'Kansas City Chiefs',
      3: 'Tampa Bay Buccaneers',
      4: 'Cleveland Browns',       // Home dog
      5: 'Miami Dolphins',
      6: 'Las Vegas Raiders',      // Road dog upset
      7: 'New Orleans Saints',
      8: 'Pittsburgh Steelers',
      9: 'Washington Commanders',
      10: 'Jacksonville Jaguars',
      11: 'Denver Broncos',
      12: 'San Francisco 49ers',
      13: 'Los Angeles Rams',      // Road dog
      14: 'Green Bay Packers',
      15: 'Buffalo Bills',
      16: 'Chicago Bears'          // Road dog upset
    },
    tiebreaker_points: 44
  },
  {
    user_id: 6,
    alias: 'Ice Cold',
    username: 'lisa_chen',
    picks: {
      1: 'Dallas Cowboys',         // Road dog upset
      2: 'Kansas City Chiefs',
      3: 'Tampa Bay Buccaneers',
      4: 'Cincinnati Bengals',
      5: 'Indianapolis Colts',     // Home dog
      6: 'New England Patriots',
      7: 'Arizona Cardinals',      // Road dog upset
      8: 'New York Jets',          // Home dog
      9: 'New York Giants',        // Road dog upset
      10: 'Jacksonville Jaguars',
      11: 'Tennessee Titans',      // Road dog upset
      12: 'Seattle Seahawks',      // Home dog
      13: 'Detroit Lions',
      14: 'Minnesota Vikings',     // Road dog
      15: 'Buffalo Bills',
      16: 'Houston Texans'
    },
    tiebreaker_points: 39
  },
  {
    user_id: 7,
    alias: 'Underdog',
    username: 'david_brown',
    picks: {
      1: 'Philadelphia Eagles',
      2: 'Los Angeles Chargers',   // Home dog
      3: 'Atlanta Falcons',        // Home dog
      4: 'Cincinnati Bengals',
      5: 'Miami Dolphins',
      6: 'New England Patriots',
      7: 'New Orleans Saints',
      8: 'Pittsburgh Steelers',
      9: 'Washington Commanders',
      10: 'Jacksonville Jaguars',
      11: 'Denver Broncos',
      12: 'San Francisco 49ers',
      13: 'Detroit Lions',
      14: 'Green Bay Packers',
      15: 'Baltimore Ravens',      // Road dog
      16: 'Houston Texans'
    },
    tiebreaker_points: 47
  },
  {
    user_id: 8,
    alias: 'The Sage',
    username: 'emily_davis',
    picks: {
      1: 'Philadelphia Eagles',
      2: 'Kansas City Chiefs',
      3: 'Tampa Bay Buccaneers',
      4: 'Cincinnati Bengals',
      5: 'Miami Dolphins',
      6: 'New England Patriots',
      7: 'New Orleans Saints',
      8: 'Pittsburgh Steelers',
      9: 'Washington Commanders',
      10: 'Jacksonville Jaguars',
      11: 'Denver Broncos',
      12: 'San Francisco 49ers',
      13: 'Detroit Lions',
      14: 'Green Bay Packers',
      15: 'Buffalo Bills',
      16: 'Houston Texans'
    },
    tiebreaker_points: 42
  }
];

// Mock pick percentages
export const mockPickPercentages = {
  1: {
    total_picks: 8,
    home_team_picks: 6,  // PHI: Prophet, Mike, Wildcard, Hammer, Underdog, Sage
    away_team_picks: 2,  // DAL: Upset Queen, Ice Cold
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'Philadelphia Eagles',
    away_team: 'Dallas Cowboys',
    is_upset: false
  },
  2: {
    total_picks: 8,
    home_team_picks: 3,  // LAC: Upset Queen, Wildcard, Underdog
    away_team_picks: 5,  // KC: Prophet, Mike, Hammer, Ice Cold, Sage
    home_team_percentage: 38,
    away_team_percentage: 62,
    home_team: 'Los Angeles Chargers',
    away_team: 'Kansas City Chiefs',
    is_upset: false
  },
  3: {
    total_picks: 8,
    home_team_picks: 3,  // ATL: Upset Queen, Wildcard, Underdog
    away_team_picks: 5,  // TB: Prophet, Mike, Hammer, Ice Cold, Sage
    home_team_percentage: 38,
    away_team_percentage: 62,
    home_team: 'Atlanta Falcons',
    away_team: 'Tampa Bay Buccaneers',
    is_upset: false
  },
  4: {
    total_picks: 8,
    home_team_picks: 2,  // CLE: Upset Queen, Hammer
    away_team_picks: 6,  // CIN: Prophet, Mike, Wildcard, Underdog, Ice Cold, Sage
    home_team_percentage: 25,
    away_team_percentage: 75,
    home_team: 'Cleveland Browns',
    away_team: 'Cincinnati Bengals',
    is_upset: false
  },
  5: {
    total_picks: 8,
    home_team_picks: 3,  // IND: Upset Queen, Wildcard, Ice Cold
    away_team_picks: 5,  // MIA: Prophet, Mike, Hammer, Underdog, Sage
    home_team_percentage: 38,
    away_team_percentage: 62,
    home_team: 'Indianapolis Colts',
    away_team: 'Miami Dolphins',
    is_upset: false
  },
  6: {
    total_picks: 8,
    home_team_picks: 6,  // NE: Prophet, Mike, Wildcard, Underdog, Ice Cold, Sage
    away_team_picks: 2,  // LV: Upset Queen, Hammer
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'New England Patriots',
    away_team: 'Las Vegas Raiders',
    is_upset: false
  },
  7: {
    total_picks: 8,
    home_team_picks: 6,  // NO: Prophet, Mike, Wildcard, Hammer, Underdog, Sage
    away_team_picks: 2,  // ARI: Upset Queen, Ice Cold
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'New Orleans Saints',
    away_team: 'Arizona Cardinals',
    is_upset: false
  },
  8: {
    total_picks: 8,
    home_team_picks: 3,  // NYJ: Upset Queen, Mike, Ice Cold
    away_team_picks: 5,  // PIT: Prophet, Wildcard, Hammer, Underdog, Sage
    home_team_percentage: 38,
    away_team_percentage: 62,
    home_team: 'New York Jets',
    away_team: 'Pittsburgh Steelers',
    is_upset: false
  },
  9: {
    total_picks: 8,
    home_team_picks: 6,  // WAS: Prophet, Mike, Wildcard, Hammer, Underdog, Sage
    away_team_picks: 2,  // NYG: Upset Queen, Ice Cold
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'Washington Commanders',
    away_team: 'New York Giants',
    is_upset: false
  },
  10: {
    total_picks: 8,
    home_team_picks: 6,  // JAX: Prophet, Mike, Wildcard, Hammer, Underdog, Ice Cold, Sage
    away_team_picks: 2,  // CAR: Upset Queen, Wildcard
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'Jacksonville Jaguars',
    away_team: 'Carolina Panthers',
    is_upset: false
  },
  11: {
    total_picks: 8,
    home_team_picks: 6,  // DEN: Prophet, Mike, Wildcard, Hammer, Underdog, Sage
    away_team_picks: 2,  // TEN: Upset Queen, Ice Cold
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'Denver Broncos',
    away_team: 'Tennessee Titans',
    is_upset: false
  },
  12: {
    total_picks: 8,
    home_team_picks: 3,  // SEA: Upset Queen, Wildcard, Ice Cold
    away_team_picks: 5,  // SF: Prophet, Mike, Hammer, Underdog, Sage
    home_team_percentage: 38,
    away_team_percentage: 62,
    home_team: 'Seattle Seahawks',
    away_team: 'San Francisco 49ers',
    is_upset: false
  },
  13: {
    total_picks: 8,
    home_team_picks: 6,  // DET: Prophet, Mike, Wildcard, Underdog, Ice Cold, Sage
    away_team_picks: 2,  // LAR: Upset Queen, Hammer
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'Detroit Lions',
    away_team: 'Los Angeles Rams',
    is_upset: false
  },
  14: {
    total_picks: 8,
    home_team_picks: 5,  // GB: Prophet, Wildcard, Hammer, Underdog, Sage
    away_team_picks: 3,  // MIN: Upset Queen, Mike, Ice Cold
    home_team_percentage: 62,
    away_team_percentage: 38,
    home_team: 'Green Bay Packers',
    away_team: 'Minnesota Vikings',
    is_upset: false
  },
  15: {
    total_picks: 8,
    home_team_picks: 6,  // BUF: Prophet, Mike, Hammer, Underdog, Ice Cold, Sage
    away_team_picks: 2,  // BAL: Upset Queen, Wildcard
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'Buffalo Bills',
    away_team: 'Baltimore Ravens',
    is_upset: false
  },
  16: {
    total_picks: 8,
    home_team_picks: 6,  // HOU: Prophet, Mike, Wildcard, Underdog, Ice Cold, Sage
    away_team_picks: 2,  // CHI: Upset Queen, Hammer
    home_team_percentage: 75,
    away_team_percentage: 25,
    home_team: 'Houston Texans',
    away_team: 'Chicago Bears',
    is_upset: false
  }
};

// Mock recap response
export const mockRecapResponse = {
  week: 1,
  season: 2025,
  picks_closed: true,
  games: mockGames,
  final_game: mockGames[15], // Monday Night Football as tiebreaker
  recap_data: mockRecapData,
  pick_percentages: mockPickPercentages,
  total_users: 8,
  total_games: 16
};

// Mock available weeks
export const mockAvailableWeeks = {
  season: 2025,
  weeks: [
    {
      week: 1,
      first_game_date: '2025-09-04T20:20:00Z',
      last_game_date: '2025-09-09T00:15:00Z',
      game_count: 16,
      completed_games: 16,
      picks_closed: true,
      recap_available: true
    }
  ]
};