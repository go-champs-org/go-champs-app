import type { Page, Route } from '@playwright/test';
import { test, expect, phases, tournaments } from './fixtures';
import { tournamentDetailsFixture, tournamentHistoryFixture } from '../src/test/fixtures/tournamentFixtures';

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

test('[singleClassification] abre classificação sem tela intermediária', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await expect(page.getByText('TABELA GERAL')).toBeVisible();
});

test('[singleGroups] abre grupos sem tela intermediária', async ({ page }) => {
  await openTournament(page, 'Copa Grupos');
  await expect(page.getByText('Grupo A', { exact: true }).last()).toBeVisible();
});

test('[singlePlayoffs] abre playoffs sem tela intermediária', async ({ page }) => {
  await openTournament(page, 'Copa Playoffs');
  await expect(page.getByText('Chaveamento')).toBeVisible();
  await expect(page.getByText('Decisão')).toBeVisible();
});

test('[multiplePhases] permite escolher uma entre várias fases', async ({ page }) => {
  await openTournament(page, 'Copa Completa');
  await expect(page.getByText('Escolha uma fase')).toBeVisible();
  await page.getByText('Classificação', { exact: true }).last().click();
  await expect(page.getByText('TABELA GERAL')).toBeVisible();
});

test('[cancelPicker] fecha o seletor de fases sem navegar', async ({ page }) => {
  await openTournament(page, 'Copa Completa');
  await page.getByLabel('Fechar').click();
  await expect(page.getByText('Escolha uma fase')).toBeHidden();
  await expect(page.getByText('Copa Completa', { exact: true })).toBeVisible();
});

test('[noPhases] informa campeonato sem fases', async ({ page }) => {
  await openTournament(page, 'Copa Sem Fases');
  await expect(page.getByText('Este campeonato ainda não possui fases disponíveis.')).toBeVisible();
});

test('[unsupportedPhase] ignora fases que ainda não têm visualização', async ({ page }) => {
  await page.route('**/tournaments/t-0', (route) => fulfillJson(route, historyPayload(0, [phases[0], { ...phases[0], id: 'unknown', title: 'Inscrições', type: 'registration' }])));
  await openTournament(page, 'Copa Completa');
  await expect(page.getByText('TABELA GERAL')).toBeVisible();
});

test('[entryError] permite tentar novamente após falha ao abrir', async ({ page }) => {
  let attempts = 0;
  await page.route('**/tournaments/t-1', (route) => {
    attempts += 1;
    return attempts === 1 ? route.fulfill({ status: 500 }) : fulfillJson(route, historyPayload(1, [phases[0]]));
  });
  await openTournament(page, 'Copa Classificação');
  await expect(page.getByText('Não foi possível abrir o campeonato. Tente novamente.')).toBeVisible();
  await page.getByText('Copa Classificação', { exact: true }).click();
  await expect(page.getByText('TABELA GERAL')).toBeVisible();
});

test('[matchDates] consulta partidas e navega entre datas', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await page.getByText('Partidas', { exact: true }).click();
  await expect(page.getByText('Court 1')).toBeVisible();
  await page.getByLabel('Próxima data').click();
  await expect(page.getByText('Court 2')).toBeVisible();
});

test('[emptyMatches] apresenta estado vazio de partidas', async ({ page }) => {
  await page.route('**/games?*', (route) => fulfillJson(route, { data: [] }));
  await openTournament(page, 'Copa Classificação');
  await page.getByText('Partidas', { exact: true }).click();
  await expect(page.getByText('Sem partidas para esta data')).toBeVisible();
});

test('[teamLogos] carrega escudos nas tabelas e partidas', async ({ page }) => {
  await openTournament(page, 'Copa Classificação');
  await expect(page.getByLabel('Escudo Alpha').first()).toBeVisible();
});

test('[backNavigation] volta ao catálogo preservando a busca', async ({ page }) => {
  await openHome(page);
  const search = page.getByPlaceholder('Pesquisar campeonatos, times...');
  await search.fill('classificação');
  await page.getByText('Copa Classificação', { exact: true }).click();
  await expect(page.getByText('TABELA GERAL')).toBeVisible();
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
  await expect(page.getByText('Olá, ana')).toBeVisible();
  await expect(page.getByText('ana@example.com')).toBeVisible();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.getByText('Entre na sua conta')).toBeVisible();
});

test('[authGames] mostra agenda do atleta autenticado', async ({ page }) => {
  await signInAsAna(page);
  await page.getByText('Meus jogos', { exact: true }).click();
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
  await expect(page.getByText('TABELA GERAL')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('classification.png'), fullPage: true });
});
