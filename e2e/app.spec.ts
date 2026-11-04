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

test('[gameDetail] abre detalhe do jogo com súmula', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await gamesTab(page).click();
  await page.getByLabel('Data anterior').click();
  await page.getByLabel(/Abrir jogo/).first().click();
  await expect(page.getByText('Súmula')).toBeVisible();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await expect(page.getByText('34:30')).toBeVisible();
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
