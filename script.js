// Cricket Score Manager - Match Scheduler with Round Navigation
class CricketScoreManager {
    constructor() {
        this.teams = JSON.parse(localStorage.getItem('cricketTeams')) || [];
        this.globalGamesPlayed = parseInt(localStorage.getItem('globalGamesPlayed')) || 0;
        this.roundsData = JSON.parse(localStorage.getItem('roundsData')) || {};
        this.currentRound = parseInt(localStorage.getItem('currentRound')) || 1;
        this.viewingRound = this.currentRound; // Which round we're currently viewing
        this.matchHistory = JSON.parse(localStorage.getItem('cricketMatches')) || [];
        
        this.init();
    }

    init() {
        this.updateTeamsDisplay();
        this.updateTeamSelects();
        this.updateRoundDisplay();
        this.updateScheduledMatches();
        this.updateStandingsDisplay();
        this.bindEvents();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('gameDate').value = today;
        
        // Set global games played input
        document.getElementById('globalGamesPlayed').value = this.globalGamesPlayed;
    }

    bindEvents() {
        // Enter key handlers for form inputs
        document.getElementById('teamName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });
        document.getElementById('teamPoints').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });
        document.getElementById('globalGamesPlayed').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.updateGamesPlayed();
        });
        
        // Team selection change handlers
        document.getElementById('team1Select').addEventListener('change', () => this.updateAddMatchButton());
        document.getElementById('team2Select').addEventListener('change', () => this.updateAddMatchButton());
    }

    saveData() {
        localStorage.setItem('cricketTeams', JSON.stringify(this.teams));
        localStorage.setItem('globalGamesPlayed', this.globalGamesPlayed.toString());
        localStorage.setItem('roundsData', JSON.stringify(this.roundsData));
        localStorage.setItem('currentRound', this.currentRound.toString());
        localStorage.setItem('cricketMatches', JSON.stringify(this.matchHistory));
    }

    getCurrentRoundMatches() {
        if (!this.roundsData[this.viewingRound]) {
            this.roundsData[this.viewingRound] = {
                matches: [],
                completed: false,
                date: null
            };
        }
        return this.roundsData[this.viewingRound].matches;
    }

    setCurrentRoundMatches(matches) {
        if (!this.roundsData[this.viewingRound]) {
            this.roundsData[this.viewingRound] = {
                matches: [],
                completed: false,
                date: null
            };
        }
        this.roundsData[this.viewingRound].matches = matches;
    }

    isRoundCompleted(roundNumber) {
        return this.roundsData[roundNumber] && this.roundsData[roundNumber].completed;
    }

    navigateRound(direction) {
        const newRound = this.viewingRound + direction;
        
        if (direction === -1 && newRound < 1) return;
        if (direction === 1 && newRound > this.currentRound) return;
        
        this.viewingRound = newRound;
        this.updateRoundDisplay();
        this.updateScheduledMatches();
    }

    updateRoundDisplay() {
        document.getElementById('currentRoundNumber').textContent = this.viewingRound;
        
        const roundStatus = document.getElementById('roundStatus');
        const schedulerControls = document.getElementById('schedulerControls');
        const prevBtn = document.getElementById('prevRoundBtn');
        const nextBtn = document.getElementById('nextRoundBtn');
        
        // Update navigation buttons
        prevBtn.disabled = this.viewingRound <= 1;
        nextBtn.disabled = this.viewingRound >= this.currentRound;
        
        // Update round status and controls availability
        if (this.viewingRound === this.currentRound) {
            roundStatus.textContent = 'Current Round';
            roundStatus.className = 'round-info';
            schedulerControls.classList.remove('disabled');
        } else if (this.isRoundCompleted(this.viewingRound)) {
            roundStatus.textContent = 'Completed Round';
            roundStatus.className = 'round-info completed';
            schedulerControls.classList.add('disabled');
        } else {
            roundStatus.textContent = 'Past Round';
            roundStatus.className = 'round-info';
            schedulerControls.classList.add('disabled');
        }
    }

    updateGamesPlayed() {
        const newGamesPlayed = parseInt(document.getElementById('globalGamesPlayed').value) || 0;
        this.globalGamesPlayed = newGamesPlayed;
        
        // Update all teams' games played to match global value
        this.teams.forEach(team => {
            team.games_played = this.globalGamesPlayed;
            // Recalculate total points sum based on current points and new games played
            team.total_points_sum = team.current_points * team.games_played;
        });
        
        this.saveData();
        this.updateStandingsDisplay();
        this.showSuccessMessage(`Global games played updated to ${this.globalGamesPlayed}`);
    }

    addTeam() {
        const nameInput = document.getElementById('teamName');
        const pointsInput = document.getElementById('teamPoints');

        const name = nameInput.value.trim();
        const points = parseFloat(pointsInput.value) || 0;

        if (!name) {
            alert('Please enter a team name');
            return;
        }

        if (this.teams.some(team => team.name.toLowerCase() === name.toLowerCase())) {
            alert('Team name already exists');
            return;
        }

        const team = {
            id: Date.now(),
            name: name,
            current_points: points,
            games_played: this.globalGamesPlayed,
            total_points_sum: points * this.globalGamesPlayed,
            created_at: new Date().toISOString()
        };

        this.teams.push(team);
        this.saveData();
        this.updateTeamsDisplay();
        this.updateTeamSelects();
        this.updateStandingsDisplay();

        // Clear form
        nameInput.value = '';
        pointsInput.value = '';
        nameInput.focus();
    }

    deleteTeam(teamId) {
        if (confirm('Are you sure you want to delete this team?')) {
            this.teams = this.teams.filter(team => team.id !== teamId);
            
            // Remove any scheduled matches involving this team from all rounds
            Object.keys(this.roundsData).forEach(roundNumber => {
                this.roundsData[roundNumber].matches = this.roundsData[roundNumber].matches.filter(match => 
                    match.team1.id !== teamId && match.team2.id !== teamId
                );
            });
            
            this.saveData();
            this.updateTeamsDisplay();
            this.updateTeamSelects();
            this.updateScheduledMatches();
            this.updateStandingsDisplay();
        }
    }

    updateAddMatchButton() {
        if (this.viewingRound !== this.currentRound) return;
        
        const team1Id = document.getElementById('team1Select').value;
        const team2Id = document.getElementById('team2Select').value;
        const currentMatches = this.getCurrentRoundMatches();
        
        // Check if we can add this match
        const canAdd = team1Id && team2Id && team1Id !== team2Id && 
                      !currentMatches.some(match => 
                          (match.team1.id == team1Id && match.team2.id == team2Id) ||
                          (match.team1.id == team2Id && match.team2.id == team1Id)
                      );
        
        // Enable/disable the add match button based on validation
        const addBtn = document.querySelector('.add-match-form .btn');
        if (addBtn) {
            addBtn.disabled = !canAdd;
            addBtn.style.opacity = canAdd ? '1' : '0.5';
        }
    }

    addMatch() {
        if (this.viewingRound !== this.currentRound) return;
        
        const team1Id = parseInt(document.getElementById('team1Select').value);
        const team2Id = parseInt(document.getElementById('team2Select').value);

        if (!team1Id || !team2Id || team1Id === team2Id) {
            alert('Please select two different teams');
            return;
        }

        const currentMatches = this.getCurrentRoundMatches();
        
        // Check if this match is already scheduled
        const matchExists = currentMatches.some(match => 
            (match.team1.id === team1Id && match.team2.id === team2Id) ||
            (match.team1.id === team2Id && match.team2.id === team1Id)
        );

        if (matchExists) {
            alert('This match is already scheduled');
            return;
        }

        const team1 = this.teams.find(t => t.id === team1Id);
        const team2 = this.teams.find(t => t.id === team2Id);

        if (!team1 || !team2) {
            alert('Selected teams not found');
            return;
        }

        const match = {
            id: Date.now(),
            team1: { ...team1 },
            team2: { ...team2 },
            winner: null // No winner selected yet
        };

        currentMatches.push(match);
        this.setCurrentRoundMatches(currentMatches);
        this.saveData();
        this.updateScheduledMatches();
        this.updateRoundActionsVisibility();

        // Reset selects
        document.getElementById('team1Select').value = '';
        document.getElementById('team2Select').value = '';
        this.updateAddMatchButton();
    }

    removeMatch(matchId) {
        if (this.viewingRound !== this.currentRound) return;
        
        const currentMatches = this.getCurrentRoundMatches();
        const updatedMatches = currentMatches.filter(match => match.id !== matchId);
        this.setCurrentRoundMatches(updatedMatches);
        this.saveData();
        this.updateScheduledMatches();
        this.updateRoundActionsVisibility();
    }

    selectWinner(matchId, teamId) {
        if (this.viewingRound !== this.currentRound) return;
        
        const currentMatches = this.getCurrentRoundMatches();
        const match = currentMatches.find(m => m.id === matchId);
        if (match) {
            match.winner = teamId;
            this.setCurrentRoundMatches(currentMatches);
            this.saveData();
            this.updateMatchDisplay(matchId);
            this.updateRoundActionsVisibility();
        }
    }

    calculateNewPoints(team1, team2, winnerId) {
        const team1Copy = { ...team1 };
        const team2Copy = { ...team2 };
        
        const pointGap = Math.abs(team1.current_points - team2.current_points);
        const isExceptionRule = pointGap > 100;
        
        let team1NewPoints, team2NewPoints;
        let team1Change, team2Change;

        if (winnerId === team1.id) {
            // Team 1 wins
            if (isExceptionRule && team1.current_points > team2.current_points) {
                // Higher-rated team wins - use exception rule (no change)
                team1NewPoints = team1.current_points;
                team1Change = 0;
            } else {
                // Standard rule or lower-rated team wins
                const newSum = team1Copy.total_points_sum + team2.current_points + 100;
                const newGames = team1Copy.games_played + 1;
                team1NewPoints = newSum / newGames;
                team1Change = team1NewPoints - team1.current_points;
            }
            
            if (isExceptionRule && team2.current_points < team1.current_points) {
                // Lower-rated team loses - use exception rule (no change)
                team2NewPoints = team2.current_points;
                team2Change = 0;
            } else {
                // Standard rule
                const newSum = team2Copy.total_points_sum + team1.current_points - 100;
                const newGames = team2Copy.games_played + 1;
                team2NewPoints = newSum / newGames;
                team2Change = team2NewPoints - team2.current_points;
            }
        } else {
            // Team 2 wins
            if (isExceptionRule && team2.current_points > team1.current_points) {
                // Higher-rated team wins - use exception rule (no change)
                team2NewPoints = team2.current_points;
                team2Change = 0;
            } else {
                // Standard rule or lower-rated team wins
                const newSum = team2Copy.total_points_sum + team1.current_points + 100;
                const newGames = team2Copy.games_played + 1;
                team2NewPoints = newSum / newGames;
                team2Change = team2NewPoints - team2.current_points;
            }
            
            if (isExceptionRule && team1.current_points < team2.current_points) {
                // Lower-rated team loses - use exception rule (no change)
                team1NewPoints = team1.current_points;
                team1Change = 0;
            } else {
                // Standard rule
                const newSum = team1Copy.total_points_sum + team2.current_points - 100;
                const newGames = team1Copy.games_played + 1;
                team1NewPoints = newSum / newGames;
                team1Change = team1NewPoints - team1.current_points;
            }
        }

        return {
            team1: {
                newPoints: team1NewPoints,
                change: team1Change
            },
            team2: {
                newPoints: team2NewPoints,
                change: team2Change
            },
            isExceptionRule
        };
    }

    updateMatchDisplay(matchId) {
        const currentMatches = this.getCurrentRoundMatches();
        const match = currentMatches.find(m => m.id === matchId);
        if (!match) return;

        const matchElement = document.querySelector(`[data-match-id="${matchId}"]`);
        if (!matchElement) return;

        const team1Option = matchElement.querySelector('[data-team="team1"]');
        const team2Option = matchElement.querySelector('[data-team="team2"]');

        // Update selection visual state
        team1Option.classList.toggle('selected', match.winner === match.team1.id);
        team2Option.classList.toggle('selected', match.winner === match.team2.id);

        // Show predictions if a winner is selected
        if (match.winner) {
            const prediction = this.calculateNewPoints(match.team1, match.team2, match.winner);
            
            // Update team 1 prediction
            const team1Prediction = team1Option.querySelector('.prediction-display');
            if (team1Prediction) {
                const newPoints = team1Prediction.querySelector('.new-points');
                const change = team1Prediction.querySelector('.change');
                
                newPoints.textContent = `${prediction.team1.newPoints.toFixed(1)} pts`;
                change.textContent = `${prediction.team1.change >= 0 ? '+' : ''}${prediction.team1.change.toFixed(1)}`;
                change.className = 'change ' + (
                    prediction.team1.change > 0 ? 'positive' : 
                    prediction.team1.change < 0 ? 'negative' : 'neutral'
                );
            }

            // Update team 2 prediction
            const team2Prediction = team2Option.querySelector('.prediction-display');
            if (team2Prediction) {
                const newPoints = team2Prediction.querySelector('.new-points');
                const change = team2Prediction.querySelector('.change');
                
                newPoints.textContent = `${prediction.team2.newPoints.toFixed(1)} pts`;
                change.textContent = `${prediction.team2.change >= 0 ? '+' : ''}${prediction.team2.change.toFixed(1)}`;
                change.className = 'change ' + (
                    prediction.team2.change > 0 ? 'positive' : 
                    prediction.team2.change < 0 ? 'negative' : 'neutral'
                );
            }
        }
    }

    updateRoundActionsVisibility() {
        const roundActions = document.getElementById('roundActions');
        const currentMatches = this.getCurrentRoundMatches();
        const hasMatches = currentMatches.length > 0;
        const hasWinners = currentMatches.some(match => match.winner);
        
        // Only show round actions for current round
        const showActions = this.viewingRound === this.currentRound && hasMatches;
        roundActions.style.display = showActions ? 'block' : 'none';
        
        if (showActions) {
            const processBtn = roundActions.querySelector('.btn-success');
            if (processBtn) {
                processBtn.disabled = !hasWinners;
                processBtn.style.opacity = hasWinners ? '1' : '0.5';
            }
        }
    }

    clearRound() {
        if (this.viewingRound !== this.currentRound) return;
        
        if (confirm('Clear all scheduled matches?')) {
            this.setCurrentRoundMatches([]);
            this.saveData();
            this.updateScheduledMatches();
            this.updateRoundActionsVisibility();
        }
    }

    processRound() {
        if (this.viewingRound !== this.currentRound) return;
        
        const currentMatches = this.getCurrentRoundMatches();
        const matchesWithWinners = currentMatches.filter(match => match.winner);
        
        if (matchesWithWinners.length === 0) {
            alert('No matches with winners selected');
            return;
        }

        const gameDate = document.getElementById('gameDate').value;
        if (!gameDate) {
            alert('Please select a game date');
            return;
        }

        let processedMatches = 0;

        // Process each match with a winner
        matchesWithWinners.forEach(match => {
            const prediction = this.calculateNewPoints(match.team1, match.team2, match.winner);

            // Update team 1
            const team1Index = this.teams.findIndex(t => t.id === match.team1.id);
            if (team1Index !== -1) {
                this.teams[team1Index].games_played += 1;
                this.teams[team1Index].total_points_sum += (match.winner === match.team1.id) ? 
                    (prediction.isExceptionRule && match.team1.current_points > match.team2.current_points ? 
                        match.team1.current_points : match.team2.current_points + 100) :
                    (prediction.isExceptionRule && match.team1.current_points < match.team2.current_points ?
                        match.team1.current_points : match.team2.current_points - 100);
                this.teams[team1Index].current_points = prediction.team1.newPoints;
            }

            // Update team 2
            const team2Index = this.teams.findIndex(t => t.id === match.team2.id);
            if (team2Index !== -1) {
                this.teams[team2Index].games_played += 1;
                this.teams[team2Index].total_points_sum += (match.winner === match.team2.id) ? 
                    (prediction.isExceptionRule && match.team2.current_points > match.team1.current_points ? 
                        match.team2.current_points : match.team1.current_points + 100) :
                    (prediction.isExceptionRule && match.team2.current_points < match.team1.current_points ?
                        match.team2.current_points : match.team1.current_points - 100);
                this.teams[team2Index].current_points = prediction.team2.newPoints;
            }

            // Record match in history (for data purposes, not displayed)
            const historyMatch = {
                id: Date.now() + Math.random(),
                date: gameDate,
                round: this.currentRound,
                team1: { ...match.team1 },
                team2: { ...match.team2 },
                winner_id: match.winner,
                prediction: prediction,
                timestamp: new Date().toISOString()
            };
            this.matchHistory.unshift(historyMatch);

            processedMatches++;
        });

        // Mark round as completed and set date
        this.roundsData[this.currentRound].completed = true;
        this.roundsData[this.currentRound].date = gameDate;

        // Update global games played if any matches were processed
        if (processedMatches > 0) {
            this.globalGamesPlayed += 1;
            this.currentRound += 1; // Move to next round
            this.viewingRound = this.currentRound; // View the new current round
            document.getElementById('globalGamesPlayed').value = this.globalGamesPlayed;
        }

        this.saveData();
        this.updateTeamsDisplay();
        this.updateStandingsDisplay();
        this.updateRoundDisplay();
        this.updateScheduledMatches();
        this.updateRoundActionsVisibility();

        // Show success message
        this.showSuccessMessage(`Round ${this.currentRound - 1} completed! ${processedMatches} matches processed.`);
    }

    showSuccessMessage(message) {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const matchScheduler = document.querySelector('.match-scheduler');
        matchScheduler.insertBefore(successDiv, matchScheduler.firstChild);

        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    updateTeamsDisplay() {
        const teamsList = document.getElementById('teamsList');
        
        if (this.teams.length === 0) {
            teamsList.innerHTML = `
                <div class="empty-state">
                    <h3>No teams yet</h3>
                    <p>Add your first team above</p>
                </div>
            `;
            return;
        }

        teamsList.innerHTML = this.teams.map(team => `
            <div class="team-item">
                <div class="team-info">
                    <div class="team-name">${team.name}</div>
                    <div class="team-points">${team.current_points.toFixed(1)} pts</div>
                </div>
                <button onclick="cricketManager.deleteTeam(${team.id})" class="delete-btn" title="Delete team">
                    ×
                </button>
            </div>
        `).join('');
    }

    updateTeamSelects() {
        const team1Select = document.getElementById('team1Select');
        const team2Select = document.getElementById('team2Select');
        
        const sortedTeams = [...this.teams].sort((a, b) => a.name.localeCompare(b.name));
        
        const teamOptions = sortedTeams.map(team => 
            `<option value="${team.id}">${team.name} (${team.current_points.toFixed(1)} pts)</option>`
        ).join('');

        team1Select.innerHTML = '<option value="">Select Team 1</option>' + teamOptions;
        team2Select.innerHTML = '<option value="">Select Team 2</option>' + teamOptions;
        
        this.updateAddMatchButton();
    }

    updateScheduledMatches() {
        const matchesList = document.getElementById('matchesList');
        const currentMatches = this.getCurrentRoundMatches();
        
        if (currentMatches.length === 0) {
            matchesList.innerHTML = `
                <div class="empty-state">
                    <h3>No matches scheduled</h3>
                    <p>${this.viewingRound === this.currentRound ? 'Add matches using the form above' : 'This round has no matches'}</p>
                </div>
            `;
            this.updateRoundActionsVisibility();
            return;
        }

        const isCurrentRound = this.viewingRound === this.currentRound;
        const isCompleted = this.isRoundCompleted(this.viewingRound);

        matchesList.innerHTML = currentMatches.map(match => {
            const pointGap = Math.abs(match.team1.current_points - match.team2.current_points);
            const isExceptionRule = pointGap > 100;
            
            return `
                <div class="match-card ${isCompleted ? 'completed' : ''}" data-match-id="${match.id}">
                    <div class="match-header">
                        <div class="match-teams">${match.team1.name} vs ${match.team2.name}</div>
                        <div class="gap-indicator ${isExceptionRule ? 'gap-significant' : 'gap-normal'}">
                            Gap: ${pointGap.toFixed(1)} ${isExceptionRule ? '(Exception Rule)' : '(Standard Rule)'}
                        </div>
                    </div>
                    
                    <div class="match-selection">
                        <div class="team-option ${!isCurrentRound ? 'disabled' : ''}" data-team="team1" onclick="cricketManager.selectWinner(${match.id}, ${match.team1.id})">
                            <div class="team-name-large">${match.team1.name}</div>
                            <div class="team-points-large">${match.team1.current_points.toFixed(1)} pts</div>
                            <div class="prediction-display">
                                <span class="new-points"></span>
                                <span class="change"></span>
                            </div>
                        </div>
                        
                        <div class="vs-divider">VS</div>
                        
                        <div class="team-option ${!isCurrentRound ? 'disabled' : ''}" data-team="team2" onclick="cricketManager.selectWinner(${match.id}, ${match.team2.id})">
                            <div class="team-name-large">${match.team2.name}</div>
                            <div class="team-points-large">${match.team2.current_points.toFixed(1)} pts</div>
                            <div class="prediction-display">
                                <span class="new-points"></span>
                                <span class="change"></span>
                            </div>
                        </div>
                    </div>
                    
                    ${isCurrentRound ? `
                        <div class="match-actions">
                            <button onclick="cricketManager.removeMatch(${match.id})" class="remove-match-btn" title="Remove match">
                                ×
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Update predictions for all matches
        currentMatches.forEach(match => {
            if (match.winner) {
                this.updateMatchDisplay(match.id);
            }
        });

        this.updateRoundActionsVisibility();
    }

    updateStandingsDisplay() {
        const standingsTable = document.getElementById('standingsTable');
        
        if (this.teams.length === 0) {
            standingsTable.innerHTML = `
                <div class="empty-state">
                    <h3>No teams to display</h3>
                    <p>Add teams to see standings</p>
                </div>
            `;
            return;
        }

        const sortedTeams = [...this.teams].sort((a, b) => b.current_points - a.current_points);

        standingsTable.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>Points</th>
                        <th>Games</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedTeams.map((team, index) => `
                        <tr>
                            <td>${index + 1}${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}</td>
                            <td><strong>${team.name}</strong></td>
                            <td>${team.current_points.toFixed(1)}</td>
                            <td>${team.games_played}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

// Global functions for HTML onclick handlers
function addTeam() {
    cricketManager.addTeam();
}

function updateGamesPlayed() {
    cricketManager.updateGamesPlayed();
}

function addMatch() {
    cricketManager.addMatch();
}

function processRound() {
    cricketManager.processRound();
}

function clearRound() {
    cricketManager.clearRound();
}

function navigateRound(direction) {
    cricketManager.navigateRound(direction);
}

// Initialize the application
const cricketManager = new CricketScoreManager(); 