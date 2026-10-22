/**
 * Proficiency level weight mapping
 */
const PROFICIENCY_WEIGHTS = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

/**
 * Calculate compatibility score between current user and a candidate user
 * @param {Object} currentUser - The logged-in user profile
 * @param {Object} candidateUser - The peer user profile to evaluate
 * @returns {Object} { matchScore, breakdown, mutualSkills }
 */
const calculateSkillCompatibility = (currentUser, candidateUser) => {
  if (!currentUser || !candidateUser) {
    return { matchScore: 0, breakdown: {}, mutualSkills: { teachingToThem: [], learningFromThem: [] } };
  }

  // Extract skill names (normalized lowercase)
  const currentOffered = (currentUser.skillsOffered || []).map((s) => ({
    name: s.skillName.toLowerCase(),
    originalName: s.skillName,
    proficiency: s.proficiency || 'Intermediate',
  }));

  const currentWanted = (currentUser.skillsWanted || []).map((s) => ({
    name: s.skillName.toLowerCase(),
    originalName: s.skillName,
    targetProficiency: s.targetProficiency || 'Beginner',
  }));

  const candidateOffered = (candidateUser.skillsOffered || []).map((s) => ({
    name: s.skillName.toLowerCase(),
    originalName: s.skillName,
    proficiency: s.proficiency || 'Intermediate',
  }));

  const candidateWanted = (candidateUser.skillsWanted || []).map((s) => ({
    name: s.skillName.toLowerCase(),
    originalName: s.skillName,
    targetProficiency: s.targetProficiency || 'Beginner',
  }));

  // 1. Find mutual skill overlaps
  // Skills Current User teaches that Candidate wants
  const teachingToThem = currentOffered
    .filter((offered) => candidateWanted.some((wanted) => wanted.name === offered.name))
    .map((s) => s.originalName);

  // Skills Candidate teaches that Current User wants
  const learningFromThem = candidateOffered
    .filter((offered) => currentWanted.some((wanted) => wanted.name === offered.name))
    .map((s) => s.originalName);

  const hasTeachingMatch = teachingToThem.length > 0;
  const hasLearningMatch = learningFromThem.length > 0;
  const isDirectMutualSwap = hasTeachingMatch && hasLearningMatch;

  let exchangeScore = 0;

  if (isDirectMutualSwap) {
    // 60 base points for direct mutual exchange
    exchangeScore = 60 + Math.min(10, (teachingToThem.length + learningFromThem.length - 2) * 5);
  } else if (hasTeachingMatch || hasLearningMatch) {
    // 30 base points for one-way complement match
    exchangeScore = 30;
  } else {
    exchangeScore = 0;
  }

  // 2. Proficiency Alignment Score (Max 20 points)
  let proficiencyScore = 0;
  if (hasLearningMatch) {
    const matchedLearnings = candidateOffered.filter((offered) =>
      currentWanted.some((wanted) => wanted.name === offered.name)
    );

    let totalAlignment = 0;
    matchedLearnings.forEach((candidateSkill) => {
      const wantedSkill = currentWanted.find((w) => w.name === candidateSkill.name);
      const offeredWeight = PROFICIENCY_WEIGHTS[candidateSkill.proficiency] || 2;
      const wantedWeight = PROFICIENCY_WEIGHTS[wantedSkill?.targetProficiency] || 1;

      if (offeredWeight >= wantedWeight) {
        totalAlignment += 20;
      } else {
        totalAlignment += 10;
      }
    });

    proficiencyScore = Math.min(20, Math.round(totalAlignment / matchedLearnings.length));
  } else {
    proficiencyScore = 5;
  }

  // 3. User Reputation & Rating (Max 10 points)
  let ratingScore = 7; // Default baseline rating points for new users
  if (candidateUser.rating && candidateUser.rating.count > 0) {
    ratingScore = Math.min(10, Math.round((candidateUser.rating.average / 5) * 10));
  }

  // 4. Schedule Availability Overlap (Max 10 points)
  let availabilityScore = 5;
  const currentAvail = currentUser.availability || [];
  const candidateAvail = candidateUser.availability || [];
  const commonAvailability = currentAvail.filter((day) => candidateAvail.includes(day));

  if (commonAvailability.length > 0) {
    availabilityScore = 10;
  }

  // 5. Total Compatibility Calculation (0 - 100%)
  let totalScore = exchangeScore + proficiencyScore + ratingScore + availabilityScore;
  totalScore = Math.min(100, Math.max(0, totalScore));

  return {
    matchScore: totalScore,
    isDirectMutualSwap,
    mutualSkills: {
      teachingToThem,
      learningFromThem,
    },
    breakdown: {
      exchangeScore,
      proficiencyScore,
      ratingScore,
      availabilityScore,
      commonAvailability,
    },
  };
};

module.exports = {
  calculateSkillCompatibility,
};
