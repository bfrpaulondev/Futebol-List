// AI Service for team drawing with balanced skills

/**
 * Draw balanced teams using player skills
 * @param {Array} players - Array of player objects with skills
 * @returns {Object} { teamA: [], teamB: [] }
 */
export const drawTeamsAI = async (players) => {
  if (players.length < 4) {
    throw new Error('Mínimo de 4 jogadores necessário');
  }
  
  // Calculate overall rating for each player
  const playersWithRating = players.map(player => ({
    ...player,
    rating: calculateOverallRating(player)
  }));
  
  // Sort by rating (descending)
  playersWithRating.sort((a, b) => b.rating - a.rating);
  
  // Initialize teams
  const teamA = [];
  const teamB = [];
  
  // Snake draft algorithm for balanced teams
  // Pattern: A, B, B, A, A, B, B, A, ...
  let teamATurn = true;
  
  for (let i = 0; i < playersWithRating.length; i++) {
    if (teamATurn) {
      teamA.push(playersWithRating[i]._id);
    } else {
      teamB.push(playersWithRating[i]._id);
    }
    
    // Alternate pattern (snake draft)
    if (i % 2 === 1) {
      teamATurn = !teamATurn;
    }
  }
  
  // Balance check and swap if needed
  const balancedTeams = balanceTeams(playersWithRating, teamA, teamB);
  
  return balancedTeams;
};

/**
 * Calculate overall player rating
 * @param {Object} player - Player object with skills
 * @returns {Number} Overall rating (1-10)
 */
const calculateOverallRating = (player) => {
  const skills = player.skills || {};
  const { shooting = 5, passing = 5, dribbling = 5, defense = 5, physical = 5, goalkeeping = 5 } = skills;
  
  // Weighted average (goalkeeping less important for field players)
  const fieldPlayerRating = (shooting * 1.2 + passing * 1.2 + dribbling * 1.1 + defense * 1.1 + physical * 1.0 + goalkeeping * 0.4) / 6;
  
  return Math.round(fieldPlayerRating * 10) / 10;
};

/**
 * Balance teams by swapping players if difference is too high
 * @param {Array} players - All players with ratings
 * @param {Array} teamA - Team A player IDs
 * @param {Array} teamB - Team B player IDs
 * @returns {Object} Balanced teams
 */
const balanceTeams = (players, teamA, teamB) => {
  const getTeamRating = (teamIds) => {
    return teamIds.reduce((sum, id) => {
      const player = players.find(p => p._id.toString() === id.toString());
      return sum + (player?.rating || 5);
    }, 0);
  };
  
  let ratingA = getTeamRating(teamA);
  let ratingB = getTeamRating(teamB);
  let diff = Math.abs(ratingA - ratingB);
  
  // Try to balance if difference > 2 points
  if (diff > 2) {
    // Find players to swap
    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        // Try swapping
        const tempA = [...teamA];
        const tempB = [...teamB];
        
        [tempA[i], tempB[j]] = [tempB[j], tempA[i]];
        
        const newRatingA = getTeamRating(tempA);
        const newRatingB = getTeamRating(tempB);
        const newDiff = Math.abs(newRatingA - newRatingB);
        
        // If swap improves balance, apply it
        if (newDiff < diff) {
          teamA[i] = tempA[i];
          teamB[j] = tempB[j];
          diff = newDiff;
          ratingA = newRatingA;
          ratingB = newRatingB;
        }
      }
    }
  }
  
  console.log(`⚽ Times sorteados - Time A: ${ratingA.toFixed(1)}, Time B: ${ratingB.toFixed(1)}, Diferença: ${diff.toFixed(1)}`);
  
  return { teamA, teamB };
};

/**
 * Get team stats
 * @param {Array} players - Array of player objects
 * @param {Array} teamIds - Array of player IDs in the team
 * @returns {Object} Team statistics
 */
export const getTeamStats = (players, teamIds) => {
  const teamPlayers = players.filter(p => teamIds.includes(p._id.toString()));
  
  const stats = {
    avgShooting: 0,
    avgPassing: 0,
    avgDribbling: 0,
    avgDefense: 0,
    avgPhysical: 0,
    avgGoalkeeping: 0,
    overallRating: 0
  };
  
  if (teamPlayers.length === 0) return stats;
  
  teamPlayers.forEach(player => {
    const skills = player.skills || {};
    stats.avgShooting += skills.shooting || 5;
    stats.avgPassing += skills.passing || 5;
    stats.avgDribbling += skills.dribbling || 5;
    stats.avgDefense += skills.defense || 5;
    stats.avgPhysical += skills.physical || 5;
    stats.avgGoalkeeping += skills.goalkeeping || 5;
  });
  
  const count = teamPlayers.length;
  stats.avgShooting = Math.round((stats.avgShooting / count) * 10) / 10;
  stats.avgPassing = Math.round((stats.avgPassing / count) * 10) / 10;
  stats.avgDribbling = Math.round((stats.avgDribbling / count) * 10) / 10;
  stats.avgDefense = Math.round((stats.avgDefense / count) * 10) / 10;
  stats.avgPhysical = Math.round((stats.avgPhysical / count) * 10) / 10;
  stats.avgGoalkeeping = Math.round((stats.avgGoalkeeping / count) * 10) / 10;
  
  stats.overallRating = Math.round(
    ((stats.avgShooting + stats.avgPassing + stats.avgDribbling + 
      stats.avgDefense + stats.avgPhysical + stats.avgGoalkeeping) / 6) * 10
  ) / 10;
  
  return stats;
};
