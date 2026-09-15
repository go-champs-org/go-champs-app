# Go Champs - Handoff de continuidade

Atualizado em: 2026-09-15

## Objetivo em andamento

Aplicar o novo design system mobile do Figma ao app Expo/React Native Web, preservar a experiência web e entregar um PWA com cobertura de testes unitários e E2E de pelo menos 90%.

Figma de referência: https://www.figma.com/design/ejLZZAUH3CLh1PNsvjs4jp/Home?node-id=628-10881

## Estado atual

- Branch: `main`.
- Há alterações locais ainda não commitadas neste ciclo; não descarte nem reverta arquivos modificados.
- O app foi reorganizado em camadas `core`, `data`, `domain`, `viewmodels` e `views`.
- Serviços legados duplicados em `src/services` foram removidos após verificar que não possuíam importadores.
- As telas atuais usam componentes compartilhados e tokens do design system em `src/theme/theme.ts`.
- A home foi redesenhada, com hero reduzido, área segura para notch, cards de campeonatos e navegação inferior fixa.
- A escolha de fase deixou de ser uma tela dedicada: uma única fase navega direto e múltiplas fases usam modal.
- Telas de classificação, grupos, playoffs, partidas, perfil, organização e histórico foram alinhadas ao novo padrão visual.
- **Auth MVP nativo:** login `POST /v1/accounts/signin`; token persistido (`expo-secure-store` / `localStorage` na web) via `SecureAuthTokenStore`; `GoChampsApiClient` injeta `Authorization: Bearer <token>`; perfil de conta via `GET /v1/users/:username`; perfil de atleta via `athlete-profiles`; Meus jogos via `GET /v1/athlete-profiles/me/schedules`; logout local (API sem revoke).
- Cadastro e recuperação continuam abrindo o site (CAPTCHA). `PATCH /users` e cadastro nativo ficam para depois.
- Plano/spec: `docs/superpowers/specs/2026-09-15-auth-mvp-design.md` e `docs/superpowers/plans/2026-09-15-auth-mvp.md`.
- A home inclui `MonthlyHighlights.tsx`. Sem ranking mensal agregado na API pública, o estado vazio permanece sem dados fictícios.
- `AppHeader`: marca à esquerda para visitante (login pelo ícone); centralizada após autenticação.

## PWA

- `app/+html.tsx` inclui metadados, manifest, `viewport-fit=cover` e registro do worker.
- `public/manifest.webmanifest`, `public/sw.js` e os ícones em `public/` compõem o shell instalável.
- O worker serve somente o fallback de navegação offline. Ele não interfere em APIs, imagens remotas ou bundles.
- Em automação (`navigator.webdriver`) o registro automático é desativado porque o WebKit não entrega as rotas mockadas quando uma página controlada pelo worker faz chamadas cross-origin. O teste PWA registra o worker explicitamente e confirma o estado `activated`.

## Testes e comandos

Use Node 22:

```sh
export PATH=/Users/aw-admin/.nvm/versions/node/v22.22.2/bin:$PATH
```

```sh
npm run check
npm run lint
npm run test:e2e
```

- `npm run check`: typecheck e Jest com cobertura.
- E2E: jornadas em `e2e/journeys.ts` (meta 90%) em Android Web, iOS WebKit e desktop.

## Ponto de retomada

1. Revisar o diff local por grupos funcionais antes de criar commits.
2. Push somente após o usuário solicitar.
3. Backlog auth: cadastro/recovery nativos (CAPTCHA), `PATCH /users`, revoke/refresh JWT, `GET /me`, account-identity, Facebook auth.
4. Migração Expo SDK 57 em branch separada, se prioridade for alertas Metro.
5. Destaques mensais quando a API tiver ranking agregado publicável.

## Segurança conhecida

O `npm audit` reporta alertas high na cadeia Metro/Expo (`image-size`). Correção automática puxa Expo SDK 57. Não adicionar override de `image-size` 2.x.
