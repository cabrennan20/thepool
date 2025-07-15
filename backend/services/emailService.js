const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Configure your email provider here
      // This example uses Gmail, but you can use any SMTP provider
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
        },
      });

      // Verify connection
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        await this.transporter.verify();
        console.log('📧 Email service initialized successfully');
      } else {
        console.log('⚠️  Email service not configured (missing EMAIL_USER or EMAIL_PASSWORD)');
      }
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
    }
  }

  async sendPickReminder(user, games, deadline) {
    if (!this.transporter) {
      console.log('Email service not available');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const subject = `🏈 Reminder: Submit Your NFL Picks - Deadline Soon!`;
      
      const gamesList = games.map(game => 
        `• ${game.away_team} @ ${game.home_team} (${new Date(game.game_date).toLocaleString()})`
      ).join('\n');

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">🏈 THE POOL - Pick Reminder</h2>
          
          <p>Hi <strong>${user.alias}</strong>,</p>
          
          <p>This is a friendly reminder that your NFL picks are due soon!</p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">⏰ Deadline: ${new Date(deadline).toLocaleString()}</h3>
            <p style="margin: 0; color: #92400e;">Don't miss out - submit your picks now!</p>
          </div>
          
          <h3>This Week's Games:</h3>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
            <pre style="font-family: Arial, sans-serif; margin: 0; white-space: pre-wrap;">${gamesList}</pre>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/picks" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Submit Your Picks Now
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Good luck with your picks!<br>
            - The Pool Management Team
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            You're receiving this because you're a member of The Pool. 
            Pick reminders help ensure everyone submits their picks on time.
          </p>
        </div>
      `;

      const textContent = `
THE POOL - Pick Reminder

Hi ${user.alias},

This is a friendly reminder that your NFL picks are due soon!

⏰ DEADLINE: ${new Date(deadline).toLocaleString()}

This Week's Games:
${gamesList}

Submit your picks now: ${process.env.FRONTEND_URL}/picks

Good luck with your picks!
- The Pool Management Team
      `;

      const mailOptions = {
        from: {
          name: 'The Pool - NFL Picks',
          address: process.env.EMAIL_USER
        },
        to: user.email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Pick reminder sent to ${user.email} (${user.alias})`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send reminder to ${user.email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendWeeklyRecap(user, recapData, leaderboard) {
    if (!this.transporter) {
      console.log('Email service not available');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const subject = `🏈 Week ${recapData.week} Results & Leaderboard Update`;
      
      // Build leaderboard table
      const leaderboardRows = leaderboard.slice(0, 10).map((member, index) => 
        `${index + 1}. ${member.alias} - ${member.correct_picks}/${member.total_picks} (${member.win_percentage}%)`
      ).join('\n');

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">🏈 THE POOL - Week ${recapData.week} Results</h2>
          
          <p>Hi <strong>${user.alias}</strong>,</p>
          
          <p>Week ${recapData.week} is complete! Here are the results and updated standings.</p>
          
          <h3>📊 Top 10 Leaderboard</h3>
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
            <pre style="font-family: Arial, sans-serif; margin: 0; white-space: pre-wrap;">${leaderboardRows}</pre>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/recap?week=${recapData.week}" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">
              View Full Recap
            </a>
            <a href="${process.env.FRONTEND_URL}/leaderboard" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              View Leaderboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            Get ready for next week's games!<br>
            - The Pool Management Team
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            You're receiving this because you're a member of The Pool.
          </p>
        </div>
      `;

      const textContent = `
THE POOL - Week ${recapData.week} Results

Hi ${user.alias},

Week ${recapData.week} is complete! Here are the results and updated standings.

📊 TOP 10 LEADERBOARD:
${leaderboardRows}

View full recap: ${process.env.FRONTEND_URL}/recap?week=${recapData.week}
View leaderboard: ${process.env.FRONTEND_URL}/leaderboard

Get ready for next week's games!
- The Pool Management Team
      `;

      const mailOptions = {
        from: {
          name: 'The Pool - NFL Picks',
          address: process.env.EMAIL_USER
        },
        to: user.email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Weekly recap sent to ${user.email} (${user.alias})`);
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send recap to ${user.email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async testEmailConfiguration() {
    if (!this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();