import type { Page, Route } from '@playwright/test';
import { test, expect, phases, tournaments } from './fixtures';
import { gamesFixture, tournamentDetailsFixture, tournamentHistoryFixture } from '../src/test/fixtures/tournamentFixtures';

const recentPayload = (items = tournaments) => ({ data: items.map((tournament) => ({ tournament })) });
const historyPayload = (index: number, selectedPhases = phases) => ({
  data: {
    ...tournamentHistoryFixture.data,
    ...tournamentDetailsFixture,
    ...tournaments[index],
    phases: selectedPhases,
  },
});

const openHome = async (page: Page) => {
  await page.goto('/');
  await expect(page.getByText('Campeonatos em andamento')).toBeVisible();
};

const openTournament = async (page: Page, name: string) => {
  await openHome(page);
  await page.getByText(name, { exact: true }).click();
};

const fulfillJson = (route: Route, json: unknown, status = 200) =>
  route.fulfill({ status, json, headers: { 'access-control-allow-origin': '*' } });

test('[catalogue] carrega identidade, banner e campeonatos', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('GO CHAMPS', { exact: true })).toBeVisible();
  await expect(page.getByText('Copa Completa', { exact: true })).toBeVisible();
});

test('[search] filtra por campeonato', async ({ page }) => {
  await openHome(page);
  await page.getByPlaceholder('Pesquisar campeonatos, times...').fill('grupos');
  await expect(page.getByText('Copa Grupos', { exact: true })).toBeVisible();
  await expect(page.getByText('Copa Playoffs', { exact: true })).toBeHidden();
});

test('[noResults] mostra busca vazia e permite recuperar', async ({ page }) => {
  await openHome(page);
  const search = page.getByPlaceholder('Pesquisar campeonatos, times...');
  await search.fill('inexistente');
  await expect(page.getByText('Nenhum campeonato encontrado')).toBeVisible();
  await search.clear();
  await expect(page.getByText('Copa Completa', { exact: true })).toBeVisible();
});

test('[emptyCatalogue] trata catálogo vazio', async ({ page }) => {
  await page.route('**/recently-view', (route) => fulfillJson(route, recentPayload([])));
  await openHome(page);
  await expect(page.getByText('Nenhum campeonato encontrado')).toBeVisible();
});

test('[apiFallback] usa a API alternativa quando a principal falha', async ({ page }) => {
  await page.route('**/recently-view', (route) => {
    const isPrimary = route.request().url().includes('api.go-champs.com');
    return isPrimary ? route.fulfill({ status: 503 }) : fulfillJson(route, recentPayload([tournaments[2]]));
  });
  await openHome(page);
  await expect(page.getByText('Copa Grupos', { exact: true })).toBeVisible();
});

test('[catalogueOffline] mantém a home útil quando as APIs falham', async ({ page }) => {
  await page.route('**/recently-view', (route) => route.fulfill({ status: 503 }));
  await openHome(page);
  await expect(page.getByText('Nenhum campeonato encontrado')).toBeVisible();
});

const gamesTab = (page: Page) => page.getByRole('tab', { name: /Jogos$/ });

test('[singleClassification] abre o campeonato na tabela de classificação', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
  await expect(page.getByText('Fase do campeonato')).toBeVisible();
  await expect(page.getByText('TIME', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('ALP', { exact: true }).first()).toBeVisible();
});

test('[singleGroups] abre o campeonato nos grupos', async ({ page }) => {
  await openTournament(page, 'Copa Grupos');
  await expect(page.getByText('Grupo A', { exact: true })).toBeVisible();
  await expect(page.getByText('2 grupos')).toBeVisible();
});

test('[singlePlayoffs] abre o campeonato no chaveamento', async ({ page }) => {
  await openTournament(page, 'Copa Playoffs');
  await expect(page.getByText('Chaveamento')).toBeVisible();
  await expect(page.getByText('Decisão')).toBeVisible();
});

test('[multiplePhases] troca de fase pelo seletor do campeonato', async ({ page }) => {
  await openTournament(page, 'Copa Completa');
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
  await page.getByLabel('Fase do campeonato').click();
  await page.getByText('Playoffs', { exact: true }).click();
  await expect(page.getByText('Chaveamento')).toBeVisible();
});

test('[tournamentSummary] mostra identidade e times do campeonato', async ({ page }) => {
  await openTournament(page, 'Copa Completa');
  await expect(page.getByText('Copa Completa', { exact: true }).last()).toBeVisible();
  await expect(page.getByLabel('Times do campeonato')).toBeVisible();
  await expect(page.getByText(/Times · /)).toHaveCount(0);
  await expect(page.getByText('Beta', { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel('Iniciais Beta').first()).toBeVisible();
});

test('[tournamentHighlights] mostra os destaques de atletas', async ({ page }) => {
  await page.route('**/tournaments/t-1', (route) => fulfillJson(route, {
    data: {
      ...historyPayload(1, [phases[0]]).data,
      has_aggregated_player_stats: true,
      sport_slug: 'basketball_5x5',
      player_stats: [{ id: 's1', slug: 'points', title: 'PTS' }, { id: 's2', slug: 'points_per_game', title: 'PTS/J' }],
    },
  }));
  await page.route('**/aggregated-player-stats-leaders?*', (route) => fulfillJson(route, {
    data: [
      { stat_key: 'points', leaders: [{ player_id: 'player-a', team_id: 'team-a', value: 31, player: { name: 'Ana Silva' } }] },
      { stat_key: 'points_per_game', leaders: [{ player_id: 'player-b', team_id: 'team-b', value: 15.5, player: { name: 'Bia Souza' } }] },
    ],
  }));
  await openTournament(page, 'Copa Classificação');
  await page.getByRole('button', { name: 'Destaques', exact: true }).click();
  await expect(page.getByText('Pontos', { exact: true })).toBeVisible();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await expect(page.getByLabel('Iniciais Ana Silva')).toBeVisible();
  await expect(page.getByText('31', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver todos: Pontos' })).toBeVisible();
  await page.getByRole('tab', { name: 'Pontos Por jogo' }).click();
  await expect(page.getByText('Bia Souza')).toBeVisible();
  await expect(page.getByText('15.5', { exact: true })).toBeVisible();
});

const statsTournament = (index: number, selectedPhases = phases) => ({
  data: {
    ...historyPayload(index, selectedPhases).data,
    has_aggregated_player_stats: true,
    sport_slug: 'basketball_5x5',
    player_stats: [
      { id: 's1', slug: 'game_played', title: 'JOG' },
      { id: 's2', slug: 'points', title: 'PTS' },
      { id: 's3', slug: 'assists', title: 'AST' },
      { id: 's4', slug: 'points_per_game', title: 'PTS/J' },
    ],
    players: [
      { id: 'player-a', name: 'Ana Silva', photo_url: null, team_id: 'team-a' },
      { id: 'player-b', name: 'Bia Souza', photo_url: null, team_id: 'team-b' },
    ],
  },
});

// Ranks Ana first by points and Bia first by anything else; a minimum of
// games leaves no one.
const routeStatsRanking = async (page: Page) => {
  const queries: URLSearchParams[] = [];
  await page.route('**/aggregated-player-stats-by-tournament?*', (route) => {
    const query = new URL(route.request().url()).searchParams;
    queries.push(query);
    const ana = { id: 'l1', player_id: 'player-a', stats: { game_played: 4, points: 40, assists: 2, points_per_game: 10 } };
    const bia = { id: 'l2', player_id: 'player-b', stats: { game_played: 3, points: 30, assists: 9, points_per_game: 12.5 } };
    const sort = query.get('sort');
    const data = query.has('where[game_played][gte]') ? [] : sort === 'points' ? [ana, bia] : [bia, ana];
    return fulfillJson(route, { data });
  });
  return () => queries[queries.length - 1];
};

const athleteOrder = (page: Page) => page.getByTestId('tournament-stats-table').getByText(/^(Ana Silva|Bia Souza)$/).allTextContents();

test('[tournamentStats] abre as estatísticas pelo Ver todos do destaque', async ({ page }) => {
  await page.route('**/tournaments/t-1', (route) => fulfillJson(route, statsTournament(1, [phases[0]])));
  await page.route('**/aggregated-player-stats-leaders?*', (route) => fulfillJson(route, {
    data: [
      { stat_key: 'points', leaders: [{ player_id: 'player-a', team_id: 'team-a', value: 40, player: { name: 'Ana Silva' } }] },
      { stat_key: 'points_per_game', leaders: [{ player_id: 'player-b', team_id: 'team-b', value: 12.5, player: { name: 'Bia Souza' } }] },
    ],
  }));
  const lastQuery = await routeStatsRanking(page);
  await openTournament(page, 'Copa Classificação');
  await page.getByRole('button', { name: 'Destaques', exact: true }).click();
  await page.getByRole('tab', { name: 'Pontos Por jogo' }).click();
  await page.getByRole('link', { name: 'Ver todos: Pontos' }).click();

  await expect(page.getByText('Estatísticas do campeonato')).toBeVisible();
  await expect.poll(() => lastQuery()?.get('sort')).toBe('points_per_game');
  expect(lastQuery().get('where[tournament_id]')).toBe('t-1');
  await expect(page.getByTestId('tournament-stats-table').getByText('12.5', { exact: true })).toBeVisible();
  await expect.poll(() => athleteOrder(page)).toEqual(['Bia Souza', 'Ana Silva']);
});

test('[statsRanking] troca estatística, escopo e filtros do ranking', async ({ page }) => {
  await page.route('**/tournaments/t-0', (route) => fulfillJson(route, statsTournament(0)));
  await page.route('**/aggregated-player-stats-leaders?*', (route) => fulfillJson(route, { data: [] }));
  const lastQuery = await routeStatsRanking(page);
  await openTournament(page, 'Copa Completa');
  await page.getByRole('button', { name: 'Estatísticas' }).click();

  await expect.poll(() => lastQuery()?.get('sort')).toBe('points');
  await expect.poll(() => athleteOrder(page)).toEqual(['Ana Silva', 'Bia Souza']);

  await page.getByRole('button', { name: 'Ordenar por Assistências' }).click();
  await expect.poll(() => lastQuery().get('sort')).toBe('assists');
  await expect.poll(() => athleteOrder(page)).toEqual(['Bia Souza', 'Ana Silva']);

  await page.getByRole('tab', { name: 'Por jogo' }).click();
  await expect.poll(() => lastQuery().get('sort')).toBe('points_per_game');

  await page.getByRole('button', { name: 'Filtros', exact: true }).click();
  await page.getByRole('button', { name: 'Fase: Todas as fases' }).click();
  await page.getByRole('radio', { name: 'Playoffs' }).click();
  await expect.poll(() => lastQuery().get('where[phase_id]')).toBe('draw');
  await page.getByRole('button', { name: 'Time: Todos os times' }).click();
  await page.getByRole('radio', { name: 'Beta' }).click();
  await expect.poll(() => lastQuery().get('where[team_id]')).toBe('team-b');
  await page.getByLabel('Jogos (mín.)').fill('5');
  await expect.poll(() => lastQuery().get('where[game_played][gte]')).toBe('5');
  await expect(page.getByText('Nenhum atleta atende a esses filtros.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtros (3)' })).toBeVisible();

  await page.getByRole('button', { name: 'Glossário' }).click();
  await expect(page.getByTestId('stats-glossary').getByText('PTS', { exact: true })).toBeVisible();
});

test('[noPhases] informa campeonato sem fases', async ({ page }) => {
  await openTournament(page, 'Copa Sem Fases');
  await expect(page.getByText('Este campeonato ainda não possui fases disponíveis.')).toBeVisible();
});

test('[unsupportedPhase] ignora fases que ainda não têm visualização', async ({ page }) => {
  await page.route('**/tournaments/t-0', (route) => fulfillJson(route, historyPayload(0, [{ ...phases[0], id: 'unknown', title: 'Inscrições', type: 'registration' }, phases[0]])));
  await openTournament(page, 'Copa Completa');
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
  await expect(page.getByText('Inscrições')).toBeHidden();
});

test('[entryError] permite tentar novamente após falha ao abrir', async ({ page }) => {
  let attempts = 0;
  await page.route('**/tournaments/t-1', (route) => {
    attempts += 1;
    return attempts === 1 ? route.fulfill({ status: 500 }) : fulfillJson(route, historyPayload(1, [phases[0]]));
  });
  await openTournament(page, 'Copa Classificação');
  await expect(page.getByText('Não foi possível abrir o campeonato. Tente novamente.')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
});

test('[matchDates] consulta jogos e navega entre datas', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await expect(page.getByText('Court 2')).toBeVisible();
  await page.getByLabel('Data anterior').click();
  await expect(page.getByText('Court 1')).toBeVisible();
});

test('[emptyMatches] apresenta estado vazio de partidas', async ({ page }) => {
  await page.route('**/games?*', (route) => fulfillJson(route, { data: [] }));
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await expect(page.getByText('Sem partidas para esta data')).toBeVisible();
});

test('[liveGame] mostra partida ao vivo com placar do scoreboard', async ({ page }) => {
  const live = { ...gamesFixture[1], live_state: 'in_progress', is_finished: false, home_score: 0, away_score: 0 };
  await page.route('**/games?*', (route) => fulfillJson(route, { data: [live] }));
  await page.route('https://scoreboard.go-champs.com/**', (route) => fulfillJson(route, {
    data: {
      home_team: { total_player_stats: { points: 5 } },
      away_team: { total_player_stats: { points: 11 } },
      live_state: { state: 'in_progress' },
    },
  }));
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await expect(page.getByText('AO VIVO')).toBeVisible();
  await expect(page.getByText('11', { exact: true })).toBeVisible();
  await expect(page.getByText('5', { exact: true })).toBeVisible();
});

test('[teamLogos] carrega escudos nas tabelas e no campeonato', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await expect(page.getByLabel('Escudo Alpha').first()).toBeVisible();
});

test('[backNavigation] volta ao catálogo preservando a busca', async ({ page }) => {
  await openHome(page);
  const search = page.getByPlaceholder('Pesquisar campeonatos, times...');
  await search.fill('classificação');
  await page.getByText('Copa Classificação', { exact: true }).click();
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
  await page.goBack();
  await expect(search).toHaveValue('classificação');
});

test('[gamesTab] abre a agenda do visitante', async ({ page }) => {
  await openHome(page);
  await page.getByText('Meus jogos', { exact: true }).click();
  await expect(page.getByText('Sua agenda começa aqui')).toBeVisible();
});

test('[auth] entra pela home e atualiza a sessão', async ({ page }) => {
  await openHome(page);
  await page.getByLabel('Abrir perfil').click();
  await expect(page.getByText('Entrar na minha conta')).toBeVisible();
  await page.getByLabel('Usuário/E-mail').fill('ana');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByLabel('Logo Go Champs')).toBeVisible();
  await expect(page.getByLabel('Abrir perfil')).toBeHidden();
});

const signInAsAna = async (page: Page) => {
  await openHome(page);
  await page.getByLabel('Abrir perfil').click();
  await page.getByLabel('Usuário/E-mail').fill('ana');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Entrar na minha conta')).toBeHidden();
  await expect(page.getByLabel('Abrir perfil')).toBeHidden();
  await expect(page.getByText('Campeonatos em andamento')).toBeVisible();
};

test('[authProfile] mostra conta autenticada e permite sair', async ({ page }) => {
  await signInAsAna(page);
  await page.getByText('Perfil', { exact: true }).click();
  await expect(page.getByText('Olá, ana', { exact: true })).toBeVisible();
  await expect(page.getByText('ana@example.com')).toBeVisible();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.getByText('Entre na sua conta')).toBeVisible();
});

test('[authGames] mostra agenda do atleta autenticado', async ({ page }) => {
  await signInAsAna(page);
  await page.getByRole('tab', { name: /Meus jogos/ }).click();
  await expect(page.getByText('Alpha vs Beta')).toBeVisible();
  await expect(page.getByText('Ginásio Central · São Paulo · 1')).toBeVisible();
});

test('[authNavigation] navega entre entrar, cadastro e recuperação', async ({ page }) => {
  await openHome(page);
  await page.getByLabel('Criar conta').click();
  await expect(page.getByText('Criar minha conta')).toBeVisible();
  await page.getByText('Voltar para entrar').click();
  await page.getByText('Recuperar senha').click();
  await expect(page.getByText('Recuperar conta', { exact: true }).first()).toBeVisible();
  await page.getByText('Voltar para entrar').click();
  await expect(page.getByText('Entrar na minha conta')).toBeVisible();
});

test('[webAuthSignUp] abre fluxo WebAuth de cadastro', async ({ page }) => {
  await openHome(page);
  await page.getByLabel('Criar conta').click();
  await expect(page.getByText('Criar minha conta')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir cadastro' }).click();
  await expect(page.getByText(/cadastro é feito no site da Go Champs/i)).toBeVisible();
  await expect(page.getByLabel('Fechar')).toBeVisible();
});

const basketballTournament = (page: Page, scoreboardSetting: unknown = null) =>
  page.route('**/tournaments/t-1', (route) => fulfillJson(route, {
    data: { ...historyPayload(1, [phases[0]]).data, sport_slug: 'basketball_5x5', scoreboard_setting: scoreboardSetting },
  }));

test('[gameDetail] abre detalhe do jogo com estatísticas', async ({ page }) => {
  await basketballTournament(page);
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await page.getByLabel('Data anterior').click();
  await page.getByLabel(/Abrir jogo/).first().click();
  await expect(page.getByText('Estatísticas', { exact: true })).toBeVisible();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await expect(page.getByText('34:30')).toBeVisible();
  await expect(page.getByText('Totais').first()).toBeVisible();
  await expect(page.getByText('AO VIVO')).toHaveCount(0);
});

// The screens a stack leaves behind stay in the page on web: only the one
// showing counts.
const teamLink = (page: Page, name: string) => page.getByLabel(`Abrir time ${name}`).filter({ visible: true });

const expectTeamScreen = async (page: Page, name: string) => {
  await expect(page.getByTestId('team-banner').filter({ visible: true })).toContainText(name);
  await expect(page.getByTestId('team-games').filter({ visible: true })).toBeVisible();
};

test('[teamFromStrip] abre o time pela faixa de times', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await page.getByLabel('Times do campeonato').getByLabel('Abrir time Beta').click();
  await expectTeamScreen(page, 'Beta');
});

test('[teamFromStandings] abre o time pela tabela de classificação', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
  await teamLink(page, 'Alpha').last().click();
  await expectTeamScreen(page, 'Alpha');
});

test('[teamFromGames] abre o time pelo nome na lista de jogos', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await expect(page.getByText('Court 2')).toBeVisible();
  await teamLink(page, 'Beta').last().click();
  await expectTeamScreen(page, 'Beta');
});

test('[teamFromBracket] abre o time pelo chaveamento', async ({ page }) => {
  await openTournament(page, 'Copa Playoffs');
  await expect(page.getByText('Decisão')).toBeVisible();
  await teamLink(page, 'Alpha').last().click();
  await expectTeamScreen(page, 'Alpha');
});

test('[teamFromGameDetail] abre o time pelo placar do jogo', async ({ page }) => {
  await basketballTournament(page);
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await page.getByLabel('Data anterior').click();
  await page.getByLabel(/Abrir jogo/).first().click();
  await expect(page.getByText('Estatísticas', { exact: true })).toBeVisible();
  await teamLink(page, 'Alpha').first().click();
  await expectTeamScreen(page, 'Alpha');
});

// Only the athlete screen showing counts: the stack keeps the others in the page.
const athleteLink = (page: Page, name: string) => page.getByLabel(`Abrir atleta ${name}`).filter({ visible: true });
const athleteBanner = (page: Page) => page.getByTestId('athlete-banner').filter({ visible: true });
const athleteStats = (page: Page) => page.getByTestId('athlete-stats').filter({ visible: true });

// The API's aggregate of one athlete, the same for the tournament and each phase.
const routeAthleteStats = (page: Page, stats: Record<string, number>) =>
  page.route('**/aggregated-player-stats-by-tournament?*', (route) => {
    const playerId = new URL(route.request().url()).searchParams.get('where[player_id]');
    return fulfillJson(route, { data: playerId ? [{ id: 'agg', player_id: playerId, stats }] : [] });
  });

test('[athleteFromRoster] abre o atleta pelo elenco do time', async ({ page }) => {
  await page.route('**/tournaments/t-1', (route) => fulfillJson(route, statsTournament(1, [phases[0]])));
  await page.route('**/aggregated-player-stats-leaders?*', (route) => fulfillJson(route, { data: [] }));
  await routeAthleteStats(page, { game_played: 4, points: 40, assists: 2, points_per_game: 10 });
  await openTournament(page, 'Copa Classificação');
  await page.getByLabel('Times do campeonato').getByLabel('Abrir time Alpha').click();
  await athleteLink(page, 'Ana Silva').click();

  await expect(athleteBanner(page)).toContainText('Ana Silva');
  await expect(athleteBanner(page)).toContainText('Copa Classificação');
  await expect(athleteBanner(page)).toContainText('Alpha · 4 jogos disputados');
  await expect(athleteBanner(page).getByLabel('Instagram')).toBeVisible();
  await expect(athleteStats(page)).toContainText('Estatísticas detalhadas');
  await expect(athleteStats(page).getByTestId('athlete-stats-phase')).toHaveText(['Classificação']);
  await expect(athleteStats(page).getByTestId('athlete-stats-total')).toHaveText('4402');
  await page.getByRole('tab', { name: 'Por jogo' }).filter({ visible: true }).click();
  await expect(athleteStats(page).getByTestId('athlete-stats-total')).toHaveText('410.0');
  await athleteStats(page).getByRole('button', { name: 'Glossário' }).click();
  await expect(athleteStats(page).getByTestId('athlete-glossary')).toContainText('JG — Jogos');

  await athleteBanner(page).getByTestId('athlete-team-link').click();
  await expect(page.getByTestId('team-banner').filter({ visible: true })).toContainText('Alpha');
});

test('[athleteFromStats] abre o atleta pela tabela de estatísticas', async ({ page }) => {
  await page.route('**/tournaments/t-0', (route) => fulfillJson(route, statsTournament(0)));
  await page.route('**/aggregated-player-stats-leaders?*', (route) => fulfillJson(route, { data: [] }));
  await routeStatsRanking(page);
  await openTournament(page, 'Copa Completa');
  await page.getByRole('button', { name: 'Estatísticas' }).click();
  await athleteLink(page, 'Bia Souza').click();

  await expect(athleteBanner(page)).toContainText('Bia SouzaAlpha · 3 jogos disputados');
  // Every phase the API has numbers for, each read from its own aggregate.
  await expect(athleteStats(page).getByTestId('athlete-stats-phase')).toHaveText(['Classificação', 'Grupos', 'Playoffs']);
  await expect(athleteStats(page).getByTestId('athlete-stats-total')).toHaveText('3309');
});

test('[athleteFromBoxScore] abre o atleta pelo box score do jogo', async ({ page }) => {
  await basketballTournament(page);
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await page.getByLabel('Data anterior').click();
  await page.getByLabel(/Abrir jogo/).first().click();
  await athleteLink(page, 'Ana Silva').click();

  await expect(athleteBanner(page)).toContainText('Ana Silva');
  // The API has no aggregate for the athlete yet.
  await expect(athleteStats(page)).toHaveText('Sem estatísticas para este atleta ainda.');
});

test('[athleteError] permite tentar novamente após falha ao abrir o atleta', async ({ page }) => {
  const responses = [
    { status: 500, json: { errors: { detail: 'boom' } } },
    { status: 404, json: { errors: { detail: 'Not found' } } },
    { status: 200, json: { data: { id: 'player-a', name: 'Ana Silva', team_id: null } } },
  ];
  await page.route('**/tournaments/t-1', (route) => fulfillJson(route, statsTournament(1, [phases[0]])));
  await page.route('**/aggregated-player-stats-leaders?*', (route) => fulfillJson(route, { data: [] }));
  await page.route('**/players/player-a', (route) => {
    const { status, json } = responses.shift() ?? responses[responses.length - 1];
    return fulfillJson(route, json, status);
  });
  await routeAthleteStats(page, { game_played: 1, points: 12 });
  await openTournament(page, 'Copa Classificação');
  await page.getByLabel('Times do campeonato').getByLabel('Abrir time Alpha').click();
  await athleteLink(page, 'Ana Silva').click();
  const retry = page.getByRole('button', { name: 'Tentar novamente' }).filter({ visible: true });

  await expect(page.getByText('Não foi possível abrir o atleta. Tente novamente.')).toBeVisible();
  await retry.click();
  await expect(page.getByText('Atleta não encontrado neste campeonato.')).toBeVisible();
  await retry.click();
  await expect(athleteBanner(page)).toContainText('Ana Silva');
  // No team to link to: the banner reads only the games.
  await expect(athleteBanner(page)).toContainText('1 jogo disputado');
  await expect(athleteBanner(page).getByTestId('athlete-team-link')).toHaveCount(0);
});

test('[liveGameDetail] acompanha jogo ao vivo com período e estatísticas do scoreboard', async ({ page }) => {
  const live = { ...gamesFixture[1], live_state: 'in_progress', is_finished: false, home_score: 0, away_score: 0 };
  const team = (base: typeof live.home_team, player: { id: string; name: string; shirt_number: string }) => ({
    ...base, logo_url: 'https://example.com/alpha.png', players: [player],
  });
  await basketballTournament(page, { live_site_update: 'full-live-update' });
  await page.route('**/games?*', (route) => fulfillJson(route, { data: [live] }));
  await page.route((url) => url.hostname === 'api.go-champs.com' && url.pathname.endsWith(`/games/${live.id}`), (route) => fulfillJson(route, {
    data: {
      ...live,
      city: 'São Paulo',
      court: null,
      number: null,
      result_type: null,
      assets: [],
      officials: [],
      web_url: null,
      phase: { id: 'table', title: 'Classificação', type: 'elimination', tournament: { id: 't-1', name: 'Copa Classificação', slug: 'copa' } },
      home_team: team(live.home_team, { id: 'player-a', name: 'Ana Silva', shirt_number: '5' }),
      away_team: team(live.away_team, { id: 'player-b', name: 'Bia Costa', shirt_number: '10' }),
    },
  }));
  await page.route('https://scoreboard.go-champs.com/**', (route) => fulfillJson(route, {
      data: {
        home_team: {
          total_player_stats: { points: 5 },
          players: [{ id: 'player-a', name: 'Ana Silva', number: '5', stats_values: { points: 5, minutes_played: 600, game_started: 1 } }],
        },
        away_team: {
          total_player_stats: { points: 11 },
          players: [{ id: 'player-b', name: 'Bia Costa', number: '10', stats_values: { points: 11, minutes_played: 300 } }],
        },
        live_state: { state: 'in_progress' },
        clock_state: { period: 2, time: 452 },
      },
    }));
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await page.getByLabel(/Abrir jogo/).first().click();
  await expect(page.getByText('Estatísticas', { exact: true })).toBeVisible();
  await expect(page.getByText('AO VIVO').last()).toBeVisible();
  await expect(page.getByText('2º quarto · 07:32')).toBeVisible();
  await expect(page.getByLabel(/: 11$/)).toBeVisible();
  await expect(page.getByLabel(/: 5$/)).toBeVisible();
  await expect(page.getByText('Bia Costa')).toBeVisible();
  // Minutes played, read in the box score: the games list behind it shows kickoff times too.
  const boxScore = page.getByTestId('box-score-team');
  await expect(boxScore.getByText('10:00', { exact: true })).toBeVisible();
  await expect(boxScore.getByText('05:00', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Titular')).toHaveCount(1);
});

test('[profileEdit] edita perfil de atleta autenticado', async ({ page }) => {
  await signInAsAna(page);
  await page.getByText('Perfil', { exact: true }).click();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await page.getByLabel('Editar perfil de atleta').click();
  await page.getByLabel('Nome').fill('Ana Atualizada');
  await page.getByLabel('Instagram').fill('@ana');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Perfil de atleta atualizado.')).toBeVisible();
  await expect(page.getByText('Ana Atualizada')).toBeVisible();
});

test('[highlights] mostra destaques do mês sem estatísticas inventadas', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('Destaques do mês')).toBeVisible();
  await expect(page.getByText('Os destaques aparecem após a publicação das estatísticas.')).toBeVisible();
});

test('[pwaShell] expõe manifest e registra o service worker', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  const manifest = await page.request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect((await manifest.json()).display).toBe('standalone');
  await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
  await expect.poll(() => page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.some((registration) => registration.active?.state === 'activated');
  })).toBe(true);
});

test('capturas para validação visual responsiva', async ({ page }, testInfo) => {
  await openHome(page);
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.getByText('Copa Classificação', { exact: true }).click();
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('tournament.png'), fullPage: true });
});
