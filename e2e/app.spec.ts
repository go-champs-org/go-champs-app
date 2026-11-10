import type { Page, Request, Route } from '@playwright/test';
import { test, expect, phases, storageUploadUrl, tournaments, uploadedPhotoUrl } from './fixtures';
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
  await expect(page.getByLabel('Abrir menu')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
};

const openSearch = async (page: Page) => {
  await page.getByRole('button', { name: 'Abrir busca' }).click();
  const search = page.getByPlaceholder('Nome do campeonato, organização');
  await expect(search).toBeVisible();
  return search;
};

const openSignIn = async (page: Page) => {
  await openHome(page);
  await page.getByRole('tab', { name: /Perfil/ }).click();
  await page.getByRole('button', { name: /Entrar$/ }).click();
  await expect(page.getByText('Entrar na minha conta')).toBeVisible();
};

const openTournament = async (page: Page, name: string) => {
  await openHome(page);
  await page.getByText(name, { exact: true }).click();
};

const fulfillJson = (route: Route, json: unknown, status = 200) =>
  route.fulfill({ status, json, headers: { 'access-control-allow-origin': '*' } });

test('[catalogue] carrega identidade e campeonatos', async ({ page }) => {
  await openHome(page);
  await expect(page.getByLabel('Logo Go Champs')).toBeVisible();
  await expect(page.getByText('Copa Completa', { exact: true })).toBeVisible();
  await expect(page.getByText('Campeonatos em andamento')).toBeHidden();
  await expect(page.getByText('GO CHAMPS', { exact: true })).toBeHidden();
});

test('[searchToggle] abre e fecha a busca pelo topo', async ({ page }) => {
  await openHome(page);
  await expect(page.getByPlaceholder('Nome do campeonato, organização')).toBeHidden();
  const search = await openSearch(page);
  await search.fill('norte');
  await expect(page.getByText('Nenhum campeonato encontrado')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar busca' }).click();
  await expect(search).toBeHidden();
  await expect(page.getByText('Copa Completa', { exact: true })).toBeVisible();
  await openSearch(page);
  await expect(page.getByPlaceholder('Nome do campeonato, organização')).toHaveValue('');
});

test('[searchOrganization] busca campeonatos pelo nome da organização', async ({ page }) => {
  await openHome(page);
  await (await openSearch(page)).fill('go champs');
  await expect(page.getByText('Copa Grupos', { exact: true })).toBeVisible();
  await expect(page.getByText('Copa Completa', { exact: true })).toBeVisible();
});

test('[sideMenu] abre o menu com links e redes sociais', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('button', { name: 'Início' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Organizações' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Minha conta' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Perguntas frequentes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Instagram da Go Champs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeHidden();
  await expect(page.getByText('Campeonatos', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Fechar menu' }).first().click();
  await expect(page.getByRole('button', { name: 'Perguntas frequentes' })).toBeHidden();
});

test('[menuLinks] abre as páginas do site pelo menu', async ({ page }) => {
  await page.context().route('https://go-champs.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>Go Champs</p>' }));
  await openHome(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Perguntas frequentes' }).click();
  expect((await popup).url()).toBe('https://go-champs.com/faq');
});

test('[appearance] troca o tema pelo menu e o mantém', async ({ page }) => {
  const pageBackground = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await openHome(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('radio', { name: 'Sistema' })).toBeChecked();
  await expect.poll(pageBackground).toBe('rgb(250, 250, 238)');

  await page.getByRole('radio', { name: 'Escuro' }).click();
  await expect(page.getByRole('radio', { name: 'Escuro' })).toBeChecked();
  await expect.poll(pageBackground).toBe('rgb(29, 29, 27)');

  await openHome(page);
  await expect.poll(pageBackground).toBe('rgb(29, 29, 27)');
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('radio', { name: 'Escuro' })).toBeChecked();

  await page.getByRole('radio', { name: 'Sistema' }).click();
  await expect.poll(pageBackground).toBe('rgb(250, 250, 238)');
});

test('[organizationsList] lista e busca organizações pelo menu', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Organizações' }).click();
  await expect(page.getByRole('button', { name: 'Perguntas frequentes' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir organização Go Champs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir organização Liga Norte' })).toBeHidden();
  const search = page.getByPlaceholder('Buscar organização');
  await search.fill('norte');
  await expect(page.getByRole('button', { name: 'Abrir organização Liga Norte' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir organização Go Champs' })).toBeHidden();
  await search.fill('inexistente');
  await expect(page.getByText('Nenhuma organização encontrada')).toBeVisible();
  await search.fill('champs');
  await page.getByRole('button', { name: 'Abrir organização Go Champs' }).click();
  await expect(page.getByTestId('organization-screen')).toBeVisible();
});

test('[organizationsEmpty] mostra lista de organizações vazia', async ({ page }) => {
  await page.route('**/organizations/recently-viewed', (route) => route.fulfill({ status: 503 }));
  await openHome(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Organizações' }).click();
  await expect(page.getByText('Nenhuma organização vista ainda')).toBeVisible();
});

test('[pinTournament] fixa um campeonato no topo da lista', async ({ page }) => {
  await openHome(page);
  const pinButtons = page.getByRole('button', { name: 'Fixar campeonato', exact: true });
  await expect(pinButtons).toHaveCount(tournaments.length);
  await pinButtons.nth(2).click();
  await expect(page.getByRole('button', { name: 'Desafixar campeonato', exact: true })).toHaveCount(1);
  await expect(page.getByText('Fixado', { exact: true })).toBeVisible();
  const names = page.getByText(/^Copa /);
  await expect(names.first()).toHaveText('Copa Grupos');
  await page.getByRole('button', { name: 'Desafixar campeonato', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fixar campeonato', exact: true })).toHaveCount(tournaments.length);
  await expect(names.first()).toHaveText('Copa Completa');
});

test('[search] filtra por campeonato', async ({ page }) => {
  await openHome(page);
  await (await openSearch(page)).fill('grupos');
  await expect(page.getByText('Copa Grupos', { exact: true })).toBeVisible();
  await expect(page.getByText('Copa Playoffs', { exact: true })).toBeHidden();
});

test('[noResults] mostra busca vazia e permite recuperar', async ({ page }) => {
  await openHome(page);
  const search = await openSearch(page);
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
  const search = await openSearch(page);
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

test('[auth] entra pelo perfil e atualiza a sessão', async ({ page }) => {
  await openSignIn(page);
  await page.getByLabel('Usuário/E-mail').fill('ana');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Entrar na minha conta')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Editar perfil', exact: true })).toBeVisible();
});

const signInAsAna = async (page: Page) => {
  await openSignIn(page);
  await page.getByLabel('Usuário/E-mail').fill('ana');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Entrar na minha conta')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Editar perfil', exact: true })).toBeVisible();
};

const openSignedInAccount = async (page: Page) => {
  await signInAsAna(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Sua conta' })).toBeVisible();
};

test('[authProfile] mostra o perfil de atleta com resumo e campeonatos', async ({ page }) => {
  await signInAsAna(page);
  const hero = page.getByTestId('athlete-home-hero').filter({ visible: true });
  await expect(hero.getByText('Ana Silva', { exact: true })).toBeVisible();
  await expect(hero.getByLabel('Abrir Instagram')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compartilhar perfil', exact: true })).toBeEnabled();
  await expect(page.getByText('Resumo · Basquete 5x5')).toBeVisible();
  const career = page.getByTestId('career-basketball_5x5').filter({ visible: true });
  await expect(career.getByText('257', { exact: true })).toBeVisible();
  await expect(career.getByText('21.4', { exact: true })).toBeVisible();
  const monthly = page.getByTestId('monthly-scoring').filter({ visible: true });
  await expect(monthly.getByText('Pontuação mensal')).toBeVisible();
  await expect(monthly.getByText('Último mês · PTS')).toBeVisible();
  await expect(monthly.getByLabel('49 pontos em novembro de 2026')).toBeVisible();
  await expect(page.getByText('Meus campeonatos')).toBeVisible();
  const tournamentCard = page.getByTestId('athlete-tournament-card').filter({ visible: true }).first();
  await expect(tournamentCard.getByText('Alpha · #7')).toBeVisible();
  await expect(tournamentCard.getByLabel('Escudo Alpha')).toBeVisible();
  await expect(tournamentCard.getByLabel('Escudo Copa Completa')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sua conta' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeHidden();
});

test('[profileFeedback] abre o formulário de feedback pelo perfil', async ({ page }) => {
  await page.context().route('https://forms.gle/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>Formulário</p>' }));
  await signInAsAna(page);
  const feedback = page.getByTestId('athlete-feedback').filter({ visible: true });
  await expect(feedback.getByText('Ajude a melhorar o Go Champs')).toBeVisible();
  const popup = page.waitForEvent('popup');
  await feedback.getByRole('link', { name: 'Enviar feedback (abre formulário)' }).click();
  expect((await popup).url()).toBe('https://forms.gle/1fv6sDCBjfEigmYL7');
});

test('[profileShare] abre Compartilhar perfil e troca o formato do sticker', async ({ page }) => {
  await signInAsAna(page);
  await page.getByRole('button', { name: 'Compartilhar perfil', exact: true }).click();
  const sheet = page.getByTestId('profile-share-sheet');
  await expect(sheet.getByRole('heading', { name: 'Compartilhar perfil' })).toBeVisible();
  await expect(sheet.getByRole('radio')).toHaveCount(4);

  const bottomDark = sheet.getByRole('radio', { name: 'Estatísticas embaixo, logo escuro' });
  const centerLight = sheet.getByRole('radio', { name: 'Estatísticas em destaque no centro, logo claro' });
  await expect(bottomDark).toBeChecked();
  const bottomTile = sheet.getByTestId('share-format-bottom-dark');
  await expect(bottomTile.getByText('Ana Silva', { exact: true })).toBeVisible();
  await expect(bottomTile.getByText('Campeonatos', { exact: true })).toBeVisible();
  await expect(bottomTile.getByText('257 · 21.4 por jogo', { exact: true })).toBeVisible();
  // The image that gets saved is the picked format.
  await expect(sheet.getByTestId('share-capture').getByTestId('share-sticker-bottom-dark')).toBeAttached();

  await centerLight.click();
  await expect(centerLight).toBeChecked();
  await expect(bottomDark).not.toBeChecked();
  const centerTile = sheet.getByTestId('share-format-center-light');
  await expect(centerTile.getByText('Pontos por jogo', { exact: true })).toBeVisible();
  await expect(centerTile.getByText('21.4', { exact: true })).toBeVisible();
  await expect(centerTile.getByText('257 no total', { exact: true })).toBeVisible();
  await expect(sheet.getByTestId('share-capture').getByTestId('share-sticker-center-light')).toBeAttached();

  // Copy, save and share need the native app.
  await expect(sheet.getByText('Para copiar, salvar ou compartilhar a imagem, use o app Go Champs.')).toBeVisible();
  await sheet.getByRole('button', { name: 'Fechar' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Resumo · Basquete 5x5')).toBeVisible();
});

test('[profileShareBackground] escolhe e remove a foto de fundo do sticker', async ({ page }) => {
  await signInAsAna(page);
  await page.getByRole('button', { name: 'Compartilhar perfil', exact: true }).click();
  const sheet = page.getByTestId('profile-share-sheet');
  await expect(sheet.getByText(/O fundo é transparente/)).toBeVisible();
  await expect(sheet.getByTestId('share-sticker-photo')).toHaveCount(0);

  const chooser = page.waitForEvent('filechooser');
  await sheet.getByRole('button', { name: 'Escolher foto de fundo' }).click();
  await (await chooser).setFiles({
    name: 'jogo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfXkAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(sheet.getByText('Escolha um formato. A imagem sai com a sua foto de fundo.')).toBeVisible();
  // Every preview and the saved image carry the photo.
  await expect(sheet.getByTestId('share-sticker-photo')).toHaveCount(5);
  await expect(sheet.getByTestId('share-capture').getByTestId('share-sticker-photo')).toHaveCount(1);
  await expect(sheet.getByRole('button', { name: 'Trocar foto de fundo' })).toBeVisible();

  await sheet.getByRole('button', { name: 'Remover foto de fundo' }).click();
  await expect(sheet.getByTestId('share-sticker-photo')).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Escolher foto de fundo' })).toBeVisible();
});

test('[profileTournament] abre o campeonato pelo card de Meus campeonatos', async ({ page }) => {
  await signInAsAna(page);
  await page.getByLabel('Ver campeonato Copa Completa').click();
  await expect(page).toHaveURL(/\/tournament\/t-0$/);
});

test('[accountMenu] abre Minha conta pelo menu e permite sair', async ({ page }) => {
  await openSignedInAccount(page);
  await expect(page.getByText('ana@example.com')).toBeVisible();
  await expect(page.getByText('Ana Maria Silva')).toBeVisible();
  await expect(page.getByText('••• •• 4725')).toBeVisible();
  await expect(page.getByText('21 mai 1997')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Perfil de atleta' })).toBeHidden();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeHidden();
  await expect(page.getByText('Entre na sua conta').last()).toBeVisible();
});

test('[accountSignedOut] pede para entrar ao abrir Minha conta sem sessão', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Minha conta' }).click();
  await expect(page.getByText('Entre na sua conta')).toBeVisible();
});

// Stubs DELETE /v1/accounts for one test; every other method falls through to the fixture API.
const routeDeleteAccount = (page: Page, respond: (password: string | undefined) => { status: number; json?: unknown }) =>
  page.route('**/v1/accounts', async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    const { status, json } = respond((route.request().postDataJSON() as { password?: string } | null)?.password);
    if (status === 204) return route.fulfill({ status, headers: { 'access-control-allow-origin': '*' } });
    return fulfillJson(route, json, status);
  });

const openDeleteAccount = async (page: Page) => {
  await page.getByRole('button', { name: 'Excluir conta', exact: true }).click();
  await expect(page.getByText('Excluir sua conta é permanente.', { exact: false })).toBeVisible();
};

const confirmDeletion = async (page: Page, password: string) => {
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill(password);
  await page.getByRole('button', { name: 'Excluir conta definitivamente' }).click();
};

test('[deleteAccount] exclui a conta, volta deslogado para a Home e não entra de novo', async ({ page }) => {
  // A per-test fake account: once deleted, the same credentials no longer sign in.
  let deleted = false;
  const deleteBodies: (string | undefined)[] = [];
  await routeDeleteAccount(page, (password) => {
    deleteBodies.push(password);
    deleted = true;
    return { status: 204 };
  });
  await page.route('**/v1/accounts/signin', (route) =>
    deleted ? fulfillJson(route, { error: 'invalid_credentials' }, 401) : route.fallback()
  );

  await openSignedInAccount(page);
  await openDeleteAccount(page);
  await expect(page.getByText('Seus registros em torneios continuam, sem vínculo com a sua conta.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Excluir conta definitivamente' })).toBeDisabled();
  await confirmDeletion(page, 'secret');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Copa Completa', { exact: true })).toBeVisible();
  expect(deleteBodies).toEqual(['secret']);

  // Signed out, also after a reload (the stored session is gone).
  await page.reload();
  await page.getByRole('tab', { name: /Perfil/ }).click();
  await expect(page.getByText('Entre na sua conta')).toBeVisible();

  await page.getByRole('button', { name: /Entrar$/ }).click();
  await page.getByLabel('Usuário/E-mail').fill('ana');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Não foi possível entrar. Verifique seus dados e tente novamente.')).toBeVisible();
  await expect(page.getByText('Entrar na minha conta')).toBeVisible();
});

test('[deleteAccountKept] senha errada e dono único mantêm a conta e a sessão', async ({ page }) => {
  await routeDeleteAccount(page, (password) =>
    password === 'secret'
      ? {
          status: 409,
          json: {
            error: 'account_owns_organizations',
            organizations: [
              { id: 'org-1', name: 'Federação Paulista', slug: 'fpb' },
              { id: 'org-2', name: 'Liga Norte', slug: 'liga-norte' },
            ],
          },
        }
      : { status: 401, json: { error: 'invalid_password' } }
  );

  await openSignedInAccount(page);
  await openDeleteAccount(page);
  await confirmDeletion(page, 'errada');
  await expect(page.getByText('Senha incorreta.')).toBeVisible();

  await confirmDeletion(page, 'secret');
  await expect(
    page.getByText(
      'Você é o único dono destas organizações: Federação Paulista, Liga Norte. Adicione outro dono ou exclua as organizações antes de excluir sua conta.'
    )
  ).toBeVisible();

  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('button', { name: 'Excluir conta definitivamente' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Sua conta' })).toBeVisible();
  await expect(page.getByText('ana@example.com')).toBeVisible();
});

test('[deleteAccountExpired] sessão expirada limpa a sessão e pede para entrar de novo', async ({ page }) => {
  await routeDeleteAccount(page, () => ({ status: 401, json: { error: 'invalid_token' } }));

  await openSignedInAccount(page);
  await openDeleteAccount(page);
  await confirmDeletion(page, 'secret');

  await expect(page.getByText('Sessão expirada. Entre novamente para excluir sua conta.')).toBeVisible();
  await expect(page.getByText('Entre na sua conta').last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sair da conta' })).toBeHidden();
});

const openMyGames = async (page: Page) => {
  await signInAsAna(page);
  await page.getByRole('tab', { name: /Meus jogos/ }).click();
  await expect(page.getByRole('heading', { name: 'Meus jogos' })).toBeVisible();
};

test('[authGames] mostra próximo jogo, mais jogos e resultados do atleta', async ({ page }) => {
  await openMyGames(page);
  const next = page.getByTestId('next-game').filter({ visible: true });
  // Teams read by logo and tri code; Gama has no code, so its name stands in.
  await expect(next.getByText('ALP', { exact: true })).toBeVisible();
  await expect(next.getByText('BET', { exact: true })).toBeVisible();
  await expect(next.getByText('19:30')).toBeVisible();
  await expect(next.getByText('São Paulo · Ginásio Central')).toBeVisible();
  await expect(page.getByText('Gama', { exact: true })).toBeVisible();
  await expect(page.getByText('Dom · 18:00 · São Paulo · Ginásio Central')).toBeVisible();
  await expect(page.getByText('Jogos anteriores')).toBeVisible();
  await expect(page.getByText('84–76')).toBeVisible();
  await expect(page.getByText('VITÓRIA')).toBeVisible();
  await expect(page.getByTestId('result-loss').filter({ visible: true })).toHaveText('DERROTA');
  await expect(page.getByTestId('result-win').filter({ visible: true })).toHaveText('VITÓRIA');
  await expect(page.getByText('28 PTS  ·  8 REB  ·  6 AST  ·  32 MIN')).toBeVisible();
});

test('[myGamesFilters] filtra os jogos carregados sem chamar a API de novo', async ({ page }) => {
  let listRequests = 0;
  page.on('request', (request) => {
    if (/\/(schedules|recent-games)$/.test(new URL(request.url()).pathname)) listRequests += 1;
  });
  await openMyGames(page);
  await expect(page.getByText('84–76')).toBeVisible();
  const loaded = listRequests;
  await page.getByRole('tab', { name: 'Próximos' }).click();
  await expect(page.getByText('Jogos anteriores')).toBeHidden();
  await expect(page.getByText('Gama', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Todos os jogos' }).click();
  await page.getByRole('button', { name: 'Campeonato: Todos os campeonatos' }).click();
  await page.getByRole('radio', { name: 'Copa Classificação' }).click();
  await expect(page.getByTestId('next-game').filter({ visible: true }).getByText('Gama', { exact: true })).toBeVisible();
  await expect(page.getByTestId('next-game').filter({ visible: true }).getByText('BET', { exact: true })).toBeHidden();
  await expect(page.getByText('71–78')).toBeVisible();
  await expect(page.getByText('84–76')).toBeHidden();
  expect(listRequests).toBe(loaded);
});

test('[myGamesGameDetail] abre o jogo pelo card do próximo jogo', async ({ page }) => {
  await openMyGames(page);
  await page.route(/youtube\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' }));
  await page.getByTestId('next-game').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/game\/game-next$/);
  // The game's video plays inline.
  const video = page.getByTestId('game-video').filter({ visible: true }).locator('iframe');
  await expect(video).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0');
  // The tournament name opens the tournament's home.
  await page.getByRole('link', { name: 'Abrir campeonato Copa Classificação' }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/tournament\/t-1$/);
  await expect(page.getByText('Tabela de classificação')).toBeVisible();
});

test('[gameShare] compartilha um jogo anterior e troca o canto do sticker', async ({ page }) => {
  await openMyGames(page);
  await page.getByRole('button', { name: 'Compartilhar jogo Alpha vs Beta' }).filter({ visible: true }).first().click();
  const sheet = page.getByTestId('game-share-sheet');
  await expect(sheet.getByRole('heading', { name: 'Compartilhar jogo' })).toBeVisible();
  await expect(sheet.getByRole('radio')).toHaveCount(4);

  const leftDark = sheet.getByRole('radio', { name: 'Conteúdo no canto inferior esquerdo, logo escuro' });
  const bottomLight = sheet.getByRole('radio', { name: 'Conteúdo no canto inferior direito, logo claro' });
  await expect(leftDark).toBeChecked();
  const leftTile = sheet.getByTestId('share-format-bottom-left-dark');
  // The athlete with their number, the team and the tournament of that game.
  await expect(leftTile.getByText('Ana Silva  #7', { exact: true })).toBeVisible();
  await expect(leftTile.getByText('Alpha', { exact: true })).toBeVisible();
  await expect(leftTile.getByText('Copa Completa', { exact: true })).toBeVisible();
  await expect(leftTile.getByText('7 nov 2026', { exact: true })).toBeVisible();
  for (const [value, label] of [['28', 'PTS'], ['8', 'REB'], ['6', 'AST'], ['32', 'MIN']]) {
    await expect(leftTile.getByText(value, { exact: true })).toBeVisible();
    await expect(leftTile.getByText(label, { exact: true })).toBeVisible();
  }
  // The Go Champs logo is a small credit under the content.
  await expect(leftTile.getByText('Fornecido por', { exact: true })).toBeVisible();
  await expect(sheet.getByTestId('share-capture').getByTestId('share-sticker-bottom-left-dark')).toBeAttached();

  await bottomLight.click();
  await expect(bottomLight).toBeChecked();
  await expect(leftDark).not.toBeChecked();
  await expect(sheet.getByTestId('share-capture').getByTestId('share-sticker-bottom-right-light')).toBeAttached();

  await expect(sheet.getByText('Para copiar, salvar ou compartilhar a imagem, use o app Go Champs.')).toBeVisible();
  await sheet.getByRole('button', { name: 'Fechar' }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByText('Jogos anteriores')).toBeVisible();
});

test('[myGamesNoProfile] pede o perfil de atleta quando não existe', async ({ page }) => {
  await page.route('**/athlete-profiles/username/ana**', (route) => fulfillJson(route, { error: 'Athlete profile not found' }, 404));
  await openSignIn(page);
  await page.getByLabel('Usuário/E-mail').fill('ana');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Nenhum perfil de atleta ainda')).toBeVisible();
  await page.getByRole('tab', { name: /Meus jogos/ }).click();
  await expect(page.getByText('Complete seu perfil de atleta')).toBeVisible();
  await page.getByRole('button', { name: 'Criar perfil de atleta' }).filter({ visible: true }).click();
  await expect(page.getByLabel('Nome de atleta')).toBeVisible();
});

test('[authNavigation] navega entre entrar, cadastro e recuperação', async ({ page }) => {
  await openSignIn(page);
  await page.getByText('Criar conta', { exact: true }).click();
  await expect(page.getByText('Criar minha conta')).toBeVisible();
  await page.getByText('Voltar para entrar').click();
  await page.getByText('Recuperar senha').click();
  await expect(page.getByText('Recuperar conta', { exact: true }).first()).toBeVisible();
  await page.getByText('Voltar para entrar').click();
  await expect(page.getByText('Entrar na minha conta')).toBeVisible();
});

test('[webAuthSignUp] abre fluxo WebAuth de cadastro', async ({ page }) => {
  await openSignIn(page);
  await page.getByText('Criar conta', { exact: true }).click();
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

const organizationSummary = (page: Page) => page.getByTestId('organization-summary').filter({ visible: true });

test('[organizationFromTournament] abre a organização pelo nome no campeonato', async ({ page }) => {
  await openTournament(page, 'Copa Completa');
  await page.getByLabel('Abrir organização Go Champs').filter({ visible: true }).click();

  await expect(organizationSummary(page)).toContainText('Go Champs');
  await expect(organizationSummary(page)).toContainText('5 campeonatos');
  await expect(page).toHaveURL(/organization\/go-champs/);
  await page.getByLabel('Abrir Copa Classificação').click();
  await expect(page).toHaveURL(/tournament\/t-1/);
});

test('[organizationFromCatalogue] abre a organização pelo card do catálogo', async ({ page }) => {
  await openHome(page);
  await page.getByLabel('Abrir organização Go Champs').first().click();

  await expect(organizationSummary(page)).toContainText('Go Champs');
  for (const tournament of tournaments) await expect(page.getByLabel(`Abrir ${tournament.name}`)).toBeVisible();
  await expect(organizationSummary(page).getByLabel('Escudo Go Champs')).toBeVisible();
  await expect(page.getByLabel('Iniciais Copa Grupos')).toBeVisible();
});

test('[organizationEmpty] mostra organização sem campeonatos', async ({ page }) => {
  await page.route('**/tournaments?*', (route) => fulfillJson(route, { errors: { detail: 'boom' } }, 500));
  await openHome(page);
  await page.getByLabel('Abrir organização Go Champs').first().click();

  await expect(organizationSummary(page)).toContainText('0 campeonatos');
  await expect(page.getByText('Nenhum campeonato encontrado')).toBeVisible();
});

test('[organizationError] permite tentar novamente após falha ao abrir a organização', async ({ page }) => {
  const responses = [
    { status: 500, json: { errors: { detail: 'boom' } } },
    { status: 200, json: { data: [] } },
    { status: 200, json: { data: [{ id: 'org-1', name: 'Go Champs', slug: 'go-champs', logo_url: null }] } },
  ];
  await page.route('**/organizations?*', (route) => {
    const { status, json } = responses.shift() ?? responses[responses.length - 1];
    return fulfillJson(route, json, status);
  });
  await openHome(page);
  await page.getByLabel('Abrir organização Go Champs').first().click();
  const retry = page.getByRole('button', { name: 'Tentar novamente' }).filter({ visible: true });

  await expect(page.getByText('Não foi possível abrir a organização. Tente novamente.')).toBeVisible();
  await retry.click();
  await expect(page.getByText('Organização não encontrada.')).toBeVisible();
  await retry.click();
  await expect(organizationSummary(page)).toContainText('5 campeonatos');
  await expect(organizationSummary(page).getByLabel('Iniciais Go Champs')).toBeVisible();
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

const openProfileEdit = async (page: Page) => {
  await signInAsAna(page);
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await expect(page.getByLabel('Nome de atleta')).toBeVisible();
};

const requestBody = (request: Request) => request.postDataJSON() as Record<string, Record<string, unknown>>;

test('[profileEdit] Editar perfil abre o formulário e volta ao perfil salvo', async ({ page }) => {
  let saved: Record<string, unknown> | null = null;
  // The profile reads back what the PATCH saved, from the moment it is sent.
  await page.route('**/athlete-profiles/username/ana', (route) => {
    const request = route.request();
    if (request.method() === 'PATCH') saved = requestBody(request).athlete_profile;
    if (request.method() === 'GET' && saved) {
      return fulfillJson(route, { data: { id: 'athlete-1', username: 'ana', ...saved, memberships: [], career_stats: [] } });
    }
    return route.fallback();
  });
  await openProfileEdit(page);
  await expect(page.getByLabel('Nome de atleta')).toHaveValue('Ana Silva');
  await expect(page.getByLabel('Facebook')).toBeEditable();
  await expect(page.getByLabel('Twitter')).toBeEditable();
  await page.getByLabel('Nome de atleta').fill('Ana Atualizada');
  await page.getByRole('textbox', { name: 'Instagram' }).fill('@ana');
  const patch = page.waitForRequest((request) => request.method() === 'PATCH' && request.url().includes('/athlete-profiles/username/ana'));
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  expect(requestBody(await patch)).toEqual({
    athlete_profile: { name: 'Ana Atualizada', photo_url: null, facebook: null, instagram: '@ana', twitter: null },
  });
  await expect(page.getByLabel('Nome de atleta')).toBeHidden();
  await expect(page.getByText('Perfil de atleta atualizado.')).toBeVisible();
  await expect(page.getByTestId('athlete-home-hero').filter({ visible: true }).getByText('Ana Atualizada')).toBeVisible();
  await page.getByRole('tab', { name: /Início/ }).click();
  await page.getByRole('tab', { name: /Perfil/ }).click();
  await expect(page.getByText('Perfil de atleta atualizado.')).toBeHidden();
});

test('[profileCancel] cancela a edição e volta ao perfil sem salvar', async ({ page }) => {
  let patched = false;
  page.on('request', (request) => { if (request.method() === 'PATCH') patched = true; });
  await openProfileEdit(page);
  await page.getByLabel('Nome de atleta').fill('Outro Nome');
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByLabel('Nome de atleta')).toBeHidden();
  await expect(page.getByText('Outro Nome')).toBeHidden();
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await expect(page.getByLabel('Nome de atleta')).toHaveValue('Ana Silva');
  expect(patched).toBe(false);
});

test('[profileSaveError] mostra o erro da API e mantém a edição', async ({ page }) => {
  await page.route('**/athlete-profiles/username/ana', (route) => (route.request().method() === 'PATCH'
    ? fulfillJson(route, { errors: { instagram: ['must be a valid Instagram handle'] } }, 422)
    : route.fallback()));
  await openProfileEdit(page);
  await page.getByRole('textbox', { name: 'Instagram' }).fill('not valid!');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('Confira os campos destacados.')).toBeVisible();
  await expect(page.getByText('Use @usuario ou o link do Instagram.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Instagram' })).toHaveValue('not valid!');
});

test('[athletePhoto] envia a foto do perfil pela URL assinada', async ({ page }) => {
  await openProfileEdit(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Adicionar foto' }).click();
  await (await chooser).setFiles({
    name: 'foto.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfXkAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByRole('button', { name: 'Trocar foto' })).toBeVisible();
  const presign = page.waitForRequest((request) => request.url().includes('/upload/presigned-url'));
  const upload = page.waitForRequest((request) => request.method() === 'PUT' && request.url() === storageUploadUrl);
  const patch = page.waitForRequest((request) => request.method() === 'PATCH' && request.url().includes('/athlete-profiles/'));
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  expect(requestBody(await presign)).toEqual(
    expect.objectContaining({ filename: 'foto.jpg', content_type: 'image/jpeg', file_type: 'athlete-profiles-photos' })
  );
  expect((await upload).headers()['content-type']).toBe('image/jpeg');
  expect(requestBody(await patch).athlete_profile.photo_url).toBe(uploadedPhotoUrl);
  await expect(page.getByText('Perfil de atleta atualizado.')).toBeVisible();
});

test('[athleteCreate] cria o perfil de atleta pelo estado vazio', async ({ page }) => {
  await page.route('**/athlete-profiles/username/ana**', (route) => fulfillJson(route, { error: 'Athlete profile not found' }, 404));
  await openSignIn(page);
  await page.getByLabel('Usuário/E-mail').fill('ana');
  await page.getByRole('textbox', { name: 'Senha', exact: true }).fill('secret');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Nenhum perfil de atleta ainda')).toBeVisible();
  await page.getByRole('button', { name: 'Criar perfil de atleta' }).click();
  await page.getByLabel('Nome de atleta').fill('Ana Nova');
  const post = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/athlete-profiles'));
  await page.getByRole('button', { name: 'Criar perfil' }).click();
  expect(requestBody(await post).athlete_profile.name).toBe('Ana Nova');
  await expect(page.getByLabel('Nome de atleta')).toBeHidden();
  await expect(page.getByText('Perfil de atleta criado.')).toBeVisible();
});

test('[identityEdit] edita os dados de identidade e envia só o que mudou', async ({ page }) => {
  await openSignedInAccount(page);
  await page.getByRole('button', { name: 'Editar dados de identidade' }).click();
  await expect(page.getByLabel('Nome completo')).toHaveValue('Ana Maria Silva');
  await expect(page.getByLabel('Data de nascimento')).toHaveValue('21/05/1997');
  await expect(page.getByText('Termina em 4725. Deixe em branco para manter.')).toBeVisible();
  await page.getByLabel('CPF').fill('11111111111');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByText('CPF inválido.')).toBeVisible();
  await page.getByLabel('CPF').fill('11144477735');
  await expect(page.getByLabel('CPF')).toHaveValue('111.444.777-35');
  await page.getByLabel('RG').fill('12.345.678-9');
  const put = page.waitForRequest((request) => request.method() === 'PUT' && request.url().endsWith('/account-identity'));
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  expect(requestBody(await put)).toEqual({
    account_identity: { tax_id_type: 'CPF', tax_id: '11144477735', government_id_type: 'RG', government_id: '12.345.678-9' },
  });
  await expect(page.getByText('Dados de identidade salvos.')).toBeVisible();
  await expect(page.getByText('••• •• 7735')).toBeVisible();
  await expect(page.getByText('••• •• 6789')).toBeVisible();
});

test('[identityCreate] adiciona dados de identidade pelo estado vazio', async ({ page }) => {
  await page.route('**/account-identity', (route) => (route.request().method() === 'GET'
    ? fulfillJson(route, { errors: { detail: 'Not Found' } }, 404)
    : route.fallback()));
  await openSignedInAccount(page);
  await expect(page.getByText('Nenhum dado de identidade ainda')).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar dados de identidade' }).click();
  await page.getByLabel('Nome completo').fill('Ana Maria Silva');
  await page.getByLabel('Data de nascimento').fill('21051997');
  await expect(page.getByLabel('Data de nascimento')).toHaveValue('21/05/1997');
  const post = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/account-identity'));
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  expect(requestBody(await post)).toEqual({
    account_identity: { full_legal_name: 'Ana Maria Silva', date_of_birth: '1997-05-21' },
  });
  await expect(page.getByText('Dados de identidade salvos.')).toBeVisible();
  await expect(page.getByText('21 mai 1997')).toBeVisible();
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
