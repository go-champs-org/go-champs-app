import { Game } from '../../../models/GameModel';
import { PlayoffResponse } from '../../../models/PlayoffModel';
import { SportConfig } from '../../../models/Sport';
import { TournamentDetails } from '../../../models/TournamentDetails';

export class TournamentFallbackDataSource {
  getTournamentDetails(): TournamentDetails {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../../../json/payloadData.json');
    return local.data as TournamentDetails;
  }

  getPlayoffData(): PlayoffResponse {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../../../json/payloadData2.json');
    return local as PlayoffResponse;
  }

  getGames(): Game[] {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../../../json/payloadData3.json');
    return (local.data ?? []) as Game[];
  }

  getSportConfig(): SportConfig {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../../../json/payloadData4.json');
    return local.data as SportConfig;
  }
}

