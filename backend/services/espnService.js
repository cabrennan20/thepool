const axios = require('axios');

class ESPNService {
  constructor() {
    this.baseURL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
  }

  // Fetch current NFL scoreboard
  async getScoreboard() {
    try {
      const response = await axios.get(`${this.baseURL}/scoreboard`);
      return this.formatScoreboardData(response.data);
    } catch (error) {
      console.error('ESPN API Error:', error.message);
      throw new Error('Failed to fetch live scores from ESPN');
    }
  }

  // Fetch specific week's games
  async getWeekGames(week = 1, season = 2025) {
    try {
      const response = await axios.get(`${this.baseURL}/scoreboard`, {
        params: {
          seasontype: 2, // Regular season
          week: week,
          year: season
        }
      });
      return this.formatScoreboardData(response.data);
    } catch (error) {
      console.error('ESPN API Error:', error.message);
      throw new Error(`Failed to fetch Week ${week} games from ESPN`);
    }
  }

  // Format ESPN API response to match our game data structure
  formatScoreboardData(data) {
    if (!data || !data.events) {
      return [];
    }

    return data.events.map(event => {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find(team => team.homeAway === 'home');
      const awayTeam = competition.competitors.find(team => team.homeAway === 'away');
      
      // Extract venue and broadcast info
      const venue = competition.venue || {};
      const broadcast = competition.broadcasts?.[0] || {};
      
      // Extract odds if available
      const odds = competition.odds?.[0] || {};
      
      // Format game status
      const status = this.formatGameStatus(competition.status);
      
      return {
        espn_id: event.id,
        game_id: event.id, // Use as fallback ID
        name: event.name, // e.g., "Los Angeles Chargers at Detroit Lions"
        short_name: event.shortName, // e.g., "LAC @ DET"
        
        // Team information
        home_team: homeTeam.team.displayName,
        home_team_abbr: homeTeam.team.abbreviation,
        home_team_logo: homeTeam.team.logo,
        home_team_color: homeTeam.team.color,
        home_score: parseInt(homeTeam.score) || 0,
        
        away_team: awayTeam.team.displayName,
        away_team_abbr: awayTeam.team.abbreviation,
        away_team_logo: awayTeam.team.logo,
        away_team_color: awayTeam.team.color,
        away_score: parseInt(awayTeam.score) || 0,
        
        // Game timing
        game_date: event.date,
        game_status: status.type,
        game_status_detail: status.detail,
        clock: status.clock,
        period: status.period,
        
        // Venue information
        venue: venue.fullName,
        venue_city: `${venue.address?.city}, ${venue.address?.state}`,
        
        // Betting information
        spread: odds.spread ? parseFloat(odds.spread) : null,
        over_under: odds.overUnder ? parseFloat(odds.overUnder) : null,
        
        // Broadcast information
        network: broadcast.names?.[0] || null,
        
        // Season info
        season: event.season?.year || 2025,
        week: event.week?.number || 1,
        season_type: event.season?.type || 2 // Regular season
      };
    });
  }

  // Format game status from ESPN format to our format
  formatGameStatus(espnStatus) {
    const statusType = espnStatus.type.name.toLowerCase();
    
    let type, detail, clock = null, period = null;
    
    switch (statusType) {
      case 'status_scheduled':
        type = 'scheduled';
        detail = 'Scheduled';
        break;
      case 'status_in_progress':
        type = 'in_progress';
        detail = espnStatus.type.description;
        clock = espnStatus.displayClock;
        period = espnStatus.period;
        break;
      case 'status_final':
        type = 'final';
        detail = 'Final';
        break;
      case 'status_postponed':
        type = 'postponed';
        detail = 'Postponed';
        break;
      case 'status_canceled':
        type = 'canceled';
        detail = 'Canceled';
        break;
      default:
        type = 'scheduled';
        detail = espnStatus.type.description || 'Scheduled';
    }
    
    return { type, detail, clock, period };
  }

  // Get team by abbreviation from ESPN data
  async getTeamInfo(teamAbbr) {
    try {
      const response = await axios.get(`${this.baseURL}/teams`);
      const teams = response.data.sports[0].leagues[0].teams;
      return teams.find(team => 
        team.team.abbreviation.toLowerCase() === teamAbbr.toLowerCase()
      );
    } catch (error) {
      console.error('ESPN Team API Error:', error.message);
      return null;
    }
  }

  // Check if ESPN API is available
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/scoreboard`, {
        timeout: 5000
      });
      return {
        available: true,
        status: response.status,
        message: 'ESPN API is available'
      };
    } catch (error) {
      return {
        available: false,
        status: error.response?.status || 0,
        message: error.message
      };
    }
  }
}

module.exports = new ESPNService();