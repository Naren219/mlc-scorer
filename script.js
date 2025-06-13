// Cricket Score Manager - Match Scheduler with Day Navigation
class CricketScoreManager {
    constructor() {
        this.teams = JSON.parse(localStorage.getItem('cricketTeams')) || [];
        this.currentDay = parseInt(localStorage.getItem('currentDay')) || 1;
        this.matchups = JSON.parse(localStorage.getItem('matchups')) || [];
        this.isLeaderboardView = false;
        
        this.init();
    }

    init() {
        this.updateDayDisplay();
        this.updateMatchupsDisplay();
        this.bindEvents();
        this.autoCreateMatchups();
    }

    bindEvents() {
        // Enter key handlers
        document.getElementById('teamName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });
        document.getElementById('teamPoints').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });
        document.getElementById('dayInput').addEventListener('change', () => {
            this.currentDay = parseInt(document.getElementById('dayInput').value) || 1;
            localStorage.setItem('currentDay', this.currentDay.toString());
            this.updateMatchupsDisplay();
        });

        // View toggle
        document.getElementById('viewToggle').addEventListener('click', () => {
            this.isLeaderboardView = !this.isLeaderboardView;
            document.querySelector('.spreadsheet-container').classList.toggle('leaderboard-view', this.isLeaderboardView);
            this.updateMatchupsDisplay();
        });

        // Initialize drag and drop
        this.initializeDragAndDrop();
    }

    saveData() {
        localStorage.setItem('cricketTeams', JSON.stringify(this.teams));
        localStorage.setItem('matchups', JSON.stringify(this.matchups));
        localStorage.setItem('currentDay', this.currentDay.toString());
    }

    autoCreateMatchups() {
        // Get teams that aren't in any matchup
        const availableTeams = this.teams.filter(team => 
            !this.matchups.some(matchup => 
                matchup.team1.id === team.id || matchup.team2.id === team.id
            )
        );

        // Create matchups for available teams
        for (let i = 0; i < availableTeams.length - 1; i += 2) {
            if (i + 1 < availableTeams.length) {
                this.createMatchup(availableTeams[i], availableTeams[i + 1]);
            }
        }
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
        
        // Auto-create matchup if there's an available team
        const availableTeam = this.teams.find(t => 
            t.id !== team.id && 
            !this.matchups.some(matchup => 
                matchup.team1.id === t.id || matchup.team2.id === t.id
            )
        );
        
        if (availableTeam) {
            this.createMatchup(availableTeam, team);
        }
        
        this.updateMatchupsDisplay();

        // Clear form
        nameInput.value = '';
        pointsInput.value = '';
        nameInput.focus();
    }

    deleteTeam(teamId) {
        if (confirm('Are you sure you want to delete this team?')) {
            this.teams = this.teams.filter(team => team.id !== teamId);
            this.matchups = this.matchups.filter(matchup => 
                matchup.team1.id !== teamId && matchup.team2.id !== teamId
            );
            this.saveData();
            this.updateTeamsDisplay();
            this.updateMatchupsDisplay();
        }
    }

    createMatchup(team1, team2) {
        const matchup = {
            id: Date.now(),
            team1: team1,
            team2: team2,
            winner: null,
            applied: false
        };
        this.matchups.push(matchup);
        this.saveData();
        this.updateMatchupsDisplay();
    }

    selectWinner(matchupId, teamId) {
        const matchup = this.matchups.find(m => m.id === matchupId);
        if (matchup) {
            matchup.winner = teamId;
            this.saveData();
            this.updateMatchupsDisplay();
        }
    }

    calculateNewPoints(team1, team2, winnerId) {
        const dayNumber = this.currentDay;
        let team1NewPoints, team2NewPoints;

        if (dayNumber === 1) {
            if (winnerId === team1.id) {
                team1NewPoints = (team1.current_points + team2.current_points + 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points + team1.current_points - 100) / (dayNumber + 1);
            } else {
                team1NewPoints = (team1.current_points + team2.current_points - 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points + team1.current_points + 100) / (dayNumber + 1);
            }
        } else {
            if (winnerId === team1.id) {
                team1NewPoints = (team1.current_points * dayNumber + team2.current_points + 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points * dayNumber + team1.current_points - 100) / (dayNumber + 1);
            } else {
                team1NewPoints = (team1.current_points * dayNumber + team2.current_points - 100) / (dayNumber + 1);
                team2NewPoints = (team2.current_points * dayNumber + team1.current_points + 100) / (dayNumber + 1);
            }
        }

        return {
            team1: {
                newPoints: Math.round(team1NewPoints * 10) / 10,
                change: Math.round((team1NewPoints - team1.current_points) * 10) / 10
            },
            team2: {
                newPoints: Math.round(team2NewPoints * 10) / 10,
                change: Math.round((team2NewPoints - team2.current_points) * 10) / 10
            }
        };
    }

    updateDayDisplay() {
        document.getElementById('dayInput').value = this.currentDay;
    }

    updateMatchupsDisplay() {
        const matchupsList = document.getElementById('matchupsList');
        
        if (this.isLeaderboardView) {
            // Sort teams by points for leaderboard view
            const sortedTeams = [...this.teams].sort((a, b) => b.current_points - a.current_points);
            
            matchupsList.innerHTML = sortedTeams.map((team, index) => `
                <div class="matchup-row">
                    <div class="cell rank">${index + 1}${index < 3 ? ['🥇', '🥈', '🥉'][index] : ''}</div>
                    <div class="cell team">${team.name}</div>
                    <div class="cell points">${team.current_points.toFixed(1)}</div>
                </div>
            `).join('');
        } else {
            // Regular matchup view
            let html = '';
            if (this.matchups.length === 0) {
                matchupsList.innerHTML = `
                    <div class="empty-state">
                        <h3>No matchups yet</h3>
                        <p>Add teams to create matchups</p>
                    </div>
                `;
                return;
            }

            // Track teams in matchups
            const teamsInMatchups = new Set();
            html += this.matchups.map(matchup => {
                teamsInMatchups.add(matchup.team1.id);
                teamsInMatchups.add(matchup.team2.id);
                const prediction = matchup.winner ? 
                    this.calculateNewPoints(matchup.team1, matchup.team2, matchup.winner) : null;

                // Helper to render a row for a team
                function renderTeamRow(team, opponent, isWinner, matchup, prediction, cricketManager) {
                    let newPoints = '-';
                    let change = '-';
                    if (prediction) {
                        if (team.id === matchup.team1.id) {
                            newPoints = prediction.team1.newPoints.toFixed(1);
                            change = (prediction.team1.change >= 0 ? '+' : '') + prediction.team1.change.toFixed(1);
                        } else {
                            newPoints = prediction.team2.newPoints.toFixed(1);
                            change = (prediction.team2.change >= 0 ? '+' : '') + prediction.team2.change.toFixed(1);
                        }
                    }
                    return `
                        <div class="matchup-row" draggable="true">
                            <div class="cell team">${team.name}</div>
                            <div class="cell points">${Math.round(team.current_points)}</div>
                            <div class="cell winner">
                                <button class="winner-btn short-btn ${matchup.winner === team.id ? 'selected' : (matchup.winner && matchup.winner !== team.id ? 'loser-btn' : '')}"
                                        onclick="cricketManager.selectWinner(${matchup.id}, ${team.id})">
                                    Winner
                                </button>
                            </div>
                            <div class="cell new-points">${prediction ? Math.round(newPoints) : '-'}</div>
                            <div class="cell change">
                                ${prediction ? `<div class=\"points-change ${change.startsWith('+') ? 'positive' : (change.startsWith('-') ? 'negative' : 'neutral')}\">${Math.round(Number(change))}</div>` : '-'}
                            </div>
                            <div class="cell actions">
                                <i class="fas fa-grip-vertical drag-handle"></i>
                            </div>
                        </div>
                    `;
                }

                // Apply button logic
                let applyBtn = '';
                if (matchup.winner && !matchup.applied) {
                    applyBtn = `<button class=\"btn btn-success short-btn\" onclick=\"cricketManager.applyMatchup(${matchup.id})\">Apply</button>`;
                } else if (matchup.applied) {
                    applyBtn = `<button class=\"btn btn-success short-btn\" disabled>Applied</button>`;
                } else {
                    applyBtn = `<button class=\"btn btn-success short-btn\" disabled>Apply</button>`;
                }

                return `
                    <div class="matchup-group" data-matchup-id="${matchup.id}">
                        ${renderTeamRow(matchup.team1, matchup.team2, matchup.winner === matchup.team1.id, matchup, prediction, window.cricketManager)}
                        ${renderTeamRow(matchup.team2, matchup.team1, matchup.winner === matchup.team2.id, matchup, prediction, window.cricketManager)}
                        <div class="match-actions" style="text-align:right; padding: 0 10px 10px 0;">${applyBtn}</div>
                    </div>
                `;
            }).join('');

            // Render incomplete rows for teams not in any matchup
            const unmatchedTeams = this.teams.filter(team => !teamsInMatchups.has(team.id));
            html += unmatchedTeams.map(team => `
                <div class="matchup-group incomplete-group" data-team-id="${team.id}">
                    <div class="matchup-row incomplete-row" draggable="true">
                        <div class="cell team">${team.name}</div>
                        <div class="cell points">${team.current_points.toFixed(1)}</div>
                        <div class="cell winner"><button class="winner-btn" disabled>-</button></div>
                        <div class="cell new-points">-</div>
                        <div class="cell change">-</div>
                        <div class="cell actions"><i class="fas fa-grip-vertical drag-handle"></i></div>
                    </div>
                </div>
            `).join('');

            matchupsList.innerHTML = html;
        }
    }

    initializeDragAndDrop() {
        const matchupsList = document.getElementById('matchupsList');
        let draggedItem = null;

        matchupsList.addEventListener('dragstart', (e) => {
            const matchupRow = e.target.closest('.matchup-row');
            if (matchupRow) {
                draggedItem = matchupRow;
                e.target.classList.add('dragging');
            }
        });

        matchupsList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('matchup-row')) {
                e.target.classList.remove('dragging');
                draggedItem = null;

                // --- NEW LOGIC: After drag, rebuild matchups from all rows in order ---
                const allRows = Array.from(matchupsList.querySelectorAll('.matchup-row'));
                const teamsInOrder = allRows.map(row => {
                    const teamName = row.querySelector('.cell.team').textContent;
                    return this.teams.find(t => t.name === teamName);
                }).filter(Boolean);
                let newMatchups = [];
                for (let i = 0; i < teamsInOrder.length - 1; i += 2) {
                    if (teamsInOrder[i + 1]) {
                        newMatchups.push({
                            id: Date.now() + Math.random(),
                            team1: teamsInOrder[i],
                            team2: teamsInOrder[i + 1],
                            winner: null,
                            applied: false
                        });
                    }
                }
                if (newMatchups.length > 0) {
                    this.matchups = newMatchups;
                    this.saveData();
                    this.updateMatchupsDisplay();
                }
            }
        });

        matchupsList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const matchupRow = e.target.closest('.matchup-row');
            if (matchupRow && matchupRow !== draggedItem) {
                const rect = matchupRow.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (e.clientY < midpoint) {
                    matchupRow.parentNode.insertBefore(draggedItem, matchupRow);
                } else {
                    matchupRow.parentNode.insertBefore(draggedItem, matchupRow.nextSibling);
                }
            }
        });
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
            <div class="team-item" data-team-id="${team.id}" draggable="true">
                <div class="team-info">
                    <div class="team-name">${team.name}</div>
                    <div class="team-points">${team.current_points.toFixed(1)} pts</div>
                </div>
                <button onclick="window.cricketManager.deleteTeam(${team.id})" class="delete-btn" title="Delete team">
                    ×
                </button>
            </div>
        `).join('');
    }

    applyMatchup(matchupId) {
        const matchup = this.matchups.find(m => m.id === matchupId);
        if (!matchup || !matchup.winner || matchup.applied) return;
        const prediction = this.calculateNewPoints(matchup.team1, matchup.team2, matchup.winner);
        // Update both teams' points
        const team1 = this.teams.find(t => t.id === matchup.team1.id);
        const team2 = this.teams.find(t => t.id === matchup.team2.id);
        if (team1 && team2) {
            team1.current_points = prediction.team1.newPoints;
            team2.current_points = prediction.team2.newPoints;
            matchup.applied = true;
            this.saveData();
            this.updateTeamsDisplay();
            this.updateMatchupsDisplay();
        }
    }
}

// Global functions for HTML onclick handlers
function addTeam() {
    cricketManager.addTeam();
}

// Initialize the application
const cricketManager = new CricketScoreManager();
window.cricketManager = cricketManager; 