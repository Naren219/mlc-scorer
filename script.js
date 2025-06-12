// Cricket Score Manager - Match Scheduler with Day Navigation
class CricketScoreManager {
    constructor() {
        this.teams = JSON.parse(localStorage.getItem('cricketTeams')) || [];
        this.daysData = JSON.parse(localStorage.getItem('daysData')) || {};
        this.currentDay = parseInt(localStorage.getItem('currentDay')) || 1;
        this.viewingDay = this.currentDay; // Which day we're currently viewing
        this.matchHistory = JSON.parse(localStorage.getItem('cricketMatches')) || [];
        
        this.init();
    }

    init() {
        this.updateTeamsDisplay();
        this.updateTeamSelects();
        this.updateDayDisplay();
        this.updateScheduledMatches();
        this.updateStandingsDisplay();
        this.bindEvents();
        
        // Set day number input
        document.getElementById('dayNumber').value = this.viewingDay;
    }

    bindEvents() {
        // Enter key handlers for form inputs
        document.getElementById('teamName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });
        document.getElementById('teamPoints').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });
        document.getElementById('dayNumber').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.changeDayNumber();
        });
        
        // Team selection change handlers
        document.getElementById('team1Select').addEventListener('change', () => this.updateAddMatchButton());
        document.getElementById('team2Select').addEventListener('change', () => this.updateAddMatchButton());
    }

    saveData() {
        localStorage.setItem('cricketTeams', JSON.stringify(this.teams));
        localStorage.setItem('daysData', JSON.stringify(this.daysData));
        localStorage.setItem('currentDay', this.currentDay.toString());
        localStorage.setItem('cricketMatches', JSON.stringify(this.matchHistory));
    }

    getCurrentDayMatches() {
        if (!this.daysData[this.viewingDay]) {
            this.daysData[this.viewingDay] = {
                matches: []
            };
        }
        return this.daysData[this.viewingDay].matches;
    }

    setCurrentDayMatches(matches) {
        if (!this.daysData[this.viewingDay]) {
            this.daysData[this.viewingDay] = {
                matches: []
            };
        }
        this.daysData[this.viewingDay].matches = matches;
    }

    navigateDay(direction) {
        const newDay = this.viewingDay + direction;
        
        if (direction === -1 && newDay < 1) return;
        if (direction === 1 && newDay > this.currentDay) return;
        
        this.viewingDay = newDay;
        this.updateDayDisplay();
        this.updateScheduledMatches();
    }

    updateDayDisplay() {
        document.getElementById('currentDayNumber').textContent = this.viewingDay;
        document.getElementById('dayNumber').value = this.viewingDay;
        
        const schedulerControls = document.getElementById('schedulerControls');
        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');
        
        // Update navigation buttons
        prevBtn.disabled = this.viewingDay <= 1;
        nextBtn.disabled = false; // Allow navigating to future days
        
        // All days are editable
        schedulerControls.classList.remove('disabled');
    }

    changeDayNumber() {
        const newDayNumber = parseInt(document.getElementById('dayNumber').value) || 1;
        
        if (newDayNumber < 1) {
            alert('Day number must be 1 or greater');
            document.getElementById('dayNumber').value = this.viewingDay;
            return;
        }
        
        this.viewingDay = newDayNumber;
        
        // If navigating to a day beyond current day, update current day
        if (newDayNumber > this.currentDay) {
            this.currentDay = newDayNumber;
        }
        
        this.updateDayDisplay();
        this.updateScheduledMatches();
        this.updateAddMatchButton();
        this.saveData();
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
            
            // Remove any scheduled matches involving this team from all days
            Object.keys(this.daysData).forEach(dayNumber => {
                this.daysData[dayNumber].matches = this.daysData[dayNumber].matches.filter(match => 
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
        const team1Id = document.getElementById('team1Select').value;
        const team2Id = document.getElementById('team2Select').value;
        const currentMatches = this.getCurrentDayMatches();
        
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
        const team1Id = parseInt(document.getElementById('team1Select').value);
        const team2Id = parseInt(document.getElementById('team2Select').value);

        if (!team1Id || !team2Id || team1Id === team2Id) {
            alert('Please select two different teams');
            return;
        }

        const currentMatches = this.getCurrentDayMatches();
        
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
        this.setCurrentDayMatches(currentMatches);
        this.saveData();
        this.updateScheduledMatches();
        this.updateDayActionsVisibility();

        // Reset selects
        document.getElementById('team1Select').value = '';
        document.getElementById('team2Select').value = '';
        this.updateAddMatchButton();
    }

    removeMatch(matchId) {
        if (this.viewingDay !== this.currentDay) return;
        
        const currentMatches = this.getCurrentDayMatches();
        const updatedMatches = currentMatches.filter(match => match.id !== matchId);
        this.setCurrentDayMatches(updatedMatches);
        this.saveData();
        this.updateScheduledMatches();
        this.updateDayActionsVisibility();
    }

    selectWinner(matchId, teamId) {
        const currentMatches = this.getCurrentDayMatches();
        const match = currentMatches.find(m => m.id === matchId);
        if (match) {
            match.winner = teamId;
            
            // Immediately update team points when winner is selected
            const prediction = this.calculateNewPoints(match.team1, match.team2, match.winner);
            
            // Update team 1
            const team1Index = this.teams.findIndex(t => t.id === match.team1.id);
            if (team1Index !== -1) {
                this.teams[team1Index].current_points = prediction.team1.newPoints;
            }
            
            // Update team 2
            const team2Index = this.teams.findIndex(t => t.id === match.team2.id);
            if (team2Index !== -1) {
                this.teams[team2Index].current_points = prediction.team2.newPoints;
            }
            
            this.setCurrentDayMatches(currentMatches);
            this.saveData();
            this.updateMatchDisplay(matchId);
            this.updateTeamsDisplay();
            this.updateTeamSelects();
            this.updateStandingsDisplay();
            this.updateDayActionsVisibility();
        }
    }

    calculateNewPoints(team1, team2, winnerId) {
        // Formula: new team points = (current team points * day number + opponent points ± 100) / (day number + 1)
        // Winner gets +100, loser gets -100
        // Special case: if day number == 1, don't multiply by day number in numerator
        
        const dayNumber = this.currentDay;
        
        let team1NewPoints, team2NewPoints;

        if (dayNumber === 1) {
            // Special case for day 1: don't multiply by day number
            if (winnerId === team1.id) {
                // Team 1 wins
                team1NewPoints = (team1.current_points + team2.current_points + 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points + team1.current_points - 100) / (dayNumber + 1);
            } else {
                // Team 2 wins
                team1NewPoints = (team1.current_points + team2.current_points - 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points + team1.current_points + 100) / (dayNumber + 1);
            }
        } else {
            // General formula for day > 1
            if (winnerId === team1.id) {
                // Team 1 wins
                team1NewPoints = (team1.current_points * dayNumber + team2.current_points + 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points * dayNumber + team1.current_points - 100) / (dayNumber + 1);
            } else {
                // Team 2 wins
                team1NewPoints = (team1.current_points * dayNumber + team2.current_points - 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points * dayNumber + team1.current_points + 100) / (dayNumber + 1);
            }
        }

        // Calculate changes
        const team1Change = team1NewPoints - team1.current_points;
        const team2Change = team2NewPoints - team2.current_points;

        // Round to 1 decimal place
        team1NewPoints = Math.round(team1NewPoints * 10) / 10;
        team2NewPoints = Math.round(team2NewPoints * 10) / 10;
        const team1ChangeRounded = Math.round(team1Change * 10) / 10;
        const team2ChangeRounded = Math.round(team2Change * 10) / 10;

        return {
            team1: {
                newPoints: team1NewPoints,
                change: team1ChangeRounded
            },
            team2: {
                newPoints: team2NewPoints,
                change: team2ChangeRounded
            },
            isExceptionRule: false
        };
    }

    updateMatchDisplay(matchId) {
        const currentMatches = this.getCurrentDayMatches();
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

    updateDayActionsVisibility() {
        const dayActions = document.getElementById('dayActions');
        const currentMatches = this.getCurrentDayMatches();
        const hasMatches = currentMatches.length > 0;
        
        // Show clear button only when there are matches
        dayActions.style.display = hasMatches ? 'block' : 'none';
    }

    clearDay() {
        if (confirm('Clear all scheduled matches for this day?')) {
            this.setCurrentDayMatches([]);
            this.saveData();
            this.updateScheduledMatches();
            this.updateDayActionsVisibility();
        }
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
        const currentMatches = this.getCurrentDayMatches();
        
        if (currentMatches.length === 0) {
            matchesList.innerHTML = `
                <div class="empty-state">
                    <h3>No matches scheduled</h3>
                    <p>Add matches using the form above</p>
                </div>
            `;
            this.updateDayActionsVisibility();
            return;
        }

        matchesList.innerHTML = currentMatches.map(match => {
            const pointGap = Math.abs(match.team1.current_points - match.team2.current_points);
            
            return `
                <div class="match-card" data-match-id="${match.id}">
                    <div class="match-header">
                        <div class="match-teams">${match.team1.name} vs ${match.team2.name}</div>
                        <div class="gap-indicator gap-normal">
                            Gap: ${pointGap.toFixed(1)}
                        </div>
                    </div>
                    
                    <div class="match-selection">
                        <div class="team-option" data-team="team1" onclick="cricketManager.selectWinner(${match.id}, ${match.team1.id})">
                            <div class="team-name-large">${match.team1.name}</div>
                            <div class="team-points-large">${match.team1.current_points.toFixed(1)} pts</div>
                            <div class="prediction-display">
                                <span class="new-points"></span>
                                <span class="change"></span>
                            </div>
                        </div>
                        
                        <div class="vs-divider">VS</div>
                        
                        <div class="team-option" data-team="team2" onclick="cricketManager.selectWinner(${match.id}, ${match.team2.id})">
                            <div class="team-name-large">${match.team2.name}</div>
                            <div class="team-points-large">${match.team2.current_points.toFixed(1)} pts</div>
                            <div class="prediction-display">
                                <span class="new-points"></span>
                                <span class="change"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="match-actions">
                        <button onclick="cricketManager.removeMatch(${match.id})" class="remove-match-btn" title="Remove match">
                            ×
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update predictions for all matches
        currentMatches.forEach(match => {
            if (match.winner) {
                this.updateMatchDisplay(match.id);
            }
        });

        this.updateDayActionsVisibility();
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
                    </tr>
                </thead>
                <tbody>
                    ${sortedTeams.map((team, index) => `
                        <tr>
                            <td>${index + 1}${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}</td>
                            <td><strong>${team.name}</strong></td>
                            <td>${team.current_points.toFixed(1)}</td>
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

function changeDayNumber() {
    cricketManager.changeDayNumber();
}

function addMatch() {
    cricketManager.addMatch();
}



function clearDay() {
    cricketManager.clearDay();
}

function navigateDay(direction) {
    cricketManager.navigateDay(direction);
}

// Initialize the application
const cricketManager = new CricketScoreManager(); 