import { Game } from '../../../models/GameModel';

export class TournamentFallbackDataSource {
  getGames(): Game[] {
    const local = require('../../../json/payloadData3.json');
    return (local.data ?? []) as Game[];
  }
}
