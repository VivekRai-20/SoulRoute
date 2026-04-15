/**
 * hooks/useOnboarding.ts
 *
 * Manages the onboarding state: whether it's been completed,
 * the user's baseline start date, and the 14-day learning phase.
 */

import { useState, useEffect, useCallback } from 'react';
import type { OnboardingState } from '@/types';
import {
  getOnboarding,
  saveOnboarding,
  setOnboardingComplete,
  getUserName,
  saveUserName,
  getDailyGoalMs,
  saveDailyGoalMs,
} from '@/services/storage';

export interface UseOnboardingReturn {
  onboarding: OnboardingState;
  userName: string;
  /** 0–14, null if onboarding not started */
  baselineDaysElapsed: number | null;
  /** true during the first 14 days of tracking */
  isInBaselinePhase: boolean;
  finishOnboarding: (name: string, goalMs: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
  loading: boolean;
}

export function useOnboarding(): UseOnboardingReturn {
  const [onboarding, setOnboarding] = useState<OnboardingState>({
    complete: false,
    startDate: null,
    permissionsGranted: false,
  });
  const [userName, setUserNameState] = useState('Friend');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ob, name] = await Promise.all([getOnboarding(), getUserName()]);
      setOnboarding(ob);
      setUserNameState(name);
      setLoading(false);
    })();
  }, []);

  const finishOnboarding = useCallback(async (name: string, goalMs: number) => {
    await Promise.all([
      saveUserName(name),
      saveDailyGoalMs(goalMs),
      setOnboardingComplete(),
    ]);
    const updated = await getOnboarding();
    setOnboarding(updated);
    setUserNameState(name);
  }, []);

  const setName = useCallback(async (name: string) => {
    await saveUserName(name);
    setUserNameState(name);
  }, []);

  let baselineDaysElapsed: number | null = null;
  let isInBaselinePhase = false;

  if (onboarding.startDate) {
    const start = new Date(onboarding.startDate);
    const now = new Date();
    const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
    baselineDaysElapsed = Math.min(days, 14);
    isInBaselinePhase = days < 14;
  }

  return {
    onboarding,
    userName,
    baselineDaysElapsed,
    isInBaselinePhase,
    finishOnboarding,
    setName,
    loading,
  };
}
