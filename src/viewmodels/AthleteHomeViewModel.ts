import { useCallback, useEffect, useMemo, useState } from 'react';
import { container } from '../di/container';
import { AthleteHome } from '../domain/usecases/GetAthleteHomeUseCase';
import { athleteSocialLinks } from '../domain/usecases/shared/athleteProfile';
import {
  careerSummaries,
  MonthBar,
  monthlyScoring,
  MY_TOURNAMENTS_PREVIEW,
  tournamentCards,
} from '../domain/usecases/shared/athleteHome';
import { profileShareCard } from '../domain/usecases/shared/profileShare';
import { useFlashNotice } from './useFlashNotice';
import { useLoadRequest } from './useLoadRequest';

export const ATHLETE_HOME_ERROR = 'Não foi possível carregar seu perfil de atleta.';

/** The Perfil tab: the signed-in athlete's profile, career and tournaments. */
export const useAthleteHomeViewModel = (username: string | undefined) => {
  const [home, setHome] = useState<AthleteHome | null>(null);
  const [loading, setLoading] = useState(Boolean(username));
  const [error, setError] = useState<string | null>(null);
  const [showAllTournaments, setShowAllTournaments] = useState(false);
  const { notice, showNotice, clearNotice } = useFlashNotice();
  const { request, refreshing, refreshError, retry, refresh, settleRefresh } = useLoadRequest(username ?? '');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!username) {
        setHome(null);
        setError(null);
        setLoading(false);
        return;
      }
      if (!request.refresh) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await container.getAthleteHome.execute(username);
        if (!mounted) return;
        setHome(next);
        if (request.refresh) settleRefresh(false);
      } catch {
        if (!mounted) return;
        // A failed refresh keeps the profile on screen.
        if (request.refresh) {
          settleRefresh(true);
          return;
        }
        setHome(null);
        setError(ATHLETE_HOME_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [username, request, settleRefresh]);

  const profile = home?.profile ?? null;
  const summaries = useMemo(() => careerSummaries(profile?.career_stats), [profile]);
  const monthlyPoints = useMemo(() => {
    const bySport: Record<string, MonthBar[]> = {};
    summaries.forEach((summary) => {
      bySport[summary.sportSlug] = monthlyScoring(home?.recentGames ?? [], summary.sportSlug);
    });
    return bySport;
  }, [home, summaries]);
  const shareCard = useMemo(() => profileShareCard(profile), [profile]);
  const allTournaments = useMemo(() => tournamentCards(profile?.memberships), [profile]);
  const socialLinks = useMemo(
    () =>
      profile
        ? athleteSocialLinks({ instagram: profile.instagram, facebook: profile.facebook, twitter: profile.twitter })
        : [],
    [profile]
  );

  const toggleTournaments = useCallback(() => setShowAllTournaments((current) => !current), []);

  // Back from the edit screen after a save: show what changed and reload.
  const acknowledgeSave = useCallback(
    (message: string) => {
      showNotice(message);
      refresh();
    },
    [showNotice, refresh]
  );

  return {
    loading,
    error,
    retry,
    refreshing,
    refreshError,
    refresh,
    notice,
    clearNotice,
    acknowledgeSave,
    profile,
    socialLinks,
    summaries,
    monthlyPoints,
    shareCard,
    tournaments: showAllTournaments ? allTournaments : allTournaments.slice(0, MY_TOURNAMENTS_PREVIEW),
    hasMoreTournaments: allTournaments.length > MY_TOURNAMENTS_PREVIEW,
    showAllTournaments,
    toggleTournaments,
  };
};
