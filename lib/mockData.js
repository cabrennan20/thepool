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
      1: 'New England Patriots',
      2: 'Kansas City Chiefs', 
      3: 'Dallas Cowboys',
      4: 'Green Bay Packers',
      5: 'Seattle Seahawks'
    },
    tiebreaker_points: 45
  },
  {
    user_id: 2,
    alias: 'Upset Queen',
    username: 'jane_smith',
    picks: {
      1: 'Miami Dolphins',
      2: 'Kansas City Chiefs',
      3: 'Dallas Cowboys', 
      4: 'Minnesota Vikings',
      5: 'Seattle Seahawks'
    },
    tiebreaker_points: 41
  },
  {
    user_id: 3,
    alias: 'Lucky Mike',
    username: 'mike_jones',
    picks: {
      1: 'New England Patriots',
      2: 'Buffalo Bills',
      3: 'Dallas Cowboys',
      4: 'Green Bay Packers',
      5: 'Los Angeles Rams'
    },
    tiebreaker_points: 38
  },
  {
    user_id: 4,
    alias: 'Wildcard',
    username: 'sarah_wilson',
    picks: {
      1: 'Miami Dolphins',
      2: 'Kansas City Chiefs',
      3: 'San Francisco 49ers',
      4: 'Minnesota Vikings',
      5: 'Seattle Seahawks'
    },
    tiebreaker_points: 42
  },
  {
    user_id: 5,
    alias: 'The Hammer',
    username: 'bob_garcia',
    picks: {
      1: 'New England Patriots',
      2: 'Buffalo Bills',
      3: 'San Francisco 49ers',
      4: 'Green Bay Packers',
      5: 'Los Angeles Rams'
    },
    tiebreaker_points: 39
  },
  {
    user_id: 6,
    alias: 'Ice Cold',
    username: 'lisa_chen',
    picks: {
      1: 'Miami Dolphins',
      2: 'Buffalo Bills',
      3: 'San Francisco 49ers',
      4: 'Minnesota Vikings',
      5: 'Los Angeles Rams'
    },
    tiebreaker_points: 44
  },
  {
    user_id: 7,
    alias: 'Underdog',
    username: 'david_brown',
    picks: {
      1: 'Miami Dolphins',
      2: 'Buffalo Bills',
      3: 'San Francisco 49ers',
      4: 'Minnesota Vikings',
      5: 'Los Angeles Rams'
    },
    tiebreaker_points: 37
  },
  {
    user_id: 8,
    alias: 'The Sage',
    username: 'emily_davis',
    picks: {
      1: 'Miami Dolphins',
      2: 'Buffalo Bills',
      3: 'San Francisco 49ers',
      4: 'Minnesota Vikings',
      5: 'Seattle Seahawks'
    },
    tiebreaker_points: 43
  }
];

// Mock pick percentages
export const mockPickPercentages = {
  1: {
    total_picks: 8,
    home_team_picks: 4,
    away_team_picks: 4,
    home_team_percentage: 50.0,
    away_team_percentage: 50.0,
    home_team: 'New England Patriots',
    away_team: 'Miami Dolphins',
    is_upset: false,
    winner: 'New England Patriots'
  },
  2: {
    total_picks: 8,
    home_team_picks: 3,
    away_team_picks: 5,
    home_team_percentage: 37.5,
    away_team_percentage: 62.5,
    home_team: 'Kansas City Chiefs',
    away_team: 'Buffalo Bills',
    is_upset: false,
    winner: 'Kansas City Chiefs'
  },
  3: {
    total_picks: 8,
    home_team_picks: 2,
    away_team_picks: 6,
    home_team_percentage: 25.0,
    away_team_percentage: 75.0,
    home_team: 'San Francisco 49ers',
    away_team: 'Dallas Cowboys',
    is_upset: true,
    winner: 'Dallas Cowboys'
  },
  4: {
    total_picks: 8,
    home_team_picks: 4,
    away_team_picks: 4,
    home_team_percentage: 50.0,
    away_team_percentage: 50.0,
    home_team: 'Green Bay Packers',
    away_team: 'Minnesota Vikings',
    is_upset: false,
    winner: 'Green Bay Packers'
  },
  5: {
    total_picks: 8,
    home_team_picks: 3,
    away_team_picks: 5,
    home_team_percentage: 37.5,
    away_team_percentage: 62.5,
    home_team: 'Los Angeles Rams',
    away_team: 'Seattle Seahawks',
    is_upset: false,
    winner: 'Seattle Seahawks'
  }
};

// Mock recap response
export const mockRecapResponse = {
  week: 1,
  season: 2025,
  picks_closed: true,
  games: mockGames,
  final_game: mockGames[4], // Last game as tiebreaker
  recap_data: mockRecapData,
  pick_percentages: mockPickPercentages,
  total_users: 8,
  total_games: 5
};

// Mock available weeks
export const mockAvailableWeeks = {
  season: 2025,
  weeks: [
    {
      week: 1,
      first_game_date: '2025-09-07T13:00:00Z',
      last_game_date: '2025-09-09T20:15:00Z',
      game_count: 5,
      completed_games: 5,
      picks_closed: true,
      recap_available: true
    }
  ]
};