import { RecentlyViewedItemDto } from '../dto/ApiResponses';
import { Tournament } from '../../models/Tournament';
import { TournamentHistory } from '../../models/TournamentHistory';

export const mapRecentlyViewedToTournaments = (
  items: RecentlyViewedItemDto<Tournament>[],
  apiBaseUrl?: string
): Tournament[] => items.map((item) => ({ ...item.tournament, apiBaseUrl }));

export const mapTournamentHistoryResponse = (response: unknown): TournamentHistory => {
  const maybeWrapped = response as Partial<TournamentHistory>;

  if (maybeWrapped.data) {
    return maybeWrapped as TournamentHistory;
  }

  return { data: response as TournamentHistory['data'] };
};
