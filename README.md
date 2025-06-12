# 🏏 Cricket Score Manager

A modern web application for managing cricket team scores with MLC (Major League Cricket) scoring rules.

## Features

- **Team Management**: Add teams with current points and games played
- **Match Prediction**: See predicted score changes before confirming matches
- **Interactive UI**: Click on teams to select winners and see real-time predictions
- **Smart Scoring**: Implements standard and exception rules based on point gaps
- **Leaderboard**: Ranked team display with medals for top 3 teams
- **Data Persistence**: All data saved locally in your browser

## Scoring Rules

### Standard Points Calculation

For every game played:
- **If team WINS**: Add (opponent's points + 100) to the running sum
- **If team LOSES**: Add (opponent's points – 100) to the running sum
- **Update**: games_played += 1, current_points = total_points_sum / games_played

### Exception Rule (Point Gap > 100)

When the absolute difference between teams' points > 100:
- **Higher-rated team wins OR lower-rated team loses**: Team's points remain unchanged
- **Lower-rated team wins**: Use standard calculation

## How to Use

1. **Open `index.html`** in your web browser
2. **Add Teams**: Enter team name, current points, and games played
3. **Set Match Date**: Select the game date
4. **Select Teams**: Choose Team 1 and Team 2 from dropdowns
5. **Predict Winner**: Click on the team you think will win
6. **Review Predictions**: See point changes with color coding:
   - 🟢 Green: Positive change
   - 🔴 Red: Negative change
   - ⚫ Gray: No change (exception rule)
7. **Confirm Match**: Click "Confirm Match Result" to apply changes

## Technical Details

- Pure HTML, CSS, and JavaScript (no frameworks required)
- Responsive design works on desktop and mobile
- Data stored in browser's localStorage
- Modern CSS with smooth animations and transitions

## Getting Started

Simply open `index.html` in any modern web browser. No server or installation required!

## Example Teams

Try adding these sample teams to get started:
- Mumbai Indians: 1250 points, 15 games
- Chennai Super Kings: 1180 points, 14 games
- Royal Challengers: 1050 points, 13 games
- Delhi Capitals: 980 points, 12 games 