import { useState, useEffect } from 'react';
import { Achievement, Goal, Challenge } from '../types';
import { mockAchievements, mockGoals, mockChallenges } from '../fixtures';

export const useGamificationState = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    setAchievements(mockAchievements);
    setGoals(mockGoals);
    setChallenges(mockChallenges);
  }, []);

  return {
    achievements,
    goals,
    challenges,
    setAchievements,
    setGoals,
    setChallenges
  };
};
