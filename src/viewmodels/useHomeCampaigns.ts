import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { container } from '../di/container';
import { AthleteHome } from '../domain/usecases/GetAthleteHomeUseCase';
import { gameShareCard } from '../domain/usecases/shared/gameShare';

export type Campaign = 'create' | 'share' | 'progress';

export function useHomeCampaigns(username: string | undefined, bootstrapping: boolean) {
  const [loaded, setLoaded] = useState<{ username: string; home: AthleteHome }>();
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoaded(undefined);
    if (username) {
      void container.getAthleteHome.execute(username).then(home => {
        if (active) setLoaded({ username, home });
      }).catch(() => { /* Unknown profile: do not guess which campaign applies. */ });
    }
    return () => { active = false; };
  }, [username]));
  const home = loaded?.username === username ? loaded?.home : undefined;
  const profile = home?.profile;
  const card = useMemo(() => {
    if (!home?.profile) return null;
    // The API returns completed games newest first. Skip results without recorded stats.
    for (const game of home.recentGames) {
      const sticker = gameShareCard(game, home.profile);
      if (sticker.stats.length) return sticker;
    }
    return null;
  }, [home]);
  const campaigns: Campaign[] = [];
  if (!bootstrapping) {
    if (!username || profile === null) campaigns.push('create');
    if (card) campaigns.push('share');
    if (profile) campaigns.push('progress');
  }
  return { campaigns, card };
}
