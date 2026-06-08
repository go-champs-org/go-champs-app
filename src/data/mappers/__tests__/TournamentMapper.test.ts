import { mapRecentlyViewedToTournaments, mapTournamentHistoryResponse } from '../TournamentMapper';
import { tournamentFixture, tournamentHistoryFixture } from '../../../test/fixtures/tournamentFixtures';

describe('TournamentMapper', () => {
  it('maps recently viewed items to tournaments', () => {
    expect(mapRecentlyViewedToTournaments([{ tournament: tournamentFixture }])).toEqual([tournamentFixture]);
  });

  it('keeps wrapped tournament history responses', () => {
    expect(mapTournamentHistoryResponse(tournamentHistoryFixture)).toEqual(tournamentHistoryFixture);
  });

  it('wraps direct tournament history payloads', () => {
    expect(mapTournamentHistoryResponse(tournamentHistoryFixture.data)).toEqual(tournamentHistoryFixture);
  });
});

