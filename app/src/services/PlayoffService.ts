import { PlayoffResponse } from '../models/PlayoffModel';
import { Game } from '../models/GameModel';
import { TournamentDetails, TournamentDetailsResponse } from '../models/TournamentDetails';
import { SportConfig, SportResponse } from '../models/Sport';

const API_BASE = 'https://api.go-champs.com/v1';

// Fetch tournament details (phases, sport info, etc.)
export const fetchTournamentDetails = async (
  tournamentId: string
): Promise<TournamentDetails> => {
  try {
    const response = await fetch(`${API_BASE}/tournaments/${tournamentId}`);
    const jsonData: TournamentDetailsResponse = await response.json();
    return jsonData.data;
  } catch (error) {
    console.warn('Falling back to local tournament JSON due to error:', error);
    // Fallback to local JSON
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../json/payloadData.json');
    return local.data as TournamentDetails;
  }
};

// Fetch bracket/draw data for a given phase
export const fetchPlayoffData = async (phaseId: string): Promise<PlayoffResponse> => {
  try {
    const response = await fetch(`${API_BASE}/phases/${phaseId}`);
    const jsonData = await response.json();
    return jsonData as PlayoffResponse;
  } catch (error) {
    console.warn('Falling back to local phase JSON due to error:', error);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../json/payloadData2.json');
    return local as PlayoffResponse;
  }
};

// Fetch games for a given phase
export const fetchGamesByPhaseId = async (phaseId: string): Promise<Game[]> => {
  try {
    const response = await fetch(`${API_BASE}/games?where[phase_id]=${phaseId}`);
    const jsonData = await response.json();
    return jsonData.data as Game[];
  } catch (error) {
    console.warn('Falling back to local games JSON due to error:', error);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../json/payloadData3.json');
    return (local.data ?? []) as Game[];
  }
};

// Optionally fetch sport config (statistics, etc.) by slug
export const fetchSportConfig = async (sportSlug: string): Promise<SportConfig> => {
  try {
    const response = await fetch(`${API_BASE}/sports/${sportSlug}`);
    const jsonData: SportResponse = await response.json();
    return jsonData.data;
  } catch (error) {
    console.warn('Falling back to local sport JSON due to error:', error);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const local = require('../json/payloadData4.json');
    return local.data as SportConfig;
  }
};
