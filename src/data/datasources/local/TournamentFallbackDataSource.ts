import { Game } from '../../../models/GameModel';
import { PlayoffResponse } from '../../../models/PlayoffModel';
import { SportConfig } from '../../../models/Sport';
import { TournamentDetails } from '../../../models/TournamentDetails';

export class TournamentFallbackDataSource {
  getTournamentDetails(): TournamentDetails {
    const local = require('../../../json/payloadData.json');
    return local.data as TournamentDetails;
  }

  getPlayoffData(): PlayoffResponse {
    const local = require('../../../json/payloadData2.json');
    return local as PlayoffResponse;
  }

  getGames(): Game[] {
    const local = require('../../../json/payloadData3.json');
    return (local.data ?? []) as Game[];
  }

  getSportConfig(): SportConfig {
    const local = require('../../../json/payloadData4.json');
    return local.data as SportConfig;
  }
}
